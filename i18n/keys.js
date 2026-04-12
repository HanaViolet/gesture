/**
 * 翻译键常量定义
 * 防止拼写错误，提供IDE自动补全支持
 */

// 通用键
const COMMON = {
  CONFIRM: 'common.confirm',
  CANCEL: 'common.cancel',
  SAVE: 'common.save',
  OK: 'common.ok',
  DELETE: 'common.delete',
  EDIT: 'common.edit',
  CLOSE: 'common.close',
  BACK: 'common.back',
  NEXT: 'common.next',
  SKIP: 'common.skip',
  LOADING: 'common.loading',
  ERROR: 'common.error',
  SUCCESS: 'common.success',
  RETRY: 'common.retry',
  DONE: 'common.done'
}

// 导航键
const NAV = {
  HOME: 'nav.home',
  SETTINGS: 'nav.settings'
}

// 首页键
const HOME = {
  TITLE: 'home.title',
  START_TRANSLATE: 'home.startTranslate',
  QUICK_PHRASES: 'home.quickPhrases',
  // 普通版 - AI对话助手按钮
  NORMAL_PSYCHOLOGY_BTN: 'home.normal.psychologyBtn',
  // 听障版 - AI对话助手入口
  DEAF_PSYCHOLOGY_TITLE: 'home.deaf.psychologyTitle',
  DEAF_PSYCHOLOGY_DESC: 'home.deaf.psychologyDesc'
}

// 设置页键
const SETTINGS = {
  TITLE: 'settings.title',
  GENERAL: 'settings.general',
  LANGUAGE: 'settings.language',
  FONT_SIZE: 'settings.fontSize',
  MODE: 'settings.mode',
  ACCESSIBILITY: 'settings.accessibility',
  HIGH_CONTRAST: 'settings.highContrast',
  REDUCE_MOTION: 'settings.reduceMotion',
  ABOUT: 'settings.about',
  ABOUT_APP: 'settings.aboutApp',
  FEEDBACK: 'settings.feedback',
  SELECT_LANGUAGE: 'settings.selectLanguage',
  SELECT_FONT_SIZE: 'settings.selectFontSize',
  SELECT_MODE: 'settings.selectMode',
  RESET_ONBOARDING: 'settings.resetOnboarding',
  RESET_ONBOARDING_CONFIRM: 'settings.resetOnboardingConfirm'
}

// 字体大小选项
const FONT_SIZE_OPTIONS = {
  SMALL: 'font.small',
  MEDIUM: 'font.medium',
  LARGE: 'font.large',
  XLARGE: 'font.xlarge',
  XXLARGE: 'font.xxlarge'
}

// 模式选项
const MODE_OPTIONS = {
  NORMAL: 'mode.normal',
  DEAF: 'mode.deaf',
  NORMAL_DESC: 'mode.normal.desc',
  DEAF_DESC: 'mode.deaf.desc'
}

// 语言选项
const LANGUAGE_OPTIONS = {
  ZH_CN: 'lang.zh-CN',
  EN_US: 'lang.en-US',
  DE_DE: 'lang.de-DE'
}

// 快捷短语
const PHRASES = {
  HELLO: 'phrase.hello',
  THANK_YOU: 'phrase.thanks',
  SORRY: 'phrase.sorry',
  HELP: 'phrase.help',
  YES: 'phrase.yes',
  NO: 'phrase.no'
}

// AI对话助手
const PSYCHOLOGY = {
  TITLE: 'psychology.title',
  WELCOME_MESSAGE: 'psychology.welcomeMessage',
  VIEW_SIGN: 'psychology.viewSign',
  CAMERA_STATUS: 'psychology.cameraStatus',
  RECOGNIZING: 'psychology.recognizing',
  CONFIRM_START: 'psychology.confirmStart',
  RECOGNIZED: 'psychology.recognized',
  CAMERA_HINT: 'psychology.cameraHint',
  INPUT_PLACEHOLDER: 'psychology.inputPlaceholder',
  SEND: 'psychology.send',
  SIGN_MODAL_TITLE: 'psychology.signModalTitle',
  SIGN_LOADING: 'psychology.signLoading',
  SIGN_LOADING_WAIT: 'psychology.signLoadingWait',
  SIGN_EMPTY: 'psychology.signEmpty',
  ORIGINAL_TEXT: 'psychology.originalText'
}

// 所有键的集合
const TRANSLATION_KEYS = {
  ...COMMON,
  ...NAV,
  ...HOME,
  ...SETTINGS,
  ...FONT_SIZE_OPTIONS,
  ...MODE_OPTIONS,
  ...LANGUAGE_OPTIONS,
  ...PHRASES,
  ...PSYCHOLOGY
}

module.exports = {
  COMMON,
  NAV,
  HOME,
  SETTINGS,
  FONT_SIZE_OPTIONS,
  MODE_OPTIONS,
  LANGUAGE_OPTIONS,
  PHRASES,
  PSYCHOLOGY,
  TRANSLATION_KEYS
}
