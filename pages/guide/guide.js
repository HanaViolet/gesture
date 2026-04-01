Page({
  data: {
      guideSteps: [
          {
              id: 1,
              target: '.custom-navbar .tab-item:nth-child(1)', // 导航栏左下角的首页按钮
              content: '欢迎使用手语翻译小程序！首先，点击导航栏左下角的首页按钮，可以切换听障模式和普通模式。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 2,
              target: '.custom-navbar .tab-item:nth-child(2)',
              content: '点击导航栏中间的“社区合作”按钮，可以查看与聋哑人学校的合作资讯以及社区的聋哑人辅助服务信息。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 3,
              target: '.custom-navbar .tab-item:nth-child(3)',
              content: '点击导航栏右边的“个人中心”按钮，可以进行账号设置、密码设置以及绑定手机等操作。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 4,
              target: '.deaf-homepage-camera', // 听障模式首页的相机按钮，假设的类名
              content: '在听障模式的首页，点击左上部分的相机按钮，可以录制30s视频，上传后可将手语翻译成文字并有语音播放功能。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 5,
              target: '.deaf-homepage-text', // 听障模式首页的文字输入按钮，假设的类名
              content: '在听障模式的首页，点击右上部分的文字输入按钮，可以输入文字然后转换成语音播放。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 6,
              target: '.deaf-homepage-common-phrases', // 听障模式首页的常用语集合按钮，假设的类名
              content: '在听障模式的首页，点击下半部分的常用语集合按钮，可以查看和管理你以往拍摄的视频。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 7,
              target: '.normal-homepage-camera', // 普通模式首页的相机按钮，假设的类名
              content: '在普通模式的首页，点击上半部分的相机按钮，功能与听障模式的相机按钮相同。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 8,
              target: '.normal-homepage-common-phrases', // 普通模式首页的常用语按钮，假设的类名
              content: '在普通模式的首页，点击中间的常用语按钮，可以查看和管理你以往拍摄的视频。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 9,
              target: '.normal-homepage-teach', // 普通模式首页的教程按钮，假设的类名
              content: '在普通模式的首页，点击下方左边的教程按钮，可以查看更多关于如何使用本小程序的教程。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          },
          {
              id: 10,
              target: '.normal-homepage-popularization', // 普通模式首页的手语科普按钮，假设的类名
              content: '在普通模式的首页，点击下方右边的手语科普按钮，可以查看手语科普文字。',
              spotlightStyle: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  position: 'absolute'
              }
          }
      ],
      currentStep: 1,
      spotlightPosition: {
          left: 0,
          top: 0
      }
  },
  onLoad() {
      this.updateSpotlightPosition();
  },
  updateSpotlightPosition() {
      const currentStep = this.data.currentStep;
      const targetSelector = this.data.guideSteps[currentStep - 1].target;
      const query = wx.createSelectorQuery();
      query.select(targetSelector).boundingClientRect();
      query.exec((res) => {
          if (res && res[0]) {
              const { left, top } = res[0];
              this.setData({
                  spotlightPosition: {
                      left: left,
                      top: top
                  }
              });
          }
      });
  },
  nextStep() {
      const currentStep = this.data.currentStep;
      if (currentStep < this.data.guideSteps.length) {
          this.setData({
              currentStep: currentStep + 1
          }, () => {
              this.updateSpotlightPosition();
          });
      } else {
          // 跳转到 deaf_homepage 页面
          wx.navigateTo({
              url: '/pages/home/home'
          });
      }
  }
});