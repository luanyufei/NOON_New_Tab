import { state, defaultShortcuts, defaultCategoryDefinitions } from "./state.js";
import { 
  normalizeCreatedAt, 
  normalizeClickCount, 
  normalizeSortMode, 
  normalizeLanguage, 
  normalizeCategoryDefinitions
} from "./utils.js";

export const STORAGE_KEY = "noon-new-tab-shortcuts";
export const CATEGORY_STORAGE_KEY = "noon-new-tab-categories-v1";
export const THEME_STORAGE_KEY = "noon-new-tab-theme-v2";
export const CUSTOM_LOGO_STORAGE_KEY = "noon-new-tab-custom-logo-v2";
export const SORT_STORAGE_KEY = "noon-new-tab-shortcut-sort-v2";
export const LANGUAGE_STORAGE_KEY = "noon-new-tab-language-v1";
export const WALLPAPER_STORAGE_KEY = "noon-new-tab-wallpaper-v1";
export const SYNC_CHUNK_SIZE = 7000;

export async function readStorage(key) {
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

export async function writeStorage(key, value) {
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

export function hasChromeSyncStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.sync);
}

export function getLocalFallbackKey(key) {
  return `fallback:${key}`;
}

export function getChunkManifestKey(key) {
  return `${key}__manifest`;
}

export function getChunkKey(key, index) {
  return `${key}__chunk_${index}`;
}

export async function writeSyncStorageChunked(key, value) {
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

export function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeBase64Utf8(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function readLocalOnlyStorage(key) {
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

export async function writeLocalOnlyStorage(key, value) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({[key]: value});
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export async function removeLocalOnlyStorage(key) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.remove(key);
    return;
  }

  localStorage.removeItem(key);
}

export async function loadShortcuts() {
  try {
    const savedValue = await readStorage(STORAGE_KEY);
    if (!savedValue) {
      return defaultShortcuts;
    }

    const parsed = typeof savedValue === "string" ? JSON.parse(savedValue) : savedValue;
    if (!Array.isArray(parsed)) {
      return defaultShortcuts;
    }

    return parsed.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      name: String(item.name ?? "").trim(),
      url: String(item.url ?? "").trim(),
      categories: Array.isArray(item.categories) ? item.categories.map(String) : [],
      pinned: Boolean(item.pinned),
      createdAt: normalizeCreatedAt(item.createdAt),
      clickCount: normalizeClickCount(item.clickCount),
    }));
  } catch {
    return defaultShortcuts;
  }
}

export async function saveShortcuts(shortcuts) {
  await writeStorage(STORAGE_KEY, shortcuts);
}

export async function persistShortcuts() {
  await saveShortcuts(state.shortcuts);
}

export async function loadCategoryDefinitions() {
  try {
    const savedValue = await readStorage(CATEGORY_STORAGE_KEY);
    if (!savedValue) {
      return defaultCategoryDefinitions;
    }

    const parsed = typeof savedValue === "string" ? JSON.parse(savedValue) : savedValue;
    if (!Array.isArray(parsed)) {
      return defaultCategoryDefinitions;
    }

    return normalizeCategoryDefinitions(parsed);
  } catch {
    return defaultCategoryDefinitions;
  }
}

export async function saveCategoryDefinitions(categories) {
  await writeStorage(CATEGORY_STORAGE_KEY, categories);
}

export async function persistCategoryDefinitions() {
  await saveCategoryDefinitions(state.categoryDefinitions);
}

export async function loadThemePreference() {
  try {
    const saved = await readStorage(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch (e) {}
  return "system";
}

export async function saveThemePreference(theme) {
  try {
    await writeStorage(THEME_STORAGE_KEY, theme);
  } catch (e) {}
}

export async function loadCustomLogo() {
  const savedLogo = await readLocalOnlyStorage(CUSTOM_LOGO_STORAGE_KEY);
  return typeof savedLogo === "string" && savedLogo.length > 0 ? savedLogo : null;
}

export async function loadSortMode() {
  return normalizeSortMode(await readStorage(SORT_STORAGE_KEY));
}

export async function saveSortMode(value) {
  await writeStorage(SORT_STORAGE_KEY, normalizeSortMode(value));
}

export async function loadLanguage() {
  return normalizeLanguage(await readStorage(LANGUAGE_STORAGE_KEY)) || "zh";
}

export async function saveLanguage(value) {
  await writeStorage(LANGUAGE_STORAGE_KEY, normalizeLanguage(value));
}

export async function loadWallpaper() {
  const savedWallpaper = await readLocalOnlyStorage(WALLPAPER_STORAGE_KEY);
  return typeof savedWallpaper === "string" && savedWallpaper.length > 0 ? savedWallpaper : null;
}

export async function persistAll() {
  await Promise.all([persistShortcuts(), persistCategoryDefinitions()]);
}
