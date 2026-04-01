const app = getApp();

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
    contentVisible: true,
    showViewer: false,
    showAddModal: false,
    addModalType: 'common',
    inputText: '',
    deafInput: '',
    videoPath: '',
    thumbTempFilePath: '',
    chunkedGifList: [],
    rippleActive: false,
    statusBarHeight: 44,
    // 快捷短语
    quickPhrases: [
      { text: '我需要帮助', type: 'urgent' },
      { text: '请帮我叫救护车', type: 'urgent' },
      { text: '谢谢', type: 'daily' },
      { text: '早上好', type: 'daily' },
      { text: '你好', type: 'daily' },
      { text: '我想办理业务', type: 'biz' },
      { text: '请出示证件', type: 'biz' },
      { text: '请问多少钱', type: 'biz' },
      { text: '再见', type: 'daily' },
      { text: '对不起', type: 'daily' },
    ]
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo();
    const savedMode = wx.getStorageSync('userMode') || 'normal';
    const customPhrases = wx.getStorageSync('customPhrases') || [];
    const defaultPhrases = [
      { text: '我需要帮助', type: 'urgent' },
      { text: '请帮我叫救护车', type: 'urgent' },
      { text: '谢谢', type: 'daily' },
      { text: '早上好', type: 'daily' },
      { text: '你好', type: 'daily' },
      { text: '我想办理业务', type: 'biz' },
      { text: '请出示证件', type: 'biz' },
      { text: '请问多少钱', type: 'biz' },
      { text: '再见', type: 'daily' },
      { text: '对不起', type: 'daily' },
    ];
    this.setData({
      mode: savedMode,
      statusBarHeight: windowInfo.statusBarHeight,
      quickPhrases: [...defaultPhrases, ...customPhrases]
    });
    this.chunkGifList();
  },

  onShow() {
    this.chunkGifList();
  },

  onModeChange(e) {
    const newMode = e.detail.mode;
    this.setData({ contentVisible: false });
    setTimeout(() => {
      wx.setStorageSync('userMode', newMode);
      this.setData({ mode: newMode, contentVisible: true });
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

  playDeafVoice() {
    const text = this.data.deafInput.trim();
    if (!text) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }
    wx.vibrateShort({ type: 'light' });
    this.setData({ rippleActive: true });
    setTimeout(() => this.setData({ rippleActive: false }), 600);
    // 调用 TTS 并播放
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
          const msg = res.data && res.data.msg ? res.data.msg : '语音合成失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '请求失败：' + (err.errMsg || '网络错误'), icon: 'none' });
      }
    });
  },

  playPhrase(e) {
    const text = e.currentTarget.dataset.text;
    wx.vibrateShort({ type: 'light' });
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
          const msg = res.data && res.data.msg ? res.data.msg : '语音合成失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '请求失败：' + (err.errMsg || '网络错误'), icon: 'none' });
      }
    });
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

  navigateToSettings() {
    wx.navigateTo({ url: '/pages/personal_settings/personal_settings' });
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
