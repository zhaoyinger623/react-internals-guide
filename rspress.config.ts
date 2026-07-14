import { defineConfig } from '@rspress/core';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS === 'true' && repository
  ? `/${repository}/`
  : '/';

export default defineConfig({
  root: 'docs',
  base,
  title: 'React 原理全景',
  description: '从心智模型到源码调用链，系统理解 React 架构与运行原理',
  icon: '/react.svg',
  logo: { light: '/react.svg', dark: '/react.svg' },
  lang: 'zh-CN',
  llms: true,
  themeConfig: {
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/your-name/react-internals-guide' },
    ],
    footer: { message: '以一次状态更新为主线，建立可用于阅读源码的 React 心智模型。' },
  },
});
