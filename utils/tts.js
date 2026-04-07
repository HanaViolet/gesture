/**
 * TTS语音合成工具函数
 * 统一封装语音合成功能，避免代码重复
 * 适配 Uni-Sign API: POST /tts 返回音频流
 */

const { API_BASE, ENDPOINTS, TIMEOUT } = require('./api');

/**
 * 音色ID映射表
 * 参考API文档: 2222=温暖女声(默认), 3333=活泼女声, 4444=成熟男声等
 */
const VOICE_MAP = {
  female: '2222',
  male: '4444',
  warm_female: '2222',
  lively_female: '3333',
  mature_male: '4444',
  clear_female: '5555',
  magnetic_male: '6666',
  gentle_female: '7777',
  sunny_male: '8888',
  sweet_female: '9999'
};

/**
 * 语音合成主函数
 * @param {string} text - 要合成的文字
 * @param {Object} options - 配置选项
 * @param {string} options.voiceType - 声音类型: 'male' | 'female' 或具体音色ID
 * @param {number} options.speed - 语速: 0-10 (默认: 5)
 * @param {number} options.temperature - 采样温度 0.1-1.0 (默认: 0.3)
 * @param {number} options.top_p - top-p 采样 0.1-1.0 (默认: 0.7)
 * @param {number} options.top_k - top-k 采样 1-100 (默认: 20)
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 错误回调
 * @param {Function} options.onComplete - 完成回调
 * @returns {Object} 返回音频上下文，可用于停止播放
 */
// 全局音频上下文管理
let currentAudioContext = null;
let currentAudioPath = null;

function speakText(text, options = {}) {
  const {
    voiceType = 'female',
    speed = 3,
    temperature,
    top_p,
    top_k,
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
    return null;
  }

  // 如果有正在播放的语音，先停止并销毁
  if (currentAudioContext) {
    try {
      currentAudioContext.stop();
      currentAudioContext.destroy();
    } catch (e) {}
    currentAudioContext = null;
    currentAudioPath = null;
  }

  // 构建请求参数 (multipart/form-data)
  const voiceId = VOICE_MAP[voiceType] || voiceType || '2222';
  let formData = `text=${encodeURIComponent(text)}&voice=${voiceId}&speed=${speed}`;
  if (temperature !== undefined) formData += `&temperature=${temperature}`;
  if (top_p !== undefined) formData += `&top_p=${top_p}`;
  if (top_k !== undefined) formData += `&top_k=${top_k}`;

  wx.request({
    url: `${API_BASE}${ENDPOINTS.TTS}`,
    method: 'POST',
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: formData,
    responseType: 'arraybuffer',
    timeout: TIMEOUT.TTS,
    success: (res) => {
      if (res.statusCode === 200 && res.data) {
        // 将 arraybuffer 写入临时文件
        const fs = wx.getFileSystemManager();
        const tmpPath = `${wx.env.USER_DATA_PATH}/tts_${voiceId}_${Date.now()}.wav`;
        fs.writeFile({
          filePath: tmpPath,
          data: res.data,
          encoding: 'binary',
          success: () => {
            // 延迟播放，确保文件写入完成
            setTimeout(() => {
              const audio = wx.createInnerAudioContext();
              currentAudioContext = audio;
              currentAudioPath = tmpPath;
              audio.src = tmpPath;

              // 监听可以播放事件
              audio.onCanplay(() => {
                audio.play();
              });

              // 监听播放结束
              audio.onEnded(() => {
                setTimeout(() => {
                  if (currentAudioContext === audio) {
                    currentAudioContext = null;
                    currentAudioPath = null;
                  }
                  try {
                    audio.destroy();
                  } catch (e) {}
                  if (typeof onSuccess === 'function') {
                    onSuccess({ audioPath: tmpPath });
                  }
                  if (typeof onComplete === 'function') {
                    onComplete();
                  }
                }, 100);
              });

              // 监听播放错误
              audio.onError((err) => {
                console.error('语音播放失败:', err);
                if (currentAudioContext === audio) {
                  currentAudioContext = null;
                  currentAudioPath = null;
                }
                try {
                  audio.destroy();
                } catch (e) {}
                if (typeof onError === 'function') {
                  onError(err);
                }
                if (typeof onComplete === 'function') {
                  onComplete();
                }
              });
            }, 100);
          },
          fail: (err) => {
            console.error('保存音频失败:', err);
            if (typeof onError === 'function') {
              onError({ errMsg: '保存音频失败', err });
            }
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }
        });
      } else {
        const error = { errMsg: '语音合成失败', statusCode: res.statusCode, res };
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

  return {
    stop: () => {
      if (currentAudioContext) {
        try {
          currentAudioContext.stop();
          currentAudioContext.destroy();
        } catch (e) {}
        currentAudioContext = null;
        currentAudioPath = null;
      }
    }
  };
}

/**
 * 预加载语音（用于常用语）
 * @param {Array} phrases - 常用语文本数组，格式: [{text: '...', voice: '2222'}]
 * @returns {Promise} - 预加载结果，返回已生成的音频路径数组
 */
function preloadVoices(phrases) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(phrases) || phrases.length === 0) {
      resolve([]);
      return;
    }

    const results = [];
    let completed = 0;

    phrases.forEach((item) => {
      const text = typeof item === 'string' ? item : item.text;
      const voice = item.voice || '2222';
      const speed = item.speed || 5;

      if (!text) {
        completed++;
        if (completed === phrases.length) resolve(results);
        return;
      }

      let formData = `text=${encodeURIComponent(text)}&voice=${voice}&speed=${speed}`;

      wx.request({
        url: `${API_BASE}${ENDPOINTS.TTS}`,
        method: 'POST',
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: formData,
        responseType: 'arraybuffer',
        timeout: TIMEOUT.TTS,
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            const fs = wx.getFileSystemManager();
            const tmpPath = `${wx.env.USER_DATA_PATH}/tts_preload_${voice}_${Date.now()}_${completed}.wav`;
            fs.writeFile({
              filePath: tmpPath,
              data: res.data,
              encoding: 'binary',
              success: () => {
                results.push({ text, voice, audioPath: tmpPath });
                completed++;
                if (completed === phrases.length) resolve(results);
              },
              fail: () => {
                completed++;
                if (completed === phrases.length) resolve(results);
              }
            });
          } else {
            completed++;
            if (completed === phrases.length) resolve(results);
          }
        },
        fail: () => {
          completed++;
          if (completed === phrases.length) resolve(results);
        }
      });
    });
  });
}

/**
 * 获取音色列表
 * @returns {Promise} - 返回可用音色列表
 */
function getVoiceList() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${ENDPOINTS.TTS_VOICES}`,
      method: 'GET',
      timeout: TIMEOUT.DEFAULT,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.voices) {
          resolve(res.data.voices);
        } else {
          // 返回默认音色列表
          resolve([
            { id: '2222', name: '默认音色', description: '温暖女声' },
            { id: '3333', name: '活泼音色', description: '年轻女声' },
            { id: '4444', name: '沉稳音色', description: '成熟男声' },
            { id: '5555', name: '清脆音色', description: '清亮女声' },
            { id: '6666', name: '磁性音色', description: '低沉男声' },
            { id: '7777', name: '温柔音色', description: '柔和女声' },
            { id: '8888', name: '阳光音色', description: '活力男声' },
            { id: '9999', name: '甜美音色', description: '甜美女声' }
          ]);
        }
      },
      fail: (err) => {
        console.error('获取音色列表失败:', err);
        // 返回默认音色列表
        resolve([
          { id: '2222', name: '默认音色', description: '温暖女声' },
          { id: '4444', name: '沉稳音色', description: '成熟男声' }
        ]);
      }
    });
  });
}

/**
 * 停止当前播放的语音
 */
function stopSpeaking() {
  if (currentAudioContext) {
    try {
      currentAudioContext.stop();
      currentAudioContext.destroy();
    } catch (e) {}
    currentAudioContext = null;
    currentAudioPath = null;
  }
}

module.exports = {
  speakText,
  preloadVoices,
  getVoiceList,
  stopSpeaking,
  VOICE_MAP
};
