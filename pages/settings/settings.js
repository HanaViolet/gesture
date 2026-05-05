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
    modeName: '普通模式',

    // 状态栏高度
    statusBarHeight: 44,

    // 意见反馈
    showFeedbackModal: false,
    feedbackText: '',

    // 翻译文本
    texts: {}
  },

  onLoad() {
    // 获取状态栏高度
    const windowInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: windowInfo.statusBarHeight })

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

    // 更新翻译文本
    this.updateTexts()

    // 更新显示名称
    this.updateDisplayNames()

    // 订阅设置变更
    this.unsubscribe = settingsManager.subscribe((newSettings) => {
      this.setData({ settings: newSettings })
      this.updateDisplayNames()
    })
  },

  // 更新翻译文本
  updateTexts() {
    // 更新字体大小选项的显示标签
    const { fontSizes } = this.data
    const updatedFontSizes = fontSizes.map(item => ({
      ...item,
      label: t(item.labelKey) || item.labelKey
    }))

    this.setData({
      fontSizes: updatedFontSizes,
      texts: {
        // 页面标题
        title: t('settings.title') || '设置',
        // 通用设置
        general: t('settings.general') || '通用设置',
        language: t('settings.language') || '语言',
        fontSize: t('settings.fontSize') || '字体大小',
        mode: t('settings.mode') || '使用模式',
        // 无障碍
        accessibility: t('settings.accessibility') || '无障碍',
        highContrast: t('settings.highContrast') || '高对比度',
        reduceMotion: t('settings.reduceMotion') || '减少动画',
        highContrastOn: t('settings.highContrastOn') || '高对比度已开启',
        highContrastOff: t('settings.highContrastOff') || '高对比度已关闭',
        reduceMotionOn: t('settings.reduceMotionOn') || '减少动画已开启',
        reduceMotionOff: t('settings.reduceMotionOff') || '减少动画已关闭',
        // 个人
        personal: t('settings.personal') || '个人',
        profile: t('settings.profile') || '关于我',
        notSet: t('settings.notSet') || '未设置',
        // 帮助
        help: t('settings.help') || '帮助',
        tutorial: t('settings.tutorial') || '使用教程',
        resetOnboarding: t('settings.resetOnboarding') || '重新进入新手引导',
        resetOnboardingConfirm: t('settings.resetOnboardingConfirm') || '确定要重新进入新手引导吗？',
        feedback: t('settings.feedback') || '意见反馈',
        feedbackTitle: t('settings.feedbackTitle') || '意见反馈',
        feedbackPlaceholder: t('settings.feedbackPlaceholder') || '请输入您的意见或建议，我们将不断改进...',
        feedbackEmpty: t('settings.feedbackEmpty') || '请输入反馈内容',
        feedbackSuccess: t('settings.feedbackSuccess') || '感谢您的反馈，我们将不断改进！',
        // 关于
        about: t('settings.about') || '关于',
        aboutApp: t('settings.aboutApp') || '关于语见',
        // 选择器
        selectLanguage: t('settings.selectLanguage') || '选择语言',
        selectFontSize: t('settings.selectFontSize') || '选择字体大小',
        selectMode: t('settings.selectMode') || '选择使用模式',
        // 通用
        confirm: t('common.confirm') || '确认',
        cancel: t('common.cancel') || '取消',
        save: t('common.save') || '保存',
        ok: t('common.ok') || '知道了',
        submit: t('common.submit') || '提交'
      }
    })
  },

  onUnload() {
    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },

  onShow() {
    // 刷新个人信息显示
    this.loadProfile()
    // 重新初始化i18n以获取最新语言设置
    i18n.init()
    // 刷新翻译文本
    this.updateTexts()
    // 刷新页面数据以反映当前语言
    const settings = settingsManager.getSettings()
    // 重新获取翻译后的模式列表
    const modes = [
      { value: 'normal', label: t('mode.normal') || '普通模式', desc: t('mode.normal.desc') || '适合一般用户使用' },
      { value: 'deaf', label: t('mode.deaf') || '听障模式', desc: t('mode.deaf.desc') || '提供手语翻译等辅助功能' }
    ]
    this.setData({ settings, modes })
    this.updateDisplayNames()
  },

  // 加载个人信息
  loadProfile() {
    const profile = wx.getStorageSync('userProfile') || {}
    let profileName = ''
    if (profile.nickname) {
      profileName = profile.nickname
    } else if (profile.phone) {
      profileName = profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    } else if (profile.email) {
      const email = profile.email
      profileName = email.substring(0, 2) + '***@' + email.split('@')[1]
    } else {
      profileName = ''
    }
    this.setData({ profileName })
  },

  // 打开个人信息页面
  openProfile() {
    wx.navigateTo({
      url: '/pages/settings_profile/settings_profile'
    })
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
    const lang = e.currentTarget.dataset.code
    const { languages } = this.data
    const langObj = languages.find(item => item.code === lang)

    // 使用 settingsManager 保存设置
    settingsManager.set('language', lang)
    // 同时更新 i18n
    setLanguage(lang)

    // 重新获取翻译后的模式列表
    const modes = [
      { value: 'normal', label: t('mode.normal') || '普通模式', desc: t('mode.normal.desc') || '适合一般用户使用' },
      { value: 'deaf', label: t('mode.deaf') || '听障模式', desc: t('mode.deaf.desc') || '提供手语翻译等辅助功能' }
    ]

    // 更新翻译文本
    this.updateTexts()

    this.setData({
      'settings.language': lang,
      languageName: langObj ? langObj.nativeName : lang,
      modes
    })

    // 更新模式显示名称
    this.updateDisplayNames()

    this.hideLanguagePicker()

    wx.showToast({
      title: this.data.texts.save || '保存成功',
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
    const size = e.currentTarget.dataset.value
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
      title: this.data.texts.save || '保存成功',
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
    const mode = e.currentTarget.dataset.value
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
      title: this.data.texts.save || '保存成功',
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
      title: value ? (this.data.texts.highContrastOn || '高对比度已开启') : (this.data.texts.highContrastOff || '高对比度已关闭'),
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
      title: value ? (this.data.texts.reduceMotionOn || '减少动画已开启') : (this.data.texts.reduceMotionOff || '减少动画已关闭'),
      icon: 'none',
      duration: 1500
    })
  },

  // ========== 使用教程 ==========
  openTutorial() {
    wx.navigateTo({ url: '/subpackage_teach/pages/teach/teach' });
  },

  // ========== 重新进入新手引导 ==========
  resetOnboarding() {
    wx.showModal({
      title: this.data.texts.confirm || '确认',
      content: this.data.texts.resetOnboardingConfirm || '确定要重新进入新手引导吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除已完成标记
          wx.removeStorageSync('has_onboarded');
          // 跳转到引导页
          wx.reLaunch({
            url: '/pages/onboarding/onboarding'
          });
        }
      }
    });
  },

  // ========== 关于页面 ==========
  showAbout() {
    wx.showModal({
      title: this.data.texts.aboutApp || '关于语见',
      content: t('about.content') || '语见是一款专注于无障碍沟通的小程序，致力于帮助听障和视障用户更好地进行日常交流。\n\n版本：1.0.0',
      showCancel: false,
      confirmText: this.data.texts.ok || '知道了'
    })
  },

  // ========== 意见反馈 ==========
  showFeedback() {
    this.setData({
      showFeedbackModal: true,
      feedbackText: ''
    })
  },

  hideFeedback() {
    this.setData({ showFeedbackModal: false })
  },

  onFeedbackInput(e) {
    this.setData({ feedbackText: e.detail.value })
  },

  submitFeedback() {
    const text = this.data.feedbackText.trim()
    if (!text) {
      wx.showToast({
        title: this.data.texts.feedbackEmpty || '请输入反馈内容',
        icon: 'none'
      })
      return
    }

    // 保存反馈到本地（可选，用于后续查看）
    try {
      const feedbacks = wx.getStorageSync('userFeedbacks') || []
      feedbacks.push({
        content: text,
        time: new Date().toISOString(),
        version: '1.0.0'
      })
      wx.setStorageSync('userFeedbacks', feedbacks.slice(-10)) // 最多保存10条
    } catch (e) {
      console.error('保存反馈失败:', e)
      // 如果存储失败，继续显示成功提示，不阻断用户体验
    }

    // 显示成功提示
    wx.showToast({
      title: this.data.texts.feedbackSuccess || '感谢您的反馈，我们将不断改进！',
      icon: 'none',
      duration: 2000
    })

    // 清空输入并关闭弹窗
    this.setData({
      showFeedbackModal: false,
      feedbackText: ''
    })
  },

  // ========== 工具方法 ==========
  preventBubble() {
    // 阻止事件冒泡，防止点击选择器内容时关闭
  },

  // ========== 返回方法 ==========
  goBack() {
    wx.navigateBack({ delta: 1 })
  }
})
