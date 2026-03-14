Page({
  data: {
    posts: [
      {
        id: 1,
        title: "手语学习交流群",
        content: "这里可以分享学习手语的经验哦～",
        author: "小明",
        time: "04-28 10:30"
      },
      {
        id: 2,
        title: "寻找就业机会",
        content: "有没有推荐适合听障朋友的工作？",
        author: "小红",
        time: "04-27 18:20"
      }
    ]
  },

  onLoad() {
    this.loadPosts();
  },

  onShow() {
    this.loadPosts();
  },

  loadPosts() {
    const posts = wx.getStorageSync('posts') || [
      {
        id: 1,
        title: "手语学习交流群",
        content: "这里可以分享学习手语的经验哦～",
        author: "小明",
        time: "04-28 10:30",
        images: [],
        likes: 0,
        comments: []
      },
      {
        id: 2,
        title: "寻找就业机会",
        content: "有没有推荐适合听障朋友的工作？",
        author: "小红",
        time: "04-27 18:20",
        images: [],
        likes: 0,
        comments: []
      }
    ];
    this.setData({ posts });
    wx.setStorageSync('posts', posts); // 第一次运行初始化保存
  },

  // 查看帖子详情
  viewPost(e) {
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/forum_detail/forum_detail?id=${postId}`
    });
  },

  // 发布新帖
  createPost() {
    wx.navigateTo({
      url: '/pages/forum_create/forum_create'
    });
  },

  // 点赞功能
  likePost(e) {
    const id = e.currentTarget.dataset.id;
    let posts = wx.getStorageSync('posts') || [];
    const index = posts.findIndex(p => p.id === id);
    if (index !== -1) {
      posts[index].likes += 1;
      wx.setStorageSync('posts', posts);
      this.setData({ posts });
    }
  }

});
