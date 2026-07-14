<p align="center">
  <img src="./assets/react-internals-logo.png" alt="React 原理全景 Logo" width="220" />
</p>

# React 原理全景（React Internals Guide）

一份用图解、动画和源码示例讲清 React 工作原理的中文教程。你将从一次 `setState` 开始，逐步理解 React 如何记录状态变化、安排更新、执行组件、比较页面差异，并最终把新界面显示到屏幕上。

项目使用 **Rspress + 多页交互 HTML**：Rspress 负责路由、侧栏和站点构建；每章正文由独立 HTML 承载，以保留教程中的动画、流程图、重点块和交互演示。

> ⭐ 如果这个项目帮助你理解了 React 原理，欢迎点击右上角的 **Star**。你的支持会帮助更多学习者发现这份教程，也会鼓励我继续完善后续章节。

## 环境要求

- Node.js 20 或更高版本，推荐 Node.js 22 LTS
- npm 10 或更高版本

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

启动后打开终端输出的地址：

```text
http://localhost:3000/
```

如果端口已被占用，可以指定其他端口：

```bash
npm run dev -- --port 3001
```

## 生产构建与本地预览

生成生产文件：

```bash
npm run build
```

构建产物位于：

```text
doc_build/
```

构建完成后本地预览：

```bash
npm run preview
```

## 单独预览多页 HTML

如果只想查看不带 Rspress 外壳的原始交互章节：

```bash
npm run multipage:build
npm run multipage:dev
```

然后访问：

```text
http://127.0.0.1:4174/
```

`multipage:dev` 使用 Python 3 的静态文件服务器。如果本机没有 Python，也可以使用：

```bash
npx serve react-internals-multipage
```

## 常用命令

| 命令                      | 作用                                  |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | 生成交互章节并启动 Rspress 开发服务器 |
| `npm run build`           | 生成交互章节并构建生产站点            |
| `npm run preview`         | 本地预览生产构建结果                  |
| `npm run multipage:build` | 从完整 HTML 重新生成 37 个独立章节    |
| `npm run multipage:dev`   | 在 `4174` 端口单独预览多页 HTML       |

## 项目结构

```text
.
├── docs/                         # Rspress 路由、章节元信息与侧栏结构
│   └── public/                   # Rspress 静态资源（章节由脚本生成）
├── react-internals-multipage/   # 37 个独立 HTML 章节及共享资源
│   └── assets/
│       ├── site.css             # 原教程视觉样式
│       ├── site.js              # 导航、主题和 iframe 高度同步
│       └── demos.js             # 交互演示与动画
├── scripts/
│   ├── build-multipage.mjs      # 拆分完整 HTML 并同步 Rspress 资源
│   └── embed-chapters.mjs       # 将 Rspress 路由切换为嵌入式章节
├── theme/
│   ├── EmbeddedChapter.tsx      # Rspress 与章节 iframe 的通信组件
│   └── locked.css               # 导航栏、侧栏和正文布局样式
├── react-principles-simplified.html # 完整教程内容源
├── rspress.config.ts
└── package.json
```

## 常见问题

### 页面中的章节显示 404

重新生成多页资源，然后重启开发服务器：

```bash
npm run multipage:build
npm run dev
```

## 内容路线

- 建立一次 React 更新的全局认知
- Trigger：UpdateQueue 更新入队
- Schedule：Lane 与 Scheduler
- Render：Fiber、双缓存、Hooks、Diff 与 flags
- Commit：应用 DOM 变更与执行 Effect
- 并发渲染、Suspense、Server Components 与 React Compiler
- Context、ref、包结构和源码阅读地图

## License

公开仓库前请根据你的发布目的添加许可证：

- 代码与构建脚本可以考虑 MIT License；
- 教程文字内容可以考虑 CC BY 4.0 或 CC BY-NC-SA 4.0。

如果希望代码和教程内容使用不同许可证，可以在 `LICENSE` 和 README 中分别说明。

---

如果这份教程对你有帮助，请为项目点一个 ⭐ **Star**。感谢你的支持！
