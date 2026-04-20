const STORAGE_KEY = "noon-new-tab-shortcuts";
const THEME_STORAGE_KEY = "noon-new-tab-theme-v2";
const CUSTOM_LOGO_STORAGE_KEY = "noon-new-tab-custom-logo-v1";
const GOOGLE_SUGGEST_ENDPOINT = "https://suggestqueries.google.com/complete/search?client=firefox&hl=zh-CN&q=";

const defaultShortcuts = [
  {id: crypto.randomUUID(), name: "YouTube", url: "https://www.youtube.com/"},
  {id: crypto.randomUUID(), name: "GitHub", url: "https://github.com/"},
  {id: crypto.randomUUID(), name: "Gmail", url: "https://mail.google.com/"},
  {id: crypto.randomUUID(), name: "Figma", url: "https://www.figma.com/"},
];

const state = {
  shortcuts: [],
  editingId: null,
  draggedId: null,
  draggedElement: null,
  themePreference: "system",
  customLogo: null,
  suggestions: [],
  activeSuggestionIndex: -1,
  suggestionAbortController: null,
};

const elements = {
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  searchSuggestions: document.querySelector("#searchSuggestions"),
  searchSuggestionsList: document.querySelector("#searchSuggestionsList"),
  googleLogo: document.querySelector("#googleLogo"),
  customLogoPanel: document.querySelector("#customLogoPanel"),
  customLogoImage: document.querySelector("#customLogoImage"),
  shortcutGrid: document.querySelector("#shortcutGrid"),
  template: document.querySelector("#shortcutCardTemplate"),
  dialog: document.querySelector("#shortcutDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  form: document.querySelector("#shortcutForm"),
  nameInput: document.querySelector("#nameInput"),
  urlInput: document.querySelector("#urlInput"),
  addShortcutButton: document.querySelector("#addShortcutButton"),
  manageButton: document.querySelector("#manageButton"),
  topbarMenu: document.querySelector("#topbarMenu"),
  uploadLogoButton: document.querySelector("#uploadLogoButton"),
  clearLogoButton: document.querySelector("#clearLogoButton"),
  exportConfigButton: document.querySelector("#exportConfigButton"),
  importConfigButton: document.querySelector("#importConfigButton"),
  logoUploadInput: document.querySelector("#logoUploadInput"),
  importConfigInput: document.querySelector("#importConfigInput"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelButton: document.querySelector("#cancelButton"),
  deleteShortcutButton: document.querySelector("#deleteShortcutButton"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
};

initializeTheme();
hydrate().then(() => {
  renderShortcuts();
  bindEvents();
});

async function hydrate() {
  state.shortcuts = await loadShortcuts();
  state.themePreference = await loadThemePreference();
  state.customLogo = await loadCustomLogo();
  applyTheme(state.themePreference);
  renderCustomLogo();
}

function bindEvents() {
  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");
  elements.searchForm.addEventListener("submit", handleSearchSubmit);
  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.searchInput.addEventListener("keydown", handleSearchKeydown);
  elements.searchInput.addEventListener("focus", handleSearchFocus);
  document.addEventListener("click", handleDocumentClick);
  elements.addShortcutButton.addEventListener("click", () => openDialog());
  elements.manageButton.addEventListener("click", toggleTopbarMenu);
  elements.uploadLogoButton.addEventListener("click", triggerLogoUpload);
  elements.clearLogoButton.addEventListener("click", clearCustomLogo);
  elements.exportConfigButton.addEventListener("click", exportConfig);
  elements.importConfigButton.addEventListener("click", triggerImportConfig);
  elements.logoUploadInput.addEventListener("change", handleLogoUpload);
  elements.importConfigInput?.addEventListener("change", handleImportConfig);
  elements.closeDialogButton.addEventListener("click", closeDialog);
  elements.cancelButton.addEventListener("click", closeDialog);
  elements.deleteShortcutButton.addEventListener("click", deleteCurrentShortcut);
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.form.addEventListener("submit", handleShortcutSubmit);
  elements.form.addEventListener("keydown", handleShortcutFormKeydown);
  colorSchemeQuery.addEventListener("change", handleSystemThemeChange);
  elements.dialog.addEventListener("click", (event) => {
    const dialogBox = elements.form.getBoundingClientRect();
    const isBackdropClick =
      event.clientX < dialogBox.left ||
      event.clientX > dialogBox.right ||
      event.clientY < dialogBox.top ||
      event.clientY > dialogBox.bottom;
    if (isBackdropClick) {
      closeDialog();
    }
  });
}

function initializeTheme() {
  applyTheme("system");
}

function toggleTheme() {
  const nextTheme = resolveTheme(state.themePreference) === "light" ? "dark" : "light";
  state.themePreference = nextTheme;
  applyTheme(nextTheme);
  void saveThemePreference(nextTheme);
}

function applyTheme(preference) {
  const theme = resolveTheme(preference);
  document.body.dataset.theme = theme;
  elements.googleLogo.src =
    theme === "light"
      ? "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
      : "https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_272x92dp.png";
}

function resolveTheme(preference) {
  if (
    preference &&
    typeof preference === "object" &&
    preference.mode === "manual" &&
    (preference.theme === "light" || preference.theme === "dark")
  ) {
    return preference.theme;
  }
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function handleSystemThemeChange() {
  if (state.themePreference !== "system") {
    return;
  }
  applyTheme("system");
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const rawValue = elements.searchInput.value.trim();
  if (!rawValue) {
    elements.searchInput.focus();
    return;
  }

  const destination = looksLikeUrl(rawValue)
    ? normalizeUrl(rawValue, true)
    : `https://www.google.com/search?q=${encodeURIComponent(rawValue)}`;

  window.location.href = destination;
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

  if (event.key === "Enter" && state.activeSuggestionIndex >= 0) {
    event.preventDefault();
    applySuggestion(state.suggestions[state.activeSuggestionIndex]);
    handleSearchSubmit(event);
    return;
  }

  if (event.key === "Escape") {
    hideSuggestions();
  }
}

function handleSearchFocus() {
  if (state.suggestions.length) {
    renderSuggestions();
  }
}

function handleDocumentClick(event) {
  if (
    event.target === elements.searchInput ||
    elements.searchSuggestions.contains(event.target)
  ) {
    return;
  }
  hideSuggestions();

  if (
    event.target === elements.manageButton ||
    elements.manageButton.contains(event.target) ||
    elements.topbarMenu.contains(event.target)
  ) {
    return;
  }
  closeTopbarMenu();
}

async function fetchSuggestions(query) {
  state.suggestionAbortController?.abort();
  const controller = new AbortController();
  state.suggestionAbortController = controller;

  try {
    const response = await fetch(`${GOOGLE_SUGGEST_ENDPOINT}${encodeURIComponent(query)}`, {
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
    button.setAttribute("role", "option");
    button.dataset.index = String(index);
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      applySuggestion(suggestion);
      elements.searchForm.requestSubmit();
    });

    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("class", "search-suggestions__icon");
    path.setAttribute("d", "M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.44 4.44 1.06-1.06-4.44-4.44A6.5 6.5 0 0 0 10.5 4Zm0 1.5a5 5 0 1 1 0 10a5 5 0 0 1 0-10Z");
    path.setAttribute("fill", "currentColor");
    icon.append(path);

    button.append(icon, document.createTextNode(suggestion));
    item.append(button);
    fragment.append(item);
  });

  elements.searchSuggestionsList.append(fragment);
  syncActiveSuggestion();
  elements.searchSuggestions.hidden = false;
}

function syncActiveSuggestion() {
  const nodes = elements.searchSuggestionsList.querySelectorAll(".search-suggestions__item");
  nodes.forEach((node, index) => {
    node.classList.toggle("is-active", index === state.activeSuggestionIndex);
  });

  if (state.activeSuggestionIndex >= 0) {
    const activeValue = state.suggestions[state.activeSuggestionIndex];
    elements.searchInput.value = activeValue;
  }
}

function applySuggestion(value) {
  elements.searchInput.value = value;
  hideSuggestions();
}

function hideSuggestions() {
  state.suggestions = [];
  state.activeSuggestionIndex = -1;
  elements.searchSuggestions.hidden = true;
  elements.searchSuggestionsList.textContent = "";
}

function openDialog(shortcutId = null) {
  closeTopbarMenu();
  state.editingId = shortcutId;
  const shortcut = state.shortcuts.find((item) => item.id === shortcutId);

  elements.dialogTitle.textContent = shortcut ? "编辑快捷方式" : "添加快捷方式";
  elements.deleteShortcutButton.hidden = !shortcut;
  elements.nameInput.value = shortcut?.name ?? "";
  elements.urlInput.value = shortcut?.url ?? "";

  elements.dialog.showModal();
  queueMicrotask(() => elements.nameInput.focus());
}

function closeDialog() {
  if (elements.dialog.open) {
    elements.dialog.close();
  }
  elements.form.reset();
  state.editingId = null;
}

function handleShortcutSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const rawUrl = String(formData.get("url") ?? "").trim();
  const shortcut = {
    id: state.editingId ?? crypto.randomUUID(),
    name: String(formData.get("name") ?? "").trim(),
    url: normalizeUrl(rawUrl, true),
  };

  if (!shortcut.name || !rawUrl || !isProbablyValidUrl(shortcut.url)) {
    elements.urlInput.setCustomValidity("请输入有效的网址");
    elements.urlInput.reportValidity();
    return;
  }

  elements.urlInput.setCustomValidity("");

  if (state.editingId) {
    state.shortcuts = state.shortcuts.map((item) =>
      item.id === state.editingId ? shortcut : item,
    );
  } else {
    state.shortcuts = [...state.shortcuts, shortcut];
  }

  void persistShortcuts();
  renderShortcuts();
  closeDialog();
}

function handleShortcutFormKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.tagName === "BUTTON" || target.tagName === "TEXTAREA") {
    return;
  }

  event.preventDefault();
  elements.form.requestSubmit();
}

function deleteCurrentShortcut() {
  if (!state.editingId) {
    return;
  }
  state.shortcuts = state.shortcuts.filter((item) => item.id !== state.editingId);
  void persistShortcuts();
  renderShortcuts();
  closeDialog();
}

function renderShortcuts() {
  elements.shortcutGrid.textContent = "";

  if (!state.shortcuts.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "还没有快捷方式，先添加一个吧。";
    elements.shortcutGrid.append(emptyState);
    elements.shortcutGrid.append(elements.addShortcutButton);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.shortcuts.forEach((shortcut) => {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    const link = node.querySelector(".shortcut-card__link");
    const favicon = node.querySelector(".shortcut-card__favicon");
    const title = node.querySelector(".shortcut-card__title");
    const editButton = node.querySelector('[data-action="edit"]');

    node.dataset.id = shortcut.id;
    node.draggable = true;
    link.href = shortcut.url;
    title.textContent = shortcut.name;
    favicon.src = getFaviconUrl(shortcut.url);
    favicon.alt = `${shortcut.name} favicon`;

    editButton.addEventListener("click", (event) => {
      event.preventDefault();
      openDialog(shortcut.id);
    });

    node.addEventListener("dragstart", onDragStart);
    node.addEventListener("dragend", onDragEnd);
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("drop", onDrop);

    fragment.append(node);
  });

  elements.shortcutGrid.append(fragment);
  elements.shortcutGrid.append(elements.addShortcutButton);
}

function onDragStart(event) {
  const card = event.currentTarget;
  state.draggedId = card.dataset.id;
  state.draggedElement = card;
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.draggedId);
}

function onDragEnd(event) {
  event.currentTarget.classList.remove("is-dragging");
  syncShortcutsFromDom();
  void persistShortcuts();
  state.draggedId = null;
  state.draggedElement = null;
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const targetCard = event.currentTarget;
  const draggedCard = state.draggedElement;
  if (!draggedCard || draggedCard === targetCard) {
    return;
  }

  const shouldInsertAfter = getShouldInsertAfter(targetCard, event);
  const referenceNode = shouldInsertAfter ? targetCard.nextSibling : targetCard;

  if (referenceNode !== draggedCard) {
    elements.shortcutGrid.insertBefore(draggedCard, referenceNode);
  }
}

function onDrop(event) {
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
  state.shortcuts = orderedIds
    .map((id) => shortcutMap.get(id))
    .filter(Boolean);
}

async function loadShortcuts() {
  try {
    const savedValue = await readStorage(STORAGE_KEY);
    if (!savedValue) {
      return defaultShortcuts;
    }

    const parsed = typeof savedValue === "string" ? JSON.parse(savedValue) : savedValue;
    if (!Array.isArray(parsed)) {
      return defaultShortcuts;
    }

    const normalized = parsed
      .map((item) => ({
        id: String(item.id ?? crypto.randomUUID()),
        name: String(item.name ?? "").trim(),
        url: String(item.url ?? "").trim(),
      }))
      .filter(isValidShortcut);

    return normalized.length ? normalized : defaultShortcuts;
  } catch {
    return defaultShortcuts;
  }
}

async function persistShortcuts() {
  await writeStorage(STORAGE_KEY, state.shortcuts);
}

function renderCustomLogo() {
  if (!state.customLogo) {
    elements.customLogoPanel.hidden = true;
    elements.customLogoImage.removeAttribute("src");
    return;
  }

  elements.customLogoImage.src = state.customLogo;
  elements.customLogoPanel.hidden = false;
}

function toggleTopbarMenu() {
  const isHidden = elements.topbarMenu.hidden;
  elements.topbarMenu.hidden = !isHidden;
  elements.manageButton.setAttribute("aria-expanded", String(isHidden));
}

function closeTopbarMenu() {
  elements.topbarMenu.hidden = true;
  elements.manageButton.setAttribute("aria-expanded", "false");
}

function exportConfig() {
  closeTopbarMenu();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    shortcuts: state.shortcuts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `noon-new-tab-shortcuts-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function triggerImportConfig() {
  closeTopbarMenu();
  elements.importConfigInput.value = "";
  elements.importConfigInput.click();
}

function triggerLogoUpload() {
  closeTopbarMenu();
  elements.logoUploadInput.value = "";
  elements.logoUploadInput.click();
}

async function handleLogoUpload(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.customLogo = dataUrl;
    renderCustomLogo();
    await writeLocalOnlyStorage(CUSTOM_LOGO_STORAGE_KEY, dataUrl);
  } catch {
    window.alert("上传 Logo 失败，请换一张图片再试。");
  }
}

async function clearCustomLogo() {
  closeTopbarMenu();
  state.customLogo = null;
  renderCustomLogo();
  await removeLocalOnlyStorage(CUSTOM_LOGO_STORAGE_KEY);
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

    const importedShortcuts = shortcutsSource
      .map((item) => ({
        id: String(item.id ?? crypto.randomUUID()),
        name: String(item.name ?? "").trim(),
        url: normalizeUrl(String(item.url ?? "").trim(), true),
      }))
      .filter(isValidShortcut)
      .filter((item) => isProbablyValidUrl(item.url));

    if (!importedShortcuts.length) {
      throw new Error("No valid shortcuts");
    }

    state.shortcuts = importedShortcuts;
    await persistShortcuts();
    renderShortcuts();
  } catch {
    window.alert("导入失败：这个文件不是有效的链接配置。");
  }
}

async function loadThemePreference() {
  const savedTheme = await readStorage(THEME_STORAGE_KEY);
  if (savedTheme === "system") {
    return savedTheme;
  }
  if (
    savedTheme &&
    typeof savedTheme === "object" &&
    (savedTheme.mode === "manual") &&
    (savedTheme.theme === "light" || savedTheme.theme === "dark")
  ) {
    return savedTheme;
  }
  return "system";
}

async function saveThemePreference(theme) {
  await writeStorage(THEME_STORAGE_KEY, {
    mode: "manual",
    theme,
  });
}

async function loadCustomLogo() {
  const savedLogo = await readLocalOnlyStorage(CUSTOM_LOGO_STORAGE_KEY);
  return typeof savedLogo === "string" && savedLogo.length > 0 ? savedLogo : null;
}

function isValidShortcut(item) {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.url === "string" &&
    item.name.length > 0 &&
    item.url.length > 0
  );
}

function looksLikeUrl(value) {
  return /^(https?:\/\/|[\w-]+\.[\w.-]+)/i.test(value);
}

function normalizeUrl(value, enforceProtocol) {
  const candidate = enforceProtocol && !/^https?:\/\//i.test(value) ? `https://${value}` : value;
  try {
    return new URL(candidate).toString();
  } catch {
    return candidate;
  }
}

function isProbablyValidUrl(value) {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname && parsed.hostname.includes("."));
  } catch {
    return false;
  }
}

function getFaviconUrl(value) {
  try {
    const url = new URL(value);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url.origin)}`;
  } catch {
    return "";
  }
}

async function readStorage(key) {
  if (hasChromeSyncStorage()) {
    const result = await chrome.storage.sync.get([key]);
    return result[key];
  }

  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

async function writeStorage(key, value) {
  if (hasChromeSyncStorage()) {
    await chrome.storage.sync.set({[key]: value});
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

function hasChromeSyncStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.sync);
}

async function readLocalOnlyStorage(key) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const result = await chrome.storage.local.get([key]);
    return result[key];
  }

  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

async function writeLocalOnlyStorage(key, value) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({[key]: value});
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

async function removeLocalOnlyStorage(key) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.remove(key);
    return;
  }

  localStorage.removeItem(key);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
