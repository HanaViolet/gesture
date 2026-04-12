/**
 * 常量定义
 */

// 颜色常量（与设计系统保持一致）
const COLORS = {
  // 品牌色
  BRAND: '#5B7BA3',
  BRAND_LIGHT: '#E8EEF5',
  BRAND_SOFT: 'rgba(91, 123, 163, 0.06)',

  // 功能色
  SUCCESS: '#7A9E7E',
  WARNING: '#C4A574',
  ERROR: '#B5726E',

  // 文字色
  TEXT_PRIMARY: '#1A1A1A',
  TEXT_SECONDARY: '#5A5A5A',
  TEXT_TERTIARY: '#9A9A9A',
  TEXT_MUTED: '#B0B0B0',

  // 背景色
  BG_PRIMARY: '#FAFBFC',
  BG_SECONDARY: '#F0F2F5',
  BG_ELEVATED: '#FFFFFF',

  // 听障模式专用
  DEAF_URGENT: '#2C4A6E',
  DEAF_DAILY: '#E3EBF5'
};

// 间距常量
const SPACING = {
  XS: 8,   // 8rpx
  SM: 16,  // 16rpx
  MD: 24,  // 24rpx
  LG: 32,  // 32rpx
  XL: 48,  // 48rpx
  XXL: 64  // 64rpx
};

// 字号常量
const FONT_SIZE = {
  CAPTION: 24,
  BODY: 30,
  DISPLAY: 36,
  DEAF_BODY: 34,
  DEAF_DISPLAY: 40
};

// 圆角常量
const RADIUS = {
  SM: 16,
  DEFAULT: 24,
  LG: 32
};

// 动画时长
const DURATION = {
  FAST: 120,
  NORMAL: 200,
  SLOW: 300
};

// 存储键名
const STORAGE_KEYS = {
  USER_MODE: 'userMode',
  USER_INFO: 'userInfo',
  QUICK_PHRASES: 'quickPhrases',
  COMMON_PHRASES: 'commonPhrases',
  SETTINGS: 'settings'
};

// 快捷短语默认数据
const DEFAULT_QUICK_PHRASES = [
  { text: '你好', type: 'daily' },
  { text: '谢谢', type: 'daily' },
  { text: '对不起', type: 'daily' },
  { text: '请问', type: 'daily' },
  { text: '求助', type: 'urgent' },
  { text: '紧急情况', type: 'urgent' },
  { text: '我需要帮助', type: 'urgent' },
  { text: '请稍等', type: 'biz' }
];

// 页面路径
const PAGES = {
  INDEX: '/pages/index/index',
  HOME: '/pages/home/home',
  CAMERA: '/pages/camera/camera',
  ANALYSIS_RESULT: '/pages/analysis_result/analysis_result',
  TEXT_RESULT: '/pages/text_result/text_result',
  SOCIETY_COWORK: '/subpackage_community/pages/society_cowork/society_cowork',
  PERSONAL_SETTINGS: '/pages/personal_settings/personal_settings',
  FORUM: '/subpackage_community/pages/forum/forum',
  POPULARIZATION: '/pages/popularization/popularization',
  TEACH: '/subpackage_teach/pages/teach/teach'
};

module.exports = {
  COLORS,
  SPACING,
  FONT_SIZE,
  RADIUS,
  DURATION,
  STORAGE_KEYS,
  DEFAULT_QUICK_PHRASES,
  PAGES
};
