# 小程序审核模式适配指南

## 背景

微信小程序规定**个人开发者不能提供视频服务**。我们的手语翻译 API 默认返回 3D 手语视频，这在审核时会被拒绝。

**解决方案**：服务端提供"审核模式"，审核期间返回**静态图片**（第一帧截图），审核通过后再切换回**视频模式**。

---

## API 变化

### 1. 响应数据结构

任务完成后，`/status/{task_id}` 接口会返回 `output_type` 字段：

```json
{
  "task_id": "72aabfc5",
  "status": "completed",
  "output_video": "72aabfc5_sample0.png",  // 注意：可能是 .png 或 .mp4
  "output_type": "image",  // 新增字段："image" 或 "video"
  "text": "审核测试"
}
```

### 2. 文件类型对应

| 模式 | output_type | 文件后缀 | Content-Type |
|------|-------------|----------|--------------|
| 审核模式 | `image` | `.png` | `image/png` |
| 正常模式 | `video` | `.mp4` | `video/mp4` |

---

## 小程序端修改方案

### 方案一：根据 output_type 判断（推荐）

```javascript
// 查询任务状态
wx.request({
  url: 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443/status/' + taskId,
  success: (res) => {
    const task = res.data;
    
    if (task.status === 'completed') {
      // 根据 output_type 决定展示方式
      if (task.output_type === 'image') {
        // 审核模式：显示图片
        this.setData({
          resultType: 'image',
          resultUrl: 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443/video/' + taskId
        });
      } else {
        // 正常模式：显示视频
        this.setData({
          resultType: 'video',
          resultUrl: 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443/video/' + taskId
        });
      }
    }
  }
});
```

```html
<!-- WXML 模板 -->
<view wx:if="{{resultType === 'image'}}">
  <image src="{{resultUrl}}" mode="aspectFit" style="width: 100%; height: 512px;"/>
  <text class="tip">审核期间仅展示静态预览</text>
</view>

<view wx:if="{{resultType === 'video'}}">
  <video src="{{resultUrl}}" style="width: 100%; height: 512px;" controls/>
</view>
```

### 方案二：根据文件后缀判断

```javascript
// 从 output_video 字段提取后缀
const fileName = task.output_video;  // "xxx.png" 或 "xxx.mp4"
const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg');
const isVideo = fileName.endsWith('.mp4');

if (isImage) {
  // 显示图片
} else if (isVideo) {
  // 显示视频
}
```

---

## 完整示例代码

```javascript
Page({
  data: {
    taskId: null,
    status: 'pending',  // pending, processing, completed, failed
    progress: 0,
    resultType: null,   // 'image' | 'video' | null
    resultUrl: null,
    text: ''
  },

  // 提交任务
  submitTask(e) {
    const text = e.detail.value.text;
    
    wx.request({
      url: 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443/generate',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { text: text, num_samples: 1 },
      success: (res) => {
        const { task_id } = res.data;
        this.setData({ taskId: task_id, text: text });
        this.connectSSE(task_id);
      }
    });
  },

  // SSE 连接获取进度
  connectSSE(taskId) {
    const eventSource = new EventSource(
      'https://uu895901-9072-0273df24.westc.seetacloud.com:8443/progress/' + taskId
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.setData({ 
        status: data.status,
        progress: data.progress 
      });

      if (data.status === 'completed') {
        eventSource.close();
        this.loadResult(taskId);
      } else if (data.status === 'failed') {
        eventSource.close();
        wx.showToast({ title: '生成失败', icon: 'error' });
      }
    };
  },

  // 加载结果（关键修改部分）
  loadResult(taskId) {
    wx.request({
      url: 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443/status/' + taskId,
      success: (res) => {
        const task = res.data;
        const resultUrl = 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443/video/' + taskId;
        
        // 关键：根据 output_type 设置展示类型
        this.setData({
          status: 'completed',
          resultType: task.output_type || 'video',  // 兼容旧版本
          resultUrl: resultUrl
        });
      }
    });
  }
});
```

```html
<!-- pages/index/index.wxml -->
<view class="container">
  <!-- 输入区域 -->
  <input type="text" placeholder="输入要翻译的文字" bindinput="onInput"/>
  <button bindtap="submitTask">生成手语</button>

  <!-- 进度显示 -->
  <view wx:if="{{status === 'processing'}}">
    <progress percent="{{progress}}" show-info/>
    <text>生成中... {{progress}}%</text>
  </view>

  <!-- 结果显示 - 关键修改：支持图片和视频两种模式 -->
  <view wx:if="{{status === 'completed' && resultType}}" class="result">
    
    <!-- 审核模式：显示图片 -->
    <block wx:if="{{resultType === 'image'}}">
      <image src="{{resultUrl}}" mode="aspectFit" style="width: 100%; height: 512px;"/>
      <view class="audit-tip">
        <text>审核期间仅展示静态预览</text>
        <text>正式上线后将显示动态手语视频</text>
      </view>
    </block>

    <!-- 正常模式：显示视频 -->
    <block wx:if="{{resultType === 'video'}}">
      <video 
        src="{{resultUrl}}" 
        style="width: 100%; height: 512px;" 
        controls
        autoplay
        loop
      />
    </block>

  </view>
</view>
```

```css
/* pages/index/index.wxss */
.audit-tip {
  margin-top: 20px;
  padding: 15px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  text-align: center;
}

.audit-tip text {
  display: block;
  color: #d48806;
  font-size: 14px;
  margin: 5px 0;
}
```

---

## 审核流程建议

### 审核期间（提交审核前）

1. **服务端设置审核模式**：
   ```bash
   export AUDIT_MODE=true
   ./start_api.sh
   ```

2. **小程序体验**：
   - 提交文字 → 显示静态图片（第一帧截图）
   - 提示用户"审核期间仅展示静态预览"

3. **提交审核**：
   - 因为返回的是图片而非视频，符合个人开发者规范

### 审核通过后

1. **服务端切换正常模式**：
   ```bash
   export AUDIT_MODE=false
   # 或删除环境变量
   ./start_api.sh
   ```

2. **用户正常使用**：
   - 提交文字 → 显示动态 3D 手语视频

---

## 注意事项

1. **不要写死视频组件**：审核期间如果用 `<video>` 组件播放图片，会显示黑屏或错误
2. **保留提示信息**：审核模式下明确告知用户这是预览，避免误会
3. **测试两种模式**：开发时分别测试 `AUDIT_MODE=true` 和 `false` 的情况
4. **图片尺寸**：返回的图片是 512x512，和视频尺寸一致

---

## 测试检查清单

- [ ] 审核模式下能看到 3D 人物静态图片
- [ ] 正常模式下能看到 3D 手语动画视频
- [ ] 进度条 SSE 实时更新正常
- [ ] 下载/保存功能正常（图片/视频都能保存）
- [ ] 不同文字输入都能正确返回对应类型
