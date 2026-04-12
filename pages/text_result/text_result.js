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
      wx.redirectTo({ url: '/pages/home/home' });
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
      wx.redirectTo({ url: '/pages/home/home' });
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
  playMaleVoice: function() {
      const audioUrl = this.data.maleAudioUrl;
      if (audioUrl) {
          // 先销毁旧的音频上下文
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
