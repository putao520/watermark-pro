import { defineConfig } from 'umi';

export default defineConfig({
  title: '葡萄图片水印工具',
  metas: [
    {
      name: 'keywords',
      content: '水印生成工具',
    },
    {
      name: 'description',
      content: '',
    },
  ],
  hash: true,
  runtimePublicPath: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  theme: {
    'primary-color': '#6366F1',
    'border-radius-base': '4px',
  },
  antd: {
    dark: false, // 开启暗色主题
    compact: true, // 开启紧凑主题
  },
  mfsu: {},
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', component: '@/pages/index' }],
  fastRefresh: {},
  headScripts: [``],
});
