# 心理健康AI对话页面 - 集成文档

## 项目概述

已成功创建面向聋哑用户的AI心理健康对话界面，这是一个以"视频手语输入 + AI对话反馈"为核心的无障碍交互系统。

## 已完成的工作

### 1. 页面文件创建
- ✅ `pages/psychology/psychology.wxml` - 页面结构
- ✅ `pages/psychology/psychology.wxss` - 页面样式
- ✅ `pages/psychology/psychology.js` - 页面逻辑
- ✅ `pages/psychology/psychology.json` - 页面配置

### 2. 组件创建
- ✅ `components/psychology-entry/` - 心理健康入口卡片组件
  - psychology-entry.wxml
  - psychology-entry.wxss
  - psychology-entry.js
  - psychology-entry.json

### 3. 配置更新
- ✅ 在 `app.json` 中注册新页面路由
- ✅ 在 `app.json` 中注册全局组件
- ✅ 在 `utils/api.js` 中添加心理健康相关API端点

## 页面功能特性

### 核心功能区域

#### 1. 顶部安全提示区 (8%高度)
- 显示"你正在与心理健康助手沟通"
- 辅助信息"你的对话是安全且私密的"
- 使用温暖配色和盾牌图标

#### 2. 对话区 (45%高度)
- 类似聊天应用的消息气泡设计
- 用户消息：蓝色气泡
- AI消息：暖灰色气泡，带手语和语音按钮
- 支持滚动查看历史对话
- AI输入中动画效果

#### 3. 视频手语输入区 (30%高度)
- 前置摄像头实时预览
- 状态提示覆盖层
- 识别结果实时显示
- 圆角卡片设计

#### 4. 输入控制区 (17%高度)
- 默认状态：单个"开始手语输入"按钮
- 展开状态：三种输入方式
  - 🎥 手语输入
  - ⌨️ 文字输入
  - 🎤 语音输入

### 交互功能

#### 手语视频播放浮层
- 点击AI消息的🤟按钮触发
- 居中浮层显示手语Avatar视频
- 半透明背景，不影响原对话
- 支持关闭和重播

#### 多模态输入支持
- 手语识别：视频 → 文本
- 语音识别：语音 → 文本
- 文字输入：直接输入

#### AI对话功能
- 发送消息到心理健康模型
- 接收AI回复
- 对话历史保存
- 支持清空对话

## 设计特点

### 视觉风格
- 温暖、克制、医疗级信任感
- 主色调：浅蓝（信任）+ 米色（温暖）+ 柔和橙（强调）
- 所有组件采用圆角设计（16-24rpx）
- 平滑动画过渡

### 无障碍设计
- 大尺寸按钮（≥64rpx高度）
- 图标 + 文字双重表达
- 清晰的状态反馈
- 触觉反馈支持

## API接口说明

### 新增的API端点（在 utils/api.js）

```javascript
// 心理健康AI对话
PSYCHOLOGY_CHAT: '/psychology/chat'
PSYCHOLOGY_HISTORY: '/psychology/history'

// 手语视频生成（文本转手语）
TEXT_TO_SIGN: '/text-to-sign/generate'
TEXT_TO_SIGN_STATUS: '/text-to-sign/status'

// 手语识别（视频转文本）
SIGN_TO_TEXT: '/sign-to-text/recognize'
SIGN_TO_TEXT_STATUS: '/sign-to-text/status'
```

## 后端集成指南

### 需要实现的后端接口

#### 1. 心理健康对话接口
```
POST /psychology/chat
请求体：
{
  "message": "用户消息",
  "history": [...] // 对话历史
}

响应：
{
  "response": "AI回复",
  "status": 200
}
```

#### 2. 文本转手语视频接口
```
POST /text-to-sign/generate
请求体：
{
  "text": "要转换的文本"
}

响应：
{
  "videoUrl": "手语视频URL",
  "taskId": "任务ID",
  "status": 200
}
```

#### 3. 手语识别接口
```
POST /sign-to-text/recognize
请求体：
{
  "videoPath": "视频临时路径"
}

响应：
{
  "text": "识别的文本",
  "confidence": 0.95,
  "status": 200
}
```

### 与EmoLLM集成

#### 方案1：直接调用FastAPI
使用 `EmoLLM/deploy/api-file.py` 提供的接口：

```python
# 启动服务
python EmoLLM/deploy/api-file.py

# 接口地址：http://127.0.0.1:6006
```

#### 方案2：封装中间层
创建一个中间API服务，封装EmoLLM调用：

```javascript
// 小程序端调用
wx.request({
  url: API_BASE + ENDPOINTS.PSYCHOLOGY_CHAT,
  method: 'POST',
  data: {
    message: userMessage,
    history: chatHistory
  },
  success: (res) => {
    // 处理AI回复
  }
})
```

## 使用方法

### 在主页添加入口

在 `pages/home/home.wxml` 中添加：

```xml
<!-- 在合适的位置插入 -->
<psychology-entry />
```

或者直接导航：

```javascript
wx.navigateTo({
  url: '/pages/psychology/psychology'
})
```

## 下一步工作

### 必须完成
1. 部署EmoLLM后端服务
2. 配置HTTPS域名（微信小程序要求）
3. 实现手语识别API集成
4. 实现文本转手语视频API集成
5. 测试完整对话流程

### 可选优化
1. 添加对话导出功能
2. 支持情绪分析可视化
3. 添加心理健康资源推荐
4. 实现对话分类和标签
5. 添加紧急求助功能

## 技术栈

- 微信小程序框架
- Camera API（手语输入）
- RecorderManager API（语音输入）
- InnerAudioContext API（语音播放）
- Storage API（对话历史）

## 注意事项

1. **权限申请**：需要申请摄像头、录音、网络访问权限
2. **HTTPS要求**：所有API必须使用HTTPS
3. **视频大小限制**：注意视频文件大小，建议压缩后上传
4. **隐私保护**：对话数据需要加密存储
5. **性能优化**：长对话需要分页加载

## 文件结构

```
gesture/
├── pages/
│   └── psychology/
│       ├── psychology.wxml    # 页面结构
│       ├── psychology.wxss    # 页面样式
│       ├── psychology.js      # 页面逻辑
│       └── psychology.json    # 页面配置
├── components/
│   └── psychology-entry/
│       ├── psychology-entry.wxml
│       ├── psychology-entry.wxss
│       ├── psychology-entry.js
│       └── psychology-entry.json
├── utils/
│   └── api.js                 # API配置（已更新）
└── app.json                   # 全局配置（已更新）
```

## 联系与支持

如有问题，请查看：
- 微信小程序官方文档
- EmoLLM项目文档
- 项目issue tracker
