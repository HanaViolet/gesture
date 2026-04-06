/**
 * API配置中心
 * 统一管理所有API接口地址
 */

// 环境配置
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

// 当前环境（可通过构建工具注入或手动切换）
const CURRENT_ENV = ENV.DEVELOPMENT; // 开发环境
// const CURRENT_ENV = ENV.PRODUCTION; // 生产环境

// 各环境基础URL配置
const BASE_URLS = {
  [ENV.DEVELOPMENT]: {
    API_BASE: 'http://127.0.0.1:9966',
    WS_BASE: 'ws://127.0.0.1:9966',
    STATIC_BASE: 'http://127.0.0.1:9966/static'
  },
  [ENV.PRODUCTION]: {
    API_BASE: 'https://api.xinyuzhe.com',
    WS_BASE: 'wss://api.xinyuzhe.com',
    STATIC_BASE: 'https://static.xinyuzhe.com'
  },
  [ENV.TEST]: {
    API_BASE: 'https://test-api.xinyuzhe.com',
    WS_BASE: 'wss://test-api.xinyuzhe.com',
    STATIC_BASE: 'https://test-static.xinyuzhe.com'
  }
};

// 当前环境的配置
const currentConfig = BASE_URLS[CURRENT_ENV];

// API端点定义
const ENDPOINTS = {
  // TTS语音合成
  TTS: '/tts',
  TTS_PRELOAD: '/tts/preload',

  // 手语识别
  SIGN_RECOGNITION: '/inference',
  SIGN_STATUS: '/inference/status',

  // 3D手语生成
  SMPL_GENERATE: '/smpl/generate',
  SMPL_STATUS: '/smpl/status',

  // 用户相关
  USER_LOGIN: '/user/login',
  USER_INFO: '/user/info',
  USER_SETTINGS: '/user/settings',

  // 常用语
  PHRASES_LIST: '/phrases',
  PHRASES_ADD: '/phrases/add',
  PHRASES_DELETE: '/phrases/delete',

  // 社区
  COMMUNITY_POSTS: '/community/posts',
  COMMUNITY_CREATE: '/community/create',
  COMMUNITY_DETAIL: '/community/detail',

  // 文件上传
  UPLOAD_VIDEO: '/upload/video',
  UPLOAD_IMAGE: '/upload/image',

  // 心理健康AI对话
  PSYCHOLOGY_CHAT: '/psychology/chat',
  PSYCHOLOGY_HISTORY: '/psychology/history',

  // 手语视频生成（文本转手语）
  TEXT_TO_SIGN: '/text-to-sign/generate',
  TEXT_TO_SIGN_STATUS: '/text-to-sign/status',

  // 手语识别（视频转文本）
  SIGN_TO_TEXT: '/sign-to-text/recognize',
  SIGN_TO_TEXT_STATUS: '/sign-to-text/status'
};

// 请求超时配置（毫秒）
const TIMEOUT = {
  DEFAULT: 10000,
  UPLOAD: 60000,
  TTS: 15000,
  SMPL: 30000
};

module.exports = {
  // 基础URL
  API_BASE: currentConfig.API_BASE,
  WS_BASE: currentConfig.WS_BASE,
  STATIC_BASE: currentConfig.STATIC_BASE,

  // 端点
  ENDPOINTS,

  // 超时配置
  TIMEOUT,

  // 环境
  ENV,
  CURRENT_ENV,

  // 构建完整URL的辅助函数
  getUrl(endpoint) {
    return `${currentConfig.API_BASE}${endpoint}`;
  },

  // 获取静态资源URL
  getStaticUrl(path) {
    return `${currentConfig.STATIC_BASE}/${path}`;
  }
};
