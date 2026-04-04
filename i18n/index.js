/**
 * 国际化语言管理器
 * 支持多语言切换和翻译
 */

const KEYS = require('./keys')

// 加载语言包
const LOCALE_MAP = {
  'zh-CN': require('./zh-CN'),
  'en-US': require('./en-US'),
  'de-DE': require('./de-DE')
}

// 存储键
const STORAGE_KEY = 'app_language_v1'

// 默认语言
const DEFAULT_LANGUAGE = 'zh-CN'

// 支持的语言列表
const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'de-DE', name: 'Deutsch', nativeName: 'Deutsch' }
]

class I18nManager {
  constructor() {
    this.currentLang = DEFAULT_LANGUAGE
    this.currentLocale = LOCALE_MAP[DEFAULT_LANGUAGE]
    this.subscribers = []
    this.initialized = false
  }

  /**
   * 初始化语言管理器
   */
  init() {
    if (this.initialized) return

    try {
      const stored = wx.getStorageSync(STORAGE_KEY)
      if (stored && LOCALE_MAP[stored]) {
        this.currentLang = stored
        this.currentLocale = LOCALE_MAP[stored]
      }
    } catch (error) {
      console.error('[I18nManager] 读取语言设置失败:', error)
    }

    this.initialized = true
    console.log('[I18nManager] 初始化完成:', this.currentLang)
  }

  /**
   * 翻译方法
   * @param {string} key 翻译键
   * @param {object} params 插值参数
   * @returns {string} 翻译后的文本
   */
  t(key, params = {}) {
    if (!key) return ''

    // 获取翻译文本
    let text = this.currentLocale[key]

    // 如果没有找到，尝试从默认语言获取
    if (!text && this.currentLang !== DEFAULT_LANGUAGE) {
      text = LOCALE_MAP[DEFAULT_LANGUAGE][key]
    }

    // 如果还是没有，返回键名
    if (!text) {
      console.warn(`[I18nManager] 未找到的翻译键: ${key}`)
      return key
    }

    // 处理插值参数 {param}
    if (params && Object.keys(params).length > 0) {
      text = text.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match
      })
    }

    return text
  }

  /**
   * 切换语言
   * @param {string} lang 语言代码
   */
  setLanguage(lang) {
    if (!LOCALE_MAP[lang]) {
      console.error(`[I18nManager] 不支持的语言: ${lang}`)
      return false
    }

    if (this.currentLang === lang) {
      return true
    }

    this.currentLang = lang
    this.currentLocale = LOCALE_MAP[lang]

    // 保存到本地存储
    try {
      wx.setStorageSync(STORAGE_KEY, lang)
    } catch (error) {
      console.error('[I18nManager] 保存语言设置失败:', error)
    }

    // 通知订阅者
    this._notifySubscribers()

    return true
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    return this.currentLang
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return [...SUPPORTED_LANGUAGES]
  }

  /**
   * 订阅语言变更
   * @param {function} callback 回调函数(newLang)
   * @returns {function} 取消订阅函数
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('[I18nManager] 订阅者必须是函数')
      return () => {}
    }

    this.subscribers.push(callback)

    // 立即返回当前语言
    callback(this.currentLang)

    // 返回取消订阅函数
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有订阅者
   */
  _notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentLang)
      } catch (error) {
        console.error('[I18nManager] 订阅者执行失败:', error)
      }
    })
  }
}

// 导出单例实例
const i18n = new I18nManager()

// 同时导出便捷方法
module.exports = {
  // 主实例
  i18n,

  // 翻译方法（快捷方式）
  t: i18n.t.bind(i18n),

  // 切换语言
  setLanguage: i18n.setLanguage.bind(i18n),

  // 获取当前语言
  getCurrentLanguage: i18n.getCurrentLanguage.bind(i18n),

  // 获取支持的语言列表
  getSupportedLanguages: i18n.getSupportedLanguages.bind(i18n),

  // 订阅语言变更
  subscribe: i18n.subscribe.bind(i18n),

  // 翻译键常量
  KEYS
}
