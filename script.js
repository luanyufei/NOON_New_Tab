const STORAGE_KEY = "noon-new-tab-shortcuts";
const CATEGORY_STORAGE_KEY = "noon-new-tab-categories-v1";
const THEME_STORAGE_KEY = "noon-new-tab-theme-v2";
const CUSTOM_LOGO_STORAGE_KEY = "noon-new-tab-custom-logo-v2";
const SORT_STORAGE_KEY = "noon-new-tab-shortcut-sort-v2";
const LANGUAGE_STORAGE_KEY = "noon-new-tab-language-v1";
const GOOGLE_SUGGEST_ENDPOINT = "https://suggestqueries.google.com/complete/search?client=firefox&hl=zh-CN&q=";
const GOOGLE_LOGO_LIGHT = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
const GOOGLE_LOGO_DARK = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_272x92dp.png";
const SYNC_CHUNK_SIZE = 7000;

const defaultShortcuts = [
  {
    id: crypto.randomUUID(),
    name: "YouTube",
    url: "https://www.youtube.com/",
    categories: ["视频|Video"],
    createdAt: Date.now() - 4000,
    clickCount: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "GitHub",
    url: "https://github.com/",
    categories: ["开发|Development"],
    createdAt: Date.now() - 3000,
    clickCount: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Gmail",
    url: "https://mail.google.com/",
    categories: ["办公|Work"],
    createdAt: Date.now() - 2000,
    clickCount: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Figma",
    url: "https://www.figma.com/",
    categories: ["设计|Design", "办公|Work"],
    createdAt: Date.now() - 1000,
    clickCount: 0,
  },
];

const defaultCategoryDefinitions = collectCategoryDefinitions(defaultShortcuts);

const translations = {
  zh: {
    languageButton: "中 / EN",
    menuUploadLogo: "上传自定义 Logo",
    menuClearLogo: "清除自定义 Logo",
    menuExport: "导出链接配置",
    menuImport: "导入链接配置",
    menuHelp: "使用帮助",
    heroSearchPlaceholder: "在 Google 中搜索，或输入网址",
    categoryTitle: "分类",
    categorySearchPlaceholder: "搜索分类",
    shortcutSearchPlaceholder: "搜索快捷方式、网址或分类",
    allCategory: "全部",
    sortLabel: "排序",
    addShortcut: "添加快捷方式",
    addShortcutTitle: "添加快捷方式",
    editShortcutTitle: "编辑快捷方式",
    fieldName: "名称",
    fieldNamePlaceholder: "例如：油管｜YouTube",
    fieldUrl: "网址",
    fieldUrlPlaceholder: "例如：youtube.com",
    fieldCategories: "分类",
    fieldCategoriesPlaceholder: "例如：视频｜Video，娱乐｜Entertainment",
    fieldCategoriesHint: "可选已有分类；直接输入可新建。多个分类可用中英文逗号分隔，用｜或 | 分隔中英文（可选）",
    cancel: "取消",
    save: "保存",
    delete: "删除",
    emptyShortcuts: "还没有快捷方式，先添加一个吧。",
    emptyFiltered: "当前筛选条件下没有匹配的快捷方式。",
    uncategorized: "未分类",
    sortManual: "手动顺序",
    sortClicks: "按频次排序",
    sortNameAsc: "名称 A-Z",
    sortNameDesc: "名称 Z-A",
    sortNewest: "最近添加",
    sortOldest: "最早添加",
    helpTitle: "使用帮助",
    helpItems: [
      "1. 使用“添加快捷方式”新增链接，可填写名称、网址和分类。",
      "2. 分类支持直接输入，也支持用“｜”分隔中英文名称。",
      "3. 左侧分类可筛选；拖动链接到分类上即可把链接加入该分类。",
      "4. 排序支持按点击频次、名称、时间和手动顺序。",
      "5. 可通过菜单导入导出配置，或上传自定义 Logo 替换主页 Google Logo。",
    ],
    addCategoryPrompt: "输入分类名称。用｜或 | 分隔中英文（可选）",
    invalidUrl: "请输入有效的网址",
    importFailed: "导入失败：这个文件不是有效的链接配置。",
    logoUploadFailed: "上传 Logo 失败，请换一张图片再试。",
    deleteCategoryConfirm: "删除这个分类？这不会删除链接，只会移除链接上的该分类。",
    renameCategoryPrompt: "重命名分类。用｜或 | 分隔中英文（可选）",
    saveFailed: "保存失败。已尝试回退到本地存储，请刷新后重试。",
  },
  en: {
    languageButton: "EN / 中",
    menuUploadLogo: "Upload Custom Logo",
    menuClearLogo: "Reset Logo",
    menuExport: "Export Shortcuts",
    menuImport: "Import Shortcuts",
    menuHelp: "Help",
    heroSearchPlaceholder: "Search Google or type a URL",
    categoryTitle: "Categories",
    categorySearchPlaceholder: "Search categories",
    shortcutSearchPlaceholder: "Search shortcuts, URLs, or categories",
    allCategory: "All",
    sortLabel: "Sort",
    addShortcut: "Add shortcut",
    addShortcutTitle: "Add shortcut",
    editShortcutTitle: "Edit shortcut",
    fieldName: "Name",
    fieldNamePlaceholder: "Example: 油管｜YouTube",
    fieldUrl: "URL",
    fieldUrlPlaceholder: "Example: youtube.com",
    fieldCategories: "Categories",
    fieldCategoriesPlaceholder: "Example: 视频｜Video, 娱乐｜Entertainment",
    fieldCategoriesHint: "Pick an existing category or type to create one. Separate multiple categories with Chinese or English commas. Use ｜ or | to split Chinese and English names (optional).",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    emptyShortcuts: "No shortcuts yet. Add one to get started.",
    emptyFiltered: "No shortcuts match the current filters.",
    uncategorized: "Uncategorized",
    sortManual: "Manual order",
    sortClicks: "By frequency",
    sortNameAsc: "Name A-Z",
    sortNameDesc: "Name Z-A",
    sortNewest: "Newest first",
    sortOldest: "Oldest first",
    helpTitle: "Help",
    helpItems: [
      "1. Use “Add shortcut” to create links with a name, URL, and categories.",
      "2. Categories can be typed directly, and “｜” can be used to split Chinese and English labels.",
      "3. Use the left sidebar to filter; drag a shortcut onto a category to add that category.",
      "4. Sorting supports click frequency, name, time, and manual order.",
      "5. Use the menu to import/export data, or upload a custom logo to replace the Google logo.",
    ],
    addCategoryPrompt: "Enter category names. Use ｜ or | to split Chinese and English labels (optional).",
    invalidUrl: "Please enter a valid URL",
    importFailed: "Import failed: the file is not a valid shortcut configuration.",
    logoUploadFailed: "Logo upload failed. Try a different image.",
    deleteCategoryConfirm: "Delete this category? Links will be kept and only this category label will be removed.",
    renameCategoryPrompt: "Rename category. Use ｜ or | to split Chinese and English labels (optional).",
    saveFailed: "Save failed. Fallback local storage was attempted. Refresh and try again.",
  },
};

const state = {
  shortcuts: [],
  categoryDefinitions: [],
  editingId: null,
  draggedId: null,
  draggedElement: null,
  didCategoryDrop: false,
  themePreference: "system",
  customLogo: null,
  suggestions: [],
  activeSuggestionIndex: -1,
  suggestionAbortController: null,
  selectedCategory: "all",
  categorySearchQuery: "",
  shortcutSearchQuery: "",
  sortMode: "click-desc",
  language: "zh",
};

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
  manageButton: document.querySelector("#manageButton"),
  topbarMenu: document.querySelector("#topbarMenu"),
  uploadLogoButton: document.querySelector("#uploadLogoButton"),
  clearLogoButton: document.querySelector("#clearLogoButton"),
  exportConfigButton: document.querySelector("#exportConfigButton"),
  importConfigButton: document.querySelector("#importConfigButton"),
  helpButton: document.querySelector("#helpButton"),
  helpDialog: document.querySelector("#helpDialog"),
  closeHelpDialogButton: document.querySelector("#closeHelpDialogButton"),
  helpDialogTitle: document.querySelector("#helpDialogTitle"),
  helpDialogContent: document.querySelector("#helpDialogContent"),
  logoUploadInput: document.querySelector("#logoUploadInput"),
  importConfigInput: document.querySelector("#importConfigInput"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelButton: document.querySelector("#cancelButton"),
  deleteShortcutButton: document.querySelector("#deleteShortcutButton"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
};

hydrate().then(() => {
  applyTheme(state.themePreference);
  applyLanguage();
  renderCategorySuggestions();
  renderCategories();
  renderShortcuts();
  bindEvents();
});

async function hydrate() {
  state.shortcuts = await loadShortcuts();
  state.categoryDefinitions = await loadCategoryDefinitions();
  state.themePreference = await loadThemePreference();
  state.customLogo = await loadCustomLogo();
  state.sortMode = await loadSortMode();
  state.language = await loadLanguage();
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
  elements.languageToggleButton.addEventListener("click", toggleLanguage);
  document.addEventListener("click", handleDocumentClick);
  elements.addShortcutButton.addEventListener("click", () => openDialog());
  elements.addCategoryButton.addEventListener("click", createCategoriesFromPrompt);
  elements.manageButton.addEventListener("click", toggleTopbarMenu);
  elements.uploadLogoButton.addEventListener("click", triggerLogoUpload);
  elements.clearLogoButton.addEventListener("click", clearCustomLogo);
  elements.exportConfigButton.addEventListener("click", exportConfig);
  elements.importConfigButton.addEventListener("click", triggerImportConfig);
  elements.helpButton.addEventListener("click", openHelpDialog);
  elements.closeHelpDialogButton.addEventListener("click", closeHelpDialog);
  elements.logoUploadInput.addEventListener("change", handleLogoUpload);
  elements.importConfigInput.addEventListener("change", handleImportConfig);
  elements.closeDialogButton.addEventListener("click", closeDialog);
  elements.cancelButton.addEventListener("click", closeDialog);
  elements.deleteShortcutButton.addEventListener("click", deleteCurrentShortcut);
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.form.addEventListener("submit", handleShortcutSubmit);
  elements.form.addEventListener("keydown", handleShortcutFormKeydown);
  colorSchemeQuery.addEventListener("change", handleSystemThemeChange);
  elements.dialog.addEventListener("click", handleDialogBackdropClick);
  elements.helpDialog.addEventListener("click", handleHelpDialogBackdropClick);
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

function handleHelpDialogBackdropClick(event) {
  const dialogBox = elements.helpDialog.querySelector(".help-dialog__panel").getBoundingClientRect();
  const isBackdropClick =
    event.clientX < dialogBox.left ||
    event.clientX > dialogBox.right ||
    event.clientY < dialogBox.top ||
    event.clientY > dialogBox.bottom;
  if (isBackdropClick) {
    closeHelpDialog();
  }
}

function t(key) {
  return translations[state.language][key];
}

function applyLanguage() {
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  elements.languageToggleButton.textContent = t("languageButton");
  elements.uploadLogoButton.textContent = t("menuUploadLogo");
  elements.clearLogoButton.textContent = t("menuClearLogo");
  elements.exportConfigButton.textContent = t("menuExport");
  elements.importConfigButton.textContent = t("menuImport");
  elements.helpButton.textContent = t("menuHelp");
  elements.searchInput.placeholder = t("heroSearchPlaceholder");
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
  elements.helpDialogTitle.textContent = t("helpTitle");
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

function toggleLanguage() {
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

function toggleTheme() {
  const nextTheme = resolveTheme(state.themePreference) === "light" ? "dark" : "light";
  state.themePreference = nextTheme;
  applyTheme(nextTheme);
  void saveThemePreference(nextTheme);
}

function applyTheme(preference) {
  const theme = resolveTheme(preference);
  document.body.dataset.theme = theme;
  elements.googleLogo.src = state.customLogo || (theme === "light" ? GOOGLE_LOGO_LIGHT : GOOGLE_LOGO_DARK);
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
    elements.searchInput.value = state.suggestions[state.activeSuggestionIndex];
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

  updateDialogTitle();
  elements.deleteShortcutButton.hidden = !shortcut;
  elements.nameInput.value = shortcut?.name ?? "";
  elements.urlInput.value = shortcut?.url ?? "";
  elements.categoriesInput.value = shortcut?.categories.join(", ") ?? "";

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
  closeTopbarMenu();
  elements.helpDialog.showModal();
}

function closeHelpDialog() {
  if (elements.helpDialog.open) {
    elements.helpDialog.close();
  }
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
  };

  if (!shortcut.name || !rawUrl || !isProbablyValidUrl(shortcut.url)) {
    elements.urlInput.setCustomValidity(t("invalidUrl"));
    elements.urlInput.reportValidity();
    return;
  }

  elements.urlInput.setCustomValidity("");

  if (state.editingId) {
    state.shortcuts = state.shortcuts.map((item) => (item.id === state.editingId ? shortcut : item));
  } else {
    state.shortcuts = [...state.shortcuts, shortcut];
  }

  mergeCategoryDefinitions(categories);
  try {
    await persistAll();
    syncSelectedCategory();
    renderCategorySuggestions();
    renderCategories();
    renderShortcuts();
    closeDialog();
  } catch (error) {
    console.error("Failed to save shortcut", error);
    window.alert(t("saveFailed"));
  }
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

async function deleteCurrentShortcut() {
  if (!state.editingId) {
    return;
  }
  state.shortcuts = state.shortcuts.filter((item) => item.id !== state.editingId);
  await persistShortcuts();
  syncSelectedCategory();
  renderCategories();
  renderShortcuts();
  closeDialog();
}

async function createCategoriesFromPrompt() {
  const raw = window.prompt(t("addCategoryPrompt"), "");
  if (raw === null) {
    return;
  }
  const categories = parseCategories(raw);
  if (!categories.length) {
    return;
  }
  mergeCategoryDefinitions(categories);
  await persistCategoryDefinitions();
  renderCategorySuggestions();
  renderCategories();
}

function renderShortcuts() {
  elements.shortcutGrid.textContent = "";
  const visibleShortcuts = getVisibleShortcuts();

  if (!state.shortcuts.length) {
    appendShortcutEmptyState(t("emptyShortcuts"));
    return;
  }

  if (!visibleShortcuts.length) {
    appendShortcutEmptyState(t("emptyFiltered"));
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleShortcuts.forEach((shortcut) => {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    const link = node.querySelector(".shortcut-card__link");
    const favicon = node.querySelector(".shortcut-card__favicon");
    const title = node.querySelector(".shortcut-card__title");
    const meta = node.querySelector(".shortcut-card__meta");
    const editButton = node.querySelector('[data-action="edit"]');

    node.dataset.id = shortcut.id;
    node.draggable = true;
    link.href = shortcut.url;
    title.textContent = displayShortcutName(shortcut.name);
    meta.textContent = shortcut.categories.length
      ? shortcut.categories.map(displayCategoryName).join(" · ")
      : t("uncategorized");
    favicon.src = getFaviconUrl(shortcut.url);
    favicon.alt = `${shortcut.name} favicon`;

    link.addEventListener("click", async (event) => {
      event.preventDefault();
      await recordShortcutClick(shortcut.id);
      window.location.href = shortcut.url;
    });

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

  item.addEventListener("dragover", (event) => {
    if (!state.draggedId || id === "all") {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  item.addEventListener("drop", (event) => {
    if (!state.draggedId || id === "all") {
      return;
    }
    event.preventDefault();
    void assignShortcutToCategory(state.draggedId, id);
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
    actionWrap.className = "category-item__actions";

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "icon-button icon-button--small category-item__rename";
    renameButton.setAttribute("aria-label", state.language === "zh" ? "重命名" : "Rename");
    renameButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 16.75V20h3.25L17.81 9.44l-3.25-3.25L4 16.75Zm12.85-8.9 1.96-1.96a.92.92 0 0 0 0-1.3L17.4 3.18a.92.92 0 0 0-1.3 0l-1.96 1.96 2.71 2.71Z" fill="currentColor"/>
      </svg>
    `;
    renameButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void renameCategory(id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "icon-button icon-button--small category-item__delete";
    deleteButton.setAttribute("aria-label", t("delete"));
    deleteButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m8 8 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    `;
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void deleteCategory(id);
    });
    actionWrap.append(renameButton, deleteButton);
    item.append(actionWrap);
  }

  return item;
}

async function renameCategory(categoryName) {
  const raw = window.prompt(t("renameCategoryPrompt"), categoryName);
  if (raw === null) {
    return;
  }

  const normalized = normalizeCategoryLabel(raw);
  if (!normalized || normalized === categoryName) {
    return;
  }

  state.categoryDefinitions = [...new Set(state.categoryDefinitions.map((item) => (
    item === categoryName ? normalized : item
  )))];

  state.shortcuts = state.shortcuts.map((shortcut) => ({
    ...shortcut,
    categories: [...new Set(shortcut.categories.map((item) => (
      item === categoryName ? normalized : item
    )))],
  }));

  if (state.selectedCategory === categoryName) {
    state.selectedCategory = normalized;
  }

  await persistAll();
  renderCategorySuggestions();
  renderCategories();
  renderShortcuts();
}

async function deleteCategory(categoryName) {
  if (!window.confirm(t("deleteCategoryConfirm"))) {
    return;
  }

  state.categoryDefinitions = state.categoryDefinitions.filter((item) => item !== categoryName);
  state.shortcuts = state.shortcuts.map((shortcut) => ({
    ...shortcut,
    categories: shortcut.categories.filter((item) => item !== categoryName),
  }));
  syncSelectedCategory();
  await persistAll();
  renderCategorySuggestions();
  renderCategories();
  renderShortcuts();
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

function onDragStart(event) {
  const card = event.currentTarget;
  state.draggedId = card.dataset.id;
  state.draggedElement = card;
  state.didCategoryDrop = false;
  card.classList.add("is-dragging", "is-drop-source");
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
      ? {...shortcut, clickCount: shortcut.clickCount + 1}
      : shortcut,
  );
  await persistShortcuts();
  if (state.sortMode === "click-desc") {
    renderShortcuts();
  }
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
        name: normalizeLocalizedLabel(String(item.name ?? "").trim()),
        url: String(item.url ?? "").trim(),
        categories: normalizeCategories(item.categories),
        createdAt: normalizeCreatedAt(item.createdAt),
        clickCount: normalizeClickCount(item.clickCount),
      }))
      .filter(isValidShortcut);

    return normalized.length ? normalized : defaultShortcuts;
  } catch {
    return defaultShortcuts;
  }
}

async function loadCategoryDefinitions() {
  const savedValue = await readStorage(CATEGORY_STORAGE_KEY);
  if (!savedValue) {
    return defaultCategoryDefinitions;
  }
  const parsed = typeof savedValue === "string" ? JSON.parse(savedValue) : savedValue;
  return normalizeCategoryDefinitions(parsed);
}

async function persistAll() {
  await Promise.all([persistShortcuts(), persistCategoryDefinitions()]);
}

async function persistShortcuts() {
  await writeStorage(STORAGE_KEY, state.shortcuts);
}

async function persistCategoryDefinitions() {
  await writeStorage(CATEGORY_STORAGE_KEY, state.categoryDefinitions);
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
    version: 3,
    exportedAt: new Date().toISOString(),
    sortMode: state.sortMode,
    language: state.language,
    categories: state.categoryDefinitions,
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
    applyTheme(state.themePreference);
    await writeLocalOnlyStorage(CUSTOM_LOGO_STORAGE_KEY, dataUrl);
  } catch {
    window.alert(t("logoUploadFailed"));
  }
}

async function clearCustomLogo() {
  closeTopbarMenu();
  state.customLogo = null;
  applyTheme(state.themePreference);
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
        name: normalizeLocalizedLabel(String(item.name ?? "").trim()),
        url: normalizeUrl(String(item.url ?? "").trim(), true),
        categories: normalizeCategories(item.categories),
        createdAt: normalizeCreatedAt(item.createdAt),
        clickCount: normalizeClickCount(item.clickCount),
      }))
      .filter(isValidShortcut)
      .filter((item) => isProbablyValidUrl(item.url));

    if (!importedShortcuts.length) {
      throw new Error("No valid shortcuts");
    }

    state.shortcuts = importedShortcuts;
    state.categoryDefinitions = mergeCategoryDefinitionLists(
      normalizeCategoryDefinitions(payload?.categories),
      collectCategoryDefinitions(importedShortcuts),
    );
    state.sortMode = normalizeSortMode(payload?.sortMode);
    state.language = normalizeLanguage(payload?.language) || state.language;
    elements.sortSelect.value = state.sortMode;
    await persistAll();
    await saveSortMode(state.sortMode);
    await saveLanguage(state.language);
    syncSelectedCategory();
    applyLanguage();
    renderCategorySuggestions();
    renderCategories();
    renderShortcuts();
  } catch {
    window.alert(t("importFailed"));
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
    savedTheme.mode === "manual" &&
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

async function loadSortMode() {
  return normalizeSortMode(await readStorage(SORT_STORAGE_KEY));
}

async function saveSortMode(value) {
  await writeStorage(SORT_STORAGE_KEY, normalizeSortMode(value));
}

async function loadLanguage() {
  return normalizeLanguage(await readStorage(LANGUAGE_STORAGE_KEY)) || "zh";
}

async function saveLanguage(value) {
  await writeStorage(LANGUAGE_STORAGE_KEY, normalizeLanguage(value) || "zh");
}

function isValidShortcut(item) {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.url === "string" &&
    Array.isArray(item.categories) &&
    typeof item.createdAt === "number" &&
    typeof item.clickCount === "number" &&
    item.name.length > 0 &&
    item.url.length > 0
  );
}

function normalizeCategories(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(
    value
      .map(normalizeCategoryLabel)
      .filter(Boolean),
  )];
}

function normalizeCategoryDefinitions(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map(normalizeCategoryLabel).filter(Boolean))];
}

function mergeCategoryDefinitionLists(left, right) {
  return [...new Set([...left, ...right])];
}

function collectCategoryDefinitions(shortcuts) {
  return [...new Set(shortcuts.flatMap((shortcut) => normalizeCategories(shortcut.categories)))];
}

function ensureCategoryDefinitionsFromShortcuts() {
  state.categoryDefinitions = mergeCategoryDefinitionLists(
    state.categoryDefinitions,
    collectCategoryDefinitions(state.shortcuts),
  );
}

function mergeCategoryDefinitions(categories) {
  state.categoryDefinitions = mergeCategoryDefinitionLists(
    state.categoryDefinitions,
    normalizeCategories(categories),
  );
}

function normalizeCategoryLabel(value) {
  return normalizeLocalizedLabel(value);
}

function normalizeLocalizedLabel(value) {
  return String(value ?? "")
    .replaceAll("｜", "|")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("|");
}

function normalizeCreatedAt(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
}

function normalizeClickCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function normalizeSortMode(value) {
  return ["click-desc", "manual", "name-asc", "name-desc", "newest", "oldest"].includes(value)
    ? value
    : "click-desc";
}

function normalizeLanguage(value) {
  return value === "en" || value === "zh" ? value : null;
}

function parseCategories(value) {
  return [...new Set(
    value
      .split(/[，,]/)
      .map(normalizeCategoryLabel)
      .filter(Boolean),
  )];
}

function displayCategoryName(value) {
  const [zh, en] = normalizeLocalizedLabel(value).split("|");
  if (state.language === "en") {
    return en || zh || "";
  }
  return zh || en || "";
}

function displayShortcutName(value) {
  const [zh, en] = normalizeLocalizedLabel(value).split("|");
  if (state.language === "en") {
    return en || zh || "";
  }
  return zh || en || "";
}

function matchesCategorySearch(rawName, query) {
  if (!query) {
    return true;
  }
  return `${rawName} ${displayCategoryName(rawName)}`.toLowerCase().includes(query);
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
    try {
      const manifestKey = getChunkManifestKey(key);
      const result = await chrome.storage.sync.get([key, manifestKey]);
      const manifest = result[manifestKey];

      if (manifest?.chunked && Number.isInteger(manifest.count)) {
        const chunkKeys = Array.from({length: manifest.count}, (_, index) => getChunkKey(key, index));
        const chunks = await chrome.storage.sync.get(chunkKeys);
        const encoded = chunkKeys.map((chunkKey) => String(chunks[chunkKey] ?? "")).join("");
        if (encoded) {
          return JSON.parse(decodeBase64Utf8(encoded));
        }
      }

      if (result[key] !== undefined) {
        return result[key];
      }
    } catch {
      // Fall through to local fallback.
    }
  }

  const rawValue = localStorage.getItem(getLocalFallbackKey(key));
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
    try {
      await writeSyncStorageChunked(key, value);
      localStorage.removeItem(getLocalFallbackKey(key));
      return;
    } catch {
      // Fall through to local fallback.
    }
  }

  localStorage.setItem(getLocalFallbackKey(key), JSON.stringify(value));
}

function hasChromeSyncStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.sync);
}

function getLocalFallbackKey(key) {
  return `fallback:${key}`;
}

function getChunkManifestKey(key) {
  return `${key}__manifest`;
}

function getChunkKey(key, index) {
  return `${key}__chunk_${index}`;
}

async function writeSyncStorageChunked(key, value) {
  const encoded = encodeBase64Utf8(JSON.stringify(value));
  const manifestKey = getChunkManifestKey(key);
  const current = await chrome.storage.sync.get([manifestKey]);
  const previousCount = current[manifestKey]?.count ?? 0;

  if (encoded.length <= SYNC_CHUNK_SIZE) {
    await chrome.storage.sync.set({[key]: value});
    const removeKeys = [manifestKey, ...Array.from({length: previousCount}, (_, index) => getChunkKey(key, index))];
    if (removeKeys.length) {
      await chrome.storage.sync.remove(removeKeys);
    }
    return;
  }

  const chunks = [];
  for (let index = 0; index < encoded.length; index += SYNC_CHUNK_SIZE) {
    chunks.push(encoded.slice(index, index + SYNC_CHUNK_SIZE));
  }

  const payload = {
    [manifestKey]: {
      chunked: true,
      count: chunks.length,
    },
  };

  chunks.forEach((chunk, index) => {
    payload[getChunkKey(key, index)] = chunk;
  });

  await chrome.storage.sync.remove([key]);
  await chrome.storage.sync.set(payload);

  const removeKeys = Array.from(
    {length: Math.max(0, previousCount - chunks.length)},
    (_, index) => getChunkKey(key, chunks.length + index),
  );
  if (removeKeys.length) {
    await chrome.storage.sync.remove(removeKeys);
  }
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64Utf8(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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
