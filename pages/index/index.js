Page({
  data: {
    current: 0
  },
  onLoad() {
    const mode = wx.getStorageSync('userMode');
    if (mode) {
      wx.redirectTo({ url: '/pages/home/home' });
    }
  },
  onSwipeChange(e) {
    this.setData({ current: e.detail.current });
  },
  chooseMode(e) {
    const mode = e.currentTarget.dataset.mode;
    wx.vibrateShort({ type: 'light' });
    wx.setStorageSync('userMode', mode);
    wx.redirectTo({ url: '/pages/home/home' });
  }
});
