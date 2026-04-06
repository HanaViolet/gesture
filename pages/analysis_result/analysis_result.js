const { API_BASE, ENDPOINTS } = require('../../utils/api');

// 当前环境配置
const ENV = require('../../utils/api').CURRENT_ENV;
const isDev = ENV === 'development';

Page({
  data: {
    chatTexts: '',
    showVoiceOptions: false,
    selectedVoice: null,
    convertingText: "以下翻译结果仅供参考",
    audioContext: null,
    videoPath: '',
    thumbPath: '',
    progress: 0,
    maleAudioUrl: '',
    femaleAudioUrl: '',
  },
  onLoad: function (options) {
    if (options.videoPath) {
      this.setData({
        videoPath: options.videoPath,
        thumbPath: options.thumbPath
      });
      this.callSignLanguageTranslation();
    }
  },
  callSignLanguageTranslation: function () {
    const that = this;
    const videoPath = this.data.videoPath;
    this.setData({ progress: 20 });
    wx.uploadFile({
      url: `${API_BASE}${ENDPOINTS.SIGN_RECOGNITION}`,
      filePath: videoPath,
      name: 'file',
      success: (res) => {
        let data;
        try { data = JSON.parse(res.data); } catch (e) {
          wx.showToast({ title: '解析响应失败', icon: 'none' });
          return;
        }
        if (data.success && data.text) {
          console.log('手语翻译结果:', data.text);
          const resultText = data.text;
          that.setData({ chatTexts: resultText, progress: 50 });
          const cleanedText = resultText.replace(/[？?]/g, '');
          that.generateBothVoices(cleanedText);
        } else {
          wx.showToast({
            title: '手语翻译失败: ' + (data.message || '未知错误'),
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '上传视频失败: ' + err.errMsg, icon: 'none' });
      }
    });
  },

  generateBothVoices: function (text) {
    // 男声、女声并发请求（voice id 参考API文档音色列表）
    this.callTextToSpeech(text, '4444', (maleUrl) => {
      this.setData({ maleAudioUrl: maleUrl });
    });
    this.callTextToSpeech(text, '2222', (femaleUrl) => {
      this.setData({ femaleAudioUrl: femaleUrl, progress: 100 });
    });
  },

  // 新API: POST /tts，multipart/form-data，直接返回 WAV 音频流
  // 微信小程序用 wx.request + responseType:'arraybuffer' + writeFile 写入临时路径
  callTextToSpeech: function (text, voice, callback) {
    const label = voice === '4444' ? '男声' : '女声';
    wx.request({
      url: `${API_BASE}${ENDPOINTS.TTS}`,
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `text=${encodeURIComponent(text)}&voice=${voice}&speed=5`,
      responseType: 'arraybuffer',
      success: (res) => {
        if (res.statusCode !== 200 || !res.data) {
          wx.showToast({ title: `${label}语音合成失败`, icon: 'none' });
          return;
        }
        // 将 arraybuffer 写入临时文件
        const fs = wx.getFileSystemManager();
        const tmpPath = `${wx.env.USER_DATA_PATH}/tts_${voice}_${Date.now()}.wav`;
        fs.writeFile({
          filePath: tmpPath,
          data: res.data,
          encoding: 'binary',
          success: () => {
            console.log(`${label}音频已保存:`, tmpPath);
            if (callback) callback(tmpPath);
          },
          fail: (err) => {
            wx.showToast({ title: `${label}保存音频失败`, icon: 'none' });
            console.error('writeFile失败:', err);
          }
        });
      },
      fail: (err) => {
        wx.showToast({ title: `${label}请求失败`, icon: 'none' });
        console.error('TTS请求失败:', err);
      }
    });
  },
  playMaleVoice: function (e) {
    const audioUrl = this.data.maleAudioUrl;
    if (audioUrl) {
      // 先销毁旧的男声音频上下文
      if (this.data.maleAudioContext) {
        this.data.maleAudioContext.destroy();
      }
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = audioUrl;
      audioContext.play();
      this.setData({
        maleAudioContext: audioContext,
        selectedVoice: 'male',
      });
    } else {
      wx.showToast({
        title: '音频文件未准备好，请稍候再试',
        icon: 'none'
      });
    }
  },
  playFemaleVoice: function (e) {
    const audioUrl = this.data.femaleAudioUrl;
    if (audioUrl) {
      // 先销毁旧的女声音频上下文
      if (this.data.femaleAudioContext) {
        this.data.femaleAudioContext.destroy();
      }
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = audioUrl;
      audioContext.play();
      this.setData({
        femaleAudioContext: audioContext,
        selectedVoice: 'female',
      });
    } else {
      wx.showToast({
        title: '音频文件未准备好，请稍候再试',
        icon: 'none'
      });
    }
  },
  saveToCommonPhrases() {
    // 保存信息到全局 gifList
    const app = getApp();
    const newGifInfo = {
      thumbPath: this.data.thumbPath,
      videoPath: this.data.videoPath,
      translationResult: this.data.chatTexts,
      maleAudioUrl: this.data.maleAudioUrl,
      femaleAudioUrl: this.data.femaleAudioUrl
    };
    app.globalData.gifList.push(newGifInfo);
    wx.showToast({
      title: '已保存至常用语',
      icon: 'success'
    });
    wx.navigateTo({
      url: '/pages/home/home',
    })
  },
  confirmEdit: function (e) {
    this.setData({
      maleAudioUrl: null,
      femaleAudioUrl: null,
      selectedVoice: null,
    });
    const newText = this.data.chatTexts;
    // 当确认编辑后，重新生成语音
    const cleanedText= newText.replace(/[？?]/g,'');
    this.generateBothVoices(cleanedText);
  },
  onChatTextInput: function (e) {
    const newText = e.detail.value;
    this.setData({
      chatTexts : newText
    });
  },
  onUnload: function () {
    // 销毁所有音频上下文，防止内存泄漏
    if (this.data.maleAudioContext) {
      this.data.maleAudioContext.destroy();
    }
    if (this.data.femaleAudioContext) {
      this.data.femaleAudioContext.destroy();
    }
    // 兼容旧代码
    if (this.data.audioContext) {
      this.data.audioContext.destroy();
    }
  }
});