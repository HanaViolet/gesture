# 心语者小程序全局样式系统使用指南

## 概述

心语者小程序采用了一套完整的设计系统，支持无障碍访问、听障模式、高对比度模式和减少动画等特性。

## 核心特性

### 1. CSS变量系统

所有样式通过CSS变量管理，便于动态调整：

```css
/* 字体 */
--font-body: 30rpx;
--font-display: 36rpx;
--font-caption: 24rpx;
--font-deaf-body: 34rpx;
--font-deaf-display: 40rpx;

/* 颜色 */
--text-primary: #1A1A1A;
--text-secondary: #5A5A5A;
--bg-primary: #FAFBFC;
--bg-secondary: #F0F2F5;
--brand: #5B7BA3;

/* 间距 */
--space-1: 8rpx;
--space-2: 16rpx;
--space-3: 24rpx;
--space-4: 32rpx;
--space-5: 48rpx;
--space-6: 64rpx;

/* 圆角 */
--radius-sm: 8rpx;
--radius: 16rpx;
--radius-lg: 24rpx;
--radius-xl: 32rpx;

/* 动画 */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
```

### 2. 特殊模式

#### 听障模式 (mode-deaf)

为听力障碍用户优化的样式：
- 增大字体（正文34rpx，标题40rpx）
- 宽松行高（1.8）
- 增大按钮点击区域（最小96rpx）
- 增大图标尺寸
- 卡片内边距增大

**启用方式：**
```javascript
settingsManager.set('mode', 'deaf')
```

#### 高对比度模式 (high-contrast)

增强视觉对比度：
- 文字纯黑 (#000000)
- 背景纯白 (#FFFFFF)
- 品牌色加深 (#0044AA)
- 强调色使用橙色 (#FF6600)
- 所有卡片添加黑色边框

**启用方式：**
```javascript
settingsManager.set('highContrast', true)
```

#### 减少动画模式 (reduce-motion)

关闭动画效果：
- 所有动画时长设为0.01ms
- 过渡效果禁用
- 滚动行为设为auto

**启用方式：**
```javascript
settingsManager.set('reduceMotion', true)
```

## 工具类使用

### 文字类

```html
<text class="text-display">标题文字</text>
<text class="text-body">正文内容</text>
<text class="text-caption">辅助说明</text>
<text class="text-deaf-display">听障模式大标题</text>
<text class="text-deaf-body">听障模式正文</text>
```

### 布局类

```html
<!-- 弹性布局 -->
<view class="flex-center">水平垂直居中</view>
<view class="flex-between">两端对齐</view>
<view class="flex-around">均匀分布</view>
<view class="flex-col">纵向排列</view>

<!-- 间距 -->
<view class="m-2">16rpx外边距</view>
<view class="p-3">24rpx内边距</view>
<view class="mt-4">32rpx上外边距</view>
<view class="px-2">水平方向16rpx内边距</view>
```

### 组件类

```html
<!-- 卡片 -->
<view class="card">基础卡片</view>
<view class="card-shadow">阴影卡片</view>
<view class="glass">玻璃拟态效果</view>

<!-- 按钮 -->
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>
<button class="btn btn-text">文字按钮</button>
<button class="btn btn-deaf">听障模式大按钮</button>

<!-- 输入框 -->
<input class="input-minimal" placeholder="最小化输入框" />
<input class="input-deaf" placeholder="听障模式大输入框" />
```

## 在页面中使用

### 基础用法

页面会自动应用全局样式类，无需额外操作。

### 监听设置变化

```javascript
const app = getApp()

Page({
  onLoad() {
    // 订阅设置变更
    app.onSettingsChange((settings) => {
      console.log('设置已更新:', settings)
      // 重新渲染页面
    })
  }
})
```

### 在WXML中使用

```html
<view class="page-full {{_pageClasses}}">
  <!-- 页面内容 -->
</view>
```

## 响应式布局

### 网格系统

```html
<!-- 两列网格 -->
<view class="grid">
  <view class="grid-item">项目1</view>
  <view class="grid-item">项目2</view>
  <view class="grid-item">项目3</view>
  <view class="grid-item">项目4</view>
</view>

<!-- 三列网格 -->
<view class="grid-3">
  <view class="grid-item">项目1</view>
  <view class="grid-item">项目2</view>
  <view class="grid-item">项目3</view>
</view>
```

### 字体放大适配

当用户开启系统字体放大（150%或200%）时：
- 网格自动变为单列布局
- 卡片内边距自动增大
- 字体大小使用CSS变量动态调整

## 最佳实践

### 1. 使用CSS变量

```css
/* 推荐 */
.my-component {
  padding: var(--space-3);
  font-size: var(--font-body);
  color: var(--text-primary);
}

/* 不推荐 */
.my-component {
  padding: 24rpx;
  font-size: 30rpx;
  color: #1A1A1A;
}
```

### 2. 支持听障模式

```css
.my-button {
  min-height: 88rpx;
  padding: var(--space-3);
}

/* 听障模式自动适配 */
page.mode-deaf .my-button {
  min-height: 96rpx;
  font-size: var(--font-deaf-body);
}
```

### 3. 无障碍考虑

- 所有交互元素最小点击区域88rpx
- 提供高对比度模式支持
- 支持减少动画偏好
- 使用语义化标签

### 4. 性能优化

- 使用CSS变量减少重复代码
- 利用小程序rpx单位自动适配屏幕
- 避免过深的嵌套选择器
- 动画使用transform和opacity

## 调试工具

访问 `/pages/accessibility-demo/accessibility-demo` 页面可以：
- 实时切换听障模式
- 开启/关闭高对比度
- 开启/关闭减少动画
- 调整字体大小
- 预览效果

## 示例代码

### 完整页面示例

```javascript
// pages/example/example.js
const app = getApp()

Page({
  data: {
    _pageClasses: ''
  },

  onLoad() {
    // 应用全局样式
    this.setData({
      _pageClasses: app.getPageClasses()
    })

    // 监听设置变化
    app.onSettingsChange((settings) => {
      this.setData({
        _pageClasses: app.getPageClasses()
      })
    })
  }
})
```

```html
<!-- pages/example/example.wxml -->
<view class="page-full {{_pageClasses}}">
  <view class="page-header">
    <text class="text-display">页面标题</text>
    <text class="text-caption">页面描述</text>
  </view>

  <view class="card">
    <text class="text-body">卡片内容</text>
    <button class="btn btn-primary mt-3">操作按钮</button>
  </view>
</view>
```

```css
/* pages/example/example.wxss */
.page-header {
  text-align: center;
  margin-bottom: var(--space-4);
}

.card {
  background: var(--bg-elevated);
}
```

## 注意事项

1. **CSS变量兼容性**：小程序基础库2.11.0+完全支持CSS变量
2. **rpx单位**：设计稿750px宽度为基准，1rpx = 1px
3. **样式优先级**：page选择器定义的变量优先级最高
4. **动态切换**：模式切换通过更新page元素的class实现
5. **性能**：避免在频繁更新的组件中使用复杂的选择器

## 更新日志

### v1.0.0
- 初始版本发布
- 支持听障模式、高对比度、减少动画
- 完整的CSS变量系统
- 响应式网格布局
