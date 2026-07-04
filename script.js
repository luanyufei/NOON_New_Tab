import { state, defaultShortcuts, defaultCategoryDefinitions } from "./state.js";
import {
  displayCategoryName,
  displayShortcutName,
  normalizeLocalizedLabel,
  looksLikeUrl,
  normalizeUrl,
  isProbablyValidUrl,
  getFaviconUrl,
  getColorForName,
  readFileAsDataUrl,
  ensureCategoryDefinitionsFromShortcuts,
  mergeCategoryDefinitions,
  matchesCategorySearch,
  parseCategories
} from "./utils.js";
import {
  STORAGE_KEY,
  CATEGORY_STORAGE_KEY,
  THEME_STORAGE_KEY,
  CUSTOM_LOGO_STORAGE_KEY,
  SORT_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  WALLPAPER_STORAGE_KEY,
  readStorage,
  writeStorage,
  readLocalOnlyStorage,
  writeLocalOnlyStorage,
  removeLocalOnlyStorage,
  loadShortcuts,
  saveShortcuts,
  persistShortcuts,
  loadCategoryDefinitions,
  saveCategoryDefinitions,
  persistCategoryDefinitions,
  loadThemePreference,
  saveThemePreference,
  loadCustomLogo,
  loadSortMode,
  saveSortMode,
  loadLanguage,
  saveLanguage,
  loadWallpaper,
  persistAll,
  getLocalFallbackKey
} from "./storage.js";
import { translations, t } from "./i18n.js";

const GOOGLE_LOGO_LIGHT = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
const GOOGLE_LOGO_DARK = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_272x92dp.png";

const elements = {
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  searchSuggestions: document.querySelector("#searchSuggestions"),
  searchSuggestionsList: document.querySelector("#searchSuggestionsList"),
  googleLogo: document.querySelector("#googleLogo"),
  languageToggleButton: document.querySelector("#languageToggleButton"),
  categorySearchInput: document.querySelector("#categorySearchInput"),
  categorySummaryCount: document.querySelector("#categorySummaryCount"),
  categoryList: document.querySelector("#categoryList"),
  addCategoryButton: document.querySelector("#addCategoryButton"),
  shortcutSearchInput: document.querySelector("#shortcutSearchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  shortcutGrid: document.querySelector("#shortcutGrid"),
  template: document.querySelector("#shortcutCardTemplate"),
  dialog: document.querySelector("#shortcutDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  form: document.querySelector("#shortcutForm"),
  nameInput: document.querySelector("#nameInput"),
  urlInput: document.querySelector("#urlInput"),
  categoriesInput: document.querySelector("#categoriesInput"),
  categorySuggestions: document.querySelector("#categorySuggestions"),
  addShortcutButton: document.querySelector("#addShortcutButton"),
  
  // Settings dialog
  settingsToggle: document.querySelector("#settingsToggle"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  
  // Custom elements from index.html settings
  settingsSearchEngineSelect: document.querySelector("#settingsSearchEngineSelect"),
  settingsLanguageBtn: document.querySelector("#settingsLanguageBtn"),
  settingsUploadLogoBtn: document.querySelector("#settingsUploadLogoBtn"),
  settingsClearLogoBtn: document.querySelector("#settingsClearLogoBtn"),
  settingsUploadWallpaperBtn: document.querySelector("#settingsUploadWallpaperBtn"),
  settingsClearWallpaperBtn: document.querySelector("#settingsClearWallpaperBtn"),
  settingsDailyWallpaperSelect: document.querySelector("#settingsDailyWallpaperSelect"),
  settingsThemeSelect: document.querySelector("#settingsThemeSelect"),
  settingsExportBtn: document.querySelector("#settingsExportBtn"),
  settingsImportBtn: document.querySelector("#settingsImportBtn"),
  settingsResetBtn: document.querySelector("#settingsResetBtn"),
  
  // Help & About
  helpDialogContent: document.querySelector("#helpDialogContent"),
  aboutDialogEmail: document.querySelector("#aboutDialogEmail"),
  aboutDialogRepoLink: document.querySelector("#aboutDialogRepoLink"),
  aboutDialogIssueBtn: document.querySelector("#aboutDialogIssueBtn"),

  // Context menu, Trash zone, Undo toast
  contextMenu: document.querySelector("#contextMenu"),
  trashZone: document.querySelector("#trashZone"),
  undoToast: document.querySelector("#undoToast"),
  undoButton: document.querySelector("#undoButton"),
  
  // Other inputs
  logoUploadInput: document.querySelector("#logoUploadInput"),
  importConfigInput: document.querySelector("#importConfigInput"),
  wallpaperUploadInput: document.querySelector("#wallpaperUploadInput"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelButton: document.querySelector("#cancelButton"),
  deleteShortcutButton: document.querySelector("#deleteShortcutButton"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  wallpaperOverlay: document.querySelector("#wallpaperOverlay"),
};

// Reference the static app loader spinner in the HTML
const appLoader = document.getElementById("appLoader");
const isDarkDefault = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Settings, context menus, and trash zone references
let selectedEngineId = "google";
let contextMenu = null;
let trashZone = null;
let toastTimeout = null;

function initializeEnhancements() {
  // Bind search engine selector options in the search box
  const engineOptions = document.querySelectorAll(".engine-option");
  engineOptions.forEach(btn => {
    btn.addEventListener("click", () => {
      const engineId = btn.dataset.engine;
      selectedEngineId = engineId;
      localStorage.setItem("noon-new-tab-search-engine-v1", engineId);
      
      // Close details dropdown
      const selector = document.getElementById("searchEngineSelector");
      if (selector) {
        selector.removeAttribute("open");
      }
      
      // Sync to Settings select
      if (elements.settingsSearchEngineSelect) {
        elements.settingsSearchEngineSelect.value = engineId;
      }
      
      syncSearchEngineUI(engineId);
      updateSearchPlaceholder();
    });
  });

  // Sync initial search engine UI from local storage
  selectedEngineId = localStorage.getItem("noon-new-tab-search-engine-v1") || "google";
  syncSearchEngineUI(selectedEngineId);
  updateSearchPlaceholder();

  // Settings select sync
  if (elements.settingsSearchEngineSelect) {
    elements.settingsSearchEngineSelect.value = selectedEngineId;
    elements.settingsSearchEngineSelect.addEventListener("change", (e) => {
      const engineId = e.target.value;
      selectedEngineId = engineId;
      localStorage.setItem("noon-new-tab-search-engine-v1", engineId);
      syncSearchEngineUI(engineId);
      updateSearchPlaceholder();
    });
  }

  // Theme select sync
  if (elements.settingsThemeSelect) {
    elements.settingsThemeSelect.value = state.themePreference;
    elements.settingsThemeSelect.addEventListener("change", (e) => {
      state.themePreference = e.target.value;
      applyTheme(state.themePreference);
      void saveThemePreference(state.themePreference);
    });
  }

  // Language buttons and syncs
  if (elements.settingsLanguageBtn) {
    elements.settingsLanguageBtn.addEventListener("click", () => {
      handleToggleLanguage();
    });
  }

  // Wallpaper control bindings
  if (elements.settingsUploadWallpaperBtn) {
    elements.settingsUploadWallpaperBtn.addEventListener("click", () => {
      elements.wallpaperUploadInput.click();
    });
  }
  if (elements.settingsClearWallpaperBtn) {
    elements.settingsClearWallpaperBtn.addEventListener("click", () => {
      void clearWallpaper();
    });
  }
  if (elements.settingsDailyWallpaperSelect) {
    elements.settingsDailyWallpaperSelect.value = localStorage.getItem("noon-new-tab-daily-wallpaper-type-v1") || "none";
    elements.settingsDailyWallpaperSelect.addEventListener("change", (e) => {
      localStorage.setItem("noon-new-tab-daily-wallpaper-type-v1", e.target.value);
      applyWallpaper();
    });
  }

  // Logo control bindings
  if (elements.settingsUploadLogoBtn) {
    elements.settingsUploadLogoBtn.addEventListener("click", () => {
      elements.logoUploadInput.click();
    });
  }
  if (elements.settingsClearLogoBtn) {
    elements.settingsClearLogoBtn.addEventListener("click", () => {
      void clearCustomLogo();
    });
  }

  // Config management bindings
  if (elements.settingsExportBtn) {
    elements.settingsExportBtn.addEventListener("click", () => {
      exportConfig();
    });
  }
  if (elements.settingsImportBtn) {
    elements.settingsImportBtn.addEventListener("click", () => {
      triggerImportConfig();
    });
  }
  if (elements.settingsResetBtn) {
    elements.settingsResetBtn.addEventListener("click", async () => {
      const isEn = state.language === "en";
      const confirmMsg = isEn 
        ? "Are you sure you want to reset all configurations? This will wipe out all shortcuts and custom logo/wallpaper."
        : "确定要重置所有配置吗？这将清除所有快捷方式、自定义Logo和背景壁纸。";
      if (window.confirm(confirmMsg)) {
        localStorage.removeItem(getLocalFallbackKey(STORAGE_KEY));
        localStorage.removeItem(getLocalFallbackKey(CATEGORY_STORAGE_KEY));
        localStorage.removeItem(getLocalFallbackKey(THEME_STORAGE_KEY));
        localStorage.removeItem(getLocalFallbackKey(SORT_STORAGE_KEY));
        localStorage.removeItem(getLocalFallbackKey(LANGUAGE_STORAGE_KEY));
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
        localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
        localStorage.removeItem("noon-new-tab-search-engine-v1");
        localStorage.removeItem("noon-new-tab-daily-wallpaper-type-v1");
        localStorage.removeItem("noon-new-tab-daily-wallpaper-cached-v1");
        localStorage.removeItem("noon-new-tab-daily-wallpaper-cached-date-v1");
        localStorage.removeItem("noon-new-tab-daily-wallpaper-cached-type-v1");
        if (typeof chrome !== "undefined" && chrome.storage?.sync) {
          try {
            await chrome.storage.sync.clear();
          } catch (e) {}
        }
        window.location.reload();
      }
    });
  }

  // Settings tab click updates for Statistics panel
  const tabLabels = document.querySelectorAll(".settings-tab-btn");
  tabLabels.forEach(label => {
    label.addEventListener("click", () => {
      const tabTarget = label.getAttribute("for");
      if (tabTarget === "tabStatistics") {
        updateStatisticsPanel();
      }
    });
  });

  // Settings dialog backdrops and close
  const settingsBackdrop = document.querySelector(".settings-backdrop-overlay");
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", () => {
      if (elements.settingsToggle) {
        elements.settingsToggle.checked = false;
      }
    });
  }

  const settingsDialog = document.getElementById("settingsDialog");
  if (settingsDialog) {
    settingsDialog.addEventListener("click", (event) => {
      const rect = settingsDialog.getBoundingClientRect();
      const isClickOutside =
        event.target === settingsDialog &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom);
      if (isClickOutside) {
        if (elements.settingsToggle) {
          elements.settingsToggle.checked = false;
        }
      }
    });
  }

  // Bind right-click Context Menu
  contextMenu = elements.contextMenu;
  document.addEventListener("click", () => {
    if (contextMenu) {
      contextMenu.hidden = true;
    }
  });

  // Bind drag-to-delete Trash Zone
  trashZone = elements.trashZone;
  if (trashZone) {
    trashZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      trashZone.classList.add("is-active");
    });

    trashZone.addEventListener("dragleave", () => {
      trashZone.classList.remove("is-active");
    });

    trashZone.addEventListener("drop", async (event) => {
      event.preventDefault();
      trashZone.classList.remove("is-active");

      const id = event.dataTransfer.getData("text/plain") || state.draggedId;
      if (!id) return;
      
      const shortcut = state.shortcuts.find(s => s.id === id);
      if (!shortcut) return;

      await deleteShortcutWithUndo(shortcut);
    });
  }

  // Bind Undo button inside Undo Toast
  if (elements.undoButton) {
    elements.undoButton.addEventListener("click", async () => {
      if (state.lastDeletedShortcut) {
        state.shortcuts = [...state.shortcuts, state.lastDeletedShortcut];
        await persistShortcuts();
        syncSelectedCategory();
        renderCategories();
        renderShortcuts();
        state.lastDeletedShortcut = null;
      }
      if (elements.undoToast) {
        elements.undoToast.classList.remove("is-visible");
      }
    });
  }
}

function syncSearchEngineUI(engineId) {
  const optionBtn = document.querySelector(`.engine-option[data-engine="${engineId}"]`);
  if (optionBtn) {
    const svgIcon = optionBtn.querySelector("svg");
    if (svgIcon) {
      const summaryTrigger = document.querySelector("#searchEngineSelector summary.engine-trigger");
      if (summaryTrigger) {
        const oldActiveIcon = summaryTrigger.querySelector(".active-engine-icon");
        if (oldActiveIcon) {
          const newActiveIcon = svgIcon.cloneNode(true);
          newActiveIcon.setAttribute("class", "engine-icon active-engine-icon");
          oldActiveIcon.replaceWith(newActiveIcon);
        }
      }
    }
  }
}

function updateSearchPlaceholder() {
  const placeholders = {
    zh: {
      google: "在 Google 中搜索，或输入网址",
      bing: "在 Bing 中搜索，或输入网址",
      duckduckgo: "在 DuckDuckGo 中搜索，或输入网址",
      github: "在 GitHub 中搜索，或输入网址",
      bilibili: "在 Bilibili 中搜索，或输入网址"
    },
    en: {
      google: "Search Google or type a URL",
      bing: "Search Bing or type a URL",
      duckduckgo: "Search DuckDuckGo or type a URL",
      github: "Search GitHub or type a URL",
      bilibili: "Search Bilibili or type a URL"
    }
  };
  const lang = state.language === "en" ? "en" : "zh";
  const ph = placeholders[lang][selectedEngineId] || placeholders[lang]["google"];
  elements.searchInput.placeholder = ph;
}

function applySettingsDialogLanguage() {
  const elementsToTranslate = [
    "settingsTabGeneral",
    "settingsTabAppearance",
    "settingsTabStatistics",
    "settingsTabData",
    "settingsTabHelp",
    "settingsTabAbout",
    "settingsGeneralTitle",
    "settingsEngineSectionTitle",
    "settingsEngineRowTitle",
    "settingsEngineRowDesc",
    "settingsLanguageSectionTitle",
    "settingsLanguageRowTitle",
    "settingsLanguageRowDesc",
    "settingsLanguageBtn",
    "settingsAppearanceTitle",
    "settingsLogoSectionTitle",
    "settingsLogoRowTitle",
    "settingsLogoRowDesc",
    "settingsUploadLogoBtn",
    "settingsClearLogoBtn",
    "settingsWallpaperSectionTitle",
    "settingsWallpaperRowTitle",
    "settingsWallpaperRowDesc",
    "settingsUploadWallpaperBtn",
    "settingsClearWallpaperBtn",
    "settingsDailyWallpaperRowTitle",
    "settingsDailyWallpaperRowDesc",
    "settingsThemeSectionTitle",
    "settingsThemeRowTitle",
    "settingsThemeRowDesc",
    "settingsStatisticsTitle",
    "settingsDataTitle",
    "settingsDataSectionTitle",
    "settingsBackupTitle",
    "settingsBackupDesc",
    "settingsExportBtn",
    "settingsRestoreTitle",
    "settingsRestoreDesc",
    "settingsImportBtn",
    "settingsResetTitle",
    "settingsResetDesc",
    "settingsResetBtn",
    "helpDialogTitle",
    "aboutDialogTitle",
    "aboutDialogAuthorLabel",
    "aboutDialogRepoLabel",
    "aboutDialogIssueText",
    "settingsStatsSummaryTitle",
    "statsShortcutsLabel",
    "statsClicksLabel",
    "settingsStatsTop5Title",
    "settingsStatsCategoryTitle"
  ];
  
  elementsToTranslate.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = t(id);
    }
  });
}

function updateStatisticsPanel() {
  const totalShortcuts = state.shortcuts.length;
  const totalClicks = state.shortcuts.reduce((sum, s) => sum + (s.clickCount || 0), 0);
  
  const statsTotalShortcutsEl = document.getElementById("statsTotalShortcuts");
  const statsTotalClicksEl = document.getElementById("statsTotalClicks");
  if (statsTotalShortcutsEl) statsTotalShortcutsEl.textContent = totalShortcuts;
  if (statsTotalClicksEl) statsTotalClicksEl.textContent = totalClicks;

  // Render Top 5 List
  const top5List = document.getElementById("statsTop5List");
  if (top5List) {
    top5List.innerHTML = "";
    if (totalShortcuts === 0) {
      top5List.innerHTML = `<div class="statistics-placeholder"><span>${state.language === "en" ? "No shortcuts" : "暂无快捷方式"}</span></div>`;
    } else {
      const sortedByClicks = [...state.shortcuts].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      sortedByClicks.slice(0, 5).forEach((s, idx) => {
        const item = document.createElement("div");
        item.className = "stats-row-item";
        item.style.cssText = `
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 6px;
          margin-bottom: 6px;
        `;
        item.innerHTML = `
          <span>${idx + 1}. <strong>${displayShortcutName(s.name)}</strong> (${s.url.length > 30 ? s.url.slice(0, 27) + '...' : s.url})</span>
          <span style="font-weight: 600;">${s.clickCount || 0} ${state.language === "en" ? "clicks" : "次点击"}</span>
        `;
        top5List.appendChild(item);
      });
    }
  }

  // Category progress rendering
  const categoryProgress = document.getElementById("statsCategoryProgress");
  if (categoryProgress) {
    categoryProgress.innerHTML = "";
    
    const categoryClicks = {};
    state.shortcuts.forEach(s => {
      s.categories.forEach(cat => {
        categoryClicks[cat] = (categoryClicks[cat] || 0) + (s.clickCount || 0);
      });
    });

    const categories = Object.keys(categoryClicks);
    if (categories.length === 0 || totalClicks === 0) {
      categoryProgress.innerHTML = `<div class="statistics-placeholder"><span>${state.language === "en" ? "No category statistics available" : "暂无分类统计数据"}</span></div>`;
    } else {
      categories.forEach(cat => {
        const clicks = categoryClicks[cat];
        const percentage = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;
        
        const wrap = document.createElement("div");
        wrap.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          margin-bottom: 10px;
        `;
        wrap.innerHTML = `
          <div style="display: flex; justify-content: space-between;">
            <span>${displayCategoryName(cat)}</span>
            <strong>${percentage}% (${clicks} ${state.language === "en" ? "clicks" : "次"})</strong>
          </div>
          <div style="width: 100%; height: 8px; background-color: rgba(0, 0, 0, 0.05); border-radius: 4px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background-color: #4f46e5; border-radius: 4px;"></div>
          </div>
        `;
        categoryProgress.appendChild(wrap);
      });
    }
  }
}

function showContextMenu(event, shortcut) {
  if (!contextMenu) return;

  const isEn = state.language === "en";
  const pinText = shortcut.pinned 
    ? (isEn ? "Unpin Shortcut" : "取消固定快捷方式") 
    : (isEn ? "Pin Shortcut" : "固定快捷方式");

  const openBtn = contextMenu.querySelector('[data-action="open"] span');
  const editBtn = contextMenu.querySelector('[data-action="edit"] span');
  const pinBtn = contextMenu.querySelector('[data-action="pin"] span');
  const deleteBtn = contextMenu.querySelector('[data-action="delete"] span');
  const copyBtn = contextMenu.querySelector('[data-action="copy"] span');

  if (openBtn) openBtn.textContent = isEn ? "Open in New Tab" : "在新标签页中打开";
  if (editBtn) editBtn.textContent = isEn ? "Edit Shortcut" : "编辑快捷方式";
  if (pinBtn) pinBtn.textContent = pinText;
  if (deleteBtn) deleteBtn.textContent = isEn ? "Delete Shortcut" : "删除快捷方式";
  if (copyBtn) copyBtn.textContent = isEn ? "Copy Link" : "复制链接";

  // Re-bind click actions
  const newContextMenu = contextMenu.cloneNode(true);
  contextMenu.replaceWith(newContextMenu);
  contextMenu = newContextMenu;
  
  const newItems = contextMenu.querySelectorAll(".context-menu__item");
  newItems.forEach(item => {
    item.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      contextMenu.hidden = true;
      
      if (action === "open") {
        await recordShortcutClick(shortcut.id);
        window.open(shortcut.url, "_blank");
      } else if (action === "edit") {
        openDialog(shortcut.id);
      } else if (action === "delete") {
        await deleteShortcutWithUndo(shortcut);
      } else if (action === "pin") {
        await togglePin(shortcut.id);
      } else if (action === "copy") {
        try {
          await navigator.clipboard.writeText(shortcut.url);
          showToast(isEn ? "Link copied!" : "链接已复制！");
        } catch (err) {
          console.error("Failed to copy link", err);
        }
      }
    });
  });

  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.hidden = false;
  
  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = `${window.innerWidth - rect.width - 8}px`;
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = `${window.innerHeight - rect.height - 8}px`;
  }
}

async function deleteShortcutWithUndo(shortcut) {
  const isEn = state.language === "en";
  const confirmMsg = isEn 
    ? `Are you sure you want to delete "${displayShortcutName(shortcut.name)}"?`
    : `确定要删除快捷方式 "${displayShortcutName(shortcut.name)}" 吗？`;
    
  if (window.confirm(confirmMsg)) {
    state.lastDeletedShortcut = shortcut;
    state.shortcuts = state.shortcuts.filter(s => s.id !== shortcut.id);
    await persistShortcuts();
    syncSelectedCategory();
    renderCategories();
    renderShortcuts();
    
    showToast(
      isEn ? `Deleted "${displayShortcutName(shortcut.name)}"` : `已删除 "${displayShortcutName(shortcut.name)}"`,
      true
    );
  }
}

function showToast(message, showUndo = false) {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  const toastMessageEl = elements.undoToast.querySelector(".undo-toast__message");
  if (toastMessageEl) {
    toastMessageEl.textContent = message;
  }
  
  if (elements.undoButton) {
    elements.undoButton.style.display = showUndo ? "inline-block" : "none";
    elements.undoButton.textContent = state.language === "en" ? "Undo" : "撤销";
  }

  elements.undoToast.classList.add("is-visible");

  toastTimeout = setTimeout(() => {
    elements.undoToast.classList.remove("is-visible");
  }, 4000);
}

// Daily Wallpaper asynchronous cache
async function fetchAndCacheDailyWallpaper() {
  const dailyType = localStorage.getItem("noon-new-tab-daily-wallpaper-type-v1") || "none";
  if (dailyType === "none") return;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const cachedDate = localStorage.getItem("noon-new-tab-daily-wallpaper-cached-date-v1");
  const cachedData = localStorage.getItem("noon-new-tab-daily-wallpaper-cached-v1");
  const cachedType = localStorage.getItem("noon-new-tab-daily-wallpaper-cached-type-v1");

  if (cachedDate === todayStr && cachedData && cachedType === dailyType) {
    return;
  }

  let url = "";
  if (dailyType === "bing") {
    url = "https://api.dujin.org/bing/1920.php"; 
  } else if (dailyType === "picsum") {
    url = `https://picsum.photos/1920/1080?sig=${todayStr}`;
  }

  if (!url) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      localStorage.setItem("noon-new-tab-daily-wallpaper-cached-v1", base64data);
      localStorage.setItem("noon-new-tab-daily-wallpaper-cached-date-v1", todayStr);
      localStorage.setItem("noon-new-tab-daily-wallpaper-cached-type-v1", dailyType);
      
      // Update background with cached base64 wallpaper
      document.body.classList.add("has-wallpaper");
      elements.wallpaperOverlay.style.backgroundImage = `url(${base64data})`;
      elements.wallpaperOverlay.hidden = false;
    };
    reader.readAsDataURL(blob);
  } catch (e) {
    console.error("Failed to fetch daily wallpaper asynchronously", e);
  }
}

// Hydrate, apply preferences, and fade out appLoader spinner
hydrate().then(() => {
  initializeEnhancements();
  applyTheme(state.themePreference);
  applyWallpaper();
  applyLanguage();
  renderCategorySuggestions();
  renderCategories();
  renderShortcuts();
  bindEvents();
  
  // Fade out dynamic loader spinner
  if (appLoader) {
    appLoader.style.opacity = "0";
    setTimeout(() => {
      appLoader.style.display = "none";
    }, 500);
  }
});

async function hydrate() {
  state.shortcuts = await loadShortcuts();
  state.categoryDefinitions = await loadCategoryDefinitions();
  state.themePreference = await loadThemePreference();
  state.customLogo = await loadCustomLogo();
  state.sortMode = await loadSortMode();
  state.language = await loadLanguage();
  state.wallpaper = await loadWallpaper();
  ensureCategoryDefinitionsFromShortcuts();
  elements.sortSelect.value = state.sortMode;
}

function bindEvents() {
  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");
  elements.searchForm.addEventListener("submit", handleSearchSubmit);
  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.searchInput.addEventListener("keydown", handleSearchKeydown);
  elements.searchInput.addEventListener("focus", handleSearchFocus);
  elements.categorySearchInput.addEventListener("input", handleCategorySearchInput);
  elements.shortcutSearchInput.addEventListener("input", handleShortcutSearchInput);
  elements.sortSelect.addEventListener("change", handleSortChange);
  elements.languageToggleButton.addEventListener("click", handleToggleLanguage);
  document.addEventListener("click", handleDocumentClick);
  elements.addShortcutButton.addEventListener("click", () => openDialog());
  elements.addCategoryButton.addEventListener("click", createCategoriesFromPrompt);
  
  // File upload inputs
  elements.logoUploadInput.addEventListener("change", handleLogoUpload);
  elements.importConfigInput.addEventListener("change", handleImportConfig);
  elements.wallpaperUploadInput.addEventListener("change", handleWallpaperUpload);
  
  // Shortcut Dialog events
  elements.closeDialogButton.addEventListener("click", closeDialog);
  elements.cancelButton.addEventListener("click", closeDialog);
  elements.deleteShortcutButton.addEventListener("click", deleteCurrentShortcut);
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.form.addEventListener("submit", handleShortcutSubmit);
  elements.form.addEventListener("keydown", handleShortcutFormKeydown);
  colorSchemeQuery.addEventListener("change", handleSystemThemeChange);
  elements.dialog.addEventListener("click", handleDialogBackdropClick);
}

function handleDialogBackdropClick(event) {
  const dialogBox = elements.form.getBoundingClientRect();
  const isBackdropClick =
    event.clientX < dialogBox.left ||
    event.clientX > dialogBox.right ||
    event.clientY < dialogBox.top ||
    event.clientY > dialogBox.bottom;
  if (isBackdropClick) {
    closeDialog();
  }
}

function applyLanguage() {
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  elements.languageToggleButton.textContent = t("languageButton");
  
  const settingsBtn = document.getElementById("settingsMenuButton");
  if (settingsBtn) {
    settingsBtn.textContent = state.language === "en" ? "Settings" : "偏好设置";
  }

  updateSearchPlaceholder();
  applySettingsDialogLanguage();

  document.querySelector("#categorySidebarTitle").textContent = t("categoryTitle");
  elements.categorySearchInput.placeholder = t("categorySearchPlaceholder");
  elements.shortcutSearchInput.placeholder = t("shortcutSearchPlaceholder");
  document.querySelector(".sort-field__label").textContent = t("sortLabel");
  elements.addShortcutButton.querySelector(".shortcut-add-card__label").textContent = t("addShortcut");
  const searchLabel = document.querySelector('label[for="searchInput"]');
  if (searchLabel) {
    searchLabel.textContent = t("heroSearchPlaceholder");
  }
  document.querySelector('label[for="nameInput"], .field:nth-of-type(1) span').textContent = t("fieldName");
  elements.nameInput.placeholder = t("fieldNamePlaceholder");
  document.querySelector('.field:nth-of-type(2) span').textContent = t("fieldUrl");
  elements.urlInput.placeholder = t("fieldUrlPlaceholder");
  document.querySelector('.field:nth-of-type(3) span').textContent = t("fieldCategories");
  elements.categoriesInput.placeholder = t("fieldCategoriesPlaceholder");
  document.querySelector(".field__hint").textContent = t("fieldCategoriesHint");
  elements.cancelButton.textContent = t("cancel");
  elements.deleteShortcutButton.textContent = t("delete");
  elements.form.querySelector('.secondary-button[type="submit"]').textContent = t("save");
  
  renderHelpContent();
  applySortOptionLabels();
  updateDialogTitle();
  renderCategorySuggestions();
  renderCategories();
  renderShortcuts();
}

function renderHelpContent() {
  elements.helpDialogContent.textContent = "";
  const fragment = document.createDocumentFragment();
  t("helpItems").forEach((item) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = item;
    fragment.append(paragraph);
  });
  elements.helpDialogContent.append(fragment);
}

function applySortOptionLabels() {
  const labels = {
    "manual": t("sortManual"),
    "click-desc": t("sortClicks"),
    "name-asc": t("sortNameAsc"),
    "name-desc": t("sortNameDesc"),
    "newest": t("sortNewest"),
    "oldest": t("sortOldest"),
  };

  [...elements.sortSelect.options].forEach((option) => {
    option.textContent = labels[option.value] ?? option.value;
  });
}

function updateDialogTitle() {
  const shortcut = state.shortcuts.find((item) => item.id === state.editingId);
  elements.dialogTitle.textContent = shortcut ? t("editShortcutTitle") : t("addShortcutTitle");
}

function handleToggleLanguage() {
  state.language = state.language === "zh" ? "en" : "zh";
  void saveLanguage(state.language);
  applyLanguage();
}

function handleCategorySearchInput(event) {
  state.categorySearchQuery = event.target.value.trim().toLowerCase();
  renderCategories();
}

function handleShortcutSearchInput(event) {
  state.shortcutSearchQuery = event.target.value.trim().toLowerCase();
  renderCategories();
  renderShortcuts();
}

function handleSortChange(event) {
  state.sortMode = normalizeSortMode(event.target.value);
  void saveSortMode(state.sortMode);
  renderShortcuts();
}

// Theme 3-state Cycle and Persistent storage under THEME_STORAGE_KEY
function toggleTheme() {
  let nextPref = "system";
  if (state.themePreference === "system") {
    nextPref = "light";
  } else if (state.themePreference === "light") {
    nextPref = "dark";
  } else {
    nextPref = "system";
  }
  state.themePreference = nextPref;
  applyTheme(nextPref);
  void saveThemePreference(nextPref);
}

function applyTheme(preference) {
  const theme = resolveTheme(preference);
  document.body.dataset.theme = theme;
  document.body.dataset.themePref = preference;
  elements.googleLogo.src = state.customLogo || (theme === "light" ? GOOGLE_LOGO_LIGHT : GOOGLE_LOGO_DARK);
  
  if (elements.themeToggleButton) {
    if (preference === "system") {
      elements.themeToggleButton.innerHTML = `
        <svg class="theme-icon theme-icon--system" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:20px; height:20px;">
          <rect x="3" y="3" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6" />
          <path d="M7 21h10M12 15v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      `;
    } else if (preference === "light") {
      elements.themeToggleButton.innerHTML = `
        <svg class="theme-icon theme-icon--sun" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:20px; height:20px;">
          <path d="M12 3.75v2.1m0 12.3v2.1m8.25-8.25h-2.1M5.85 12H3.75m14.08 5.83-1.49-1.49M7.66 7.66 6.17 6.17m11.66 0-1.49 1.49M7.66 16.34l-1.49 1.49" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="3.7" stroke="currentColor" stroke-width="1.6"/>
        </svg>
      `;
    } else {
      elements.themeToggleButton.innerHTML = `
        <svg class="theme-icon theme-icon--moon" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:20px; height:20px;">
          <path d="M18.4 14.2A7.2 7.2 0 0 1 9.8 5.6a7.5 7.5 0 1 0 8.6 8.6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        </svg>
      `;
    }
  }
}

function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function handleSystemThemeChange() {
  state.themePreference = "system";
  void saveThemePreference("system");
  if (elements.settingsThemeSelect) {
    elements.settingsThemeSelect.value = "system";
  }
  applyTheme("system");
}

// Search form submit with routing support
function handleSearchSubmit(event) {
  event.preventDefault();
  const rawValue = elements.searchInput.value.trim();
  if (!rawValue) {
    elements.searchInput.focus();
    return;
  }

  if (looksLikeUrl(rawValue)) {
    window.location.href = normalizeUrl(rawValue, true);
    return;
  }

  // Use configured search engine
  const currentEngine = selectedEngineId;
  const engines = [
    { id: "google", url: "https://www.google.com/search?q=" },
    { id: "bing", url: "https://cn.bing.com/search?q=" },
    { id: "duckduckgo", url: "https://duckduckgo.com/?q=" },
    { id: "github", url: "https://github.com/search?q=" },
    { id: "bilibili", url: "https://search.bilibili.com/all?keyword=" }
  ];
  const engineObj = engines.find(e => e.id === currentEngine) || engines[0];
  window.location.href = `${engineObj.url}${encodeURIComponent(rawValue)}`;
}

function handleSearchInput(event) {
  const query = event.target.value.trim();
  state.activeSuggestionIndex = -1;
  if (!query) {
    hideSuggestions();
    return;
  }
  void fetchSuggestions(query);
}

function handleSearchKeydown(event) {
  if (elements.searchSuggestions.hidden || !state.suggestions.length) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.activeSuggestionIndex = (state.activeSuggestionIndex + 1) % state.suggestions.length;
    syncActiveSuggestion();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    state.activeSuggestionIndex =
      (state.activeSuggestionIndex - 1 + state.suggestions.length) % state.suggestions.length;
    syncActiveSuggestion();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    hideSuggestions();
    return;
  }

  if (event.key === "Enter" && state.activeSuggestionIndex >= 0) {
    event.preventDefault();
    onSuggestionClick(state.suggestions[state.activeSuggestionIndex]);
  }
}

function syncActiveSuggestion() {
  const items = [...elements.searchSuggestionsList.children];
  items.forEach((item, index) => {
    item.classList.toggle("is-active", index === state.activeSuggestionIndex);
  });
  syncActiveSuggestionHighlight();
}

function syncActiveSuggestionHighlight() {
  const activeItem = elements.searchSuggestionsList.querySelector(".search-suggestions__item.is-active");
  if (activeItem) {
    activeItem.scrollIntoView({ block: "nearest" });
  }
}

function handleSearchFocus() {
  if (state.suggestions.length && elements.searchInput.value.trim()) {
    elements.searchSuggestions.hidden = false;
  }
}

function handleDocumentClick(event) {
  const isSearchClick =
    elements.searchForm.contains(event.target) ||
    elements.searchSuggestions.contains(event.target);
  if (!isSearchClick) {
    hideSuggestions();
  }

  // Close search engine selector details dropdown if clicked outside
  const selector = document.getElementById("searchEngineSelector");
  if (selector && selector.hasAttribute("open") && !selector.contains(event.target)) {
    selector.removeAttribute("open");
  }
}

// Dynamic language-aware hl query inside fetchSuggestions
async function fetchSuggestions(query) {
  state.suggestionAbortController?.abort();
  const controller = new AbortController();
  state.suggestionAbortController = controller;

  try {
    const hl = state.language === "en" ? "en" : "zh-CN";
    const endpoint = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(endpoint, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Suggestion request failed with ${response.status}`);
    }

    const payload = await response.json();
    const suggestions = Array.isArray(payload?.[1])
      ? payload[1].filter((item) => typeof item === "string").slice(0, 8)
      : [];

    if (elements.searchInput.value.trim() !== query) {
      return;
    }

    state.suggestions = suggestions;
    renderSuggestions();
  } catch (error) {
    if (error.name !== "AbortError") {
      hideSuggestions();
    }
  }
}

function renderSuggestions() {
  elements.searchSuggestionsList.textContent = "";
  if (!state.suggestions.length) {
    hideSuggestions();
    return;
  }

  const fragment = document.createDocumentFragment();
  state.suggestions.forEach((suggestion, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    button.type = "button";
    button.className = "search-suggestions__item";
    button.addEventListener("click", () => onSuggestionClick(suggestion));
    button.addEventListener("mousemove", () => {
      state.activeSuggestionIndex = index;
      syncActiveSuggestion();
    });

    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.className = "search-suggestions__icon";

    path.setAttribute("d", "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z");
    icon.append(path);

    const span = document.createElement("span");
    span.textContent = suggestion;

    button.append(icon, span);
    item.append(button);
    fragment.append(item);
  });

  elements.searchSuggestionsList.append(fragment);
  elements.searchSuggestions.hidden = false;
}

function hideSuggestions() {
  elements.searchSuggestions.hidden = true;
  state.suggestions = [];
  state.activeSuggestionIndex = -1;
}

function onSuggestionClick(suggestion) {
  elements.searchInput.value = suggestion;
  hideSuggestions();
  elements.searchForm.requestSubmit();
}

function renderShortcuts() {
  elements.shortcutGrid.textContent = "";
  
  const visible = getVisibleShortcuts();
  const pinned = visible.filter((s) => s.pinned);
  const unpinned = visible.filter((s) => !s.pinned);

  const sortedPinned = sortShortcuts(pinned);
  const sortedUnpinned = sortShortcuts(unpinned);

  if (!sortedPinned.length && !sortedUnpinned.length) {
    appendShortcutEmptyState(t("emptyFiltered"));
    return;
  }

  const fragment = document.createDocumentFragment();

  sortedPinned.forEach((shortcut) => {
    fragment.append(createShortcutCard(shortcut));
  });

  sortedUnpinned.forEach((shortcut) => {
    fragment.append(createShortcutCard(shortcut));
  });

  elements.shortcutGrid.append(fragment);
  elements.shortcutGrid.append(elements.addShortcutButton);
}

function createShortcutCard(shortcut) {
  const node = elements.template.content.firstElementChild.cloneNode(true);
  const link = node.querySelector(".shortcut-card__link");
  const favicon = node.querySelector(".shortcut-card__favicon");
  const title = node.querySelector(".shortcut-card__title");
  const meta = node.querySelector(".shortcut-card__meta");
  const editButton = node.querySelector('[data-action="edit"]');
  const pinButton = node.querySelector('[data-action="pin"]');

  node.dataset.id = shortcut.id;
  node.classList.toggle("is-pinned", shortcut.pinned);
  
  // Both pinned and unpinned links support drag sorting
  node.draggable = true;

  link.href = shortcut.url;
  title.textContent = displayShortcutName(shortcut.name);
  meta.textContent = shortcut.categories.length
    ? shortcut.categories.map(displayCategoryName).join(" · ")
    : t("uncategorized");
  
  favicon.src = getFaviconUrl(shortcut.url);
  favicon.alt = `${shortcut.name} favicon`;

  // Circular initial-letters fallback badge on loading error
  favicon.onerror = () => {
    const parent = favicon.parentElement;
    if (parent) {
      parent.innerHTML = "";
      const badge = document.createElement("div");
      badge.className = "shortcut-card__fallback-badge";
      const name = displayShortcutName(shortcut.name) || "?";
      badge.textContent = name.charAt(0).toUpperCase();
      badge.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${getColorForName(name)};
        color: #fff;
        font-weight: bold;
        font-size: 14px;
        border-radius: 50%;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      `;
      parent.appendChild(badge);
    }
  };

  link.addEventListener("click", async (event) => {
    event.preventDefault();
    await recordShortcutClick(shortcut.id);
    window.location.href = shortcut.url;
  });

  editButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event, shortcut);
  });

  if (pinButton) {
    pinButton.addEventListener("click", (event) => {
      event.preventDefault();
      void togglePin(shortcut.id);
    });
    pinButton.setAttribute("aria-label", shortcut.pinned ? t("unpinAriaLabel") : t("pinAriaLabel"));
  }

  // Right-click context menu positioning
  node.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event, shortcut);
  });

  // Drag and drop event listeners
  node.addEventListener("dragstart", onDragStart);
  node.addEventListener("dragend", onDragEnd);
  node.addEventListener("dragover", onDragOver);
  node.addEventListener("drop", onDrop);

  return node;
}

function appendShortcutEmptyState(message) {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.textContent = message;
  elements.shortcutGrid.append(emptyState);
  elements.shortcutGrid.append(elements.addShortcutButton);
}

function renderCategories() {
  const categories = getAllCategories();
  const query = state.categorySearchQuery;
  const visibleCategories = categories.filter((item) => matchesCategorySearch(item.name, query));
  const visibleShortcutCount = getVisibleShortcuts().length;

  elements.categorySummaryCount.textContent = String(visibleShortcutCount);
  elements.categoryList.textContent = "";

  const fragment = document.createDocumentFragment();
  fragment.append(createCategoryButton({
    id: "all",
    label: t("allCategory"),
    count: state.shortcuts.length,
    active: state.selectedCategory === "all",
    deletable: false,
  }));

  visibleCategories.forEach((category) => {
    fragment.append(createCategoryButton({
      id: category.name,
      label: displayCategoryName(category.name),
      count: category.count,
      active: state.selectedCategory === category.name,
      deletable: true,
    }));
  });

  elements.categoryList.append(fragment);
}

function createCategoryButton({id, label, count, active, deletable}) {
  const item = document.createElement("div");
  const selectButton = document.createElement("button");
  const main = document.createElement("span");
  const labelNode = document.createElement("span");
  const badge = document.createElement("span");
  const actionWrap = document.createElement("span");

  item.className = "category-item";
  item.classList.toggle("is-active", active);
  item.dataset.category = id;

  selectButton.type = "button";
  selectButton.className = "category-item__select";
  selectButton.addEventListener("click", () => {
    state.selectedCategory = id;
    renderCategories();
    renderShortcuts();
  });

  main.className = "category-item__main";
  labelNode.className = "category-item__label";
  labelNode.textContent = label;

  badge.className = "category-item__count";
  badge.textContent = String(count);

  main.append(labelNode, badge);
  selectButton.append(main);
  item.append(selectButton);

  if (deletable) {
    const editBtn = document.createElement("button");
    const deleteBtn = document.createElement("button");

    editBtn.type = "button";
    editBtn.className = "icon-button icon-button--small category-item__rename";
    editBtn.title = state.language === "en" ? "Rename Category" : "重命名分类";
    editBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <g transform="rotate(45 12 12)">
          <path d="M10 2h4v14l-2 4-2-4V2z M10 6h4 M10 14h4"/>
        </g>
      </svg>
    `;
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renameCategory(id);
    });

    deleteBtn.type = "button";
    deleteBtn.className = "icon-button icon-button--small category-item__delete";
    deleteBtn.title = state.language === "en" ? "Delete Category" : "删除分类";
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m8 8 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    `;
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCategory(id);
    });

    actionWrap.className = "category-item__actions";
    actionWrap.append(editBtn, deleteBtn);
    item.append(actionWrap);
  }

  // Handle Drag Over elements to categorise them
  item.addEventListener("dragover", (event) => {
    event.preventDefault();
    item.classList.add("dragover");
  });

  item.addEventListener("dragleave", () => {
    item.classList.remove("dragover");
  });

  item.addEventListener("drop", async (event) => {
    event.preventDefault();
    item.classList.remove("dragover");
    const idValue = event.dataTransfer.getData("text/plain") || state.draggedId;
    if (!idValue) {
      return;
    }
    await assignShortcutToCategory(idValue, id);
  });

  return item;
}

function onDragStart(event) {
  const card = event.currentTarget;
  state.draggedId = card.dataset.id;
  state.draggedElement = card;
  state.didCategoryDrop = false;
  card.classList.add("is-dragging", "is-drop-source");
  
  // Track pinned status of the dragged shortcut
  const shortcut = state.shortcuts.find(s => s.id === state.draggedId);
  state.draggedIsPinned = shortcut ? !!shortcut.pinned : false;

  event.dataTransfer.effectAllowed = canManualReorder() ? "move" : "copy";
  event.dataTransfer.setData("text/plain", state.draggedId);
}

function onDragEnd(event) {
  event.currentTarget.classList.remove("is-dragging", "is-drop-source");
  if (canManualReorder() && !state.didCategoryDrop) {
    syncShortcutsFromDom();
    void persistShortcuts();
  }
  state.draggedId = null;
  state.draggedElement = null;
  state.draggedIsPinned = false;
  state.didCategoryDrop = false;
}

function onDragOver(event) {
  if (!canManualReorder()) {
    return;
  }
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const targetCard = event.currentTarget;
  const draggedCard = state.draggedElement;
  if (!draggedCard || draggedCard === targetCard) {
    return;
  }

  // Boundary check: pinned items drag-sorting only within their zone
  const targetShortcut = state.shortcuts.find(s => s.id === targetCard.dataset.id);
  const targetIsPinned = targetShortcut ? !!targetShortcut.pinned : false;
  
  if (state.draggedIsPinned !== targetIsPinned) {
    return;
  }

  const shouldInsertAfter = getShouldInsertAfter(targetCard, event);
  const referenceNode = shouldInsertAfter ? targetCard.nextSibling : targetCard;

  if (referenceNode !== draggedCard) {
    elements.shortcutGrid.insertBefore(draggedCard, referenceNode);
  }
}

function onDrop(event) {
  if (!canManualReorder()) {
    return;
  }
  event.preventDefault();
  syncShortcutsFromDom();
  void persistShortcuts();
}

function getShouldInsertAfter(targetCard, event) {
  const rect = targetCard.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  const mostlyHorizontal = Math.abs(offsetX - rect.width / 2) > Math.abs(offsetY - rect.height / 2);
  return mostlyHorizontal ? offsetX > rect.width / 2 : offsetY > rect.height / 2;
}

function syncShortcutsFromDom() {
  const orderedIds = [...elements.shortcutGrid.querySelectorAll(".shortcut-card")]
    .map((card) => card.dataset.id)
    .filter(Boolean);

  if (!orderedIds.length) {
    return;
  }

  const shortcutMap = new Map(state.shortcuts.map((shortcut) => [shortcut.id, shortcut]));
  state.shortcuts = orderedIds.map((id) => shortcutMap.get(id)).filter(Boolean);
}

async function assignShortcutToCategory(shortcutId, categoryName) {
  state.didCategoryDrop = true;
  state.shortcuts = state.shortcuts.map((shortcut) => {
    if (shortcut.id !== shortcutId) {
      return shortcut;
    }
    if (shortcut.categories.includes(categoryName)) {
      return shortcut;
    }
    return {
      ...shortcut,
      categories: [...shortcut.categories, categoryName],
    };
  });
  mergeCategoryDefinitions([categoryName]);
  await persistAll();
  renderCategorySuggestions();
  renderCategories();
  renderShortcuts();
}

async function recordShortcutClick(shortcutId) {
  state.shortcuts = state.shortcuts.map((shortcut) =>
    shortcut.id === shortcutId
      ? {...shortcut, clickCount: (shortcut.clickCount || 0) + 1}
      : shortcut,
  );
  await persistShortcuts();
  if (state.sortMode === "click-desc") {
    renderShortcuts();
  }
  updateStatisticsPanel();
}

async function togglePin(shortcutId) {
  state.shortcuts = state.shortcuts.map((shortcut) =>
    shortcut.id === shortcutId
      ? {...shortcut, pinned: !shortcut.pinned}
      : shortcut,
  );
  await persistShortcuts();
  renderShortcuts();
}

function closeTopbarMenu() {
  // Obsolete: topbar menu is replaced by Sonoma settings panel
}

function exportConfig() {
  const payload = {
    version: "1.2.0",
    shortcuts: state.shortcuts,
    categories: state.categoryDefinitions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `noon-new-tab-shortcuts-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function triggerImportConfig() {
  elements.importConfigInput.value = "";
  elements.importConfigInput.click();
}

async function handleImportConfig(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const shortcutsSource = Array.isArray(payload) ? payload : payload?.shortcuts;
    if (!Array.isArray(shortcutsSource)) {
      throw new Error("Invalid config shape");
    }

    const importedShortcuts = shortcutsSource.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      name: normalizeLocalizedLabel(String(item.name ?? "").trim()),
      url: normalizeUrl(String(item.url ?? "").trim(), true),
      categories: Array.isArray(item.categories) ? item.categories.map(String) : [],
      pinned: Boolean(item.pinned),
      createdAt: Number(item.createdAt) || Date.now(),
      clickCount: Number(item.clickCount) || 0,
    }));

    const categoriesSource = payload?.categories;
    const importedCategories = Array.isArray(categoriesSource)
      ? normalizeCategoryDefinitions(categoriesSource)
      : [];

    state.shortcuts = importedShortcuts;
    state.categoryDefinitions = mergeCategoryDefinitionLists(
      state.categoryDefinitions,
      [...importedCategories, ...collectCategoryDefinitions(importedShortcuts)],
    );

    syncSelectedCategory();
    await persistAll();
    renderCategorySuggestions();
    renderCategories();
    renderShortcuts();
  } catch {
    window.alert(t("importFailed"));
  }
}

async function handleWallpaperUpload(event) {
  const [file] = event.target.files ?? [];
  if (!file) return;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.wallpaper = dataUrl;
    
    // De-activate daily wallpaper option
    localStorage.setItem("noon-new-tab-daily-wallpaper-type-v1", "none");
    if (document.getElementById("settingsDailyWallpaperSelect")) {
      document.getElementById("settingsDailyWallpaperSelect").value = "none";
    }

    applyWallpaper();
    await writeLocalOnlyStorage(WALLPAPER_STORAGE_KEY, dataUrl);
  } catch {
    window.alert(t("wallpaperUploadFailed"));
  }
}

async function clearWallpaper() {
  state.wallpaper = null;
  localStorage.setItem("noon-new-tab-daily-wallpaper-type-v1", "none");
  if (document.getElementById("settingsDailyWallpaperSelect")) {
    document.getElementById("settingsDailyWallpaperSelect").value = "none";
  }
  applyWallpaper();
  await removeLocalOnlyStorage(WALLPAPER_STORAGE_KEY);
}

function applyWallpaper() {
  const dailyType = localStorage.getItem("noon-new-tab-daily-wallpaper-type-v1") || "none";
  
  if (dailyType !== "none") {
    const cachedDate = localStorage.getItem("noon-new-tab-daily-wallpaper-cached-date-v1");
    const cachedData = localStorage.getItem("noon-new-tab-daily-wallpaper-cached-v1");
    const cachedType = localStorage.getItem("noon-new-tab-daily-wallpaper-cached-type-v1");
    const todayStr = new Date().toISOString().slice(0, 10);
    
    if (cachedDate === todayStr && cachedData && cachedType === dailyType) {
      document.body.classList.add("has-wallpaper");
      elements.wallpaperOverlay.style.backgroundImage = `url(${cachedData})`;
      elements.wallpaperOverlay.hidden = false;
      return;
    }
    
    let fallbackUrl = "";
    if (dailyType === "bing") {
      fallbackUrl = `https://api.dujin.org/bing/1920.php?d=${todayStr}`;
    } else if (dailyType === "picsum") {
      fallbackUrl = `https://picsum.photos/1920/1080?sig=${todayStr}`;
    }
    
    if (fallbackUrl) {
      document.body.classList.add("has-wallpaper");
      elements.wallpaperOverlay.style.backgroundImage = `url(${fallbackUrl})`;
      elements.wallpaperOverlay.hidden = false;
    }
    
    void fetchAndCacheDailyWallpaper();
  } else {
    const hasWallpaper = !!state.wallpaper;
    document.body.classList.toggle("has-wallpaper", hasWallpaper);
    if (hasWallpaper) {
      elements.wallpaperOverlay.style.backgroundImage = `url(${state.wallpaper})`;
      elements.wallpaperOverlay.hidden = false;
    } else {
      elements.wallpaperOverlay.style.backgroundImage = "";
      elements.wallpaperOverlay.hidden = true;
    }
  }
}

async function handleLogoUpload(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.customLogo = dataUrl;
    applyTheme(state.themePreference);
    await writeLocalOnlyStorage(CUSTOM_LOGO_STORAGE_KEY, dataUrl);
  } catch {
    window.alert(t("logoUploadFailed"));
  }
}

async function clearCustomLogo() {
  state.customLogo = null;
  applyTheme(state.themePreference);
  await removeLocalOnlyStorage(CUSTOM_LOGO_STORAGE_KEY);
}

function openDialog(id) {
  state.editingId = id ?? null;
  const shortcut = state.shortcuts.find((item) => item.id === id);

  if (shortcut) {
    elements.nameInput.value = shortcut.name;
    elements.urlInput.value = shortcut.url;
    elements.categoriesInput.value = shortcut.categories.join(", ");
    elements.deleteShortcutButton.style.display = "inline-block";
  } else {
    elements.nameInput.value = "";
    elements.urlInput.value = "";
    elements.categoriesInput.value = "";
    elements.deleteShortcutButton.style.display = "none";
  }

  updateDialogTitle();
  renderCategorySuggestions();
  elements.dialog.showModal();
  queueMicrotask(() => elements.nameInput.focus());
}

function closeDialog() {
  if (elements.dialog.open) {
    elements.dialog.close();
  }
  elements.form.reset();
  state.editingId = null;
  updateDialogTitle();
}

function openHelpDialog() {
  const tabHelp = document.getElementById("tabHelp");
  const toggle = document.getElementById("settingsToggle");
  if (tabHelp) tabHelp.checked = true;
  if (toggle) toggle.checked = true;
}

function closeHelpDialog() {
  const toggle = document.getElementById("settingsToggle");
  if (toggle) toggle.checked = false;
}

function openAboutDialog() {
  const tabAbout = document.getElementById("tabAbout");
  const toggle = document.getElementById("settingsToggle");
  if (tabAbout) tabAbout.checked = true;
  if (toggle) toggle.checked = true;
}

function closeAboutDialog() {
  const toggle = document.getElementById("settingsToggle");
  if (toggle) toggle.checked = false;
}

async function handleShortcutSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const rawUrl = String(formData.get("url") ?? "").trim();
  const existingShortcut = state.shortcuts.find((item) => item.id === state.editingId);
  const categories = parseCategories(String(formData.get("categories") ?? ""));
  const shortcut = {
    id: state.editingId ?? crypto.randomUUID(),
    name: normalizeLocalizedLabel(String(formData.get("name") ?? "").trim()),
    url: normalizeUrl(rawUrl, true),
    categories,
    createdAt: existingShortcut?.createdAt ?? Date.now(),
    clickCount: existingShortcut?.clickCount ?? 0,
    pinned: existingShortcut?.pinned ?? false,
  };

  if (!isProbablyValidUrl(shortcut.url)) {
    window.alert(t("invalidUrl"));
    elements.urlInput.focus();
    return;
  }

  const previousShortcuts = [...state.shortcuts];
  if (state.editingId) {
    state.shortcuts = state.shortcuts.map((item) =>
      item.id === state.editingId ? shortcut : item,
    );
  } else {
    state.shortcuts = [...state.shortcuts, shortcut];
  }

  mergeCategoryDefinitions(categories);
  closeDialog();

  try {
    await persistAll();
    renderCategorySuggestions();
    renderCategories();
    renderShortcuts();
  } catch {
    state.shortcuts = previousShortcuts;
    window.alert(t("saveFailed"));
  }
}

async function deleteCurrentShortcut() {
  if (!state.editingId) {
    return;
  }

  const shortcut = state.shortcuts.find((item) => item.id === state.editingId);
  if (!shortcut) {
    return;
  }

  closeDialog();
  await deleteShortcutWithUndo(shortcut);
}

function handleShortcutFormKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    const isButton =
      event.target.tagName === "BUTTON" ||
      (event.target.getAttribute("role") === "button");
    if (!isButton) {
      event.preventDefault();
      elements.form.requestSubmit();
    }
  }
}

function createCategoriesFromPrompt() {
  const isEn = state.language === "en";
  const rawValue = window.prompt(t("addCategoryPrompt"));
  if (rawValue === null) {
    return;
  }

  const categories = parseCategories(rawValue);
  if (!categories.length) {
    return;
  }

  const previousCategories = [...state.categoryDefinitions];
  mergeCategoryDefinitions(categories);

  persistCategoryDefinitions().catch(() => {
    state.categoryDefinitions = previousCategories;
    window.alert(isEn ? "Failed to save category. Please try again." : "保存分类失败，请重试。");
  });

  renderCategorySuggestions();
  renderCategories();
}

async function renameCategory(id) {
  const isEn = state.language === "en";
  const rawValue = window.prompt(t("renameCategoryPrompt"), id);
  if (rawValue === null) {
    return;
  }

  const [newName] = parseCategories(rawValue);
  if (!newName || newName === id) {
    return;
  }

  const previousShortcuts = [...state.shortcuts];
  const previousCategories = [...state.categoryDefinitions];

  state.categoryDefinitions = state.categoryDefinitions.map((cat) => (cat === id ? newName : cat));
  state.shortcuts = state.shortcuts.map((shortcut) => ({
    ...shortcut,
    categories: shortcut.categories.map((cat) => (cat === id ? newName : cat)),
  }));

  if (state.selectedCategory === id) {
    state.selectedCategory = newName;
  }

  try {
    await persistAll();
    renderCategorySuggestions();
    renderCategories();
    renderShortcuts();
  } catch {
    state.shortcuts = previousShortcuts;
    state.categoryDefinitions = previousCategories;
    if (state.selectedCategory === newName) {
      state.selectedCategory = id;
    }
    window.alert(isEn ? "Failed to rename category. Please try again." : "重命名分类失败，请重试。");
  }
}

async function deleteCategory(id) {
  if (!window.confirm(t("deleteCategoryConfirm"))) {
    return;
  }

  const previousShortcuts = [...state.shortcuts];
  const previousCategories = [...state.categoryDefinitions];

  state.categoryDefinitions = state.categoryDefinitions.filter((cat) => cat !== id);
  state.shortcuts = state.shortcuts.map((shortcut) => ({
    ...shortcut,
    categories: shortcut.categories.filter((cat) => cat !== id),
  }));

  if (state.selectedCategory === id) {
    state.selectedCategory = "all";
  }

  try {
    await persistAll();
    renderCategorySuggestions();
    renderCategories();
    renderShortcuts();
  } catch {
    state.shortcuts = previousShortcuts;
    state.categoryDefinitions = previousCategories;
    if (state.selectedCategory === "all") {
      state.selectedCategory = id;
    }
    window.alert(state.language === "en" ? "Failed to delete category. Please try again." : "删除分类失败，请重试。");
  }
}

function renderCategorySuggestions() {
  elements.categorySuggestions.textContent = "";
  const fragment = document.createDocumentFragment();
  getAllCategories().forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.label = displayCategoryName(category.name);
    fragment.append(option);
  });
  elements.categorySuggestions.append(fragment);
}

function getAllCategories() {
  const categoryCounts = new Map();

  state.categoryDefinitions.forEach((category) => {
    categoryCounts.set(category, 0);
  });

  state.shortcuts.forEach((shortcut) => {
    shortcut.categories.forEach((category) => {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    });
  });

  return [...categoryCounts.entries()]
    .map(([name, count]) => ({name, count}))
    .sort((left, right) => displayCategoryName(left.name).localeCompare(displayCategoryName(right.name), state.language === "en" ? "en" : "zh-CN"));
}

function getVisibleShortcuts() {
  const searchQuery = state.shortcutSearchQuery;
  const selectedCategory = state.selectedCategory;

  return sortShortcuts(state.shortcuts.filter((shortcut) => {
    if (selectedCategory !== "all" && !shortcut.categories.includes(selectedCategory)) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const haystack = [
      shortcut.name,
      displayShortcutName(shortcut.name),
      shortcut.url,
      shortcut.categories.join(" "),
      shortcut.categories.map(displayCategoryName).join(" "),
    ].join(" ").toLowerCase();

    return haystack.includes(searchQuery);
  }));
}

function sortShortcuts(shortcuts) {
  const items = [...shortcuts];

  switch (state.sortMode) {
    case "manual":
      return items;
    case "name-asc":
      return items.sort((left, right) => displayShortcutName(left.name).localeCompare(displayShortcutName(right.name), state.language === "en" ? "en" : "zh-CN"));
    case "name-desc":
      return items.sort((left, right) => displayShortcutName(right.name).localeCompare(displayShortcutName(left.name), state.language === "en" ? "en" : "zh-CN"));
    case "newest":
      return items.sort((left, right) => right.createdAt - left.createdAt);
    case "oldest":
      return items.sort((left, right) => left.createdAt - right.createdAt);
    case "click-desc":
    default:
      return items.sort((left, right) => right.clickCount - left.clickCount || right.createdAt - left.createdAt);
  }
}

function canManualReorder() {
  return state.sortMode === "manual" && !state.shortcutSearchQuery && state.selectedCategory === "all";
}

function syncSelectedCategory() {
  if (state.selectedCategory === "all") {
    return;
  }

  if (!state.categoryDefinitions.includes(state.selectedCategory)) {
    state.selectedCategory = "all";
  }
}

function normalizeCategoryDefinitions(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const normCatLabel = (val) => String(val ?? "").replaceAll("｜", "|").split("|").map(p => p.trim()).filter(Boolean).join("|");
  return [...new Set(value.map(normCatLabel).filter(Boolean))];
}

function mergeCategoryDefinitionLists(left, right) {
  return [...new Set([...left, ...right])];
}

function collectCategoryDefinitions(shortcuts) {
  const normCatLabel = (val) => String(val ?? "").replaceAll("｜", "|").split("|").map(p => p.trim()).filter(Boolean).join("|");
  const normCategories = (val) => {
    if (!Array.isArray(val)) return [];
    return [...new Set(val.map(normCatLabel).filter(Boolean))];
  };
  return [...new Set(shortcuts.flatMap((shortcut) => normCategories(shortcut.categories)))];
}

window.openHelpDialog = openHelpDialog;
window.openAboutDialog = openAboutDialog;
window.closeHelpDialog = closeHelpDialog;
window.closeAboutDialog = closeAboutDialog;
