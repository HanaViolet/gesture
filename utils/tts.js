/**
 * TTS语音合成工具函数
 * 统一封装语音合成功能，避免代码重复
 */

const API_BASE = require('./api').API_BASE;

/**
 * 语音合成主函数
 * @param {string} text - 要合成的文字
 * @param {Object} options - 配置选项
 * @param {string} options.voiceType - 声音类型: 'male' | 'female'
 * @param {number} options.speed - 语速: 0.8-1.2
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 错误回调
 * @param {Function} options.onComplete - 完成回调
 */
function speakText(text, options = {}) {
  const {
    voiceType = 'female',
    speed = 1.0,
    onSuccess,
    onError,
    onComplete
  } = options;

  if (!text || text.trim() === '') {
    const error = { errMsg: '文本内容为空' };
    if (typeof onError === 'function') {
      onError(error);
    }
    if (typeof onComplete === 'function') {
      onComplete();
    }
    return;
  }

  wx.request({
    url: `${API_BASE}/tts`,
    method: 'POST',
    data: {
      text: text,
      voice_type: voiceType,
      speed: speed
    },
    success: (res) => {
      if (res.statusCode === 200 && res.data && res.data.audio_url) {
        // 播放语音
        const innerAudioContext = wx.createInnerAudioContext();
        innerAudioContext.src = res.data.audio_url;
        innerAudioContext.play();

        // 监听播放结束
        innerAudioContext.onEnded(() => {
          if (typeof onSuccess === 'function') {
            onSuccess(res.data);
          }
          if (typeof onComplete === 'function') {
            onComplete();
          }
        });

        // 监听播放错误
        innerAudioContext.onError((err) => {
          console.error('语音播放失败:', err);
          if (typeof onError === 'function') {
            onError(err);
          }
          if (typeof onComplete === 'function') {
            onComplete();
          }
        });
      } else {
        const error = { errMsg: '语音合成失败', res };
        console.error('TTS请求失败:', error);
        if (typeof onError === 'function') {
          onError(error);
        }
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    },
    fail: (err) => {
      console.error('TTS网络请求失败:', err);
      if (typeof onError === 'function') {
        onError(err);
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  });
}

/**
 * 预加载语音（用于常用语）
 * @param {Array} phrases - 常用语文本数组
 * @returns {Promise} - 预加载结果
 */
function preloadVoices(phrases) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(phrases) || phrases.length === 0) {
      resolve([]);
      return;
    }

    wx.request({
      url: `${API_BASE}/tts/preload`,
      method: 'POST',
      data: {
        phrases: phrases
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject({ errMsg: '预加载失败', res });
        }
      },
      fail: reject
    });
  });
}

/**
 * 停止当前播放的语音
 */
function stopSpeaking() {
  const innerAudioContext = wx.createInnerAudioContext();
  innerAudioContext.stop();
}

module.exports = {
  speakText,
  preloadVoices,
  stopSpeaking
};
