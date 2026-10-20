# 《可视化导论》课程门户

基于 HTML、CSS、ES modules 与 D3.js 的静态课程网站，包含数据、可视化流程、色彩、低维数据、时序数据五章。首页提供学习入口、章节目标和图形预览；章节内提供讲解 / 关键代码 / 演示。

## 本地预览

在仓库根目录运行：

```bash
python -m http.server 8080
```

访问 http://localhost:8080/；第一章位于 http://localhost:8080/lesson-01/。

若要让同一局域网中的设备访问，可运行 `python -m http.server 8080 --bind 0.0.0.0`，通过主机局域网 IP 与端口 8080 访问。

## 发布

线上地址：https://favorites-zhaoy.github.io/hw4/

源码仓库：https://github.com/Favorites-Zhaoy/hw4

GitHub Pages 从 `main` 分支的根目录发布。推送到 `main` 后，由 GitHub 自动构建并更新网站；发布状态以仓库的 Pages 构建结果为准。

## 目录

- `index.html`：首页学习入口、五章目标与原有知识介绍
- `home-theme.css` / `home-theme.js`：教材主题与首页动效
- `soft-book.js`：封面软翻页动画
- `chapter-explorer.css` / `chapter-explorer.js`：章节目录与 SVG 预览
- `i18n.js`：中英文切换
- `lesson-01/` 至 `lesson-05/`：五章讲解、代码、演示与数据
- `lesson-theme.css`：章节共用主题
- `supplementary/`：补充演示

桌面端悬停章节名称或用键盘聚焦可预览，点击章节名称直接进入讲解；触屏端点击同样直接进入章节。

## 依赖与离线使用

无需 npm 或构建工具。五章演示从 jsDelivr CDN 加载 D3.js v7（`https://cdn.jsdelivr.net/npm/d3@7/+esm`），仓库目前未提供本地 D3 备用文件。

课程数据随各章的 `data/` 目录提供，需通过 HTTP 服务读取。本地托管页面不等于完整离线可用：断网时 D3.js 可能无法加载，交互演示不能保证运行。
