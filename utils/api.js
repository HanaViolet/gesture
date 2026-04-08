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
// const CURRENT_ENV = ENV.DEVELOPMENT; // 开发环境
const CURRENT_ENV = ENV.PRODUCTION; // 生产环境 - 使用API文档地址进行测试

// 各环境基础URL配置
const BASE_URLS = {
  [ENV.DEVELOPMENT]: {
    // 手语识别 + SMPL生成 服务（开发环境）
    API_BASE: 'http://127.0.0.1:8000',
    WS_BASE: 'ws://127.0.0.1:8000',
    STATIC_BASE: 'http://127.0.0.1:8000/static',
    SMPL_BASE: 'http://127.0.0.1:8000'
  },
  [ENV.PRODUCTION]: {
    // 手语识别 + TTS 服务（生产环境 - Api_Unsign.md 地址）
    API_BASE: 'https://u895901-9072-0273df24.westc.seetacloud.com:8443',
    WS_BASE: 'wss://u895901-9072-0273df24.westc.seetacloud.com:8443',
    STATIC_BASE: 'https://u895901-9072-0273df24.westc.seetacloud.com:8443/static',
    // SMPL 3D手语生成服务（生产环境 - API_Soke.md 地址，注意是 uu895901 双u）
    SMPL_BASE: 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443'
  },
  [ENV.TEST]: {
    API_BASE: 'https://test-api.xinyuzhe.com',
    WS_BASE: 'wss://test-api.xinyuzhe.com',
    STATIC_BASE: 'https://test-static.xinyuzhe.com',
    SMPL_BASE: 'https://test-smpl.xinyuzhe.com'
  }
};

// 当前环境的配置
const currentConfig = BASE_URLS[CURRENT_ENV];

// API端点定义
const ENDPOINTS = {
  // TTS语音合成
  TTS: '/tts',
  TTS_VOICES: '/tts/voices',
  TTS_PRELOAD: '/tts/preload',

  // 手语识别（视频/图片翻译）
  SIGN_RECOGNITION: '/translate/video',
  SIGN_RECOGNITION_IMAGE: '/translate/image',
  SIGN_STATUS: '/health',

  // 3D手语生成 (SMPL服务 - 接主地址)
  SMPL_GENERATE: '/generate',
  SMPL_STATUS: '/status',
  SMPL_PROGRESS: '/progress',
  SMPL_VIDEO: '/video',
  SMPL_TASKS: '/tasks',

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

  // 心理健康AI对话 (EmoLLM)
  PSYCHOLOGY_CHAT: '/chat',
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
  TTS: 30000,        // 短文本 30秒，长文本需要 60秒
  TTS_LONG: 60000,
  SMPL: 30000,
  CHAT: 60000,       // EmoLLM 对话需要 5-30秒
  HEALTH_CHECK: 5000
};

module.exports = {
  // 基础URL
  API_BASE: currentConfig.API_BASE,
  WS_BASE: currentConfig.WS_BASE,
  STATIC_BASE: currentConfig.STATIC_BASE,
  SMPL_BASE: currentConfig.SMPL_BASE,  // SMPL服务基础URL

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

  // 获取SMPL服务完整URL
  getSmplUrl(endpoint) {
    return `${currentConfig.SMPL_BASE}${endpoint}`;
  },

  // 获取静态资源URL
  getStaticUrl(path) {
    return `${currentConfig.STATIC_BASE}/${path}`;
  }
};
