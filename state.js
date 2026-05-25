export const defaultShortcuts = [
  {
    id: crypto.randomUUID(),
    name: "YouTube",
    url: "https://www.youtube.com/",
    categories: ["视频|Video"],
    createdAt: 1716380000000,
    clickCount: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "GitHub",
    url: "https://github.com/",
    categories: ["开发|Development"],
    createdAt: 1716380001000,
    clickCount: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Gmail",
    url: "https://mail.google.com/",
    categories: ["办公|Work"],
    createdAt: 1716380002000,
    clickCount: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Figma",
    url: "https://www.figma.com/",
    categories: ["设计|Design", "办公|Work"],
    createdAt: 1716380003000,
    clickCount: 0,
  },
];

export const defaultCategoryDefinitions = ["视频|Video", "开发|Development", "办公|Work", "设计|Design"];

export const state = {
  shortcuts: [],
  categoryDefinitions: [],
  editingId: null,
  draggedId: null,
  draggedElement: null,
  draggedIsPinned: false,
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
  wallpaper: null,
  lastDeletedShortcut: null
};
