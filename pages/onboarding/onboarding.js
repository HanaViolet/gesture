// 首次启动引导页面
Page({
  data: {
    // 系统信息
    statusBarHeight: 44,
    safeAreaBottom: 34,

    // 语言列表
    languages: [
      { code: 'zh-CN', name: '简体中文', localName: '中文' },
      { code: 'en-US', name: 'English', localName: 'English' },
      { code: 'de-DE', name: 'Deutsch', localName: 'Deutsch' }
    ],
    selectedLang: '',

    // 使用模式列表
    modes: [
      {
        id: 'deaf',
        title: '文字 / 手语',
        description: '适合听障人士，提供文字输入、常用语快捷表达和手语识别功能',
        icon: '/icons/mode-text.svg',
        iconBg: 'rgba(91, 123, 163, 0.12)'
      },
      {
        id: 'normal',
        title: '语音说话',
        description: '适合健听人士，提供语音识别、语音合成和实时翻译功能',
        icon: '/icons/mode-voice.svg',
        iconBg: 'rgba(122, 158, 126, 0.12)'
      }
    ],
    selectedMode: ''
  },

  onLoad(options) {
    // 获取系统信息
    this.initSystemInfo();

    // 检查是否已完成引导
    this.checkOnboardingStatus();
  },

  // 初始化系统信息
  initSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 44,
        safeAreaBottom: systemInfo.safeArea?.bottom ?
          systemInfo.safeArea.bottom - systemInfo.windowHeight : 34
      });
    } catch (e) {
      console.log('获取系统信息失败，使用默认值');
    }
  },

  // 检查引导状态
  checkOnboardingStatus() {
    try {
      const hasOnboarded = wx.getStorageSync('has_onboarded');
      const savedLang = wx.getStorageSync('app_language');
      const savedMode = wx.getStorageSync('app_mode');

      // 如果已完成引导，直接跳转到首页
      if (hasOnboarded) {
        wx.reLaunch({
          url: '/pages/home/home'
        });
        return;
      }

      // 如果有保存的设置，恢复它们
      if (savedLang) {
        this.setData({ selectedLang: savedLang });
      }
      if (savedMode) {
        this.setData({ selectedMode: savedMode });
      }
    } catch (e) {
      console.log('检查引导状态失败', e);
    }
  },

  // 选择语言
  onSelectLanguage(e) {
    const langCode = e.currentTarget.dataset.code;
    this.setData({ selectedLang: langCode });

    // 触觉反馈
    this.triggerHaptic();
  },

  // 选择模式
  onSelectMode(e) {
    const modeId = e.currentTarget.dataset.id;
    this.setData({ selectedMode: modeId });

    // 触觉反馈
    this.triggerHaptic();
  },

  // 触发触觉反馈
  triggerHaptic() {
    try {
      wx.vibrateShort({ type: 'light' });
    } catch (e) {
      // 忽略不支持触觉反馈的设备
    }
  },

  // 进入应用
  onEnterApp() {
    const { selectedLang, selectedMode } = this.data;

    // 验证选择
    if (!selectedLang) {
      wx.showToast({
        title: '请选择语言',
        icon: 'none'
      });
      return;
    }

    if (!selectedMode) {
      wx.showToast({
        title: '请选择使用模式',
        icon: 'none'
      });
      return;
    }

    // 保存设置
    try {
      wx.setStorageSync('app_language', selectedLang);
      wx.setStorageSync('app_language_v1', selectedLang); // i18n使用的键
      wx.setStorageSync('app_mode', selectedMode);
      wx.setStorageSync('userMode', selectedMode); // 兼容旧版
      wx.setStorageSync('has_onboarded', true);

      // 触觉反馈
      this.triggerHaptic();

      // 显示成功提示
      wx.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 800,
        complete: () => {
          // 延迟后跳转到首页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/home/home'
            });
          }, 300);
        }
      });
    } catch (e) {
      console.error('保存设置失败', e);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '语见 - 打破沟通障碍',
      path: '/pages/onboarding/onboarding'
    };
  }
});
