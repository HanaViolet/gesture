Page({
  data: {
      countdown: '30',
      cameraPosition: 'back',
      flashMode: 'off',
      isRecording: false,
      recording: false,
      recordedVideoPath: '',
      countdownInterval: null,
      convertedGifPath: '',
      statusBarHeight: 44,
      playing: false,
      // 防止重复点击
      isToggling: false
  },

  // 相机上下文，页面加载时创建
  cameraContext: null,

  onLoad() {
      const windowInfo = wx.getWindowInfo();
      this.setData({ statusBarHeight: windowInfo.statusBarHeight });
      // 提前创建相机上下文，避免每次点击都创建
      this.cameraContext = wx.createCameraContext();
  },

  goBack() {
      wx.navigateBack({ delta: 1 });
  },

  toggleRecording() {
      // 防止重复点击
      if (this.data.isToggling) {
          console.log('操作过于频繁，请稍候');
          return;
      }

      const ctx = this.cameraContext;
      if (!ctx) {
          console.error('相机上下文未初始化');
          return;
      }

      if (this.data.recording) {
          // 停止录制
          this.setData({ isToggling: true });
          wx.vibrateShort({ type: 'light' });
          ctx.stopRecord({
              success: (res) => {
                  console.log('录制结束，视频路径:', res.tempVideoPath);
                  // 先清理定时器
                  if (this.data.countdownInterval) {
                      clearInterval(this.data.countdownInterval);
                  }
                  // 再更新状态
                  this.setData({
                      recording: false,
                      recordedVideoPath: res.tempVideoPath,
                      isRecording: false,
                      countdownInterval: null,
                      isToggling: false
                  });
              },
              fail: (err) => {
                  console.error('停止录制失败:', err);
                  if (this.data.countdownInterval) {
                      clearInterval(this.data.countdownInterval);
                  }
                  this.setData({
                      recording: false,
                      isRecording: false,
                      countdownInterval: null,
                      isToggling: false
                  });
              }
          });
      } else {
          // 开始新录制 - 先设置防重复点击，等待startRecord成功后再设置recording状态
          this.setData({ isToggling: true });
          wx.vibrateShort({ type: 'heavy' });
          ctx.startRecord({
              success: () => {
                  console.log('开始录制成功');
                  this.setData({
                      recording: true,
                      countdown: '30',
                      isRecording: true,
                      isToggling: false
                  });
                  this.startCountdown();
              },
              fail: (err) => {
                  console.error('录制失败:', err);
                  this.setData({
                      recording: false,
                      isRecording: false,
                      isToggling: false
                  });
                  wx.showToast({ title: '启动录制失败', icon: 'none' });
              }
          });
      }
  },

  startCountdown() {
      let totalSeconds = 30;
      // 先清除可能存在的旧定时器
      if (this.data.countdownInterval) {
          clearInterval(this.data.countdownInterval);
      }

      const intervalId = setInterval(() => {
          totalSeconds--;

          // 更新显示 - 只显示剩余秒数
          if (totalSeconds >= 0) {
              this.setData({
                  countdown: String(totalSeconds)
              });
          }

          // 时间耗尽，自动停止
          if (totalSeconds <= 0) {
              clearInterval(intervalId);

              // 如果正在录制，自动停止
              if (this.data.recording) {
                  const ctx = this.cameraContext;
                  if (!ctx) {
                      this.setData({
                          recording: false,
                          isRecording: false,
                          countdown: '30',
                          countdownInterval: null
                      });
                      return;
                  }
                  ctx.stopRecord({
                      success: (res) => {
                          console.log('倒计时结束，自动停止录制:', res.tempVideoPath);
                          this.setData({
                              recording: false,
                              recordedVideoPath: res.tempVideoPath,
                              isRecording: false,
                              countdown: '30',
                              countdownInterval: null
                          });
                      },
                      fail: (err) => {
                          console.error('自动停止录制失败:', err);
                          this.setData({
                              recording: false,
                              isRecording: false,
                              countdown: '30',
                              countdownInterval: null
                          });
                      }
                  });
              }
          }
      }, 1000);

      this.setData({
          countdownInterval: intervalId
      });
  },

  saveVideo() {
      if (this.data.recordedVideoPath) {
          const app = getApp();
          app.globalData.gifList.push({
              thumbPath: '',
              videoPath: this.data.recordedVideoPath,
              translationResult: '未命名视频',
              maleAudioUrl: '',
              femaleAudioUrl: ''
          });
          wx.showToast({ title: '已保存', icon: 'success' });
          wx.navigateTo({ url: '/pages/home/home' });
      } else {
          console.log('没有录制的视频');
      }
  },

  uploadVideo() {
    if (this.data.recordedVideoPath) {
        wx.navigateTo({
            url: `/pages/analysis_result/analysis_result?videoPath=${this.data.recordedVideoPath}`
        });
    } else {
        console.log('没有录制的视频');
    }
  },

  switchCamera() {
      const newPosition = this.data.cameraPosition === 'back'? 'front' : 'back';
      this.setData({
          cameraPosition: newPosition
      });
  },

  toggleFlashlight() {
      const newFlashMode = this.data.flashMode === 'off'? 'on' : 'off';
      this.setData({
          flashMode: newFlashMode
      });
  },

  error(e) {
      console.error('相机错误:', e.detail);
  },

  convertAndSaveGif() {
      if (this.data.recordedVideoPath) {
          const app = getApp();
          const convertedGifPath = this.convertVideoToGif(this.data.recordedVideoPath);
          this.setData({ convertedGifPath });
          app.globalData.gifList.push({
              thumbPath: '',
              videoPath: convertedGifPath,
              translationResult: '未命名视频',
              maleAudioUrl: '',
              femaleAudioUrl: ''
          });
          wx.showToast({ title: '已保存', icon: 'success' });
          wx.navigateTo({ url: '/pages/home/home' });
      } else {
          console.log('没有录制的视频');
      }
  },

  convertVideoToGif(videoPath) {
      // 实际项目中需要替换为真实转换逻辑
      return videoPath.replace('.mp4', '.gif');
  },

  // 页面卸载时清理定时器
  onUnload() {
      if (this.data.countdownInterval) {
          clearInterval(this.data.countdownInterval);
          this.setData({ countdownInterval: null });
      }
  },

  // 页面隐藏时停止录制并清理
  onHide() {
      if (this.data.recording) {
          const ctx = this.cameraContext;
          if (!ctx) return;
          ctx.stopRecord({
              success: () => {
                  console.log('页面隐藏，停止录制');
              },
              fail: () => {}
          });
      }
      if (this.data.countdownInterval) {
          clearInterval(this.data.countdownInterval);
          this.setData({
              countdownInterval: null,
              recording: false,
              isRecording: false
          });
      }
  }
});    