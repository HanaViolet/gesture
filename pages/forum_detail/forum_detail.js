Page({
  data: {
    post: null,
    commentInput: ''
  },

  onLoad(options) {
    const { id } = options;
    const posts = wx.getStorageSync('posts') || [];
    const post = posts.find(item => item.id == id);
    if (post) {
      this.setData({ post });
    }
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  submitComment() {
    const { commentInput, post } = this.data;
    if (!commentInput.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }

    let posts = wx.getStorageSync('posts') || [];
    const index = posts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      posts[index].comments.push({
        user: '匿名',
        content: commentInput
      });
      wx.setStorageSync('posts', posts);
      this.setData({
        post: posts[index],
        commentInput: ''
      });
    }
  }
});
