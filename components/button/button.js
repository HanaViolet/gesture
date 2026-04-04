// components/button/button.js
Component({
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },

  properties: {
    // 按钮类型: primary | secondary | text | deaf
    type: {
      type: String,
      value: 'primary'
    },
    // 尺寸: normal | small | large | deaf
    size: {
      type: String,
      value: 'normal'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 是否加载中
    loading: {
      type: Boolean,
      value: false
    },
    // 是否显示波纹效果（听障模式）
    ripple: {
      type: Boolean,
      value: false
    },
    // 开放能力
    openType: {
      type: String,
      value: ''
    }
  },

  data: {
    showRipple: false
  },

  methods: {
    onTap(e) {
      if (this.data.disabled || this.data.loading) {
        return;
      }

      // 触觉反馈
      if (wx.canIUse('vibrateShort')) {
        wx.vibrateShort({ type: 'light' });
      }

      // 波纹效果（听障模式）
      if (this.data.ripple && this.data.type === 'deaf') {
        this.setData({ showRipple: true });
        setTimeout(() => {
          this.setData({ showRipple: false });
        }, 800);
      }

      this.triggerEvent('tap', e.detail);
    },

    onGetUserInfo(e) {
      this.triggerEvent('getuserinfo', e.detail);
    },

    onGetPhoneNumber(e) {
      this.triggerEvent('getphonenumber', e.detail);
    }
  }
});
