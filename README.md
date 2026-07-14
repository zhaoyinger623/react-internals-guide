# React 原理全景（React Internals Guide）

一份从心智模型到源码调用链的 React 原理学习指南，以一次 `setState` 更新为主线，串联 UpdateQueue、Lane、Scheduler、Fiber、Hooks、Diff、Commit 与并发渲染。

项目使用 **Rspress + 多页交互 HTML**：Rspress 负责路由、侧栏和 GitHub Pages 构建；每章正文由独立 HTML 承载，以保留教程中的动画、流程图、重点块和交互演示。

## 环境要求

- Node.js 20 或更高版本，推荐 Node.js 22 LTS
- npm 10 或更高版本
- Git
- 可选：Python 3，仅在单独预览多页 HTML 时使用

检查本机环境：

```bash
node -v
npm -v
git --version
```

## 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/<你的 GitHub 用户名>/react-internals-guide.git
cd react-internals-guide
```

如果你已经下载了 ZIP，解压后直接在终端进入项目目录即可。

### 2. 安装依赖

推荐使用锁定版本安装：

```bash
npm ci
```

如果项目中没有 `package-lock.json`，再使用：

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

启动后打开终端输出的地址，默认通常是：

```text
http://localhost:3000/
```

根路径会自动进入第一章。修改原始教程、样式或嵌入组件后，开发服务器会自动重新构建。

如果端口已被占用，可以指定其他端口：

```bash
npm run dev -- --port 3001
```

> `npm run dev` 会先自动执行 `multipage:build`，因此首次启动时会从完整 HTML 生成 37 个独立章节，并同步到 Rspress 静态资源目录。

## 生产构建与本地预览

生成 GitHub Pages 所需的生产文件：

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

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 生成交互章节并启动 Rspress 开发服务器 |
| `npm run build` | 生成交互章节并构建生产站点 |
| `npm run preview` | 本地预览生产构建结果 |
| `npm run multipage:build` | 从完整 HTML 重新生成 37 个独立章节 |
| `npm run multipage:dev` | 在 `4174` 端口单独预览多页 HTML |

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

## 修改教程内容

完整教程的内容源是根目录的：

```text
react-principles-simplified.html
```

修改后运行：

```bash
npm run multipage:build
```

脚本会根据侧栏顺序重新生成 `react-internals-multipage/`，并把页面同步到 Rspress 使用的静态目录。

请不要只修改 `docs/public/chapters/`：该目录属于构建产物，下次运行生成脚本时会被覆盖。

## 发布到 GitHub Pages

项目已经包含部署工作流：

```text
.github/workflows/deploy.yml
```

### 1. 创建 GitHub 仓库

在 GitHub 创建一个空仓库，例如：

```text
react-internals-guide
```

把本地项目推送到仓库：

```bash
git remote add origin https://github.com/<你的 GitHub 用户名>/react-internals-guide.git
git push -u origin main
```

如果已经存在 `origin`，可以检查或修改地址：

```bash
git remote -v
git remote set-url origin https://github.com/<你的 GitHub 用户名>/react-internals-guide.git
```

### 2. 开启 GitHub Pages

进入仓库：

```text
Settings → Pages → Build and deployment → Source
```

选择：

```text
GitHub Actions
```

### 3. 等待自动部署

推送到 `main` 分支后，GitHub Actions 会自动：

1. 安装 Node.js 22；
2. 执行 `npm ci`；
3. 执行 `npm run build`；
4. 上传 `doc_build/`；
5. 发布到 GitHub Pages。

部署状态可在仓库的 **Actions** 页面查看。部署完成后的地址通常是：

```text
https://<你的 GitHub 用户名>.github.io/react-internals-guide/
```

`rspress.config.ts` 会在 GitHub Actions 中根据仓库名自动设置 `base`，因此更改仓库名后不需要手动修改部署子路径。

### 4. 发布前修改 GitHub 链接

把 `rspress.config.ts` 中的示例地址：

```text
https://github.com/your-name/react-internals-guide
```

替换成你的真实仓库地址，否则 Navbar 中的 GitHub 图标会跳到占位链接。

## 常见问题

### 页面中的章节显示 404

重新生成多页资源，然后重启开发服务器：

```bash
npm run multipage:build
npm run dev
```

### 页面仍显示旧样式

先停止开发服务器并重新启动，然后强制刷新浏览器：

- macOS：`Command + Shift + R`
- Windows/Linux：`Ctrl + F5`

### `npm ci` 安装失败

确认 Node.js 版本符合要求，并清理旧依赖后重试：

```bash
rm -rf node_modules
npm ci
```

Windows PowerShell 可以执行：

```powershell
Remove-Item node_modules -Recurse -Force
npm ci
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
