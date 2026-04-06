Page({
  data: {
      statusBarHeight: 20,
      customNavHeight: 88,
      deafSchoolList: [
          { 
              title: '北京联合大学特殊教育学院', 
              image: '/images/community/北京联合大学特殊教育学院.jpg',
              pagePath: '/pages/cowork_content/school/bj'
          },
          { 
              title: '上海市第一聋哑学校', 
              image: '/images/community/上海市第一聋哑学校.jpg',
              pagePath: '/pages/cowork_content/school/sh'
          },
          { 
              title: '南京市聋人学校', 
              image: '/images/community/南京市聋人学校.jpg',
              pagePath: '/pages/cowork_content/school/nj'
          }
      ],
      communityHelpList: [
          { 
              title: '无声之爱康复计划', 
              image: '/images/community/无声之爱康复计划.jpg',
              pagePath: '/pages/cowork_content/community/wsza'
          },
          { 
              title: '手语桥梁公益项目', 
              image: '/images/community/慰问聋哑学校.jpg',
              pagePath: '/pages/cowork_content/community/syql'
          },
          { 
              title: '听障者就业辅导中心', 
              image: '/images/community/聋哑人就业指导.jpg',
              pagePath: '/pages/cowork_content/community/tzzjy'
          },
          { 
              title: '阳光聆听康复社', 
              image: '/images/community/聋哑康复训练.jpg',
              pagePath:  '/pages/cowork_content/community/yglt'
          },
          { 
              title: '希望之声手语培训班', 
              image: '/images/community/手语培训活动.jpg',
              pagePath: '/pages/cowork_content/community/xwzs' 
          }
      ]
  },
  handleItemClick(e) {
    const { type, index } = e.currentTarget.dataset;
    let list;
    if (type === 'deafSchool') {
      list = this.data.deafSchoolList;
    } else {
      list = this.data.communityHelpList;
    }
    const item = list[index];
    // 临时提示，详情页面开发中
    wx.showToast({
      title: '详情页面开发中',
      icon: 'none',
      duration: 2000
    });
    // 页面创建后恢复以下代码：
    // wx.navigateTo({
    //   url: `${item.pagePath}?title=${item.title}`
    // });
  },
  onLoad(options) {
    // 页面加载时的操作
  },
  // 新增：跳转到论坛页面
  goToCommunityForum() {
    wx.navigateTo({
      url: '/pages/forum/forum'
    });
  }
});    