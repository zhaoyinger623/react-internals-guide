import { defineConfig } from '@rspress/core';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS === 'true' && repository
  ? `/${repository}/`
  : '/';

export default defineConfig({
  root: 'docs',
  base,
  title: 'React 原理全景',
  description: '用图解、动画和源码示例讲清 React 如何完成一次页面更新',
  icon: '/react.svg',
  logo: { light: '/react.svg', dark: '/react.svg' },
  lang: 'zh',
  llms: true,
  themeConfig: {
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/zhaoyinger623/react-internals-guide' },
    ],
    footer: { message: '以一次状态更新为主线，建立可用于阅读源码的 React 心智模型。' },
  },
});
