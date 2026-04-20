<div align="center">

# NOON New Tab

[![license](https://img.shields.io/badge/license-MIT-8ab4f8?style=flat-square)](#许可证)
[![release](https://img.shields.io/github/v/release/luanyufei/NOON_New_Tab?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)
[![downloads](https://img.shields.io/github/downloads/luanyufei/NOON_New_Tab/total?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)

中文 | [English](./README.en.md)

</div>

一个可自定义的 Chrome 新标签页扩展项目，参考了 Chrome / Google 新标签页的交互体验，并扩展出了无限快捷方式、拖拽排序、主题切换、配置导入导出和自定义 Logo 等功能。

## 功能特性

- 无限添加快捷方式
- 快捷方式拖拽排序
- 新增、编辑、删除快捷方式
- 带候选词下拉的搜索框
- 明暗主题切换
- 导入 / 导出快捷方式 JSON 配置
- 自定义 Logo 上传 / 清除
- 通过 `chrome_url_overrides.newtab` 覆盖新标签页

## 项目结构

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

## 截图

请把截图放到 `docs/images/` 目录，然后在 README 里通过相对路径引用。

示例：

```md
![浅色预览](./docs/images/preview-light.png)
![深色预览](./docs/images/preview-dark.png)
```

## 安装方式

### 作为本地 Chrome 扩展加载

1. 打开 `chrome://extensions/`
2. 开启 `开发者模式`
3. 点击 `加载已解压的扩展程序`
4. 选择当前项目文件夹

完成后，新开标签页就会加载这个扩展页面。

## 使用说明

### 快捷方式管理

- 点击添加快捷方式卡片创建新链接
- 点击快捷方式上的编辑按钮修改内容
- 直接拖拽快捷方式调整顺序

### 主题切换

- 点击右上角主题按钮切换明暗模式

### 导入 / 导出配置

- 点击右上角三线菜单
- 导出当前快捷方式配置为 JSON
- 后续可通过导入恢复配置

### 自定义 Logo

- 点击右上角三线菜单
- 上传自定义 Logo
- 也可以从同一菜单中清除自定义 Logo

## 数据存储

- 快捷方式在扩展环境下使用 `chrome.storage.sync`
- 主题偏好使用浏览器扩展存储
- 自定义 Logo 使用本地存储，避免占用同步配额过多
- 在非扩展上下文中，部分功能会回退到浏览器本地存储

## 说明

- 这是个人项目，与 Google 无官方关联
- 界面风格参考了 Chrome / Google 新标签页，但功能重点是可自定义快捷方式管理
- `reference/` 仅是开发时的参考资料，不纳入版本控制

## 许可证

本项目使用 MIT License。

## 后续可扩展方向

- 更完整的设置菜单
- 快捷方式分组
- 快捷方式搜索 / 过滤
- 更丝滑的拖拽动画
- 更完善的自适应布局
