import json
from time import perf_counter

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:4173"
SCREENSHOT = "/tmp/noon-new-tab-after.png"
STYLE_SCREENSHOT = "/tmp/noon-style-regression.png"
BULK_SHORTCUT_COUNT = 1000


def assert_no_horizontal_overflow(page):
    overflow = page.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    assert overflow <= 1, f"horizontal overflow: {overflow}px"


def run_core_interactions(browser):
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    console_errors = []
    page.on(
        "console",
        lambda message: console_errors.append(f"{message.text} @ {message.location}")
        if message.type == "error"
        else None,
    )
    page.add_init_script(
        """
        window.__flipAnimationCount = 0;
        const nativeAnimate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          window.__flipAnimationCount += 1;
          return nativeAnimate.apply(this, args);
        };
        """
    )
    page.goto(BASE_URL, wait_until="networkidle")
    page.locator("#appLoader").wait_for(state="hidden")

    assert page.locator("#googleLogo").is_visible()
    assert page.locator("#commandButton").count() == 0
    assert page.locator(".topbar__brand").count() == 0
    assert page.locator(".hero-intro").count() == 0
    assert page.locator(".quick-actions").count() == 0
    assert page.locator(".shortcut-card").count() == 4

    icon_box = page.locator(".shortcut-card__favicon-wrap").first.bounding_box()
    card_box = page.locator(".shortcut-card").first.bounding_box()
    assert icon_box and icon_box["width"] <= 48 and icon_box["height"] <= 48
    assert card_box and card_box["width"] <= 90
    assert_no_horizontal_overflow(page)

    # Modified clicks must keep the anchor's native browser behavior so
    # Command-click can open a shortcut in a new tab on macOS.
    first_link = page.locator(".shortcut-card__link").first
    original_href = first_link.get_attribute("href")
    first_link.evaluate(
        "(link, href) => { link.href = href; }",
        f"{BASE_URL}/#modified-link-click",
    )
    with page.context.expect_page() as new_page_info:
        first_link.click(modifiers=["Meta"])
    new_page = new_page_info.value
    new_page.wait_for_load_state("domcontentloaded")
    assert new_page.url.endswith("#modified-link-click")
    new_page.close()
    first_link.evaluate("(link, href) => { link.href = href; }", original_href)

    # Pinned rings may extend above the card. Paint containment would crop
    # that overflow, which is the regression this assertion prevents.
    page.locator(".shortcut-card").evaluate_all(
        "cards => cards.slice(0, 4).forEach(card => card.classList.add('is-pinned'))"
    )
    containment = page.locator(".shortcut-card").first.evaluate(
        "card => ({contain: getComputedStyle(card).contain, contentVisibility: getComputedStyle(card).contentVisibility})"
    )
    assert "paint" not in containment["contain"]
    assert containment["contentVisibility"] == "visible"

    search_panel = page.locator("#searchForm")
    resting_shadow = search_panel.evaluate("element => getComputedStyle(element).boxShadow")
    search_panel.hover()
    page.wait_for_timeout(320)
    hover_shadow = search_panel.evaluate("element => getComputedStyle(element).boxShadow")
    assert hover_shadow != resting_shadow

    page.mouse.move(4, 4)
    page.wait_for_timeout(320)
    restored_shadow = search_panel.evaluate("element => getComputedStyle(element).boxShadow")
    assert restored_shadow == resting_shadow

    page.locator("#searchInput").focus()
    focused_style = search_panel.evaluate(
        "element => ({border: getComputedStyle(element).borderColor, shadow: getComputedStyle(element).boxShadow})"
    )
    assert "26, 115, 232" not in focused_style["border"]
    assert "26, 115, 232" not in focused_style["shadow"]
    assert "138, 180, 248" not in focused_style["shadow"]
    assert focused_style["shadow"] == resting_shadow
    page.screenshot(path=STYLE_SCREENSHOT, full_page=True)

    # Dragging works directly from any display sort and automatically records
    # the resulting order as manual, without requiring a separate setup step.
    cards = page.locator(".shortcut-card")
    first_id = cards.nth(0).get_attribute("data-id")
    last_id = cards.nth(3).get_attribute("data-id")
    cards.nth(0).drag_to(cards.nth(3), target_position={"x": 80, "y": 40})
    page.wait_for_timeout(260)
    assert page.locator("#sortSelect").input_value() == "manual"
    reordered_ids = page.locator(".shortcut-card").evaluate_all(
        "cards => cards.map(card => card.dataset.id)"
    )
    assert reordered_ids.index(first_id) > reordered_ids.index(last_id)
    assert page.evaluate("window.__flipAnimationCount") > 0

    # Settings closes with Escape.
    page.locator("#settingsButton").click()
    assert page.locator("#settingsToggle").is_checked()
    assert page.locator("#settingsDialog").is_visible()
    page.locator("#panelGeneral").click()
    assert page.locator("#settingsToggle").is_checked()
    page.keyboard.press("Escape")
    assert not page.locator("#settingsToggle").is_checked()

    # Settings also closes when clicking the blank backdrop.
    page.locator("#settingsButton").click()
    assert page.locator("#settingsToggle").is_checked()
    page.locator(".settings-backdrop-overlay").click(position={"x": 10, "y": 10}, force=True)
    assert not page.locator("#settingsToggle").is_checked()

    page.locator("#addShortcutButton").click()
    page.locator("#shortcutDialog").wait_for(state="visible")
    page.locator("#nameInput").fill("NOON Docs")
    page.locator("#urlInput").fill("openai.com")
    page.locator("#categoriesInput").fill("测试|Testing")
    page.locator("#shortcutForm button[type='submit']").click()
    page.locator("#shortcutDialog").wait_for(state="hidden")
    assert page.locator(".shortcut-card").count() == 5

    page.locator("#shortcutSearchInput").fill("NOON Docs")
    page.wait_for_timeout(120)
    assert page.locator(".shortcut-card").count() == 1

    page.screenshot(path=SCREENSHOT, full_page=True)
    assert not console_errors, f"console errors: {console_errors}"
    page.close()


def make_bulk_shortcuts():
    return [
        {
            "id": f"bulk-{index}",
            "name": f"Shortcut {index}",
            "url": f"https://example-{index}.com/",
            "categories": [f"Group {index % 20}"],
            "pinned": index < 10,
            "createdAt": 1_716_380_000_000 + index,
            "clickCount": index % 37,
        }
        for index in range(BULK_SHORTCUT_COUNT)
    ]


def run_large_dataset(browser):
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    bulk_json = json.dumps(make_bulk_shortcuts())
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.evaluate(
        """value => {
          localStorage.setItem('fallback:noon-new-tab-shortcuts', value);
          localStorage.setItem('fallback:noon-new-tab-shortcut-sort-v2', JSON.stringify('manual'));
        }
        """,
        bulk_json,
    )

    started = perf_counter()
    page.reload(wait_until="domcontentloaded")
    page.locator("#appLoader").wait_for(state="hidden")
    load_seconds = perf_counter() - started
    initial_rendered_count = page.locator(".shortcut-card").count()
    assert 1 <= initial_rendered_count < 360

    cdp = page.context.new_cdp_session(page)
    cdp.send("Performance.enable")
    cdp.send("HeapProfiler.collectGarbage")
    metrics = {item["name"]: item["value"] for item in cdp.send("Performance.getMetrics")["metrics"]}
    heap_mb = metrics.get("JSHeapUsedSize", 0) / 1024 / 1024
    node_count = int(metrics.get("Nodes", 0))

    # Reaching the invisible sentinel loads the next batch without requiring
    # a visible "load more" control.
    page.locator(".shortcut-render-sentinel").scroll_into_view_if_needed()
    page.wait_for_timeout(100)
    assert page.locator(".shortcut-card").count() > initial_rendered_count

    search_started = perf_counter()
    page.locator("#shortcutSearchInput").fill("Shortcut 999")
    page.wait_for_timeout(120)
    search_seconds = perf_counter() - search_started
    assert page.locator(".shortcut-card").count() == 1

    assert load_seconds < 6, f"1000-link startup took {load_seconds:.2f}s"
    assert search_seconds < 1, f"1000-link search took {search_seconds:.2f}s"
    assert heap_mb < 80, f"JS heap is unexpectedly high: {heap_mb:.1f}MB"
    print(
        f"Large dataset: {BULK_SHORTCUT_COUNT} links ({initial_rendered_count} initially rendered), "
        f"startup {load_seconds:.2f}s, "
        f"search {search_seconds:.2f}s, JS heap {heap_mb:.1f}MB, DOM nodes {node_count}"
    )
    page.close()


with sync_playwright() as playwright:
    chromium = playwright.chromium.launch(headless=True)
    run_core_interactions(chromium)
    run_large_dataset(chromium)
    chromium.close()

print("UI and performance smoke tests passed")
