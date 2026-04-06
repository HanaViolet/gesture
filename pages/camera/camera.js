Page({
  data: {
      countdown: '30:00',
      cameraPosition: 'back',
      flashMode: 'off',
      isRecording: false,
      recording: false,
      recordedVideoPath: '',
      countdownInterval: null,
      convertedGifPath: '',
      statusBarHeight: 44
  },

  onLoad() {
      const windowInfo = wx.getWindowInfo();
      this.setData({ statusBarHeight: windowInfo.statusBarHeight });
  },

  goBack() {
      wx.navigateBack({ delta: 1 });
  },

  toggleRecording() {
      const ctx = wx.createCameraContext();
      if (this.data.recording) {
          // 停止录制
          ctx.stopRecord({
              success: (res) => {
                  this.setData({
                      recording: false,
                      recordedVideoPath: res.tempVideoPath,
                      // 恢复按钮样式
                      isRecording: false
                  });
                  console.log('录制结束，视频路径:', res.tempVideoPath);
                  if (this.data.countdownInterval) {
                      clearInterval(this.data.countdownInterval);
                  }
              },
              fail: (err) => {
                  console.error('停止录制失败:', err);
                  this.setData({ recording: false, isRecording: false });
                  if (this.data.countdownInterval) {
                      clearInterval(this.data.countdownInterval);
                      this.setData({ countdownInterval: null });
                  }
              }
          });
      } else {
          // 开始新录制（无论是否有之前的录制）
          this.setData({
              recording: true,
              countdown: '30:00',
              // 设置按钮为录制状态样式
              isRecording: true
          });
          ctx.startRecord({
              success: () => {
                  console.log('开始录制');
                  this.startCountdown();
              },
              fail: (err) => {
                  console.error('录制失败:', err);
                  this.setData({
                      recording: false,
                      isRecording: false
                  });
              }
          });
      }
  },

  startCountdown() {
      let totalSeconds = 30;
      // 使用100ms间隔，减少性能开销
      const intervalId = setInterval(() => {
          totalSeconds--;

          // 更新显示
          if (totalSeconds >= 0) {
              const formattedSeconds = String(totalSeconds).padStart(2, '0');
              this.setData({
                  countdown: `${formattedSeconds}:00`
              });
          }

          // 时间耗尽
          if (totalSeconds <= 0) {
              this.setData({
                  countdown: '00:00'
              });
              clearInterval(intervalId);
              this.setData({ countdownInterval: null });

              // 如果正在录制，自动停止
              if (this.data.recording) {
                  const ctx = wx.createCameraContext();
                  ctx.stopRecord({
                      success: (res) => {
                          this.setData({
                              recording: false,
                              recordedVideoPath: res.tempVideoPath,
                              isRecording: false
                          });
                          console.log('录制结束，视频路径:', res.tempVideoPath);
                      },
                      fail: (err) => {
                          console.error('倒计时结束时停止录制失败:', err);
                          this.setData({ recording: false, isRecording: false });
                          if (this.data.countdownInterval) {
                              clearInterval(this.data.countdownInterval);
                              this.setData({ countdownInterval: null });
                          }
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
          const ctx = wx.createCameraContext();
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