Page({
  data: {
      countdown: '30:00',
      cameraPosition: 'back',
      flashMode: 'off',
      isRecording: false,
      recording: false,
      recordedVideoPath: '',
      countdownInterval: null,
      convertedGifPath: ''
  },

  onLoad() {
      // 初始化时不启动倒计时
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
      let milliseconds = 0;
      const intervalId = setInterval(() => {
          milliseconds -= 10;
          if (milliseconds < 0) {
              milliseconds = 990;
              totalSeconds--;
          }

          // 只有当总时间>0时才更新显示
          if (totalSeconds > 0 || (totalSeconds === 0 && milliseconds > 0)) {
              const formattedSeconds = String(totalSeconds).padStart(2, '0');
              const formattedMilliseconds = String(Math.floor(milliseconds / 10)).padStart(2, '0');
              this.setData({
                  countdown: `${formattedSeconds}:${formattedMilliseconds}`
              });
          } else {
              // 时间耗尽时显示00:00
              this.setData({
                  countdown: '00:00'
              });
              clearInterval(intervalId);
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
                      }
                  });
              }
          }
      }, 10);

      this.setData({
          countdownInterval: intervalId
      });
  },

  saveVideo() {
      if (this.data.recordedVideoPath) {
          wx.navigateBack({
              success: () => {
                  // 获取上一页实例
                  const pages = getCurrentPages();
                  const prevPage = pages[pages.length - 2];
                  // 创建新GIF对象
                  const newGif = {
                      url: this.data.recordedVideoPath,
                      time: new Date().toLocaleDateString()
                  };
                  // 找到第一个加号框的位置
                  const gifList = prevPage.data.gifList;
                  const firstEmptyIndex = gifList.findIndex(item => !item);
                  if (firstEmptyIndex!== -1) {
                      // 如果存在加号框，将新GIF插入到该位置
                      gifList[firstEmptyIndex] = newGif;
                  } else {
                      // 如果不存在加号框，添加到列表末尾
                      gifList.push(newGif);
                  }
                  // 更新上一页的GIF列表
                  prevPage.setData({
                      gifList: gifList
                  }, () => {
                      prevPage.chunkGifList();
                  });
              }
          });
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
          // 模拟视频转GIF
          const convertedGifPath = this.convertVideoToGif(this.data.recordedVideoPath);
          this.setData({
              convertedGifPath: convertedGifPath
          });

          // 保存到首页
          const pages = getCurrentPages();
          pages.forEach(page => {
              if (page.route.includes('deaf_homepage') || page.route.includes('normal_homepage')) {
                  const newGif = {
                      url: convertedGifPath,
                      time: new Date().toLocaleDateString()
                  };
                  const gifList = page.data.gifList;
                  const firstEmptyIndex = gifList.findIndex(item => !item);
                  if (firstEmptyIndex!== -1) {
                      // 如果存在加号框，将新GIF插入到该位置
                      gifList[firstEmptyIndex] = newGif;
                  } else {
                      // 如果不存在加号框，添加到列表末尾
                      gifList.push(newGif);
                  }
                  page.setData({
                      gifList: gifList
                  }, () => {
                      page.chunkGifList();
                  });
              }
          });
      } else {
          console.log('没有录制的视频');
      }
  },

  convertVideoToGif(videoPath) {
      // 实际项目中需要替换为真实转换逻辑
      return videoPath.replace('.mp4', '.gif');
  }
});    