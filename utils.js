import { state } from "./state.js";

export function displayCategoryName(value) {
  const [zh, en] = normalizeLocalizedLabel(value).split("|");
  if (state.language === "en") {
    return en || zh || "";
  }
  return zh || en || "";
}

export function displayShortcutName(value) {
  const [zh, en] = normalizeLocalizedLabel(value).split("|");
  if (state.language === "en") {
    return en || zh || "";
  }
  return zh || en || "";
}

export function normalizeLocalizedLabel(value) {
  return String(value ?? "")
    .replaceAll("｜", "|")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("|");
}

export function normalizeCategoryLabel(value) {
  return normalizeLocalizedLabel(value);
}

export function parseCategories(value) {
  return [...new Set(
    value
      .split(/[，,]/)
      .map(normalizeCategoryLabel)
      .filter(Boolean),
  )];
}

export function looksLikeUrl(value) {
  return /^(https?:\/\/|[\w-]+\.[\w.-]+)/i.test(value);
}

export function normalizeUrl(value, enforceProtocol) {
  const candidate = enforceProtocol && !/^https?:\/\//i.test(value) ? `https://${value}` : value;
  try {
    return new URL(candidate).toString();
  } catch {
    return candidate;
  }
}

export function isProbablyValidUrl(value) {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname && parsed.hostname.includes("."));
  } catch {
    return false;
  }
}

export function getFaviconUrl(value) {
  try {
    const url = new URL(value);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url.origin)}`;
  } catch {
    return "";
  }
}

export function getColorForName(name) {
  const colors = [
    "#4f46e5", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#6366f1"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function normalizeCreatedAt(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
}

export function normalizeClickCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

export function normalizeSortMode(value) {
  return ["click-desc", "manual", "name-asc", "name-desc", "newest", "oldest"].includes(value)
    ? value
    : "click-desc";
}

export function normalizeLanguage(value) {
  return value === "en" || value === "zh" ? value : null;
}

export function normalizeCategories(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(
    value
      .map(normalizeCategoryLabel)
      .filter(Boolean),
  )];
}

export function normalizeCategoryDefinitions(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map(normalizeCategoryLabel).filter(Boolean))];
}

export function mergeCategoryDefinitionLists(left, right) {
  return [...new Set([...left, ...right])];
}

export function collectCategoryDefinitions(shortcuts) {
  return [...new Set(shortcuts.flatMap((shortcut) => normalizeCategories(shortcut.categories)))];
}

export function ensureCategoryDefinitionsFromShortcuts() {
  state.categoryDefinitions = mergeCategoryDefinitionLists(
    state.categoryDefinitions,
    collectCategoryDefinitions(state.shortcuts),
  );
}

export function mergeCategoryDefinitions(categories) {
  state.categoryDefinitions = mergeCategoryDefinitionLists(
    state.categoryDefinitions,
    normalizeCategories(categories),
  );
}

export function matchesCategorySearch(rawName, query) {
  if (!query) {
    return true;
  }
  return `${rawName} ${displayCategoryName(rawName)}`.toLowerCase().includes(query);
}
