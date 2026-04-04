// app.js
const settingsManager = require('./utils/settings-manager')
const { i18n } = require('./i18n/index')

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })

    // 初始化全局设置管理器
    settingsManager.init()
    console.log('[App] 设置管理器初始化完成')

    // 初始化国际化
    i18n.init()
    console.log('[App] 国际化初始化完成，当前语言:', i18n.getCurrentLanguage())

    // 监听设置变化，同步更新应用状态
    settingsManager.subscribe((settings) => {
      console.log('[App] 设置已更新:', settings)
      this.updateGlobalStyles(settings)
    })

    // 初始化全局样式
    this.initGlobalStyles()

    // 监听语言变化
    i18n.subscribe((newLang) => {
      console.log('[App] 语言已切换为:', newLang)
      this.notifyPagesToRefresh()
    })
  },

  /**
   * 通知所有页面刷新
   */
  notifyPagesToRefresh() {
    const pages = getCurrentPages()
    pages.forEach(page => {
      if (page && page.onSettingsChange) {
        page.onSettingsChange(settingsManager.getSettings())
      }
    })
  },
  /**
   * 初始化全局样式系统
   * 应用用户偏好设置到全局CSS变量
   */
  initGlobalStyles() {
    const settings = settingsManager.getSettings()
    this.updateGlobalStyles(settings)
    console.log('[App] 全局样式初始化完成')
  },

  /**
   * 更新全局样式
   * @param {Object} settings 新的设置
   */
  updateGlobalStyles(settings) {
    // 构建要应用到page元素的类名
    const pageClasses = []

    // 应用模式类
    if (settings.mode === 'deaf') {
      pageClasses.push('mode-deaf')
    }

    // 应用高对比度
    if (settings.highContrast) {
      pageClasses.push('high-contrast')
    }

    // 应用减少动画
    if (settings.reduceMotion) {
      pageClasses.push('reduce-motion')
    }

    // 应用到页面
    this.applyPageClasses(pageClasses)

    // 触发自定义事件通知所有页面样式已更新
    if (this.globalData.settingsChangeCallback) {
      this.globalData.settingsChangeCallback(settings)
    }
  },

  /**
   * 应用类名到page元素
   * @param {Array} classes 类名数组
   */
  applyPageClasses(classes) {
    // 在小程序中，我们通过设置全局数据来传递状态
    // 页面onShow时可以根据这些状态设置page的class
    this.globalData.pageClasses = classes

    // 尝试直接获取当前页面并设置class
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.setData) {
        currentPage.setData({
          _pageClasses: classes.join(' ')
        })
      }
    }
  },

  /**
   * 获取当前全局样式类名
   * @returns {string} 类名字符串
   */
  getPageClasses() {
    return (this.globalData.pageClasses && this.globalData.pageClasses.join(' ')) || ''
  },

  /**
   * 订阅设置变更（供页面使用）
   * @param {Function} callback 回调函数
   */
  onSettingsChange(callback) {
    this.globalData.settingsChangeCallback = callback
  },

  // 全局暴露设置管理器和国际化
  settingsManager,
  i18n,

  globalData: {
    userInfo: null,
    gifList: [
      {
        thumbPath: '/utils/example/example_1/img.jpg',
        videoPath : '/utils/example/example_1/example_1.mp4',
        translationResult : '吃药了吗，身体怎么样',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      },
      {
        thumbPath: '/utils/example/example_2/img.jpg',
        videoPath : '/utils/example/example_2/example_2.mp4',
        translationResult : '对不起',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      },
      {
        thumbPath: '/utils/example/example_3/img.jpg',
        videoPath : '/utils/example/example_3/example_3.mp4',
        translationResult : '没关系',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      },
      {
        thumbPath: '/utils/example/example_4/img.jpg',
        videoPath : '/utils/example/example_4/example_4.mp4',
        translationResult : '你会打手语吗',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      }
    ]
  }
})
