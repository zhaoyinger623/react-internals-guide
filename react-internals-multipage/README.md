# React 原理全景 · 多页 HTML 实验版

这是从根目录原始完整 HTML 自动拆分得到的多页版本。每章一个 HTML，共享同一份 CSS 和交互脚本，因此完整保留原教程的布局、重点块和动画。

## 本地运行

在仓库根目录执行：

```bash
npm run multipage:build
npm run multipage:dev
```

然后访问 <http://127.0.0.1:4174/>。

不要直接手改生成后的章节文件；应修改根目录的 `react-principles-simplified.html`，再运行 `npm run multipage:build`。
