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
    const voiceValue = voiceType === 'male' ? '6652' : '1983';
    wx.request({
      url: `${API_BASE}${ENDPOINTS.TTS}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        text: text,
        prompt: "",
        voice: voiceValue,
        temperature: 0.1,
        top_p: 0.7,
        top_k: 20,
        skip_refine: 1,
        custom_voice: 0
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({
            title: `${voiceType ==='male'? '男声' : '女声'}语音已合成`,
            icon: 'success'
          });
          console.log(`${voiceType ==='male'? '男声' : '女声'}音频文件URL:`, res.data.audio_files[0].url);
          if (callback) {
            callback(res.data.audio_files[0].url);
          }
        } else {
          wx.showToast({
            title: `${voiceType ==='male'? '男声' : '女声'}语音合成失败:` + res.data.msg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: `${voiceType ==='male'? '男声' : '女声'}请求失败:` + err.errMsg,
          icon: 'none'
        });
      }
    });
  },
  playMaleVoice: function () {
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
        this.data.femaleAudioContext.destroy();
      }
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = audioUrl;
      audioContext.play();
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
    gifList[gifIndex].translationResult = this.data.inputText;
    gifList[gifIndex].maleAudioUrl = this.data.maleAudioUrl;
    gifList[gifIndex].femaleAudioUrl = this.data.femaleAudioUrl;
    app.globalData.gifList = gifList;
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
    wx.navigateTo({
      url: '/pages/home/home',
    })
  }
});