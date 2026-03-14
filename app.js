// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null,
    gifList: [
      {
        thumbPath: '/utils/example/example_1/img.jpg',
        videoPath : '/utils/example/example_1/example_1.mp4',
        translationResult : '吃药了吗，身体怎么样',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      },
      {
        thumbPath: '/utils/example/example_2/img.jpg',
        videoPath : '/utils/example/example_2/example_2.mp4',
        translationResult : '对不起',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      },
      {
        thumbPath: '/utils/example/example_3/img.jpg',
        videoPath : '/utils/example/example_3/example_3.mp4',
        translationResult : '没关系',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      },
      {
        thumbPath: '/utils/example/example_4/img.jpg',
        videoPath : '/utils/example/example_4/example_4.mp4',
        translationResult : '你会打手语吗',
        maleAudioUrl : '',
        femaleAudioUrl : ''
      }
    ]
  }
})
