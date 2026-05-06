const featureGate = require('../../utils/feature-gate');

// AI对话助手入口卡片组件
Component({
  properties: {},

  data: {},

  methods: {
    /**
     * 导航到AI对话助手页面
     */
    navigateToPsychology() {
      // 触觉反馈
      if (wx.canIUse('vibrateShort')) {
        wx.vibrateShort({ type: 'light' });
      }

      featureGate.checkPsychologyAccess((allowed) => {
        if (!allowed) return;
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
      });
    }
  }
});
