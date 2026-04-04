/**
 * 动画工具函数
 * 统一处理页面转场动画和交互反馈
 */

/**
 * 页面进入动画
 * @param {Object} pageInstance - 页面实例(this)
 * @param {number} delay - 延迟时间(毫秒)
 */
function pageEnter(pageInstance, delay = 0) {
  const animation = wx.createAnimation({
    duration: 300,
    timingFunction: 'ease-out',
    delay: delay
  });

  animation.opacity(0).translateY(20).step({ duration: 0 });
  animation.opacity(1).translateY(0).step();

  pageInstance.setData({
    pageAnimationData: animation.export()
  });
}

/**
 * 页面退出动画
 * @param {Object} pageInstance - 页面实例(this)
 * @param {Function} callback - 动画完成回调
 */
function pageExit(pageInstance, callback) {
  const animation = wx.createAnimation({
    duration: 200,
    timingFunction: 'ease-in'
  });

  animation.opacity(0).translateY(10).step();

  pageInstance.setData({
    pageAnimationData: animation.export()
  });

  setTimeout(() => {
    if (typeof callback === 'function') {
      callback();
    }
  }, 200);
}

/**
 * 模式切换动画（spring效果）
 * @param {Object} pageInstance - 页面实例
 * @param {string} mode - 新模式 'normal' | 'deaf'
 */
function modeSwitchAnimation(pageInstance, mode) {
  // 胶囊滑块动画
  const highlightAnimation = wx.createAnimation({
    duration: 400,
    timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // spring
  });

  const translateX = mode === 'deaf' ? '100%' : '0';
  highlightAnimation.translateX(translateX).step();

  // 内容淡入淡出
  const contentAnimation = wx.createAnimation({
    duration: 200,
    timingFunction: 'ease'
  });

  contentAnimation.opacity(0).step();
  contentAnimation.opacity(1).step();

  pageInstance.setData({
    highlightAnimation: highlightAnimation.export(),
    contentAnimationData: contentAnimation.export(),
    contentVisible: false
  });

  // 触觉反馈
  if (wx.canIUse('vibrateShort')) {
    wx.vibrateShort({ type: 'light' });
  }

  setTimeout(() => {
    pageInstance.setData({
      mode: mode,
      contentVisible: true
    });
  }, 200);
}

/**
 * 按钮按压反馈
 * @param {Object} pageInstance - 页面实例
 * @param {string} btnId - 按钮ID
 */
function buttonPressFeedback(pageInstance, btnId) {
  // 触觉反馈
  if (wx.canIUse('vibrateShort')) {
    wx.vibrateShort({ type: 'light' });
  }

  // 视觉反馈动画
  const animation = wx.createAnimation({
    duration: 100,
    timingFunction: 'ease'
  });

  animation.scale(0.95).step();
  animation.scale(1).step();

  const animationDataKey = `${btnId}Animation`;
  pageInstance.setData({
    [animationDataKey]: animation.export()
  });
}

/**
 * 波纹效果（听障模式）
 * @param {Object} pageInstance - 页面实例
 * @param {string} elementId - 元素ID
 */
function rippleEffect(pageInstance, elementId) {
  pageInstance.setData({
    [`${elementId}Ripple`]: true
  });

  setTimeout(() => {
    pageInstance.setData({
      [`${elementId}Ripple`]: false
    });
  }, 800);
}

/**
 * 卡片悬浮效果
 * @param {Object} pageInstance - 页面实例
 * @param {string} cardId - 卡片ID
 * @param {boolean} isHover - 是否悬浮
 */
function cardHoverEffect(pageInstance, cardId, isHover) {
  const animation = wx.createAnimation({
    duration: 200,
    timingFunction: 'ease'
  });

  if (isHover) {
    animation.translateY(-4).step();
  } else {
    animation.translateY(0).step();
  }

  pageInstance.setData({
    [`${cardId}Animation`]: animation.export()
  });
}

/**
 * 加载动画控制
 * @param {Object} pageInstance - 页面实例
 * @param {boolean} show - 显示/隐藏
 */
function loadingAnimation(pageInstance, show) {
  pageInstance.setData({
    loadingVisible: show
  });
}

/**
 * 列表项进入动画（stagger效果）
 * @param {Object} pageInstance - 页面实例
 * @param {Array} list - 列表数据
 * @param {string} prefix - 动画数据前缀
 */
function listItemEnterAnimation(pageInstance, list, prefix = 'item') {
  list.forEach((item, index) => {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
      delay: index * 50 // stagger效果
    });

    animation.opacity(0).translateY(20).step({ duration: 0 });
    animation.opacity(1).translateY(0).step();

    pageInstance.setData({
      [`${prefix}${index}Animation`]: animation.export()
    });
  });
}

module.exports = {
  pageEnter,
  pageExit,
  modeSwitchAnimation,
  buttonPressFeedback,
  rippleEffect,
  cardHoverEffect,
  loadingAnimation,
  listItemEnterAnimation
};
