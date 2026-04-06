const { API_BASE, ENDPOINTS } = require('../../utils/api');
const i18n = require('../../i18n/index');

Page({
  data: {
    posts: [],
    page: 1,
    hasMore: true,
    isLoading: false,
    communityImages: []
  },

  t(key) {
    return i18n.t(key);
  },

  onLoad() {
    this.setData({ t: this.t.bind(this) });
    this.loadCommunityImages();
    this.loadPosts();
    // TODO: 后端API对接时启用
    // this.fetchPostsFromServer();
  },

  // 加载合作社区宣传图片
  loadCommunityImages() {
    const communityImages = [
      { path: '/images/community/上海市第一聋哑学校.jpg', title: '上海市第一聋哑学校' },
      { path: '/images/community/北京联合大学特殊教育学院.jpg', title: '北京联合大学特殊教育学院' },
      { path: '/images/community/南京市聋人学校.jpg', title: '南京市聋人学校' },
      { path: '/images/community/慰问聋哑学校.jpg', title: '慰问聋哑学校' },
      { path: '/images/community/手语培训活动.jpg', title: '手语培训活动' },
      { path: '/images/community/无声之爱康复计划.jpg', title: '无声之爱康复计划' },
      { path: '/images/community/聋哑人就业指导.jpg', title: '聋哑人就业指导' },
      { path: '/images/community/聋哑康复训练.jpg', title: '聋哑康复训练' }
    ];
    this.setData({ communityImages });
  },

  onShow() {
    this.loadPosts();
  },

  // 生成分布式头像URL（基于用户名生成一致的头像）
  generateAvatar(seed) {
    const styles = ['adventurer', 'avataaars', 'big-ears', 'bottts', 'fun-emoji', 'lorelei', 'notionists', 'open-peeps'];
    const style = styles[seed.length % styles.length];
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  },

  // 本地存储方案（临时）
  loadPosts() {
    let posts = wx.getStorageSync('posts') || this.getDefaultPosts();
    // 确保数据字段完整性并添加头像
    posts = posts.map(post => ({
      ...post,
      commentCount: post.commentCount || 0,
      likes: post.likes || 0,
      avatar: post.avatar || this.generateAvatar(post.author)
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
        avatar: this.generateAvatar("小明"),
        time: "04-28 10:30",
        category: "分享",
        images: [],
        likes: 12,
        commentCount: 5,
        comments: [
          { id: 1, user: '阿强', avatar: this.generateAvatar('阿强'), content: '支持！我也想学', time: '04-28 11:00' },
          { id: 2, user: 'Lisa', avatar: this.generateAvatar('Lisa'), content: '有线上课程推荐吗', time: '04-28 12:30' }
        ]
      },
      {
        id: 2,
        title: "寻找就业机会",
        content: "有没有推荐适合听障朋友的工作？希望能在本地找到合适的工作机会。",
        author: "小红",
        avatar: this.generateAvatar("小红"),
        time: "04-27 18:20",
        category: "求助",
        images: [],
        likes: 8,
        commentCount: 3,
        comments: [
          { id: 1, user: 'HR小王', avatar: this.generateAvatar('HR小王'), content: '我们公司有岗位', time: '04-27 19:00' }
        ]
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
