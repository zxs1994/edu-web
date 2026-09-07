import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 偏好会写入 localStorage；若某项被旧缓存压住不生效，在 packages/@core/preferences 递增 MIGRATION_VERSION 做强制迁移
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    /** 后端路由模式 */
    accessMode: 'backend',
    name: import.meta.env.VITE_APP_TITLE,
    enableRefreshToken: true,
    layout: 'mixed-nav',
    /** 默认首页路径 */
    defaultHomePath: '/workspace',
    /** 隐藏偏好设置按钮 */
    enablePreferences: false,
    /** 站内信/默认头像（与 Logo 同源；启动时强制覆盖 localStorage 旧值） */
    defaultAvatar: `${import.meta.env.BASE_URL}static/imgs/logo.png`,
  },
  // 自定义应用 Logo（将图片放在 apps/web-antd/public/static/imgs/ 目录下）
  /* eslint-disable */
  logo: {
    enable: true,
    fit: 'contain',
    // 使用 BASE_URL 动态获取 base 路径，支持部署在子路径下
    // 开发环境: /static/imgs/logo.png
    // 生产环境: /web/static/imgs/logo.png
    // 注意：BASE_URL 已包含末尾斜杠，所以不需要再加斜杠
    source: `${import.meta.env.BASE_URL}static/imgs/logo.png`,
  },
  /* eslint-enable */
  theme: {
    mode: 'light',
    semiDarkHeader: false,
  },
  sidebar: {
    autoActivateChild: true,
  },
  footer: {
    /** 默认关闭 footer 页脚，因为有一定遮挡 */
    enable: false,
    fixed: false,
  },
  copyright: {
    companyName: import.meta.env.VITE_APP_TITLE,
    companySiteLink: 'https://gitee.com/dhcode/dh-ui-admin-vben',
  },
  // 标签页配置 - 隐藏图标
  tabbar: {
    showIcon: false,
    showRefresh: false,
  },
  // 面包屑配置 - 隐藏图标
  breadcrumb: {
    showIcon: false,
  },
  navigation: {
    showIcon: true,
  },
  // 顶栏控件：仅开启站内信铃铛，其余图标保持隐藏
  widget: {
    fullscreen: false,
    globalSearch: false,
    languageToggle: false,
    notification: true,
    themeToggle: false,
    timezone: false,
  },
});
