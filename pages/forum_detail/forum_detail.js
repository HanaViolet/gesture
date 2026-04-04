const { API_BASE, ENDPOINTS } = require('../../utils/api');

Page({
  data: {
    post: null,
    commentInput: '',
    postId: null,
    isLiked: false
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ postId: id });
    this.loadPostDetail(id);
    // TODO: 后端API对接时启用
    // this.fetchPostFromServer(id);
  },

  // 本地存储方案（临时）
  loadPostDetail(id) {
    const posts = wx.getStorageSync('posts') || [];
    const post = posts.find(item => item.id == id);
    if (post) {
      // 确保数据字段完整性
      const safePost = {
        ...post,
        commentCount: post.commentCount || 0,
        likes: post.likes || 0,
        comments: post.comments || []
      };
      this.setData({ post: safePost });
    } else {
      wx.showToast({ title: '帖子不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // TODO: 后端API对接 - 从服务器获取帖子详情
  async fetchPostFromServer(id) {
    wx.request({
      url: `${API_BASE}${ENDPOINTS.COMMUNITY_DETAIL}/${id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ post: res.data.data });
        }
      }
    });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  // 提交评论
  submitComment() {
    const { commentInput, post, postId } = this.data;
    if (!commentInput || !commentInput.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }

    // 本地存储方案（临时）
    let posts = wx.getStorageSync('posts') || [];
    const index = posts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      const newComment = {
        id: Date.now(),
        user: '我',
        content: commentInput.trim(),
        time: this.formatTime(new Date())
      };

      if (!posts[index].comments) {
        posts[index].comments = [];
      }
      posts[index].comments.push(newComment);
      posts[index].commentCount = posts[index].comments.length;

      wx.setStorageSync('posts', posts);
      this.setData({
        post: posts[index],
        commentInput: ''
      });

      wx.showToast({ title: '评论成功', icon: 'success' });
    }

    // TODO: 后端API对接时启用
    // this.submitCommentToServer(postId, commentInput.trim());
  },

  // TODO: 后端API对接 - 提交评论到服务器
  async submitCommentToServer(postId, content) {
    wx.request({
      url: `${API_BASE}${ENDPOINTS.COMMUNITY_DETAIL}/${postId}/comment`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: { content },
      success: (res) => {
        if (res.data.code === 0) {
          this.fetchPostFromServer(postId);
          this.setData({ commentInput: '' });
          wx.showToast({ title: '评论成功', icon: 'success' });
        }
      }
    });
  },

  // 点赞
  likePost() {
    if (this.data.isLiked) return;

    const { post } = this.data;
    let posts = wx.getStorageSync('posts') || [];
    const index = posts.findIndex(p => p.id === post.id);

    if (index !== -1) {
      posts[index].likes = (posts[index].likes || 0) + 1;
      wx.setStorageSync('posts', posts);

      this.setData({
        'post.likes': posts[index].likes,
        isLiked: true
      });
    }

    // TODO: 后端API对接时启用
    // wx.request({
    //   url: `${API_BASE}${ENDPOINTS.COMMUNITY_DETAIL}/${this.data.postId}/like`,
    //   method: 'POST',
    //   header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` }
    // });
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.post.images,
      current: url
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
