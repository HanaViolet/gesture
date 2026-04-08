# SOKE Sign Language API 文档

SOKE 手语翻译 API - 支持文本到 3D 手语视频的生成。

## 基础信息

- **本地 Base URL**: `http://localhost:6008`
- **公网 Base URL**: `https://uu895901-9072-0273df24.westc.seetacloud.com:8443`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

### 访问方式

| 环境 | 地址 |
|------|------|
| 本地开发 | `http://localhost:6008` |
| 生产环境 | `https://uu895901-9072-0273df24.westc.seetacloud.com:8443` |

## API 端点一览

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/` | 服务状态 |
| POST | `/generate` | 提交生成任务 |
| GET | `/status/{task_id}` | 查询任务状态 |
| GET | `/progress/{task_id}` | SSE 实时进度流 |
| GET | `/video/{task_id}` | 下载生成的视频 |
| GET | `/tasks` | 列出最近任务 |

---

## 1. 服务状态

检查 API 服务是否正常运行，以及模型是否已加载。

```http
GET /
```

### 响应示例

```json
{
    "name": "SOKE Sign Language API",
    "version": "1.0.0",
    "model_loaded": true,
    "endpoints": {
        "POST /generate": "Submit text to generate sign language video",
        "GET /status/{task_id}": "Check task status",
        "GET /video/{task_id}": "Download generated video",
        "GET /tasks": "List recent tasks",
        "GET /progress/{task_id}": "SSE real-time progress stream"
    }
}
```

---

## 2. 提交生成任务

提交文本，创建一个新的手语视频生成任务。

```http
POST /generate
Content-Type: application/json
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 要翻译的中文文本 |
| num_samples | int | 否 | 生成样本数量（默认 1） |

### 请求示例

```json
{
    "text": "我爱计算机设计大赛",
    "num_samples": 1
}
```

### 响应示例

```json
{
    "task_id": "c571ee5a",
    "status": "pending",
    "message": "Task submitted successfully. Use /status/{task_id} to check progress."
}
```

### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务唯一标识符 |
| status | string | 任务状态（pending/processing/completed/failed） |
| message | string | 提示信息 |

---

## 3. 查询任务状态

查询指定任务的当前状态和结果。

```http
GET /status/{task_id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务 ID（由 `/generate` 返回） |

### 响应示例 - 处理中

```json
{
    "task_id": "c571ee5a",
    "status": "processing",
    "created_at": "2026-04-06T21:16:31.421851",
    "completed_at": null,
    "text": "测试实时进度",
    "output_video": null,
    "error_message": null
}
```

### 响应示例 - 已完成

```json
{
    "task_id": "c571ee5a",
    "status": "completed",
    "created_at": "2026-04-06T21:16:31.421851",
    "completed_at": "2026-04-06T21:17:23.842140",
    "text": "测试实时进度",
    "output_video": "c571ee5a_sample0.mp4",
    "error_message": null
}
```

### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务 ID |
| status | string | 任务状态 |
| created_at | string | 创建时间（ISO 8601） |
| completed_at | string | 完成时间（ISO 8601），未完成时为 null |
| text | string | 输入的文本 |
| output_video | string | 输出视频文件名，未完成时为 null |
| error_message | string | 错误信息，无错误时为 null |

### 状态说明

| 状态 | 说明 |
|------|------|
| pending | 等待处理 |
| processing | 正在生成 |
| completed | 生成完成 |
| failed | 生成失败 |

---

## 4. SSE 实时进度流

使用 Server-Sent Events (SSE) 实时获取任务进度，比轮询更高效。

```http
GET /progress/{task_id}
Content-Type: text/event-stream
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务 ID |

### SSE 数据格式

```
data: {"task_id": "c571ee5a", "status": "processing", "progress": 50, "text": "测试实时进度", "message": "生成中... 50%"}
```

### 数据字段

| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务 ID |
| status | string | 当前状态 |
| progress | int | 进度百分比（0-100） |
| text | string | 输入文本 |
| message | string | 中文状态描述 |

### 前端使用示例

```javascript
const eventSource = new EventSource(`http://localhost:6008/progress/${taskId}`);

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(`${data.progress}%`, data.message);
    
    // 更新进度条
    progressBar.style.width = `${data.progress}%`;
    progressText.textContent = data.message;
    
    // 完成或失败时关闭连接
    if (data.status === 'completed' || data.status === 'failed') {
        eventSource.close();
        if (data.status === 'completed') {
            // 下载视频
            window.open(`http://localhost:6008/video/${taskId}`);
        }
    }
};

eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
};
```

---

## 5. 下载视频

下载生成的手语视频文件（MP4 格式）。

```http
GET /video/{task_id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sample | int | 否 | 样本索引（默认 0） |

### 响应

- **成功**: 返回 `video/mp4` 文件
- **Content-Disposition**: `attachment; filename="sign_language_{task_id}_sample{sample}.mp4"`

### 示例

```bash
curl -o video.mp4 http://localhost:6008/video/c571ee5a
```

### 视频规格

| 属性 | 值 |
|------|-----|
| 分辨率 | 512x512 |
| 帧率 | 18 fps |
| 编码 | H.264 |
| 背景色 | 浅灰蓝色 (RGB: 199, 209, 229) |
| 人物颜色 | 深蓝色 |
| 字幕 | 底部居中，白色文字 |

---

## 6. 列出最近任务

列出最近提交的任务列表。

```http
GET /tasks?limit=10
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | int | 否 | 返回数量上限（默认 10，最大 100） |

### 响应示例

```json
{
    "tasks": [
        {
            "task_id": "c571ee5a",
            "status": "completed",
            "created_at": "2026-04-06T21:16:31.421851",
            "text": "测试实时进度"
        }
    ]
}
```

---

## 完整前端调用流程

### 本地开发

```javascript
const API_BASE = 'http://localhost:6008';

// 1. 提交任务
const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: "你好世界", num_samples: 1 })
});
const { task_id } = await response.json();

// 2. 使用 SSE 监听进度
const eventSource = new EventSource(`${API_BASE}/progress/${task_id}`);
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(`${data.progress}% - ${data.message}`);
    
    if (data.status === 'completed') {
        eventSource.close();
        // 3. 下载视频
        window.open(`${API_BASE}/video/${task_id}`);
    } else if (data.status === 'failed') {
        eventSource.close();
        alert('生成失败: ' + data.message);
    }
};
```

### 生产环境（公网）

```javascript
const API_BASE = 'https://uu895901-9072-0273df24.westc.seetacloud.com:8443';

// 同上，只需替换 API_BASE
const response = await fetch(`${API_BASE}/generate`, {...});
const eventSource = new EventSource(`${API_BASE}/progress/${task_id}`);
// ...
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 任务不存在 |
| 503 | 模型未加载 |

### 错误响应示例

```json
{
    "detail": "Task not found"
}
```

---

## 性能指标

| 指标 | 典型值 |
|------|--------|
| 任务创建延迟 | < 100ms |
| 视频生成时间 | 10-20 秒（取决于文本长度） |
| 视频时长 | 约 10 秒 |
| 视频文件大小 | 13-20 KB |

---

## 注意事项

1. **文本长度**: 建议输入 1-20 个中文字符，过长文本可能导致生成时间增加
2. **并发**: 当前版本单线程处理，建议前端控制提交频率
3. **存储**: 生成的视频保存在 `api/outputs/` 目录，定期清理避免磁盘满
4. **内存**: 首次加载模型需要约 10GB GPU 内存

---

## 更新日志

### v1.0.0
- 基础文本到手语视频生成
- 支持 SSE 实时进度推送
- 中文字幕显示
- 自定义视频样式（背景色、人物颜色）
