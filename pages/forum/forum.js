const { API_BASE, ENDPOINTS } = require('../../utils/api');

Page({
  data: {
    posts: [],
    page: 1,
    hasMore: true,
    isLoading: false
  },

  onLoad() {
    this.loadPosts();
    // TODO: 后端API对接时启用
    // this.fetchPostsFromServer();
  },

  onShow() {
    this.loadPosts();
  },

  // 本地存储方案（临时）
  loadPosts() {
    let posts = wx.getStorageSync('posts') || this.getDefaultPosts();
    // 确保数据字段完整性
    posts = posts.map(post => ({
      ...post,
      commentCount: post.commentCount || 0,
      likes: post.likes || 0
    }));
    this.setData({ posts });
    // 初始化默认数据
    if (!wx.getStorageSync('posts')) {
      wx.setStorageSync('posts', posts);
    }
  },

  // 默认示例数据
  getDefaultPosts() {
    return [
      {
        id: 1,
        title: "手语学习交流群",
        content: "这里可以分享学习手语的经验哦～欢迎大家一起交流！",
        author: "小明",
        time: "04-28 10:30",
        category: "分享",
        images: [],
        likes: 12,
        commentCount: 5,
        comments: []
      },
      {
        id: 2,
        title: "寻找就业机会",
        content: "有没有推荐适合听障朋友的工作？希望能在本地找到合适的工作机会。",
        author: "小红",
        time: "04-27 18:20",
        category: "求助",
        images: [],
        likes: 8,
        commentCount: 3,
        comments: []
      }
    ];
  },

  // TODO: 后端API对接 - 从服务器获取帖子列表
  async fetchPostsFromServer() {
    if (this.data.isLoading || !this.data.hasMore) return;

    this.setData({ isLoading: true });

    wx.request({
      url: `${API_BASE}${ENDPOINTS.COMMUNITY_POSTS}`,
      method: 'GET',
      data: {
        page: this.data.page,
        pageSize: 10
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          const newPosts = res.data.data.list;
          this.setData({
            posts: this.data.page === 1 ? newPosts : [...this.data.posts, ...newPosts],
            hasMore: newPosts.length >= 10,
            page: this.data.page + 1
          });
        }
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 加载更多
  loadMore() {
    // TODO: 后端API对接时启用
    // this.fetchPostsFromServer();
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

  // TODO: 后端API对接 - 点赞功能
  async likePost(e) {
    const id = e.currentTarget.dataset.id;

    // 本地存储方案（临时）
    let posts = wx.getStorageSync('posts') || [];
    const index = posts.findIndex(p => p.id === id);
    if (index !== -1) {
      posts[index].likes += 1;
      wx.setStorageSync('posts', posts);
      this.setData({ posts });
    }

    // TODO: 后端API对接时启用
    // wx.request({
    //   url: `${API_BASE}${ENDPOINTS.COMMUNITY_DETAIL}/${id}/like`,
    //   method: 'POST',
    //   header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` }
    // });
  }

});
