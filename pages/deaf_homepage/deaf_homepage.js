const common = require('./common.js');

Page({
    data: {
        statusBarHeight: 20,
        customNavHeight: 88,
        videoPath: '', 
        thumbTempFilePath: '',
        chunkedGifList: [],
        showPrompt: false, 
        deleteIndex: -1, 
        isDeafMode: true
    },
    handleSwitchMode: function (e) {
        const mode = e.detail.mode;
        this.setData({
            isDeafMode: mode === 'deaf'
        });
    },
    onShow: function () {
        wx.hideHomeButton();
    },
    onLoad() { 
      const windowInfo = wx.getWindowInfo(); // 使用推荐 API 
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight,
        customNavHeight: windowInfo.statusBarHeight + 44
      });
      this.chunkGifList(); // 初始化 GIF 列表
    },    
    openText: function () {
        wx.navigateTo({
            url: '/pages/text_result/text_result'
        });
    },
    openCamera: function () {
        wx.showActionSheet({
            itemList: ['从相册上传', '拍照'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    this.chooseVideo();
                } else if (res.tapIndex === 1) {
                    wx.navigateTo({
                        url: '/pages/camera/camera',
                    });
                }
            },
            fail: (err) => {
                console.error('显示操作菜单失败:', err);
            }
        });
    },
    chooseVideo: common.chooseVideo,
    chooseMediaAfterAuth: common.chooseMediaAfterAuth,
    uploadVideo: common.uploadVideo,
    previewGif: function (e) {
        console.log(e.currentTarget.dataset);
        const videoPath1 = e.currentTarget.dataset.videopath;
        wx.navigateTo({
            url: `/pages/get_detail/get_detail?videoPath=${encodeURIComponent(videoPath1)}`
        });
    },
    chunkGifList: common.chunkGifList,
    switchToOtherPage: function () {
        wx.redirectTo({
            url: '/pages/normal_homepage/normal_homepage'
        });
    },
    showDeletePrompt: function (e) {
        const index = e.currentTarget.dataset.index;
        this.setData({
            showPrompt: true,
            deleteIndex: index
        });
    },
    deleteGif: function (e) {
        const confirm = e.currentTarget.dataset.confirm;
        if (confirm === 'true') {
            const app = getApp();
            const gifList = app.globalData.gifList;
            const index = this.data.deleteIndex;
            gifList.splice(index, 1);
            app.globalData.gifList = gifList;
            this.setData({
                showPrompt: false,
                deleteIndex: -1
            }, () => {
                this.chunkGifList();
            });
            wx.showToast({
                title: '删除成功',
                icon: 'success'
            });
        }
    },
    hideDeletePrompt: function () {
        this.setData({
            showPrompt: false,
            deleteIndex: -1
        });
    }
});