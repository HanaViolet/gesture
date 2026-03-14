Page({
  data: {
      inputText: '',
      showVoiceOptions: false,
      selectedVoice: null,
      convertingText: "输入文字，可生成语音",
      audioContext: null,
      progress: 0,
      maleAudioUrl: null,
      femaleAudioUrl: null
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
      this.generateBothVoices(cleanedText);
  },
  generateBothVoices: function(text) {
      const that = this;
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
                      icon:'success'
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
  playMaleVoice: function() {
      const audioUrl = this.data.maleAudioUrl;
      if (audioUrl) {
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = audioUrl;
          audioContext.play();
          this.setData({
              audioContext: audioContext,
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
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = audioUrl;
          audioContext.play();
          this.setData({
              audioContext: audioContext,
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
      const audioContext = this.data.audioContext;
      if (audioContext) {
          audioContext.destroy();
      }
  }
});