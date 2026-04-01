Component({
  properties: {
    mode: {
      type: String,
      value: 'normal'
    }
  },
  data: {
    animating: false
  },
  methods: {
    toggleMode(e) {
      const newMode = e.currentTarget.dataset.mode;
      if (newMode === this.data.mode) return;
      wx.vibrateShort({ type: 'light' });
      this.setData({ animating: true });
      setTimeout(() => {
        this.setData({ animating: false });
      }, 350);
      this.triggerEvent('change', { mode: newMode });
    }
  }
});
