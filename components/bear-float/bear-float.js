Component({
  data: {
    showPopup: false,
    showBadge: true,
    wobble: false,
    bearBottom: 240,  // rpx，距底部距离
    currentMsg: '',

    messages: [
      '嘿，最近心情还好吗？\n有什么话想说，我在这里听你说 🐻',
      '你好呀～\n感觉有点低落？要不要跟我聊聊天？',
      '小熊来看你了！\n心情怎么样？需要倾诉一下吗？✨',
      '今天过得怎么样？\n不管开心还是难过，都可以跟我说哦 🌿',
      '嗨！我是你的小熊助手 🐾\n要和我聊聊你的心情吗？',
      '你还好吗？\n有时候说出来，会好受很多的 💙',
    ],

    lastMsgIndex: -1,
  },

  lifetimes: {
    attached() {
      // 3秒后自动抖动一次提示用户
      setTimeout(() => {
        this.triggerWobble();
      }, 3000);
    }
  },

  methods: {
    onBearTap() {
      this.triggerWobble();

      if (this.data.showPopup) {
        this.setData({ showPopup: false });
        return;
      }

      // 随机选一条不重复的消息
      const msgs = this.data.messages;
      let idx;
      do {
        idx = Math.floor(Math.random() * msgs.length);
      } while (idx === this.data.lastMsgIndex && msgs.length > 1);

      this.setData({
        showPopup: true,
        showBadge: false,
        currentMsg: msgs[idx],
        lastMsgIndex: idx,
      });

      // 计算弹窗位置（跟随小熊）
      this.setData({
        bubbleBottom: this.data.bearBottom + 20
      });

      if (wx.canIUse('vibrateShort')) wx.vibrateShort({ type: 'light' });
    },

    onCancel() {
      this.setData({ showPopup: false });
    },

    onConfirm() {
      this.setData({ showPopup: false });
      wx.navigateTo({ url: '/pages/psychology/psychology' });
    },

    triggerWobble() {
      this.setData({ wobble: true });
      setTimeout(() => this.setData({ wobble: false }), 600);
    },

    noop() {}
  }
});
