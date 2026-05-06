const { API_BASE } = require('./api');

/**
 * 检查 AI 对话助手（psychology）页面访问权限
 * @param {function(boolean): void} callback - 回调函数，参数为是否允许访问
 */
function checkPsychologyAccess(callback) {
  wx.request({
    url: `${API_BASE}/psychology/access`,
    method: 'GET',
    timeout: 5000,
    success: (res) => {
      if (res.statusCode === 200 && res.data) {
        if (res.data.enabled) {
          callback(true);
        } else {
          wx.showToast({
            title: res.data.message || '功能暂未开放',
            icon: 'none',
            duration: 2500
          });
          callback(false);
        }
      } else {
        // 降级：接口异常时允许访问
        callback(true);
      }
    },
    fail: () => {
      // 降级：网络错误时允许访问
      callback(true);
    }
  });
}

module.exports = {
  checkPsychologyAccess
};
