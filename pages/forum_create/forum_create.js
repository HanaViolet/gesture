const { API_BASE, ENDPOINTS } = require('../../utils/api');
const i18n = require('../../i18n/index');

Page({
  data: {
    title: '',
    content: '',
    images: [],
    selectedCategory: 'help',
    categories: [
      { value: 'help', labelKey: 'forum.category.help' },
      { value: 'share', labelKey: 'forum.category.share' },
      { value: 'job', labelKey: 'forum.category.job' },
      { value: 'life', labelKey: 'forum.category.life' }
    ],
    canSubmit: false,
    isSubmitting: false
  },

  onLoad() {
    this.setData({ t: this.t.bind(this) });
    this.checkCanSubmit();
  },

  t(key) {
    return i18n.t(key);
  },

  // 生成分布式头像URL（基于用户名生成一致的头像）
  generateAvatar(seed) {
    const styles = ['adventurer', 'avataaars', 'big-ears', 'bottts', 'fun-emoji', 'lorelei', 'notionists', 'open-peeps'];
    const style = styles[seed.length % styles.length];
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  },

  onTitleChange(e) {
    this.setData({ title: e.detail.value });
    this.checkCanSubmit();
  },

  onContentChange(e) {
    this.setData({ content: e.detail.value });
    this.checkCanSubmit();
  },

  selectCategory(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.value });
  },

  checkCanSubmit() {
    const { title, content } = this.data;
    const canSubmit = title.trim().length > 0 && content.trim().length > 0;
    this.setData({ canSubmit });
  },

  chooseImage() {
    const remaining = 9 - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多添加9张图片', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          images: [...this.data.images, ...newImages]
        });
      }
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 提交帖子（带API预留）
  async submitPost() {
    if (!this.data.canSubmit || this.data.isSubmitting) return;

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '发布中...' });

    const { title, content, images, selectedCategory } = this.data;

    // TODO: 后端API对接时替换为真实接口调用
    // const result = await this.submitToServer({ title, content, images, category: selectedCategory });

    // 临时本地存储方案
    const authorName = "我";
    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      images,
      category: selectedCategory,
      author: authorName,
      avatar: this.generateAvatar(authorName + Date.now()), // 为自己生成独特头像
      time: this.formatTime(new Date()),
      likes: 0,
      comments: [],
      commentCount: 0
    };

    let posts = wx.getStorageSync('posts') || [];
    posts.unshift(newPost);
    wx.setStorageSync('posts', posts);

    wx.hideLoading();
    wx.showToast({ title: i18n.t('forum.create.success'), icon: 'success' });

    setTimeout(() => {
      wx.navigateBack();
    }, 800);
  },

  // 预留：提交到服务器
  submitToServer(data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE}${ENDPOINTS.COMMUNITY_CREATE}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        data,
        success: (res) => {
          if (res.data.code === 0) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        },
        fail: reject
      });
    });
  },

  formatTime(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${m}-${d} ${h}:${min}`;
  }
});
