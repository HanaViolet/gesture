const { i18n, t } = require('../../i18n/index');

Page({
  data: {
    profile: {
      nickname: '',
      avatar: '',
      gender: '',
      age: '',
      bio: '',
      phone: '',
      email: ''
    },
    genderOptions: [
      { value: 'male', label: '男', icon: '👨' },
      { value: 'female', label: '女', icon: '👩' },
      { value: 'other', label: '其他', icon: '🧑' },
      { value: 'secret', label: '保密', icon: '🔒' }
    ],
    showGenderPicker: false,
    isSaving: false
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    this.loadProfile();
  },

  // 加载个人信息
  loadProfile() {
    const profile = wx.getStorageSync('userProfile') || {};
    this.setData({
      profile: {
        nickname: profile.nickname || '',
        avatar: profile.avatar || '',
        gender: profile.gender || '',
        age: profile.age || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        email: profile.email || ''
      }
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ 'profile.nickname': e.detail.value });
  },

  // 年龄输入
  onAgeInput(e) {
    const age = e.detail.value;
    // 确保年龄是数字且在合理范围
    if (age && (age < 1 || age > 150)) {
      wx.showToast({ title: '请输入有效年龄', icon: 'none' });
      return;
    }
    this.setData({ 'profile.age': age });
  },

  // 简介输入
  onBioInput(e) {
    this.setData({ 'profile.bio': e.detail.value });
  },

  // 电话输入
  onPhoneInput(e) {
    this.setData({ 'profile.phone': e.detail.value });
  },

  // 邮箱输入
  onEmailInput(e) {
    this.setData({ 'profile.email': e.detail.value });
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          // 这里可以上传到服务器，暂时使用本地路径
          this.setData({ 'profile.avatar': tempFilePath });
          wx.showToast({ title: '头像已更新', icon: 'success' });
        }
      },
      fail: () => {
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  // 显示性别选择器
  showGenderPicker() {
    this.setData({ showGenderPicker: true });
  },

  // 隐藏性别选择器
  hideGenderPicker() {
    this.setData({ showGenderPicker: false });
  },

  // 选择性别
  selectGender(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      'profile.gender': value,
      showGenderPicker: false
    });
  },

  // 获取性别显示文本
  getGenderLabel(gender) {
    const option = this.data.genderOptions.find(item => item.value === gender);
    return option ? `${option.icon} ${option.label}` : '请选择性别';
  },

  // 保存个人信息
  saveProfile() {
    if (this.data.isSaving) return;

    const { profile } = this.data;

    // 基本验证
    if (profile.nickname && profile.nickname.length > 20) {
      wx.showToast({ title: '昵称不能超过20个字符', icon: 'none' });
      return;
    }

    if (profile.bio && profile.bio.length > 200) {
      wx.showToast({ title: '简介不能超过200个字符', icon: 'none' });
      return;
    }

    // 邮箱格式验证
    if (profile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        wx.showToast({ title: '邮箱格式不正确', icon: 'none' });
        return;
      }
    }

    // 手机号格式验证（中国大陆）
    if (profile.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(profile.phone)) {
        wx.showToast({ title: '手机号格式不正确', icon: 'none' });
        return;
      }
    }

    this.setData({ isSaving: true });

    // 保存到本地存储
    wx.setStorageSync('userProfile', profile);

    // 模拟保存过程
    setTimeout(() => {
      this.setData({ isSaving: false });
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
    }, 500);
  },

  // 清空所有信息
  clearProfile() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有个人信息吗？此操作不可恢复。',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          const emptyProfile = {
            nickname: '',
            avatar: '',
            gender: '',
            age: '',
            bio: '',
            phone: '',
            email: ''
          };
          wx.setStorageSync('userProfile', emptyProfile);
          this.setData({ profile: emptyProfile });
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 阻止事件冒泡
  preventBubble() {}
});
