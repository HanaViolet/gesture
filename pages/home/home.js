const app = getApp();
const { i18n, t } = require('../../i18n/index');
const settingsManager = require('../../utils/settings-manager');

// 数据清洗函数 - 修复 [object Object] bug
function sanitizePhrases(phrases) {
  if (!Array.isArray(phrases)) return [];
  return phrases.map((p, index) => {
    if (typeof p === 'string') {
      // 字符串转为对象，智能推断类型
      const text = p;
      let type = 'daily';
      if (/帮助|救护车|紧急|医院/i.test(text)) type = 'urgent';
      else if (/证件|业务|多少钱|办理/i.test(text)) type = 'biz';
      return { text, type, id: `phrase_${index}` };
    }
    if (typeof p === 'object' && p !== null) {
      // 已经是对象，确保有 text 字段
      if (p.text) {
        return {
          text: String(p.text),
          type: p.type || 'daily',
          id: p.id || `phrase_${index}`
        };
      }
    }
    // 无效数据，返回默认
    console.error('[sanitizePhrases] 无效短语:', p);
    return { text: '...', type: 'daily', id: `phrase_${index}` };
  });
}

// 触觉反馈封装
function hapticFeedback(type = 'light') {
  if (wx.canIUse('vibrateShort')) {
    wx.vibrateShort({ type });
  }
}

function chooseVideo() {
  if (!wx.canIUse('chooseMedia')) {
    wx.showToast({ title: '当前版本不支持选择媒体功能', icon: 'none' });
    return;
  }
  wx.getSetting({
    success: (res) => {
      if (!res.authSetting['scope.writePhotosAlbum']) {
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => { chooseMediaAfterAuth.call(this); },
          fail: () => { wx.showToast({ title: '未授予相册访问权限', icon: 'none' }); }
        });
      } else {
        chooseMediaAfterAuth.call(this);
      }
    }
  });
}

function chooseMediaAfterAuth() {
  const that = this;
  wx.chooseMedia({
    count: 1,
    mediaType: ['video'],
    sourceType: ['album'],
    maxDuration: 60,
    camera: 'back',
    success: (res) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        const videoFilePath = res.tempFiles[0].tempFilePath;
        const thumbTempFilePath = res.tempFiles[0].thumbTempFilePath;
        that.setData({ videoPath: videoFilePath, thumbTempFilePath: thumbTempFilePath });
        that.uploadVideo();
      } else {
        wx.showToast({ title: '未获取到有效的媒体路径', icon: 'none' });
      }
    },
    fail: () => { wx.showToast({ title: '选择媒体失败', icon: 'none' }); }
  });
}

function uploadVideo() {
  if (this.data.videoPath) {
    wx.navigateTo({
      url: `/pages/analysis_result/analysis_result?videoPath=${this.data.videoPath}&thumbPath=${this.data.thumbTempFilePath}`
    });
  }
}

function chunkGifList() {
  const gifList = app.globalData.gifList;
  if (!gifList.length) {
    this.setData({ chunkedGifList: [[null]] });
    return;
  }
  const chunked = [];
  for (let i = 0; i < gifList.length; i += 2) {
    chunked.push([gifList[i], gifList[i + 1]]);
  }
  const lastRow = chunked[chunked.length - 1];
  if (lastRow.length === 2 && lastRow[1]) {
    chunked.push([null]);
  } else if (lastRow.length === 1 || !lastRow[1]) {
    lastRow[1] = null;
  }
  this.setData({ chunkedGifList: chunked });
}

Page({
  data: {
    mode: 'normal',
    settings: {},
    texts: {},
    fontStyleVars: '',
    contentVisible: true,
    showViewer: false,
    viewerText: '',
    showAddModal: false,
    addModalType: 'common',
    inputText: '',
    deafInput: '',
    videoPath: '',
    thumbTempFilePath: '',
    chunkedGifList: [],
    rippleActive: false,
    statusBarHeight: 44,
    isRecording: false,
    showPhraseModal: false,
    showKeyboardModal: false,
    keyboardInput: '',
    chatList: [],
    transcriptText: '',
    // 当前输出（听障版显示）
    currentOutput: '',
    // SMPL使用历史记录（最多3条）
    smplHistory: [],
    // 听障版输出历史记录（最多3条）
    deafOutputHistory: [],
    // 重构后的快捷短语数据结构 - 统一为对象数组，支持AI动态替换
    quickPhrases: [
      { text: '我需要帮助', type: 'urgent', id: 'p1' },
      { text: '请帮我叫救护车', type: 'urgent', id: 'p2' },
      { text: '谢谢', type: 'daily', id: 'p3' },
      { text: '早上好', type: 'daily', id: 'p4' },
      { text: '你好', type: 'daily', id: 'p5' },
      { text: '我想办理业务', type: 'biz', id: 'p6' },
      { text: '请出示证件', type: 'biz', id: 'p7' },
      { text: '请问多少钱', type: 'biz', id: 'p8' },
      { text: '再见', type: 'daily', id: 'p9' },
      { text: '对不起', type: 'daily', id: 'p10' }
    ]
  },

  onLoad() {
    // 检查是否已完成引导
    const hasOnboarded = wx.getStorageSync('has_onboarded');
    if (!hasOnboarded) {
      wx.reLaunch({
        url: '/pages/onboarding/onboarding'
      });
      return;
    }

    // 初始化设置管理器
    settingsManager.init();
    i18n.init();

    // 从 settingsManager 获取设置
    const settings = settingsManager.getSettings();
    this.setData({
      mode: settings.mode,
      settings
    });

    // 订阅设置变更
    this.unsubscribeSettings = settingsManager.subscribe((newSettings) => {
      this.setData({ settings: newSettings });
      this.updateFontStyles();
    });

    // 初始化文本和字体样式
    this.updateTexts();
    this.updateFontStyles();

    const windowInfo = wx.getWindowInfo();
    // 从本地存储加载自定义短语，使用数据清洗确保格式正确
    const rawCustomPhrases = wx.getStorageSync('customPhrases') || [];
    const customPhrases = sanitizePhrases(rawCustomPhrases);

    // 默认短语 - 已是正确格式
    const defaultPhrases = [
      { text: '我需要帮助', type: 'urgent', id: 'p1' },
      { text: '请帮我叫救护车', type: 'urgent', id: 'p2' },
      { text: '谢谢', type: 'daily', id: 'p3' },
      { text: '早上好', type: 'daily', id: 'p4' },
      { text: '你好', type: 'daily', id: 'p5' },
      { text: '我想办理业务', type: 'biz', id: 'p6' },
      { text: '请出示证件', type: 'biz', id: 'p7' },
      { text: '请问多少钱', type: 'biz', id: 'p8' },
      { text: '再见', type: 'daily', id: 'p9' },
      { text: '对不起', type: 'daily', id: 'p10' }
    ];

    // 合并并去重（基于 text 字段）
    const allPhrases = [...defaultPhrases, ...customPhrases];
    const uniquePhrases = allPhrases.filter((item, index, self) =>
      index === self.findIndex(t => t.text === item.text)
    );

    this.setData({
      statusBarHeight: windowInfo.statusBarHeight,
      quickPhrases: uniquePhrases,
      // 加载历史记录
      smplHistory: wx.getStorageSync('smplHistory') || [],
      deafOutputHistory: wx.getStorageSync('deafOutputHistory') || []
    });
    this.chunkGifList();
  },

  onShow() {
    this.chunkGifList();
    // 检查设置是否被更改
    const currentSettings = settingsManager.getSettings();
    const settingsChanged = (
      currentSettings.mode !== this.data.mode ||
      currentSettings.fontSize !== this.data.settings.fontSize ||
      currentSettings.language !== this.data.settings.language
    );

    if (settingsChanged) {
      this.setData({ contentVisible: false });
      setTimeout(() => {
        this.setData({
          mode: currentSettings.mode,
          settings: currentSettings,
          contentVisible: true
        });
        // 重新初始化i18n以获取新语言
        i18n.init();
        this.updateTexts();
        this.updateFontStyles();
      }, 180);
    }
  },

  // 设置变化回调
  onSettingsChange(newSettings) {
    this.setData({ settings: newSettings });
    this.updateTexts();
    this.updateFontStyles();
  },

  onUnload() {
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
    }
  },

  // 更新翻译文本
  updateTexts() {
    const prefix = this.data.mode === 'deaf' ? 'home.deaf' : 'home.normal';
    this.setData({
      texts: {
        title: t(`${prefix}.title`),
        inputPlaceholder: t(`${prefix}.input.placeholder`),
        playButton: t(`${prefix}.button.play`),
        holdToSpeak: t('home.normal.holdToSpeak') || '按住说话，松开发送',
        quickPhrasesTitle: t('home.deaf.quickPhrases') || '快捷短语'
      }
    });
  },

  // 更新字体样式
  updateFontStyles() {
    const config = settingsManager.getFontSizeConfig();
    const isDeaf = this.data.mode === 'deaf';
    const scale = isDeaf ? 1.2 : 1;

    this.setData({
      fontStyleVars: `
        --font-body: ${Math.round(config.body * scale)}rpx;
        --font-display: ${Math.round(config.display * scale)}rpx;
        --font-caption: ${Math.round(config.caption * scale)}rpx;
      `
    });
  },

  // 切换模式
  switchMode() {
    const newMode = this.data.mode === 'normal' ? 'deaf' : 'normal';
    this.setData({ contentVisible: false });
    setTimeout(() => {
      // 保存设置到 settingsManager
      settingsManager.set('mode', newMode);
      this.setData({ mode: newMode, contentVisible: true });
      this.updateTexts();
      this.updateFontStyles();
      wx.showToast({
        title: newMode === 'normal' ? '已切换到普通模式' : '已切换到听障模式',
        icon: 'none'
      });
    }, 180);
  },

  onModeChange(e) {
    const newMode = e.detail.mode || (this.data.mode === 'normal' ? 'deaf' : 'normal');
    this.setData({
      contentVisible: false,
      mode: newMode
    });

    // 保存设置
    settingsManager.set('mode', newMode);

    // 更新文本
    setTimeout(() => {
      this.updateTexts();
      this.updateFontStyles();
      this.setData({ contentVisible: true });
    }, 180);
  },

  // ===== 健听模式 =====
  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  generateSignLanguage() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }
    wx.vibrateShort({ type: 'light' });
    this.setData({ showViewer: true, viewerText: text });
  },

  closeViewer() {
    this.setData({ showViewer: false });
  },

  openCamera() {
    wx.showActionSheet({
      itemList: ['从相册上传', '拍摄手语'],
      success: (res) => {
        if (res.tapIndex === 0) {
          chooseVideo.call(this);
        } else {
          wx.navigateTo({ url: '/pages/camera/camera' });
        }
      }
    });
  },

  openTeach() {
    wx.navigateTo({ url: '/pages/teach/teach' });
  },

  openPopularization() {
    wx.navigateTo({ url: '/pages/popularization/popularization' });
  },

  // ===== 听障模式 =====
  onDeafInputChange(e) {
    this.setData({ deafInput: e.detail.value });
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 选择快捷短语
  selectQuickPhrase(e) {
    const phrase = e.currentTarget.dataset.phrase;
    // 直接播放并保存
    this.saveDeafOutput(phrase);
    this.setData({ currentOutput: phrase, inputText: '' });
    wx.vibrateShort({ type: 'light' });

    // 自动播放语音
    const formData = `text=${encodeURIComponent(phrase.replace(/[？?]/g, ''))}&prompt=&voice=6652&temperature=0.1&top_p=0.7&top_k=20&skip_refine=1&custom_voice=0`;
    wx.request({
      url: 'http://127.0.0.1:9966/tts',
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formData,
      success: (res) => {
        if (res.data.code === 0 && res.data.audio_files && res.data.audio_files[0]) {
          const audio = wx.createInnerAudioContext();
          audio.src = res.data.audio_files[0].url;
          audio.play();
        }
      }
    });
  },

  // 发送文字
  sendText() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }
    // 添加到对话记录
    const chatList = this.data.chatList || [];
    chatList.push({
      id: Date.now(),
      type: 'send',
      text: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
    this.setData({ chatList, inputText: '' });
    wx.vibrateShort({ type: 'light' });
  },

  // ===== 听障版：播放TTS并保存到历史记录 =====
  playDeafTTS() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }
    this.setData({ rippleActive: true });
    setTimeout(() => this.setData({ rippleActive: false }), 600);
    wx.vibrateShort({ type: 'light' });

    // 保存到输出历史记录
    this.saveDeafOutput(text);

    // 显示在当前输出区域
    this.setData({
      currentOutput: text,
      inputText: ''  // 清空输入框
    });

    // TTS播放逻辑
    const formData = `text=${encodeURIComponent(text.replace(/[？?]/g, ''))}&prompt=&voice=6652&temperature=0.1&top_p=0.7&top_k=20&skip_refine=1&custom_voice=0`;
    wx.request({
      url: 'http://127.0.0.1:9966/tts',
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formData,
      success: (res) => {
        if (res.data.code === 0 && res.data.audio_files && res.data.audio_files[0]) {
          const audio = wx.createInnerAudioContext();
          audio.src = res.data.audio_files[0].url;
          audio.play();
        } else {
          wx.showToast({ title: '语音合成失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },

  // 保存听障版输出到历史记录
  saveDeafOutput(text) {
    const newRecord = {
      id: Date.now(),
      text: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    const currentHistory = this.data.deafOutputHistory || [];
    const updatedHistory = [newRecord, ...currentHistory].slice(0, 3);

    this.setData({ deafOutputHistory: updatedHistory });
    wx.setStorageSync('deafOutputHistory', updatedHistory);
  },

  // 播放历史记录项
  playHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.deafOutputHistory[index];
    if (!item) return;

    // 显示在当前输出
    this.setData({ currentOutput: item.text });

    wx.vibrateShort({ type: 'light' });

    const formData = `text=${encodeURIComponent(item.text.replace(/[？?]/g, ''))}&prompt=&voice=6652&temperature=0.1&top_p=0.7&top_k=20&skip_refine=1&custom_voice=0`;
    wx.request({
      url: 'http://127.0.0.1:9966/tts',
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formData,
      success: (res) => {
        if (res.data.code === 0 && res.data.audio_files && res.data.audio_files[0]) {
          const audio = wx.createInnerAudioContext();
          audio.src = res.data.audio_files[0].url;
          audio.play();
        } else {
          wx.showToast({ title: '语音合成失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },

  // ===== 普通模式：生成手语动画 =====
  generateSignLanguage() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }
    wx.vibrateShort({ type: 'light' });

    // 保存到历史记录（最多3条，新记录插入头部）
    const newRecord = {
      id: Date.now(),
      text: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    // 获取现有历史记录，添加新记录，只保留最近3条
    const currentHistory = this.data.smplHistory || [];
    const updatedHistory = [newRecord, ...currentHistory].slice(0, 3);

    // 更新数据和本地存储
    this.setData({
      showViewer: true,
      viewerText: text,
      smplHistory: updatedHistory,
      inputText: ''  // 清空输入框
    });

    wx.setStorageSync('smplHistory', updatedHistory);
  },

  // 查看历史记录中的SMPL动画
  viewHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.smplHistory[index];
    if (item) {
      this.setData({
        showViewer: true,
        viewerText: item.text
      });
    }
  },

  closeViewer() {
    this.setData({ showViewer: false });
  },

  // 开始录音
  startRecording() {
    this.setData({ isRecording: true });
    wx.vibrateShort({ type: 'light' });
    // 这里可以添加实际的录音逻辑
  },

  // 停止录音
  stopRecording() {
    this.setData({ isRecording: false });
    wx.vibrateShort({ type: 'light' });
    // 模拟录音结果
    const chatList = this.data.chatList || [];
    chatList.push({
      id: Date.now(),
      type: 'receive',
      text: '这是语音识别结果...',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
    this.setData({ chatList });
  },

  // 显示常用语弹窗
  showQuickPhrases() {
    this.setData({ showPhraseModal: true });
  },

  // 隐藏常用语弹窗
  hidePhraseModal() {
    this.setData({ showPhraseModal: false });
  },

  // 使用常用语
  usePhrase(e) {
    const phrase = e.currentTarget.dataset.phrase;
    this.setData({ inputText: phrase, showPhraseModal: false });
    this.sendText();
  },

  // 打开键盘
  openKeyboard() {
    this.setData({ showKeyboardModal: true, keyboardInput: '' });
  },

  // 隐藏键盘弹窗
  hideKeyboardModal() {
    this.setData({ showKeyboardModal: false });
  },

  // 键盘输入
  onKeyboardInput(e) {
    this.setData({ keyboardInput: e.detail.value });
  },

  // 发送键盘输入
  sendKeyboardText() {
    const text = this.data.keyboardInput;
    if (text && text.trim()) {
      this.setData({ inputText: text.trim() });
      this.sendText();
    }
    this.hideKeyboardModal();
  },

  // 打招呼
  waveHand() {
    wx.showToast({ title: '已发送打招呼', icon: 'none' });
  },


  addQuickPhrase() {
    this.setData({ showAddModal: true, addModalType: 'quick', addModalTitle: '添加快捷短语' });
  },

  addCommonPhrase() {
    this.setData({ showAddModal: true, addModalType: 'common', addModalTitle: '添加常用语' });
  },

  hideAddModal() {
    this.setData({ showAddModal: false });
  },

  onKeyboardAdd() {
    this.hideAddModal();
    if (this.data.addModalType === 'quick') {
      wx.navigateTo({ url: '/pages/text_result/text_result?mode=quick' });
    } else {
      wx.navigateTo({ url: '/pages/text_result/text_result?saveAsPhrase=1' });
    }
  },

  // ===== 通用 =====
  chooseVideo,
  chooseMediaAfterAuth,
  uploadVideo,
  chunkGifList,

  // ===== 听障版：打开相机进行手语识别 =====
  openCameraForDeaf() {
    wx.showActionSheet({
      itemList: ['从相册上传', '拍摄手语'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 从相册选择
          this.chooseVideoForSign();
        } else {
          // 拍摄手语
          wx.navigateTo({
            url: '/pages/camera/camera?from=deaf'
          });
        }
      }
    });
  },

  // 从相册选择视频进行手语识别
  chooseVideoForSign() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const videoPath = res.tempFiles[0].tempFilePath;
          this.recognizeSignLanguage(videoPath);
        }
      },
      fail: () => {
        wx.showToast({ title: '选择视频失败', icon: 'none' });
      }
    });
  },

  // 手语识别（模拟）
  recognizeSignLanguage(videoPath) {
    wx.showLoading({ title: '识别中...' });

    // 这里应该调用实际的手语识别API
    // 暂时模拟识别结果
    setTimeout(() => {
      wx.hideLoading();
      const mockResults = ['你好，请问有什么可以帮助您？', '谢谢您的帮助', '我需要一杯水', '请问洗手间在哪里？'];
      const result = mockResults[Math.floor(Math.random() * mockResults.length)];

      // 保存到历史记录并显示
      this.saveDeafOutput(result);
      this.setData({ currentOutput: result });
      wx.showToast({ title: '识别完成', icon: 'success' });
    }, 2000);
  },

  navigateToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  navigateToSocietyCowork() {
    wx.navigateTo({ url: '/pages/society_cowork/society_cowork' });
  },

  previewGif(e) {
    const videoPath = e.currentTarget.dataset.videopath;
    wx.navigateTo({
      url: `/pages/get_detail/get_detail?videoPath=${encodeURIComponent(videoPath)}`
    });
  },

  showDeletePrompt(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '删除常用语',
      content: '确定删除该常用语吗？',
      success: (res) => {
        if (res.confirm) {
          const gifList = app.globalData.gifList;
          gifList.splice(index, 1);
          app.globalData.gifList = gifList;
          this.chunkGifList();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  }
});
