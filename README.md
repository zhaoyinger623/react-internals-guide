# React Internals Guide

一份从心智模型到源码调用链的 React 原理学习指南，使用 Rspress 构建。

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

原始交互版本保留在 `docs/public/interactive.html`，迁移后的正文位于 `docs/`，可直接用 Markdown 持续维护。

## License

建议在公开仓库前选择并添加适合你的开源许可证（例如 MIT 或 CC BY-NC-SA 4.0）。
