/**
 * Mock数据配置 - 用于后端API完成前的本地测试
 * 将 ENABLE_MOCK 设为 true 启用Mock模式
 */

const ENABLE_MOCK = false;  // 设为true启用Mock，false调用真实API

// Mock SMPL生成响应
const mockSmplResponse = {
  success: true,
  video_url: 'https://www.w3school.com.cn/example/html5/mov_bbb.mp4',  // 示例视频，替换为你的测试视频
  message: '生成成功',
  duration: 3.0,
  generated_at: new Date().toISOString()
};

// Mock错误响应（用于测试错误处理）
const mockErrorResponse = {
  success: false,
  video_url: null,
  message: '服务器繁忙，请稍后重试'
};

/**
 * 模拟SMPL生成请求
 * @param {string} text - 输入文本
 * @param {number} delay - 模拟延迟（毫秒）
 * @returns {Promise} 模拟API响应
 */
function mockGenerateSmpl(text, delay = 2000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 总是返回成功（测试用）
      resolve(mockSmplResponse);
    }, delay);
  });
}

module.exports = {
  ENABLE_MOCK,
  mockGenerateSmpl,
  mockSmplResponse
};
