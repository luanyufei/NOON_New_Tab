<div align="center">

# NOON New Tab

[![license](https://img.shields.io/badge/license-MIT-8ab4f8?style=flat-square)](#许可证)
[![release](https://img.shields.io/github/v/release/luanyufei/NOON_New_Tab?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)
[![downloads](https://img.shields.io/github/downloads/luanyufei/NOON_New_Tab/total?style=flat-square)](https://github.com/luanyufei/NOON_New_Tab/releases)

中文 | [English](./README.en.md)

</div>

一个尽可能贴近 Chrome / Google 原生新标签页体验的可自定义新标签页扩展，支持无限快捷方式、分类管理、本地搜索、排序、主题切换、配置导入导出和自定义 Logo。

<img src="./docs/images/ea657d70-7dc7-4636-b85f-c2e9cc2142e5.png" alt="NOON New Tab preview" width="720">

## 项目背景

我做这个扩展的原因很直接。Chrome 自带的新标签页不支持无限添加链接，而市面上很多新标签页扩展要么收费，要么做得太花哨，但用户最核心的需求其实只是一个干净、顺手、稳定、支持大量快捷方式的新标签页。

所以这个项目的目标不是“做一个炫酷的桌面门户”，而是尽量复刻 Chrome 新标签页那种简单直接的体验，并把最核心的功能补齐。

这个项目目前的目标是复刻 Chrome 新标签页，因此界面中包含了 Google 的 logo，并整体参考了 Chrome / Google 新标签页的视觉与交互风格。

出于这一点考虑，我暂时没有把它上传到 Chrome Web Store。后续如果要正式上架扩展商店，可以考虑替换掉当前的 Google logo，进一步去掉可能引起“官方产品误认”的视觉元素，再按商店规范整理后发布。

## 功能特性

- 无限添加快捷方式
- 快捷方式拖拽排序
- 新增、编辑、删除快捷方式
- 分类侧栏、分类搜索、分类重命名与删除
- 支持把快捷方式拖到左侧分类中，快速追加分类
- 快捷方式本地搜索
- 多种排序方式，包括按频次排序
- 分类支持 `中文｜English` 双语命名，并可在页面右上角切换语言
- 带候选词下拉的搜索框
- 明暗主题切换
- 导入 / 导出快捷方式 JSON 配置
- 自定义 Logo 上传 / 清除（替换中间的 Google Logo）
- 内置“使用帮助”面板
- 通过 `chrome_url_overrides.newtab` 覆盖新标签页

## 使用方法

1、首先下载本项目的 ZIP 文件夹或 Release 附件中的扩展压缩包。下载完后解压到一个文件夹里备用。

<img src="./docs/images/4281aec3-774e-4310-b912-21b510f5b663.png" alt="Download ZIP" width="720">

2、打开 Chrome 的扩展页面。可以按如图所示的方法打开，也可以直接在 Chrome 地址栏输入 `chrome://extensions/`。

<img src="./docs/images/0c3eedfc-54af-4833-be04-f8cb0a90c950.png" alt="Open extensions page" width="720">

3、打开右上角的 `开发者模式`，然后点击 `加载已解压的扩展程序`，选择刚刚解压后的文件夹。

<img src="./docs/images/1159439f-e677-406d-846a-c99c5c5da6bc.png" alt="Load unpacked extension" width="720">

4、之后新开一个标签页，就会进入这个扩展的新标签页界面。

5、常用操作：
- 点击“添加快捷方式”新增链接
- 在分类输入框里可直接选已有分类，也可手动输入新分类
- 多个分类可用中英文逗号分隔；中英文名称可用 `｜` 或 `|` 分隔
- 拖动快捷方式到左侧分类上，可直接把链接加入该分类
- 右上角支持语言切换、主题切换、Logo 替换、导入导出和“使用帮助”

## 说明

- 这是个人项目，与 Google 无官方关联
- 界面风格参考了 Chrome / Google 新标签页，但核心目标是补足原生新标签页在快捷方式管理上的不足
- `reference/` 仅作为开发时参考资料，不纳入版本控制

## 许可证

本项目使用 MIT License。
