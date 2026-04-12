const { API_BASE, ENDPOINTS } = require('../../utils/api');

Page({
  data: {
    inputText: '',
    showVoiceOptions: false,
    selectedVoice: null,
    convertingText: "自定义常用语",
    audioContext: null,
    progress: 0,
    maleAudioUrl: null,
    femaleAudioUrl: null,
    videoPath: '',
    translationResult: ''
  },
  onLoad: function (options) {
    const videoPath = decodeURIComponent(options.videoPath);
    const app = getApp();
    const gifList = app.globalData.gifList;
    const gifInfo = gifList.find(info => info.videoPath === videoPath);
    console.log(gifInfo)
    if (gifInfo) {
      // 展示详细信息，例如更新页面数据
      this.setData({
        videoPath: gifInfo.videoPath,
        translationResult: gifInfo.translationResult,
        maleAudioUrl: gifInfo.maleAudioUrl,
        femaleAudioUrl: gifInfo.femaleAudioUrl,
        inputText: gifInfo.translationResult
      });
    }
    console.log(this.data)
  },
  videoErrorCallback: function (e) {
    console.log('视频播放出错，错误信息:', e.detail.errMsg);
    const videoComponent = this.selectComponent('#localVideo');
    if (videoComponent) {
        const videoPath = videoComponent.src;
        console.log('视频出错，视频路径为：', videoPath);
    } else {
        console.log('未能获取到视频组件实例');
    }
},
  videoLoadStartCallback: function (e) {
    console.log('视频开始加载');
  },
  onTextInput: function (e) {
    const newText = e.detail.value;
    this.setData({
      inputText: newText
    });
  },
  confirmEdit: function () {
    this.setData({
      maleAudioUrl: null,
      femaleAudioUrl: null,
      selectedVoice: null
    });
    const cleanedText = this.data.inputText.replace(/[？?]/g, '');
    this.generateBothVoices(cleanedText);
  },
  generateBothVoices: function (text) {
    console.log(this.data.videoPath)
    const app = getApp();
    const gifList = app.globalData.gifList;
    const gifIndex = gifList.findIndex(item => item.videoPath === this.data.videoPath);
    gifList[gifIndex].translationResult = text;
    this.setData({
      progress: 20
    });
    // 生成男声语音
    this.callTextToSpeech(text, 'male', (maleUrl) => {
      this.setData({
        maleAudioUrl: maleUrl,
        progress: 60
      });
      gifList[gifIndex].maleAudioUrl = maleUrl;
      // 生成女声语音
      this.callTextToSpeech(text, 'female', (femaleUrl) => {
        this.setData({
          femaleAudioUrl: femaleUrl,
          progress: 100
        });
        gifList[gifIndex].femaleAudioUrl = femaleUrl;
        app.globalData.gifList = gifList;
      });
    });
  },
  callTextToSpeech: function (text, voiceType, callback) {
    const voiceValue = voiceType === 'male' ? '4444' : '2222';
    const label = voiceType === 'male' ? '男声' : '女声';
    wx.request({
      url: `${API_BASE}${ENDPOINTS.TTS}`,
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `text=${encodeURIComponent(text)}&voice=${voiceValue}&speed=3`,
      responseType: 'arraybuffer',
      timeout: 60000,
      success: (res) => {
        if (res.statusCode !== 200 || !res.data) {
          wx.showToast({ title: `${label}语音合成失败`, icon: 'none' });
          return;
        }
        // 将 arraybuffer 写入临时文件
        const fs = wx.getFileSystemManager();
        const tmpPath = `${wx.env.USER_DATA_PATH}/tts_${voiceValue}_${Date.now()}.wav`;
        fs.writeFile({
          filePath: tmpPath,
          data: res.data,
          encoding: 'binary',
          success: () => {
            console.log(`${label}音频已保存:`, tmpPath);
            wx.showToast({ title: `${label}语音已合成`, icon: 'success' });
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
  playMaleVoice: function () {
    const audioUrl = this.data.maleAudioUrl;
    if (audioUrl) {
      // 先销毁旧的男声音频上下文
      if (this.data.maleAudioContext) {
        try {
          this.data.maleAudioContext.stop();
          this.data.maleAudioContext.destroy();
        } catch (e) {}
      }
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = audioUrl;

      // 监听可以播放事件
      audioContext.onCanplay(() => {
        audioContext.play();
      });

      // 监听播放完成
      audioContext.onEnded(() => {
        setTimeout(() => {
          try {
            audioContext.destroy();
          } catch (e) {}
          this.setData({ maleAudioContext: null });
        }, 100);
      });

      // 监听播放错误
      audioContext.onError((err) => {
        console.error('男声播放失败:', err);
        try {
          audioContext.destroy();
        } catch (e) {}
        this.setData({ maleAudioContext: null });
        wx.showToast({ title: '播放失败', icon: 'none' });
      });

      // 延迟播放，确保资源加载完成
      setTimeout(() => {
        audioContext.play();
      }, 100);

      this.setData({
        maleAudioContext: audioContext,
        selectedVoice: 'male'
      });
    } else {
      wx.showToast({
        title: '音频文件未准备好，请稍候再试',
        icon: 'none'
      });
    }
  },
  playFemaleVoice: function () {
    const audioUrl = this.data.femaleAudioUrl;
    if (audioUrl) {
      // 先销毁旧的女声音频上下文
      if (this.data.femaleAudioContext) {
        try {
          this.data.femaleAudioContext.stop();
          this.data.femaleAudioContext.destroy();
        } catch (e) {}
      }
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = audioUrl;

      // 监听可以播放事件
      audioContext.onCanplay(() => {
        audioContext.play();
      });

      // 监听播放完成
      audioContext.onEnded(() => {
        setTimeout(() => {
          try {
            audioContext.destroy();
          } catch (e) {}
          this.setData({ femaleAudioContext: null });
        }, 100);
      });

      // 监听播放错误
      audioContext.onError((err) => {
        console.error('女声播放失败:', err);
        try {
          audioContext.destroy();
        } catch (e) {}
        this.setData({ femaleAudioContext: null });
        wx.showToast({ title: '播放失败', icon: 'none' });
      });

      // 延迟播放，确保资源加载完成
      setTimeout(() => {
        audioContext.play();
      }, 100);

      this.setData({
        femaleAudioContext: audioContext,
        selectedVoice: 'female'
      });
    } else {
      wx.showToast({
        title: '音频文件未准备好，请稍候再试',
        icon: 'none'
      });
    }
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
  },
  saveToCommonPhrases() {
    // 保存信息到全局 gifList
    const app = getApp();
    const gifList = app.globalData.gifList;
    const gifIndex = gifList.findIndex(item => item.videoPath === this.data.videoPath);
    if (gifIndex === -1) {
      // 未找到对应项，添加新记录
      gifList.push({
        thumbPath: '',
        videoPath: this.data.videoPath,
        translationResult: this.data.inputText,
        maleAudioUrl: this.data.maleAudioUrl,
        femaleAudioUrl: this.data.femaleAudioUrl
      });
    } else {
      // 更新已有记录
      gifList[gifIndex].translationResult = this.data.inputText;
      gifList[gifIndex].maleAudioUrl = this.data.maleAudioUrl;
      gifList[gifIndex].femaleAudioUrl = this.data.femaleAudioUrl;
    }
    app.globalData.gifList = gifList;
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
    wx.redirectTo({
      url: '/pages/home/home',
    })
  }
});