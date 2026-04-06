const { API_BASE, ENDPOINTS } = require('../../utils/api');

Page({
  data: {
    // 对话
    messages: [],
    scrollToView: '',
    aiTyping: false,
    messageIdCounter: 0,

    // 摄像头 & 录制
    cameraOn: false,
    recording: false,
    cameraStatus: '点击开始手语',
    recognizedText: '',

    // 文字输入
    textInput: '',

    // 手语浮层
    showSignModal: false,
    signLoading: false,
    signVideoUrl: '',
    currentSignText: ''
  },

  // ===== 生命周期 =====
  onLoad() {
    this.loadHistory();
  },

  onHide() {
    this.setData({ cameraOn: false, recording: false });
  },

  onUnload() {
    this.setData({ cameraOn: false, recording: false });
  },

  // ===== 历史记录 =====
  loadHistory() {
    try {
      const history = wx.getStorageSync('psychology_history') || [];
      this.setData({ messages: history, messageIdCounter: history.length });
      this.scrollBottom();
    } catch (e) {}
  },

  saveHistory() {
    try {
      // 只保留最近 50 条
      const msgs = this.data.messages.slice(-50);
      wx.setStorageSync('psychology_history', msgs);
    } catch (e) {}
  },

  // ===== 工具 =====
  scrollBottom() {
    const msgs = this.data.messages;
    if (msgs.length > 0) {
      this.setData({ scrollToView: `msg-${msgs[msgs.length - 1].id}` });
    }
  },

  addMessage(role, content) {
    const id = this.data.messageIdCounter;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const msg = { id, role, content, time };
    this.setData({
      messages: [...this.data.messages, msg],
      messageIdCounter: id + 1,
      scrollToView: `msg-${id}`
    });
    this.saveHistory();
    return msg;
  },

  haptic(type = 'light') {
    if (wx.canIUse('vibrateShort')) wx.vibrateShort({ type });
  },

  // ===== 摄像头：点击大框开始/停止 =====
  onToggleRecording() {
    if (!this.data.cameraOn) {
      // 开启摄像头
      wx.authorize({
        scope: 'scope.camera',
        success: () => {
          this.setData({ cameraOn: true, recording: true });
          this.haptic();
          this.startSignRecognition();
        },
        fail: () => {
          wx.showModal({
            title: '需要摄像头权限',
            content: '请在设置中开启摄像头权限',
            confirmText: '去设置',
            success: (res) => { if (res.confirm) wx.openSetting(); }
          });
        }
      });
    } else if (this.data.recording) {
      // 停止录制
      this.setData({ recording: false });
      this.haptic('medium');
      this.stopSignRecognition();
    } else {
      // 再次开始录制
      this.setData({ recording: true, recognizedText: '' });
      this.haptic();
      this.startSignRecognition();
    }
  },

  onCameraError(e) {
    console.error('[Camera]', e.detail);
    this.setData({ cameraOn: false, recording: false });
    wx.showToast({ title: '摄像头启动失败', icon: 'none' });
  },

  // ===== 手语识别 =====
  startSignRecognition() {
    // TODO: 调用手语识别 API，传入视频流
    // 目前用 mock 模拟 2 秒后识别完成
    this._recognitionTimer = setTimeout(() => {
      if (!this.data.recording) return;
      this.onSignRecognized('我最近心情有些低落');
    }, 2000);
  },

  stopSignRecognition() {
    if (this._recognitionTimer) {
      clearTimeout(this._recognitionTimer);
    }
    this.setData({ recognizedText: '' });
  },

  onSignRecognized(text) {
    this.setData({ recognizedText: text, recording: false });
    // 1.5 秒后自动发送
    setTimeout(() => {
      this.setData({ recognizedText: '', cameraOn: false });
      this.sendToAI(text);
    }, 1500);
  },

  // ===== 文字输入 =====
  onTextInput(e) {
    this.setData({ textInput: e.detail.value });
  },

  onSendText() {
    const text = this.data.textInput.trim();
    if (!text) return;
    this.setData({ textInput: '' });
    this.sendToAI(text);
    this.haptic();
  },

  // ===== 发送给 AI =====
  async sendToAI(content) {
    this.addMessage('user', content);
    this.setData({ aiTyping: true });

    try {
      const reply = await this.callAI(content);
      this.addMessage('ai', reply);
    } catch (e) {
      this.addMessage('ai', '抱歉，我暂时无法响应，请稍后再试。');
    } finally {
      this.setData({ aiTyping: false });
      this.scrollBottom();
    }
  },

  callAI(prompt) {
    // TODO: 替换为实际 EmoLLM API 调用
    // wx.request({ url: API_BASE + ENDPOINTS.PSYCHOLOGY_CHAT, ... })
    const replies = [
      '我听到你了，能多说说是什么让你有这样的感受吗？',
      '你愿意和我分享，我很感激。这段时间你还好吗？',
      '这种感觉并不孤单，我陪着你。',
      '你不需要一个人扛着这些，我在这里。'
    ];
    return new Promise(resolve => {
      setTimeout(() => resolve(replies[Math.floor(Math.random() * replies.length)]), 1200);
    });
  },

  // ===== 手语浮层 =====
  onShowSign(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({
      showSignModal: true,
      signLoading: true,
      currentSignText: text,
      signVideoUrl: ''
    });
    this.haptic();
    this.fetchSignVideo(text);
  },

  onHideSign() {
    this.setData({ showSignModal: false, signVideoUrl: '', signLoading: false });
    this.haptic();
  },

  noop() {},

  fetchSignVideo(text) {
    // TODO: 替换为实际文本转手语 API
    // wx.request({ url: API_BASE + ENDPOINTS.TEXT_TO_SIGN, ... })
    setTimeout(() => {
      this.setData({
        signLoading: false,
        signVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' // 占位视频
      });
    }, 1200);
  }
});
