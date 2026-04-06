// 心理健康入口卡片组件
Component({
  properties: {},

  data: {},

  methods: {
    /**
     * 导航到心理健康页面
     */
    navigateToPsychology() {
      // 触觉反馈
      if (wx.canIUse('vibrateShort')) {
        wx.vibrateShort({ type: 'light' });
      }

      wx.navigateTo({
        url: '/pages/psychology/psychology',
        fail: (err) => {
          console.error('[PsychologyEntry] 导航失败:', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  }
});
