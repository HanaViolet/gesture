Page({
  data: {
    inputText: '',
    progress: 0,
    showModal: false // 控制弹窗显示
  },

  onTextInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  confirmEdit() {
    // 目前确认按钮也弹窗
    this.setData({
      showModal: true
    });
  },

  playVideoPlaceholder() {
    // 点击视频也弹窗
    this.setData({
      showModal: true
    });
  },

  closeModal() {
    this.setData({
      showModal: false
    });
  }
});
