// common.js
function chooseVideo() {
  if (!wx.canIUse('chooseMedia')) {
    wx.showToast({
      title: '当前版本不支持选择媒体功能',
      icon: 'none'
    });
    return;
  }
  wx.getSetting({
    success: (res) => {
      if (!res.authSetting['scope.writePhotosAlbum']) {
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => {
            chooseMediaAfterAuth();
          },
          fail: () => {
            wx.showToast({
              title: '未授予相册访问权限',
              icon: 'none'
            });
          }
        });
      } else {
        chooseMediaAfterAuth();
      }
    }
  });
}

function chooseMediaAfterAuth() {
  const that = this;
  wx.chooseMedia({
    count: 1,
    mediaType: ['video'],
    sourceType: ['album'],
    maxDuration: 60,
    camera: 'back',
    success: (res) => {
      console.log('wx.chooseMedia 返回结果:', res);
      if (res.tempFiles && res.tempFiles.length > 0) {
        const videoFilePath = res.tempFiles[0].tempFilePath;
        const thumbTempFilePath = res.tempFiles[0].thumbTempFilePath;
        that.setData({
          videoPath: videoFilePath,
          thumbTempFilePath: thumbTempFilePath
        });
        console.log('选择的媒体路径:', videoFilePath);
        // 选择视频后直接上传翻译
        that.uploadVideo();
      } else {
        console.error('未获取到有效的媒体路径');
        wx.showToast({
          title: '未获取到有效的媒体路径',
          icon: 'none'
        });
      }
    },
    fail: (err) => {
      console.error('选择媒体失败:', err);
      wx.showToast({
        title: '选择媒体失败',
        icon: 'none'
      });
    }
  });
}

function uploadVideo() {
  if (this.data.videoPath) {
    wx.navigateTo({
      url: `/pages/analysis_result/analysis_result?videoPath=${this.data.videoPath}&thumbPath=${this.data.thumbTempFilePath}`
    });
  } else {
    console.log('没有录制的视频');
  }
}

function chunkGifList() {
  const app = getApp();
  const gifList = app.globalData.gifList;
  const chunked = [];
  for (let i = 0; i < gifList.length; i += 2) {
    chunked.push([gifList[i], gifList[i + 1]]);
  }
  const lastRow = chunked[chunked.length - 1];
  if (lastRow.length === 2 && lastRow[1]) {
    chunked.push([null]);
  } else if (lastRow.length === 1 ||!lastRow[1]) {
    lastRow[1] = null;
  }
  this.setData({
    chunkedGifList: chunked
  });
}

module.exports = {
  chooseVideo,
  chooseMediaAfterAuth,
  uploadVideo,
  chunkGifList
};