<div align="center">

# NOON New Tab

[![license](https://img.shields.io/badge/license-MIT-8ab4f8?style=flat-square)](#license)
[![release](https://img.shields.io/github/v/release/luanyufei/NOON_New_Tab?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)
[![downloads](https://img.shields.io/github/downloads/luanyufei/NOON_New_Tab/total?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)

[中文](./README.md) | English

</div>

A customizable Chrome new tab extension inspired by the Chrome / Google new tab experience, extended with unlimited shortcuts, drag-and-drop sorting, theme switching, config import/export, and optional custom logo support.

## Features

- Unlimited shortcut links
- Drag-and-drop shortcut sorting
- Add, edit, and delete shortcuts
- Search box with suggestion dropdown
- Light and dark theme switching
- Import / export shortcut config as JSON
- Custom logo upload / clear
- Override the new tab page through `chrome_url_overrides.newtab`

## Project Structure

```text
.
├── assets/
├── docs/
│   └── images/
├── index.html
├── manifest.json
├── script.js
├── styles.css
├── README.md
└── README.en.md
```

## Screenshots

Put screenshots into `docs/images/` and reference them in the README with relative paths.

Example:

```md
![Preview Light](./docs/images/preview-light.png)
![Preview Dark](./docs/images/preview-dark.png)
```

## Installation

### Load as a local Chrome extension

1. Open `chrome://extensions/`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select this project folder

After that, opening a new tab will load this extension page.

## Usage

### Manage shortcuts

- Click the add shortcut card to create a new link
- Click the edit button on a shortcut to modify it
- Drag shortcuts to reorder them

### Theme

- Use the top-right theme button to switch between light and dark mode

### Import / export config

- Open the top-right menu
- Export the current shortcut config as JSON
- Import it later to restore your shortcuts

### Custom logo

- Open the top-right menu
- Upload a custom logo
- Clear the custom logo from the same menu

## Storage

- Shortcuts use `chrome.storage.sync` in extension context
- Theme preference is stored in browser extension storage
- Custom logo uses local storage to avoid sync quota pressure
- Outside extension context, some features fall back to local browser storage

## Notes

- This is a personal project and is not affiliated with Google
- The UI style is inspired by the Chrome / Google new tab page, but the main goal is customizable shortcut management
- `reference/` is only used as development reference material and is excluded from version control

## License

This project is licensed under the MIT License.


## Possible Next Steps

- Better settings menu organization
- Optional shortcut groups
- Shortcut search / filtering
- More polished drag-and-drop animations
- Better responsive layout behavior
