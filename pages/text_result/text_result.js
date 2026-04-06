const app = getApp();
const { API_BASE, ENDPOINTS } = require('../../utils/api');

Page({
  data: {
      inputText: '',
      showVoiceOptions: false,
      selectedVoice: null,
      convertingText: "输入文字，可生成语音",
      audioContext: null,
      progress: 0,
      maleAudioUrl: null,
      femaleAudioUrl: null,
      saveAsPhrase: false,
      quickMode: false
  },

  onLoad(options) {
    this.setData({
      saveAsPhrase: options.saveAsPhrase === '1',
      quickMode: options.mode === 'quick'
    });
  },

  onTextInput: function(e) {
      const newText = e.detail.value;
      this.setData({
          inputText: newText
      });
  },

  confirmEdit: function() {
      this.setData({
          maleAudioUrl: null,
          femaleAudioUrl: null,
          selectedVoice: null
      });
      const cleanedText= this.data.inputText.replace(/[？?]/g,'');
      if (!cleanedText.trim()) {
        wx.showToast({ title: '请输入文字', icon: 'none' });
        return;
      }
      this.generateBothVoices(cleanedText);
  },

  saveAsCommonPhrase() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请先输入文字', icon: 'none' });
      return;
    }
    app.globalData.gifList.push({
      thumbPath: '',
      videoPath: '',
      translationResult: text,
      maleAudioUrl: this.data.maleAudioUrl || '',
      femaleAudioUrl: this.data.femaleAudioUrl || ''
    });
    wx.showToast({ title: '已保存为常用语', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({ delta: 1 });
    }, 600);
  },

  saveQuickPhrase() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请先输入文字', icon: 'none' });
      return;
    }
    const custom = wx.getStorageSync('customPhrases') || [];
    custom.push({ text, type: 'daily', id: `custom_${Date.now()}` });
    wx.setStorageSync('customPhrases', custom);
    wx.showToast({ title: '已保存为快捷短语', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({ delta: 1 });
    }, 600);
  },

  generateBothVoices: function(text) {
      this.setData({ progress: 20 });
      // 生成男声语音
      this.callTextToSpeech(text,'male', (maleUrl) => {
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
  callTextToSpeech: function(text, voiceType, callback) {
      const voiceValue = voiceType ==='male'? '6652' : '1983';
      const formData = `text=${encodeURIComponent(text)}&prompt=&voice=${voiceValue}&temperature=0.1&top_p=0.7&top_k=20&skip_refine=1&custom_voice=0`;
      wx.request({
          url: `${API_BASE}${ENDPOINTS.TTS}`,
          method: 'POST',
          header: {
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: formData,
          success: (res) => {
              if (res.data.code === 0) {
                  wx.showToast({
                      title: `${voiceType ==='male'? '男声' : '女声'}语音已合成`,
                      icon:'success'
                  });
                  console.log(`${voiceType ==='male'? '男声' : '女声'}音频文件URL:`, res.data.audio_files[0].url);
                  if (callback) {
                      callback(res.data.audio_files[0].url);
                  }
              } else {
                  wx.showToast({
                      title: `${voiceType ==='male'? '男声' : '女声'}语音合成失败:` + (res.data.msg || '未知错误'),
                      icon: 'none'
                  });
              }
          },
          fail: (err) => {
              wx.showToast({
                  title: `${voiceType ==='male'? '男声' : '女声'}请求失败:` + (err.errMsg || '网络错误'),
                  icon: 'none'
              });
          }
      });
  },
  playMaleVoice: function() {
      const audioUrl = this.data.maleAudioUrl;
      if (audioUrl) {
          // 先销毁旧的音频上下文
          if (this.data.maleAudioContext) {
              this.data.maleAudioContext.destroy();
          }
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = audioUrl;
          audioContext.play();
          this.setData({
              maleAudioContext: audioContext,
              selectedVoice:'male'
          });
      } else {
          wx.showToast({
              title: '音频文件未准备好，请稍候再试',
              icon: 'none'
          });
      }
  },
  playFemaleVoice: function() {
      const audioUrl = this.data.femaleAudioUrl;
      if (audioUrl) {
          // 先销毁旧的音频上下文
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
  onUnload: function() {
    // 销毁音频上下文，防止内存泄漏
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
});
