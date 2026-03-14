Page({
  data: {
    title: '',
    content: '',
    images: []
  },

  onTitleChange(e) {
    this.setData({
      title: e.detail.value
    });
  },

  onContentChange(e) {
    this.setData({
      content: e.detail.value
    });
  },

  chooseImage() {
    wx.chooseImage({
      count: 9,
      success: (res) => {
        this.setData({
          images: res.tempFilePaths
        });
      }
    });
  },

  submitPost() {
    const { title, content, images } = this.data;
    if (!title.trim() || !content.trim()) {
      wx.showToast({
        title: '标题和内容不能为空',
        icon: 'none'
      });
      return;
    }

    const newPost = {
      id: Date.now(),
      title,
      content,
      images,
      author: "匿名",
      time: this.formatTime(new Date()),
      likes: 0,
      comments: []
    };

    let posts = wx.getStorageSync('posts') || [];
    posts.unshift(newPost);
    wx.setStorageSync('posts', posts);

    wx.showToast({
      title: '发布成功！',
      icon: 'success'
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },

  formatTime(date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const min = date.getMinutes();
    return `${m}-${d} ${h}:${min < 10 ? '0' + min : min}`;
  }
});
