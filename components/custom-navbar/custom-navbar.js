Component({
  properties: {
      isDeafMode: {
          type: Boolean,
          value: true
      }
  },
  data: {
      // 不需要 showOptions 了
  },
  methods: {
      toggleHomePage: function () {
          const currentMode = this.data.isDeafMode;
          const newMode =!currentMode;
          this.setData({
              isDeafMode: newMode
          });
          if (newMode) {
              wx.reLaunch({
                  url: '/pages/deaf_homepage/deaf_homepage'
              });
          } else {
              wx.reLaunch({
                  url: '/pages/normal_homepage/normal_homepage'
              });
          }
      },
      navigateToSocietyCowork: function () {
          wx.navigateTo({
              url: '/pages/society_cowork/society_cowork'
          });
      },
      navigateToPersonalSettings: function () {
          wx.navigateTo({
              url: '/pages/personal_settings/personal_settings'
          });
      }
  }
});    