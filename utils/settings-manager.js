/**
 * 全局设置管理器
 * 管理用户偏好设置，支持订阅-发布模式
 */

const STORAGE_KEY = 'app_settings_v1';

// 字体大小配置（rpx）
const FONT_SIZE_CONFIG = {
  small: {
    caption: 24,
    body: 28,
    display: 32,
    name: '小'
  },
  medium: {
    caption: 26,
    body: 30,
    display: 36,
    name: '中'
  },
  large: {
    caption: 28,
    body: 34,
    display: 40,
    name: '大'
  },
  xlarge: {
    caption: 32,
    body: 38,
    display: 44,
    name: '特大'
  },
  xxlarge: {
    caption: 36,
    body: 42,
    display: 48,
    name: '极大'
  }
};

// 默认设置
const DEFAULT_SETTINGS = {
  language: 'zh-CN',
  fontSize: 'medium',
  mode: 'normal',
  highContrast: false,
  reduceMotion: false
};

class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.subscribers = [];
    this.initialized = false;
  }

  /**
   * 初始化设置管理器
   */
  init() {
    if (this.initialized) return;

    try {
      const stored = wx.getStorageSync(STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...stored };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } catch (error) {
      console.error('[SettingsManager] 读取设置失败:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }

    this.initialized = true;
    console.log('[SettingsManager] 初始化完成:', this.settings);
  }

  /**
   * 获取当前所有设置
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * 获取指定设置项
   */
  get(key) {
    return this.settings[key];
  }

  /**
   * 更新设置
   * @param {string|object} key 设置键或设置对象
   * @param {any} value 设置值（当key为string时）
   * @param {boolean} silent 是否静默更新（不触发订阅）
   */
  set(key, value, silent = false) {
    let changed = false;

    if (typeof key === 'object') {
      // 批量更新
      const updates = key;
      Object.keys(updates).forEach(k => {
        if (this.settings[k] !== updates[k]) {
          this.settings[k] = updates[k];
          changed = true;
        }
      });
    } else {
      // 单个更新
      if (this.settings[key] !== value) {
        this.settings[key] = value;
        changed = true;
      }
    }

    // 保存到存储
    if (changed) {
      this._save();

      // 触发订阅
      if (!silent) {
        this._notifySubscribers();
      }
    }

    return changed;
  }

  /**
   * 重置为默认设置
   */
  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    this._save();
    this._notifySubscribers();
  }

  /**
   * 获取字体大小配置
   * @param {string} size 字体大小档位（可选，默认返回当前设置）
   */
  getFontSizeConfig(size) {
    const fontSize = size || this.settings.fontSize;
    return FONT_SIZE_CONFIG[fontSize] || FONT_SIZE_CONFIG.medium;
  }

  /**
   * 获取所有支持的字体大小档位
   */
  getFontSizeOptions() {
    return Object.keys(FONT_SIZE_CONFIG).map(key => ({
      value: key,
      label: FONT_SIZE_CONFIG[key].name,
      config: FONT_SIZE_CONFIG[key]
    }));
  }

  /**
   * 订阅设置变更
   * @param {function} callback 回调函数(newSettings)
   * @returns {function} 取消订阅函数
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('[SettingsManager] 订阅者必须是函数');
      return () => {};
    }

    this.subscribers.push(callback);

    // 立即返回当前设置
    callback({ ...this.settings });

    // 返回取消订阅函数
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * 保存设置到本地存储
   */
  _save() {
    try {
      wx.setStorageSync(STORAGE_KEY, this.settings);
    } catch (error) {
      console.error('[SettingsManager] 保存设置失败:', error);
    }
  }

  /**
   * 通知所有订阅者
   */
  _notifySubscribers() {
    const settings = { ...this.settings };
    this.subscribers.forEach(callback => {
      try {
        callback(settings);
      } catch (error) {
        console.error('[SettingsManager] 订阅者执行失败:', error);
      }
    });
  }
}

// 导出单例实例
const settingsManager = new SettingsManager();

module.exports = settingsManager;
