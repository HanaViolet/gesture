const { API_BASE, ENDPOINTS, TIMEOUT, SMPL_BASE } = require('../../utils/api');
const { t } = require('../../i18n/index');

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
    cameraStatus: '',  // 从翻译获取
    recognizedText: '',
    isTogglingCamera: false,  // 防止相机操作重复点击

    // 文字输入
    textInput: '',

    // 手语浮层
    showSignModal: false,
    signLoading: false,
    signVideoUrl: '',
    currentSignText: '',
    signTaskId: '',
    SMPL_BASE: SMPL_BASE,
    ENDPOINTS: ENDPOINTS,

    // 状态栏高度
    statusBarHeight: 44,

    // 翻译文本
    texts: {}
  },

  // 对话历史缓存（用于EmoLLM API）
  chatHistory: [],

  // ===== 生命周期 =====
  onLoad() {
    // 获取状态栏高度
    const windowInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: windowInfo.statusBarHeight })
    // 每次进入清空历史记录，防止上下文过长
    this.clearHistory();
    // 初始化翻译文本
    this.updateTexts();
  },

  onShow() {
    // 每次显示页面时也清空（防止从后台返回）
    this.clearHistory();
    // 刷新翻译文本
    this.updateTexts();
  },

  // 更新界面文本
  updateTexts() {
    this.setData({
      texts: {
        title: t('psychology.title') || 'AI对话助手',
        welcomeMessage: t('psychology.welcomeMessage') || '你好，我是你的AI对话助手。你可以用手语或文字和我交流，我会认真倾听你的心声。',
        viewSign: t('psychology.viewSign') || '查看手语',
        cameraStatus: t('psychology.cameraStatus') || '点击开始手语',
        recognizing: t('psychology.recognizing') || '识别中…',
        confirmStart: t('psychology.confirmStart') || '确认开始手语对话',
        recognized: t('psychology.recognized') || '已识别',
        cameraHint: t('psychology.cameraHint') || '点击开启手语输入',
        inputPlaceholder: t('psychology.inputPlaceholder') || '说点什么…',
        send: t('psychology.send') || '发送',
        signModalTitle: t('psychology.signModalTitle') || '手语播放',
        signLoading: t('psychology.signLoading') || '正在生成手语视频',
        signLoadingWait: t('psychology.signLoadingWait') || '请稍候...',
        signEmpty: t('psychology.signEmpty') || '等待生成手语视频',
        originalText: t('psychology.originalText') || '原文'
      }
    });
  },

  onHide() {
    this.setData({ cameraOn: false, recording: false });
  },

  onUnload() {
    this.setData({ cameraOn: false, recording: false });
    // 清理手语生成轮询定时器
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
    // 清理手语识别定时器
    if (this._recognitionTimer) {
      clearTimeout(this._recognitionTimer);
    }
  },

  // 清空历史记录
  clearHistory() {
    this.setData({
      messages: [],
      messageIdCounter: 0
    });
    this.chatHistory = [];
    // 可选：同时清除本地存储的历史记录
    try {
      wx.removeStorageSync('psychology_history');
    } catch (e) {
      console.error('清除历史记录失败:', e);
    }
  },

  // ===== 历史记录 =====
  loadHistory() {
    try {
      const history = wx.getStorageSync('psychology_history') || [];
      this.setData({ messages: history, messageIdCounter: history.length });
      // 同步加载对话历史到 chatHistory（用于 API 上下文）
      this.chatHistory = this.convertMessagesToChatHistory(history);
      this.scrollBottom();
    } catch (e) {
      console.error('加载历史记录失败:', e);
    }
  },

  // 将界面消息转换为 API 对话历史格式
  convertMessagesToChatHistory(messages) {
    const history = [];
    for (const msg of messages) {
      if (msg.role === 'user') {
        history.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'ai') {
        history.push({ role: 'assistant', content: msg.content });
      }
    }
    return history;
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
    // 不再保存历史到本地存储，每次进入页面都重新开始对话
    // this.saveHistory();
    return msg;
  },

  haptic(type = 'light') {
    if (wx.canIUse('vibrateShort')) wx.vibrateShort({ type });
  },

  // ===== 摄像头：点击大框开始/停止 =====
  onToggleRecording() {
    // 防止重复点击
    if (this.data.isTogglingCamera) {
      console.log('相机操作过于频繁，请稍候');
      return;
    }

    if (!this.data.cameraOn) {
      // 开启摄像头
      wx.authorize({
        scope: 'scope.camera',
        success: () => {
          this.setData({ cameraOn: true, isTogglingCamera: true });
          this.haptic();
          // 在 startSignRecognition 成功后再设置 recording: true
          this.startSignRecognition(() => {
            this.setData({ isTogglingCamera: false });
          });
        },
        fail: () => {
          wx.showModal({
            title: '需要摄像头权限',
            content: '请在设置中开启摄像头权限',
            confirmText: '去设置',
            success: (res) => { if (res.confirm) wx.openSetting(); }
          });
          this.setData({ isTogglingCamera: false });
        }
      });
    } else if (this.data.recording) {
      // 停止录制
      this.setData({ recording: false, isTogglingCamera: true });
      this.haptic('medium');
      this.stopSignRecognition();
      this.setData({ isTogglingCamera: false });
    } else {
      // 再次开始录制
      this.setData({ recognizedText: '', isTogglingCamera: true });
      this.haptic();
      this.startSignRecognition(() => {
        this.setData({ isTogglingCamera: false });
      });
    }
  },

  onCameraError(e) {
    console.error('[Camera]', e.detail);
    this.setData({ cameraOn: false, recording: false });
    wx.showToast({ title: '摄像头启动失败', icon: 'none' });
  },

  // ===== 手语识别 =====
  startSignRecognition(callback) {
    // 复用 cameraContext，避免重复创建导致无法停止录制
    if (!this.cameraContext) {
      this.cameraContext = wx.createCameraContext();
    }
    const ctx = this.cameraContext;
    this._tempVideoPath = null;

    // 开始录制视频用于手语识别
    ctx.startRecord({
      success: () => {
        console.log('开始录制手语视频');
        // startRecord 成功后才设置 recording 状态
        this.setData({ recording: true });
        if (callback) callback();

        // 2.5秒后自动停止录制并上传
        this._recognitionTimer = setTimeout(() => {
          if (!this.data.recording) return;

          ctx.stopRecord({
            success: (res) => {
              this._tempVideoPath = res.tempVideoPath;
              this.uploadAndRecognize(res.tempVideoPath);
            },
            fail: (err) => {
              console.error('停止录制失败:', err);
              wx.showToast({ title: '录制失败', icon: 'none' });
              this.setData({ recording: false, cameraStatus: '点击开始手语' });
            }
          });
        }, 2500);
      },
      fail: (err) => {
        console.error('录制失败:', err);
        wx.showToast({ title: '录制失败', icon: 'none' });
        this.setData({ recording: false });
        if (callback) callback();
      }
    });
  },

  stopSignRecognition() {
    if (this._recognitionTimer) {
      clearTimeout(this._recognitionTimer);
    }
    // 如果正在录制，停止录制（复用 cameraContext）
    if (this.data.recording) {
      if (this.cameraContext) {
        this.cameraContext.stopRecord({ success: () => {}, fail: () => {} });
      }
    }
    this.setData({ recognizedText: '', recording: false, cameraStatus: '点击开始手语' });
  },

  // 上传视频并识别手语
  uploadAndRecognize(videoPath) {
    this.setData({ cameraStatus: '识别中...' });

    wx.uploadFile({
      url: `${API_BASE}${ENDPOINTS.SIGN_RECOGNITION}`,
      filePath: videoPath,
      name: 'file',
      timeout: TIMEOUT.UPLOAD,
      success: (res) => {
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error('解析响应失败:', res.data);
          wx.showToast({ title: '识别失败', icon: 'none' });
          this.setData({ recording: false, cameraStatus: '点击开始手语' });
          return;
        }

        if (data.success && data.text) {
          this.onSignRecognized(data.text);
        } else {
          wx.showToast({
            title: data.message || '识别失败',
            icon: 'none'
          });
          this.setData({ recording: false, cameraStatus: '点击开始手语' });
        }
      },
      fail: (err) => {
        console.error('上传视频失败:', err);
        wx.showToast({ title: '上传失败', icon: 'none' });
        this.setData({ recording: false, cameraStatus: '点击开始手语' });
      }
    });
  },

  onSignRecognized(text) {
    this.setData({ recognizedText: text, recording: false, cameraStatus: '识别完成' });
    // 1 秒后自动发送
    setTimeout(() => {
      this.setData({ recognizedText: '', cameraOn: false, cameraStatus: '点击开始手语' });
      this.sendToAI(text);
    }, 1000);
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
    // 构建消息历史 - 只传递对话历史，API 端已有内置 prompt
    const messages = [
      ...this.chatHistory,
      { role: 'user', content: prompt }
    ];

    console.log('发送给AI的消息:', JSON.stringify(messages, null, 2));

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE}${ENDPOINTS.PSYCHOLOGY_CHAT}`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: {
          messages: messages,
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.9
        },
        timeout: TIMEOUT.CHAT,
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            if (res.data.status === 'ok' && res.data.response) {
              let responseText = res.data.response;
              console.log('AI原始回复:', responseText);

              // 强力过滤思考过程
              responseText = this.filterThinkingContent(responseText);

              // 如果过滤后为空，使用默认回复
              if (!responseText || responseText.length < 5) {
                responseText = '我理解你的感受，能再多说一些吗？';
              }

              console.log('AI过滤后回复:', responseText);

              // 更新对话历史（使用过滤后的回复）
              this.chatHistory.push(
                { role: 'user', content: prompt },
                { role: 'assistant', content: responseText }
              );

              // 限制历史长度，最多15条消息（约7-8轮对话），防止上下文过长
              if (this.chatHistory.length > 15) {
                this.chatHistory = this.chatHistory.slice(-15);
              }

              resolve(responseText);
            } else {
              console.error('EmoLLM 返回错误:', res.data);
              reject(new Error(res.data.response || '服务响应异常'));
            }
          } else {
            console.error('EmoLLM 请求失败:', res);
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('EmoLLM 网络请求失败:', err);
          reject(err);
        }
      });
    });
  },

  // 过滤思考内容
  filterThinkingContent(text) {
    if (!text) return '';

    // 1. 首先检查是否有 <｜end▁of▁sentence｜> 标记
    const separator = '<｜end▁of▁sentence｜>';
    if (text.includes(separator)) {
      const parts = text.split(separator);
      // 取标记前面的内容（实际回复）
      const beforeSeparator = parts[0].trim();
      if (beforeSeparator) {
        // 移除可能的重复内容（标记后面可能重复了前面的内容）
        const afterSeparator = parts[1] ? parts[1].trim() : '';
        if (afterSeparator && beforeSeparator.includes(afterSeparator.substring(0, 10))) {
          // 如果后面内容的前面部分已经包含在前面，说明是重复的，只取前面
          return beforeSeparator;
        }
        return beforeSeparator;
      }
    }

    // 2. 如果没有标记，使用关键词过滤思考内容
    let filtered = text;

    // 1. 移除 <think>...</think> 标签及其内容
    filtered = filtered.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 2. 移除 [思考]...[/思考] 标记
    filtered = filtered.replace(/\[思考\][\s\S]*?\[\/思考\]/gi, '');

    // 3. 移除 (思考：...) 格式
    filtered = filtered.replace(/\(思考：[\s\S]*?\)/gi, '');

    // 4. 移除 "思考：" 开头的段落
    filtered = filtered.replace(/思考：[\s\S]*?(?=\n|$)/gi, '');

    // 5. 强力过滤：移除包含思考关键词的段落
    const lines = filtered.split('\n');
    const cleanLines = [];
    let skipParagraph = false;

    for (const line of lines) {
      // 检测思考模式的关键词
      const thinkPatterns = [
        /现在.*我/i,
        /接下来.*我/i,
        /我应该/i,
        /我需要/i,
        /我要/i,
        /我会/i,
        /这样.*可以/i,
        /同时.*我/i,
        /首先.*然后/i,
        /好的.*用户/i,
        /用户.*发/i,
        /作为.*咨询师/i,
        /我需要.*回应/i,
        /我应该.*回应/i,
        /我可以说/i,
        /我打算/i,
        /我准备/i,
        /我计划/i,
        /我考虑/i,
        /这意味着/i,
        /这表明/i,
        /总的来说/i,
        /总之/i,
        /综上所述/i,
        /因此.*我/i,
        /所以.*我/i,
        /然后.*我/i
      ];

      const isThinkingLine = thinkPatterns.some(pattern => pattern.test(line));

      if (isThinkingLine) {
        skipParagraph = true;
        continue;
      }

      // 如果遇到空行，重置跳过标记
      if (line.trim() === '') {
        skipParagraph = false;
      }

      // 如果不是思考段落，保留该行
      if (!skipParagraph) {
        cleanLines.push(line);
      }
    }

    filtered = cleanLines.join('\n');

    // 6. 清理多余的空行
    filtered = filtered.replace(/\n{3,}/g, '\n\n');

    // 7. 如果过滤后只剩很少内容，返回默认回复
    if (filtered.trim().length < 10) {
      return '我理解你的感受，能再多说一些吗？';
    }

    return filtered.trim();
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
    // 清理轮询定时器
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
    this.setData({ showSignModal: false, signVideoUrl: '', signLoading: false, signTaskId: '' });
    this.haptic();
  },

  noop() {},

  fetchSignVideo(text) {
    // 调用 SMPL 生成 API
    wx.showLoading({ title: '正在生成手语...', mask: true });

    wx.request({
      url: `${SMPL_BASE}${ENDPOINTS.SMPL_GENERATE}`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { text: text },
      timeout: 30000,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data && res.data.task_id) {
          // 开始轮询任务状态
          this.setData({ signTaskId: res.data.task_id });
          this.pollSignTask(res.data.task_id);
        } else {
          wx.showToast({ title: '生成失败', icon: 'none' });
          this.setData({ signLoading: false });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        console.error('SMPL生成失败:', err);
        this.setData({ signLoading: false });
      }
    });
  },

  // 轮询手语生成任务状态
  pollSignTask(taskId) {
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询60次（约2分钟）

    this._pollTimer = null;

    const doPoll = () => {
      if (!this.data.showSignModal) {
        // 弹窗已关闭，停止轮询
        return;
      }

      if (pollCount >= maxPolls) {
        wx.showToast({ title: '生成超时，请重试', icon: 'none' });
        this.setData({ signLoading: false });
        return;
      }

      wx.request({
        url: `${SMPL_BASE}${ENDPOINTS.SMPL_STATUS}/${taskId}`,
        method: 'GET',
        success: (res) => {
          if (!this.data.showSignModal) return;

          if (res.statusCode === 200 && res.data) {
            const status = res.data.status;

            if (status === 'completed') {
              // 任务完成，获取视频URL
              const videoUrl = `${SMPL_BASE}${ENDPOINTS.SMPL_VIDEO}/${taskId}`;
              this.setData({
                signLoading: false,
                signVideoUrl: videoUrl
              });
              wx.vibrateShort({ type: 'light' });
            } else if (status === 'failed') {
              wx.showToast({ title: '生成失败', icon: 'none' });
              this.setData({ signLoading: false });
            } else {
              // 继续轮询
              pollCount++;
              this._pollTimer = setTimeout(doPoll, 2000);
            }
          } else {
            pollCount++;
            this._pollTimer = setTimeout(doPoll, 2000);
          }
        },
        fail: () => {
          if (!this.data.showSignModal) return;
          pollCount++;
          this._pollTimer = setTimeout(doPoll, 2000);
        }
      });
    };

    doPoll();
  },

  // 视频播放错误处理
  onVideoError(e) {
    console.error('视频播放错误:', e.detail);
    wx.showToast({
      title: '视频播放失败',
      icon: 'none'
    });
  },

  // 返回方法
  goBack() {
    wx.navigateBack({ delta: 1 })
  }
});
