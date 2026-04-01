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
    this.setData({
      progress: 20
    });
    wx.uploadFile({
      url: 'http://0.0.0.0:6006/inference',
      filePath: videoPath,
      name: 'video',
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.predictions) {
          console.log('手语翻译结果:', data.predictions);
          const resultText = Array.isArray(data.predictions) ? data.predictions.join('') : String(data.predictions || '');
          that.setData({
            chatTexts: resultText,
            progress: 50
          });
          // 自动进行男声和女声的语音生成
          const cleanedText= data.predictions.replace(/[？?]/g,'');
          that.generateBothVoices(cleanedText);
        } else {
          wx.showToast({
            title: '手语翻译失败:' + data.error,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '上传视频失败:' + err.errMsg,
          icon: 'none'
        });
      }
    });
  },
  generateBothVoices: function (text) {
    // 生成男声语音
    this.callTextToSpeech(text, 'male', (maleUrl) => {
      this.setData({
        maleAudioUrl: maleUrl
      });
      // 生成女声语音
      this.callTextToSpeech(text, 'female', (femaleUrl) => {
        this.setData({
          femaleAudioUrl: femaleUrl,
          progress: 100
        });
      });
    });
  },
  callTextToSpeech: function (text, voiceType, callback) {
    const voiceValue = voiceType ==='male'? '6652' : '1983';
    wx.request({
      url: 'http://127.0.0.1:9966/tts',
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
  playMaleVoice: function (e) {
    const audioUrl = this.data.maleAudioUrl;
    if (audioUrl) {
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = audioUrl;
      audioContext.play();
      this.setData({
        audioContext: audioContext,
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
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = audioUrl;
      audioContext.play();
      this.setData({
        audioContext: audioContext,
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
    const audioContext = this.data.audioContext;
    if (audioContext) {
      audioContext.destroy();
    }
  }
});