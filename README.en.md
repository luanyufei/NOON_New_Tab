<div align="center">

# NOON New Tab

[![license](https://img.shields.io/badge/license-MIT-8ab4f8?style=flat-square)](#license)
[![release](https://img.shields.io/github/v/release/luanyufei/NOON_New_Tab?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)
[![downloads](https://img.shields.io/github/downloads/luanyufei/NOON_New_Tab/total?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)

[中文](./README.md) | English

</div>

A customizable new tab extension that tries to stay close to the native Chrome / Google new tab experience, while adding unlimited shortcuts, drag-and-drop sorting, theme switching, config import/export, and custom logo support.

<img src="./docs/images/ea657d70-7dc7-4636-b85f-c2e9cc2142e5.png" alt="NOON New Tab preview" width="720">

## Background

The reason I built this extension is very straightforward. Chrome’s built-in new tab page does not support unlimited shortcut links, while many third-party new tab extensions are either paid or overly flashy. But the most important user need is actually much simpler: a clean, smooth, stable new tab page that supports a large number of shortcuts.

So the goal of this project is not to build a flashy dashboard, but to recreate the simple and direct Chrome new tab experience while improving the most important missing capability.

At the moment, this project is meant to reproduce the Chrome new tab page, so it still includes the Google logo and follows the visual and interaction style of the Chrome / Google new tab page.

Because of that, I am not publishing it to the Chrome Web Store for now. If I decide to publish it later, I may replace the current Google logo, remove visual elements that could make it look too close to an official Google product, and then prepare it again according to store policies.

## Features

- Unlimited shortcut links
- Drag-and-drop shortcut sorting
- Add, edit, and delete shortcuts
- Search box with suggestion dropdown
- Light and dark theme switching
- Import / export shortcut config as JSON
- Custom logo upload / clear
- Override the new tab page through `chrome_url_overrides.newtab`

## How to use

1. First, download the ZIP package of this project as shown below, then extract it to a local folder.

<img src="./docs/images/4281aec3-774e-4310-b912-21b510f5b663.png" alt="Download ZIP" width="720">

2. Open Chrome’s extensions page. You can open it as shown below, or type `chrome://extensions/` directly in the address bar.

<img src="./docs/images/0c3eedfc-54af-4833-be04-f8cb0a90c950.png" alt="Open extensions page" width="720">

3. Turn on `Developer mode` in the top-right corner, then click `Load unpacked` and select the extracted folder.

<img src="./docs/images/1159439f-e677-406d-846a-c99c5c5da6bc.png" alt="Load unpacked extension" width="720">

4. After that, open a new tab and Chrome will load this extension page. Done!

## Notes

- This is a personal project and is not affiliated with Google
- The UI style is inspired by the Chrome / Google new tab page, but the core goal is to improve the shortcut management limitations of the native new tab page
- `reference/` is only used as development reference material and is excluded from version control

## License

This project is licensed under the MIT License.

