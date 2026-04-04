/**
 * 设置页面
 * 集成 settingsManager 和 i18n 系统
 */

const { i18n, t, getSupportedLanguages, setLanguage } = require('../../i18n/index')
const settingsManager = require('../../utils/settings-manager')

Page({
  data: {
    // 当前设置
    settings: {
      language: 'zh-CN',
      fontSize: 'medium',
      mode: 'normal',
      highContrast: false,
      reduceMotion: false
    },

    // 选项列表
    languages: [],
    fontSizes: [],
    modes: [],

    // 选择器显示状态
    showLangPicker: false,
    showFontPicker: false,
    showModePicker: false,

    // 显示的名称
    languageName: '简体中文',
    fontSizeName: '中',
    modeName: '普通模式'
  },

  onLoad() {
    // 初始化管理器
    settingsManager.init()
    i18n.init()

    // 获取当前设置
    const settings = settingsManager.getSettings()

    // 获取选项列表
    const languages = getSupportedLanguages()
    const fontSizes = settingsManager.getFontSizeOptions()
    const modes = [
      { value: 'normal', label: t('mode.normal') || '普通模式', desc: t('mode.normal.desc') || '适合一般用户使用' },
      { value: 'deaf', label: t('mode.deaf') || '听障模式', desc: t('mode.deaf.desc') || '提供手语翻译等辅助功能' }
    ]

    this.setData({
      settings,
      languages,
      fontSizes,
      modes
    })

    // 更新显示名称
    this.updateDisplayNames()

    // 订阅设置变更
    this.unsubscribe = settingsManager.subscribe((newSettings) => {
      this.setData({ settings: newSettings })
      this.updateDisplayNames()
    })
  },

  onUnload() {
    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },

  onShow() {
    // 重新初始化i18n以获取最新语言设置
    i18n.init()
    // 刷新页面数据以反映当前语言
    const settings = settingsManager.getSettings()
    this.setData({ settings })
    this.updateDisplayNames()
  },

  // 更新显示名称
  updateDisplayNames() {
    const { settings, languages, fontSizes, modes } = this.data

    const lang = languages.find(item => item.code === settings.language)
    const font = fontSizes.find(item => item.value === settings.fontSize)
    const mode = modes.find(item => item.value === settings.mode)

    this.setData({
      languageName: lang ? lang.nativeName : settings.language,
      fontSizeName: font ? font.label : settings.fontSize,
      modeName: mode ? mode.label : settings.mode
    })
  },

  // ========== 语言选择器 ==========
  showLanguagePicker() {
    this.setData({ showLangPicker: true })
  },

  hideLanguagePicker() {
    this.setData({ showLangPicker: false })
  },

  selectLanguage(e) {
    const lang = e.currentTarget.dataset.lang || e.currentTarget.dataset.code
    const { languages } = this.data
    const langObj = languages.find(item => item.code === lang)

    // 使用 settingsManager 保存设置
    settingsManager.set('language', lang)
    // 同时更新 i18n
    setLanguage(lang)

    this.setData({
      'settings.language': lang,
      languageName: langObj ? langObj.nativeName : lang
    })

    this.hideLanguagePicker()

    wx.showToast({
      title: t('common.save') || '保存成功',
      icon: 'success',
      duration: 1500
    })
  },

  // ========== 字体大小选择器 ==========
  showFontPicker() {
    this.setData({ showFontPicker: true })
  },

  hideFontPicker() {
    this.setData({ showFontPicker: false })
  },

  selectFontSize(e) {
    const size = e.currentTarget.dataset.size || e.currentTarget.dataset.value
    const { fontSizes } = this.data
    const sizeObj = fontSizes.find(item => item.value === size)

    // 使用 settingsManager 保存设置
    settingsManager.set('fontSize', size)

    this.setData({
      'settings.fontSize': size,
      fontSizeName: sizeObj ? sizeObj.label : size
    })

    this.hideFontPicker()

    wx.showToast({
      title: t('common.save') || '保存成功',
      icon: 'success',
      duration: 1500
    })
  },

  // ========== 使用模式选择器 ==========
  showModePicker() {
    this.setData({ showModePicker: true })
  },

  hideModePicker() {
    this.setData({ showModePicker: false })
  },

  selectMode(e) {
    const mode = e.currentTarget.dataset.mode || e.currentTarget.dataset.value
    const { modes } = this.data
    const modeObj = modes.find(item => item.value === mode)

    // 使用 settingsManager 保存设置
    settingsManager.set('mode', mode)

    this.setData({
      'settings.mode': mode,
      modeName: modeObj ? modeObj.label : mode
    })

    this.hideModePicker()

    wx.showToast({
      title: t('common.save') || '保存成功',
      icon: 'success',
      duration: 1500
    })
  },

  // ========== 开关设置 ==========
  onHighContrastChange(e) {
    const value = e.detail.value

    // 使用 settingsManager 保存设置
    settingsManager.set('highContrast', value)

    this.setData({ 'settings.highContrast': value })

    wx.showToast({
      title: value ? (t('settings.highContrastOn') || '高对比度已开启') : (t('settings.highContrastOff') || '高对比度已关闭'),
      icon: 'none',
      duration: 1500
    })
  },

  onReduceMotionChange(e) {
    const value = e.detail.value

    // 使用 settingsManager 保存设置
    settingsManager.set('reduceMotion', value)

    this.setData({ 'settings.reduceMotion': value })

    wx.showToast({
      title: value ? (t('settings.reduceMotionOn') || '减少动画已开启') : (t('settings.reduceMotionOff') || '减少动画已关闭'),
      icon: 'none',
      duration: 1500
    })
  },

  // ========== 使用教程 ==========
  openTutorial() {
    wx.navigateTo({ url: '/pages/teach/teach' });
  },

  // ========== 关于页面 ==========
  showAbout() {
    wx.showModal({
      title: t('about.title') || '关于语见',
      content: t('about.content') || '语见是一款专注于无障碍沟通的小程序，致力于帮助听障和视障用户更好地进行日常交流。\n\n版本：1.0.0',
      showCancel: false,
      confirmText: t('common.ok') || '知道了'
    })
  },

  // ========== 工具方法 ==========
  preventBubble() {
    // 阻止事件冒泡，防止点击选择器内容时关闭
  }
})
