const app = getApp();
const { i18n, t } = require('../../i18n/index');
const settingsManager = require('../../utils/settings-manager');
const api = require('../../utils/api');
const { API_BASE, SMPL_BASE, ENDPOINTS, getSmplUrl } = api;

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
  const page = this;
  wx.getSetting({
    success: (res) => {
      if (!res.authSetting['scope.writePhotosAlbum']) {
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => { chooseMediaAfterAuth.call(page); },
          fail: () => { wx.showToast({ title: '未授予相册访问权限', icon: 'none' }); }
        });
      } else {
        chooseMediaAfterAuth.call(page);
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
  if (!gifList || !gifList.length) {
    this.setData({ chunkedGifList: [[null]] });
    return;
  }
  const chunked = [];
  for (let i = 0; i < gifList.length; i += 2) {
    const pair = [gifList[i]];
    if (i + 1 < gifList.length) {
      pair.push(gifList[i + 1]);
    } else {
      pair.push(null);
    }
    chunked.push(pair);
  }
  this.setData({ chunkedGifList: chunked });
}

Page({
  data: {
    mode: 'normal',
    swiperIndex: 1,  // 0=听障，1=普通，与 mode 保持同步
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
    // 当前查看的视频URL
    viewerVideoUrl: '',
    // 当前任务ID
    viewerTaskId: '',
    // 后端历史任务列表
    backendTasks: [],
    // 听障版输出历史记录（最多3条）
    deafOutputHistory: [],
    // 快捷短语管理
    isEditingPhrases: false,
    showAddPhraseModal: false,
    newPhraseText: '',
    selectedPhraseType: 'daily',
    phraseTypes: [
      { value: 'urgent', label: '紧急' },
      { value: 'daily', label: '日常' },
      { value: 'biz', label: '业务' }
    ],
    // API配置（传递给组件）
    SMPL_BASE: SMPL_BASE,
    ENDPOINTS: ENDPOINTS
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
      swiperIndex: settings.mode === 'deaf' ? 0 : 1,
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
    // 同时过滤掉旧的系统短语（只保留 id 以 custom_ 开头的用户自定义短语）
    const rawCustomPhrases = wx.getStorageSync('customPhrases') || [];
    const customPhrases = sanitizePhrases(rawCustomPhrases).filter(p =>
      p.id && p.id.startsWith('custom_')
    );
    // 同步清理本地存储
    if (customPhrases.length !== rawCustomPhrases.length) {
      wx.setStorageSync('customPhrases', customPhrases);
    }

    // 默认短语 - 只保留两个系统短语，其余由用户自定义
    const defaultPhrases = [
      { text: t('phrase.help'), type: 'urgent', id: 'p1' },
      { text: t('phrase.business'), type: 'biz', id: 'p6' }
    ];

    // 合并并去重（系统短语优先，自定义短语中重复系统短语的将被过滤）
    const defaultTexts = new Set(defaultPhrases.map(p => p.text));
    const filteredCustom = customPhrases.filter(p => !defaultTexts.has(p.text));
    const uniquePhrases = [...defaultPhrases, ...filteredCustom];

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

    // 获取后端历史任务
    this.fetchBackendTasks();

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

    // 保留现有的自定义短语，只更新默认短语的翻译（系统短语优先）
    const currentPhrases = this.data.quickPhrases || [];
    const customPhrases = currentPhrases.filter(p => p.id && p.id.startsWith('custom_'));
    const defaultPhrases = this.getTranslatedPhrases();
    const defaultTexts = new Set(defaultPhrases.map(p => p.text));
    const filteredCustom = customPhrases.filter(p => !defaultTexts.has(p.text));
    const mergedPhrases = [...defaultPhrases, ...filteredCustom];

    this.setData({
      texts: {
        // 模式相关
        normalMode: t('home.mode.normal'),
        deafMode: t('home.mode.deaf'),
        // 标题和输入
        title: t(`${prefix}.title`),
        inputPlaceholder: t(`${prefix}.input.placeholder`),
        playButton: t(`${prefix}.button.play`),
        holdToSpeak: t('home.normal.holdToSpeak') || '按住说话，松开发送',
        quickPhrasesTitle: t('home.deaf.quickPhrases') || '快捷短语',
        // 通用按钮和标签
        community: t('home.community'),
        settings: t('home.settings'),
        currentOutput: t('home.currentOutput'),
        outputHint: t('home.outputHint'),
        play: t('home.play'),
        shoot: t('home.shoot'),
        send: t('home.send'),
        cancel: t('home.cancel'),
        close: t('home.close'),
        phrasesTitle: t('home.phrases.title'),
        keyboardTitle: t('home.keyboard.title'),
        recentUse: t('home.recentUse'),
        maxRecords: t('home.maxRecords'),
        emptyHistory: t('home.emptyHistory'),
        view: t('home.view'),
        quickPhrases: t('home.quickPhrases'),
        type: t('home.type'),
        // 普通版特有
        normalHint: t('home.normal.hint'),
        normalSubHint: t('home.normal.subHint'),
        generateSign: t('home.normal.generateSign'),
        signRecognition: t('home.normal.signRecognition'),
        signRecognitionDesc: t('home.normal.signRecognitionDesc'),
        popularization: t('home.normal.popularization'),
        popularizationDesc: t('home.normal.popularizationDesc'),
        releaseToSend: t('home.normal.releaseToSend'),
        recording: t('home.normal.recording')
      },
      // 更新快捷短语，保留自定义短语
      quickPhrases: mergedPhrases
    });
  },

  // 获取当前语言的快捷短语
  getTranslatedPhrases() {
    return [
      { text: t('phrase.help'), type: 'urgent', id: 'p1' },
      { text: t('phrase.business'), type: 'biz', id: 'p6' }
    ];
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

  // 切换模式（顶部胶囊点击）
  switchMode() {
    const newMode = this.data.mode === 'normal' ? 'deaf' : 'normal';
    const newIndex = newMode === 'deaf' ? 0 : 1;
    settingsManager.set('mode', newMode);
    this.setData({ mode: newMode, swiperIndex: newIndex });
    this.updateTexts();
    this.updateFontStyles();
  },

  // 滑动切换（swiper 滑动完成后同步 mode）
  onSwiperChange(e) {
    const idx = e.detail.current;
    const newMode = idx === 0 ? 'deaf' : 'normal';
    if (newMode === this.data.mode) return;
    settingsManager.set('mode', newMode);
    this.setData({ mode: newMode, swiperIndex: idx });
    this.updateTexts();
    this.updateFontStyles();
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
    this._playTTS(phrase);
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
    this.setData({ currentOutput: text, inputText: '' });

    // 调用新TTS API
    this._playTTS(text);
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
    this._playTTS(item.text);
  },

  // ===== 公共TTS播放（新API: POST /tts，返回WAV音频流）=====
  _playTTS(text) {
    // 保留标点符号，只移除可能影响语气的特殊符号
    const cleanText = text.replace(/[\n\r]/g, ' ').trim();
    if (!cleanText) return;

    // 如果有正在播放的语音，先停止并销毁
    if (this._currentAudioContext) {
      try {
        this._currentAudioContext.stop();
        this._currentAudioContext.destroy();
      } catch (e) {}
      this._currentAudioContext = null;
    }

    wx.request({
      url: `${API_BASE}${ENDPOINTS.TTS}`,
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `text=${encodeURIComponent(cleanText)}&voice=2222&speed=3`,
      responseType: 'arraybuffer',
      timeout: 60000,
      success: (res) => {
        if (res.statusCode !== 200 || !res.data) {
          wx.showToast({ title: '语音合成失败', icon: 'none' });
          return;
        }
        const fs = wx.getFileSystemManager();
        const tmpPath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}.wav`;
        fs.writeFile({
          filePath: tmpPath,
          data: res.data,
          encoding: 'binary',
          success: () => {
            // 延迟一点再播放，确保文件写入完成
            setTimeout(() => {
              const audio = wx.createInnerAudioContext();
              this._currentAudioContext = audio;
              audio.src = tmpPath;

              // 关键：设置自动播放，确保音频不会被系统中断
              audio.autoplay = false;

              // 监听可以播放事件
              audio.onCanplay(() => {
                audio.play();
              });

              // 监听播放完成
              audio.onEnded(() => {
                setTimeout(() => {
                  if (this._currentAudioContext === audio) {
                    this._currentAudioContext = null;
                  }
                  try {
                    audio.destroy();
                  } catch (e) {}
                }, 100);
              });

              // 监听播放错误
              audio.onError((e) => {
                console.error('音频播放失败:', e);
                if (this._currentAudioContext === audio) {
                  this._currentAudioContext = null;
                }
                try {
                  audio.destroy();
                } catch (err) {}
              });

              // 开始播放
              audio.play();
            }, 100);
          },
          fail: (err) => {
            wx.showToast({ title: '保存音频失败', icon: 'none' });
            console.error('writeFile失败:', err);
          }
        });
      },
      fail: () => {
        wx.showToast({ title: '语音请求失败', icon: 'none' });
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

    // 显示加载状态
    wx.showLoading({
      title: '正在提交任务...',
      mask: true
    });

    // 调用后端SMPL生成API
    // 调用后端SMPL生成API
    wx.request({
      url: `${SMPL_BASE}${ENDPOINTS.SMPL_GENERATE}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        text: text
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data && res.data.task_id) {
          // 立即跳转到viewer页面，带上task_id和text
          this.setData({
            showViewer: true,
            viewerText: text,
            viewerTaskId: res.data.task_id,
            viewerVideoUrl: ''  // 初始为空，生成完成后再填充
          });
        } else {
          const errorMsg = (res.data && res.data.error) || '提交任务失败';
          wx.showToast({ title: errorMsg, icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        console.error('SMPL提交失败:', err);
      }
    });
  },

  // 已删除：轮询逻辑移至 smpl-viewer 组件

  // 从后端获取历史任务列表
  fetchBackendTasks() {
    wx.request({
      url: `${SMPL_BASE}${ENDPOINTS.SMPL_TASKS}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.tasks) {
          // 格式化后端任务数据
          const tasks = res.data.tasks.map(task => ({
            id: task.id,
            text: task.text || '未命名任务',
            time: this.formatTaskTime(task.created_at),
            timestamp: new Date(task.created_at).getTime(),
            videoUrl: task.status === 'completed' ? `${SMPL_BASE}${ENDPOINTS.SMPL_VIDEO}/${task.id}` : ''
          })).filter(task => task.status !== 'failed').slice(0, 10); // 只取最近10个成功的

          this.setData({ backendTasks: tasks });
        }
      },
      fail: (err) => {
        console.error('获取历史任务失败:', err);
      }
    });
  },

  // 格式化任务时间
  formatTaskTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  },

  // 关闭 SMPL 查看器
  closeViewer() {
    this.setData({ showViewer: false });
  },

  // SMPL 生成完成回调
  onSmplComplete(e) {
    const { videoUrl, text, taskId } = e.detail;
    console.log('SMPL生成完成:', videoUrl, 'taskId:', taskId);

    // 保存到本地历史记录（同时保存taskId，用于URL失效时重新获取）
    const newRecord = {
      id: Date.now(),
      text: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      videoUrl: videoUrl,
      taskId: taskId || ''  // 保存taskId备用
    };

    const currentHistory = this.data.smplHistory || [];
    const updatedHistory = [newRecord, ...currentHistory].slice(0, 3);

    this.setData({ smplHistory: updatedHistory });
    wx.setStorageSync('smplHistory', updatedHistory);

    // 刷新后端任务列表
    this.fetchBackendTasks();
  },

  // SMPL 生成取消回调
  onSmplCancel(e) {
    const { text } = e.detail;
    console.log('SMPL生成已取消:', text);
    // 显示取消提示
    wx.showToast({
      title: '已取消生成',
      icon: 'none',
      duration: 1500
    });
  },

  // 查看历史记录中的SMPL动画
  viewHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.smplHistory[index];
    if (item) {
      this.setData({
        showViewer: true,
        viewerText: item.text,
        viewerVideoUrl: item.videoUrl || '',  // 从历史记录恢复视频URL
        viewerTaskId: ''  // 已有视频URL，不需要taskId
      });
    }
  },

  // 查看后端历史任务
  viewBackendTask(e) {
    const task = e.currentTarget.dataset.task;
    if (task && task.videoUrl) {
      this.setData({
        showViewer: true,
        viewerText: task.text,
        viewerVideoUrl: task.videoUrl,
        viewerTaskId: ''  // 已有视频URL，不需要taskId
      });
    } else {
      wx.showToast({ title: '视频暂未生成完成', icon: 'none' });
    }
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

  // ===== 快捷短语管理功能 =====

  // 切换编辑模式
  toggleEditPhrases() {
    this.setData({ isEditingPhrases: !this.data.isEditingPhrases });
  },

  // 显示添加短语弹窗
  showAddPhraseModal() {
    this.setData({
      showAddPhraseModal: true,
      newPhraseText: '',
      selectedPhraseType: 'daily'
    });
  },

  // 隐藏添加短语弹窗
  hideAddPhraseModal() {
    this.setData({ showAddPhraseModal: false });
  },

  // 输入新短语
  onNewPhraseInput(e) {
    this.setData({ newPhraseText: e.detail.value });
  },

  // 选择短语类型
  selectPhraseType(e) {
    this.setData({ selectedPhraseType: e.currentTarget.dataset.value });
  },

  // 添加自定义短语
  addCustomPhrase() {
    const { newPhraseText, selectedPhraseType, quickPhrases } = this.data;
    const trimmedText = newPhraseText.trim();

    if (!trimmedText) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    // 检查是否已存在
    if (quickPhrases.some(p => p.text === trimmedText)) {
      wx.showToast({ title: '该短语已存在', icon: 'none' });
      return;
    }

    // 检查是否超过最大数量（限制为15个）
    if (quickPhrases.length >= 15) {
      wx.showToast({ title: '最多添加15个常用语', icon: 'none' });
      return;
    }

    const newPhrase = {
      text: trimmedText,
      type: selectedPhraseType,
      id: `custom_${Date.now()}`
    };

    const updatedPhrases = [...quickPhrases, newPhrase];

    // 保存到本地存储
    const customPhrases = updatedPhrases.filter(p => p.id.startsWith('custom_'));
    wx.setStorageSync('customPhrases', customPhrases);

    this.setData({
      quickPhrases: updatedPhrases,
      showAddPhraseModal: false,
      newPhraseText: ''
    });

    wx.showToast({ title: '添加成功', icon: 'success' });
  },

  // 删除快捷短语
  deleteQuickPhrase(e) {
    const { index } = e.currentTarget.dataset;
    const { quickPhrases } = this.data;
    const phraseToDelete = quickPhrases[index];

    // 只允许删除自定义短语
    if (!phraseToDelete.id.startsWith('custom_')) {
      wx.showToast({ title: '系统短语不可删除', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '删除短语',
      content: `确定删除"${phraseToDelete.text}"吗？`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          const updatedPhrases = quickPhrases.filter((_, i) => i !== index);

          // 更新本地存储
          const customPhrases = updatedPhrases.filter(p => p.id.startsWith('custom_'));
          wx.setStorageSync('customPhrases', customPhrases);

          this.setData({ quickPhrases: updatedPhrases });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
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

  // 手语识别 - 调用真实API
  recognizeSignLanguage(videoPath) {
    wx.showLoading({ title: '识别中...', mask: true });

    wx.uploadFile({
      url: `${API_BASE}${ENDPOINTS.SIGN_RECOGNITION}`,
      filePath: videoPath,
      name: 'file',
      timeout: 60000,
      success: (res) => {
        wx.hideLoading();
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          wx.showToast({ title: '解析响应失败', icon: 'none' });
          return;
        }

        if (data.success && data.text) {
          console.log('手语翻译结果:', data.text);
          const result = data.text;
          // 保存到历史记录并显示
          this.saveDeafOutput(result);
          this.setData({ currentOutput: result });
          wx.showToast({ title: '识别完成', icon: 'success' });
        } else {
          wx.showToast({
            title: '手语识别失败: ' + (data.message || '未知错误'),
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('手语识别失败:', err);
        wx.showToast({ title: '上传视频失败: ' + (err.errMsg || '网络错误'), icon: 'none' });
      }
    });
  },

  navigateToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  navigateToPsychology() {
    wx.navigateTo({ url: '/pages/psychology/psychology' });
  },

  navigateToSocietyCowork() {
    wx.navigateTo({ url: '/pages/society_cowork/society_cowork' });
  },

  navigateToForum() {
    wx.navigateTo({ url: '/pages/forum/forum' });
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
