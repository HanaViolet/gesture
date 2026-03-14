Page({
  data: {
    username: '张三',
    avatar: 'https://picsum.photos/100/100',
    account: '123456789',
    gender: '男',
    genderIndex: 0,
    password: '', // 初始没设置密码
    language: '中文',
    assistMode: false,
    phoneBound: false,
    phoneNumber: '',

    inputPhone: '',
    inputCode: '',
    countdown: 0,
    showPhoneModal: false,

    showPasswordModal: false,
    showPassword: false, // 是否显示真实密码
    oldPasswordInput: '',
    newPasswordInput: '',
    confirmPasswordInput: ''
  },

  onLoad() {
    this.setData({
      genderIndex: this.data.gender === '男' ? 0 : 1
    });
  },

  // 点击密码行
  handlePasswordSetting() {
    if (!this.data.password) {
      // 没设置密码，弹窗设置
      this.setData({
        showPasswordModal: true,
        oldPasswordInput: '',
        newPasswordInput: '',
        confirmPasswordInput: ''
      });
    } else {
      // 已设置密码，切换显示或隐藏
      this.setData({
        showPassword: !this.data.showPassword
      });
    }
  },

  // 输入处理
  handleOldPasswordInput(e) {
    this.setData({ oldPasswordInput: e.detail.value });
  },

  handleNewPasswordInput(e) {
    this.setData({ newPasswordInput: e.detail.value });
  },

  handleConfirmPasswordInput(e) {
    this.setData({ confirmPasswordInput: e.detail.value });
  },

  // 确认设置/修改密码
  handlePasswordConfirm() {
    const { password, oldPasswordInput, newPasswordInput, confirmPasswordInput } = this.data;

    // 如果之前有密码，需要验证旧密码
    if (password && oldPasswordInput !== password) {
      wx.showToast({
        title: '原密码错误',
        icon: 'none'
      });
      return;
    }

    if (newPasswordInput.length < 6) {
      wx.showToast({
        title: '新密码至少6位',
        icon: 'none'
      });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      wx.showToast({
        title: '两次输入不一致',
        icon: 'none'
      });
      return;
    }

    // 保存新密码
    this.setData({
      password: newPasswordInput,
      showPasswordModal: false,
      showPassword: false
    });

    wx.showToast({
      title: '密码设置成功',
      icon: 'success'
    });
  },

  handlePasswordModalClose() {
    this.setData({ showPasswordModal: false });
  },

  // 下面是你的其他功能，保持不变……
  handleGenderChange(e) {
    const index = e.detail.value;
    const gender = index == 0 ? '男' : '女';
    this.setData({
      gender,
      genderIndex: index
    });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出账号吗？',
      success: (res) => {
        if (res.confirm) {
          console.log('用户退出账号');
        }
      }
    });
  },

  handleAssistToggle() {
    this.setData({ assistMode: !this.data.assistMode });
  },

  handlePhoneBindClick() {
    this.setData({ showPhoneModal: true });
  },

  handlePhoneInput(e) {
    this.setData({ inputPhone: e.detail.value });
  },

  handleCodeInput(e) {
    this.setData({ inputCode: e.detail.value });
  },

  handleSendCode() {
    const phone = this.data.inputPhone;
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    if (this.data.countdown > 0) {
      return;
    }

    wx.showToast({
      title: '验证码已发送',
      icon: 'success'
    });

    this.startCountdown();
  },

  startCountdown() {
    this.setData({ countdown: 60 });
    this.timer = setInterval(() => {
      if (this.data.countdown > 0) {
        this.setData({
          countdown: this.data.countdown - 1
        });
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  },

  handlePhoneBindConfirm() {
    const phone = this.data.inputPhone;
    const code = this.data.inputCode;
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      wx.showToast({
        title: '请输入正确手机号',
        icon: 'none'
      });
      return;
    }
    if (!code || code.length < 4) {
      wx.showToast({
        title: '请输入验证码',
        icon: 'none'
      });
      return;
    }

    this.setData({
      phoneNumber: phone,
      phoneBound: true,
      showPhoneModal: false
    });

    wx.showToast({
      title: '绑定成功',
      icon: 'success'
    });

    clearInterval(this.timer);
  },

  handleLanguageChange() {
    wx.showActionSheet({
      itemList: ['中文', '英文'],
      success: (res) => {
        const languages = ['中文', '英文'];
        this.setData({ language: languages[res.tapIndex] });
      }
    });
  },

  handleModalClose() {
    this.setData({ showPhoneModal: false });
  },

  onUnload() {
    clearInterval(this.timer);
  }
});
