# 心语者小程序基础设施使用指南

## 概述

本文档介绍心语者小程序的基础设施模块，包括全局设置管理器和国际化语言管理器。

## 已创建的文件

### 1. utils/settings-manager.js
全局设置管理器，管理用户偏好设置。

**功能：**
- 语言设置 (zh-CN/en-US/de-DE)
- 字体大小设置 (small/medium/large/xlarge/xxlarge)
- 界面模式 (normal/deaf)
- 高对比度开关
- 减少动画开关
- 订阅-发布模式支持

**使用示例：**
```javascript
const app = getApp()
const { settingsManager } = app

// 获取设置
const settings = settingsManager.getSettings()
const fontSize = settingsManager.get('fontSize')

// 设置单项
settingsManager.set('fontSize', 'large')

// 批量设置
settingsManager.set({
  fontSize: 'large',
  highContrast: true
})

// 订阅设置变更
settingsManager.subscribe((newSettings) => {
  console.log('设置已更新:', newSettings)
})

// 获取字体大小配置
const fontConfig = settingsManager.getFontSizeConfig()
console.log(fontConfig.body) // 输出: 34 (rpx)
```

### 2. i18n/index.js
国际化语言管理器，支持多语言切换。

**功能：**
- 翻译方法 t(key, params)
- 语言切换 setLanguage(lang)
- 语言变更订阅
- 获取支持的语言列表

**使用示例：**
```javascript
const { t, setLanguage, subscribe, KEYS } = require('../../i18n/index')

Page({
  onLoad() {
    // 订阅语言变更
    subscribe((lang) => {
      this.updateUI()
    })
  },

  updateUI() {
    // 使用翻译键
    const title = t(KEYS.HOME.TITLE)
    const message = t(KEYS.ERRORS.NETWORK_ERROR)

    // 带参数的翻译
    const greeting = t('common.welcome', { name: '用户' })
  },

  switchLanguage() {
    setLanguage('en-US')
  }
})
```

### 3. i18n/keys.js
翻译键常量定义，防止拼写错误。

**使用示例：**
```javascript
const { KEYS } = require('../../i18n/index')

// 使用常量而不是字符串
const title = t(KEYS.HOME.TITLE)  // 推荐
const title = t('home.title')      // 不推荐，容易出错
```

### 4. i18n/locales/
语言包目录，包含：
- zh-CN.js - 简体中文
- en-US.js - English
- de-DE.js - Deutsch

## 快速开始

### 在页面中使用

```javascript
// pages/example/example.js
const app = getApp()
const { t, KEYS, subscribe } = require('../../i18n/index')

Page({
  data: {
    translations: {},
    settings: {}
  },

  onLoad() {
    const { settingsManager, i18n } = app

    // 订阅设置变更
    settingsManager.subscribe((settings) => {
      this.setData({ settings })
      this.updateTranslations()
    })

    // 初始化
    this.setData({
      settings: settingsManager.getSettings()
    })
    this.updateTranslations()
  },

  updateTranslations() {
    this.setData({
      translations: {
        title: t(KEYS.HOME.TITLE),
        startButton: t(KEYS.HOME.START_TRANSLATE),
        settings: t(KEYS.NAV.SETTINGS)
      }
    })
  }
})
```

```xml
<!-- pages/example/example.wxml -->
<view class="container">
  <text>{{translations.title}}</text>
  <button>{{translations.startButton}}</button>
</view>
```

### 在WXML中使用字体大小

```xml
<view style="font-size: {{fontSizeConfig.body}}rpx">
  <text style="font-size: {{fontSizeConfig.display}}rpx">标题</text>
  <text style="font-size: {{fontSizeConfig.caption}}rpx">说明文字</text>
</view>
```

## 最佳实践

1. **始终使用KEYS常量**：避免硬编码字符串，防止拼写错误
2. **订阅变更**：在页面中订阅设置和语言变更，实现实时更新
3. **字体大小**：使用settingsManager.getFontSizeConfig()获取配置，保持统一
4. **存储**：所有设置自动持久化到storage，无需手动处理

## 注意事项

1. 设置管理器和i18n在app.js中初始化，确保在onLaunch之后使用
2. 订阅函数会立即返回当前值，无需额外获取
3. 语言切换时会自动通知所有订阅者
4. 字体大小配置返回的是rpx单位，直接在样式中使用
