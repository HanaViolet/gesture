Page({
  data: {
    buttonText: '跳过',
    swiperCurrent: 0,
    totalSwiperItems: 9
  },
  onLoad: function() {
    // 页面加载时设置初始按钮文字
    this.setData({
      buttonText: '跳过'
    });
  },
  switchToHome: function() {
    console.log('跳过按钮被点击，开始尝试跳转');
    wx.redirectTo({
      url: '/pages/deaf_homepage/deaf_homepage',
      success: function () {
        console.log('成功跳转到 deaf_homepage 页面');
      },
      fail: function (err) {
        console.log('跳转失败，错误信息:', err);
      }
    });
  },
  swiperChange: function(e) {
    const currentIndex = e.detail.current;
    this.setData({
      swiperCurrent: currentIndex
    });
    if (currentIndex === this.data.totalSwiperItems - 1) {
      // 如果是最后一张照片，修改按钮文字为“进入主页”
      this.setData({
        buttonText: '进入主页'
      });
    } else {
      // 否则恢复为“跳过”
      this.setData({
        buttonText: '跳过'
      });
    }
  }
});