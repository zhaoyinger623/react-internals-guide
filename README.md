# React Internals Guide

一份从心智模型到源码调用链的 React 原理学习指南。Rspress 负责路由、搜索、侧栏和 GitHub Pages 构建；正文由从完整交互 HTML 自动拆出的独立章节承载，以保留原有布局、重点块与动画。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

只查看拆分后的原生多页版本：

```bash
npm run multipage:build
npm run multipage:dev
```

访问 `http://127.0.0.1:4174/`。生成源位于 `react-internals-multipage/`，Rspress 构建时会自动同步到静态资源目录。

## 发布到 GitHub Pages

1. 在 GitHub 创建名为 `react-internals-guide` 的仓库并推送本项目。
2. 打开仓库的 **Settings → Pages**，将 Source 设为 **GitHub Actions**。
3. 推送到 `main` 后，工作流会自动构建并发布站点。

`rspress.config.ts` 会在 GitHub Actions 中根据仓库名自动设置部署子路径，因此更改仓库名也无需手动修改 `base`。

发布前请把配置中的 `your-name` 替换为你的 GitHub 用户名。

## 内容结构

- 建立全局认知
- 一次更新的主线
- 并发与架构协作
- 高级实践与性能
- 核心专题
- 源码阅读地图

完整交互源保留在根目录 `react-principles-simplified.html`。`scripts/build-multipage.mjs` 会按侧栏顺序拆分出 37 个章节，并把共享样式和交互脚本独立到 `assets/`；`docs/` 中的 MDX 只负责把对应章节嵌入 Rspress 路由。

## License

建议在公开仓库前选择并添加适合你的开源许可证（例如 MIT 或 CC BY-NC-SA 4.0）。
