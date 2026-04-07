# Uni-Sign 手语翻译 API 文档

## 基本信息

| 项目 | 内容 |
|------|------|
| 服务名称 | Uni-Sign 手语翻译 + EmoLLM 心理咨询服务 |
| 基础地址 | `https://u895901-9072-0273df24.westc.seetacloud.com:8443` |
| 协议 | HTTPS |
| 请求格式 | `multipart/form-data` (文件上传) |
| 响应格式 | JSON |

---

## API 端点

### 1. 健康检查

检查服务是否正常运行。

```
GET /health
```

**响应示例**:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "tts_available": true,
  "emollm_available": true
}
```

**状态说明**:
- `model_loaded: true` - 手语翻译模型已加载，可以正常翻译
- `model_loaded: false` - 模型未加载，服务不可用
- `tts_available: true` - 语音合成可用
- `emollm_available: true` - EmoLLM 心理咨询可用

---

### 2. 服务信息

获取服务基本信息。

```
GET /
```

**响应示例**:

```json
{
  "service": "Uni-Sign 手语翻译服务",
  "version": "2.0.0",
  "endpoints": [
    "/translate/video - 上传视频进行手语翻译",
    "/translate/image - 上传图片进行手语翻译",
    "/tts - 文本转语音",
    "/tts/voices - 获取音色列表"
  ]
}
```

---

## 3. 文本转语音 (TTS)

将文字转换为语音输出。

```
POST /tts
```

**请求参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 要合成的文本 |
| `voice` | string | 否 | 音色ID，如 2222, 3333 (默认: 2222) |
| `temperature` | float | 否 | 采样温度 0.1-1.0 (默认: 0.3) |
| `top_p` | float | 否 | top-p 采样 0.1-1.0 (默认: 0.7) |
| `top_k` | int | 否 | top-k 采样 1-100 (默认: 20) |
| `speed` | int | 否 | 语速 0-10 (默认: 5) |
| `skip_refine` | bool | 否 | 是否跳过文本优化 (默认: false) |

**请求示例**:

```bash
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/tts" \
  -F "text=你好，这是一个测试" \
  -F "voice=2222" \
  -F "speed=5"
```

**响应**: 直接返回 WAV 音频文件

**处理时间**: 约 2-10 秒（取决于文本长度）

---

## 4. 获取音色列表

获取可用的语音音色列表。

```
GET /tts/voices
```

**响应示例**:

```json
{
  "voices": [
    {"id": "2222", "name": "默认音色", "description": "温暖女声"},
    {"id": "3333", "name": "活泼音色", "description": "年轻女声"},
    {"id": "4444", "name": "沉稳音色", "description": "成熟男声"},
    {"id": "5555", "name": "清脆音色", "description": "清亮女声"},
    {"id": "6666", "name": "磁性音色", "description": "低沉男声"},
    {"id": "7777", "name": "温柔音色", "description": "柔和女声"},
    {"id": "8888", "name": "阳光音色", "description": "活力男声"},
    {"id": "9999", "name": "甜美音色", "description": "甜美女声"}
  ],
  "count": 8
}
```

---

## 5. 视频翻译

---

### 3. 视频翻译

上传视频文件进行手语翻译。

```
POST /translate/video
```

**请求参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 视频文件，支持 mp4, avi, mov, mkv 等格式 |

**请求示例**:

```bash
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/translate/video" \
  -F "file=@example.mp4"
```

**响应示例 - 成功**:

```json
{
  "success": true,
  "text": "吃药了吗?现在身体怎么样?",
  "message": "翻译成功"
}
```

**响应示例 - 失败**:

```json
{
  "success": false,
  "text": "",
  "message": "无法打开视频文件"
}
```

**处理时间**:
- 短视频 (< 10秒): 约 5-15 秒
- 中等视频 (10-30秒): 约 15-30 秒
- 长视频 (> 30秒): 约 30-60 秒或更长

---

### 4. 图片翻译

上传单张图片进行手语识别。

```
POST /translate/image
```

**请求参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 图片文件，支持 jpg, jpeg, png, bmp 等格式 |

**请求示例**:

```bash
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/translate/image" \
  -F "file=@example.jpg"
```

**响应示例 - 成功**:

```json
{
  "success": true,
  "text": "你。",
  "message": "翻译成功"
}
```

**响应示例 - 失败**:

```json
{
  "success": false,
  "text": "",
  "message": "不支持的文件格式: .gif"
}
```

**处理时间**: 约 2-5 秒

---

## 6. 心理咨询对话 (EmoLLM)

使用 EmoLLM 大模型进行心理咨询对话。

```
POST /chat
```

**请求参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `messages` | array | 是 | 对话历史，格式为 `[{"role": "user"/"assistant"/"system", "content": "..."}]` |
| `max_new_tokens` | int | 否 | 最大生成 token 数 (默认: 512) |
| `temperature` | float | 否 | 采样温度 0.1-1.0 (默认: 0.7) |
| `top_p` | float | 否 | top-p 采样 0.1-1.0 (默认: 0.9) |

**请求示例**:

```bash
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好，我最近感到很焦虑"}
    ],
    "max_new_tokens": 512,
    "temperature": 0.7
  }'
```

**响应示例 - 成功**:

```json
{
  "response": "你好，听起来你最近心情不太好...",
  "status": "ok"
}
```

**响应示例 - 失败**:

```json
{
  "response": "EmoLLM 引擎未初始化",
  "status": "error"
}
```

**处理时间**: 约 5-30 秒（取决于生成长度）

---

## 前端调用示例

### JavaScript (Fetch API)

#### 完整流程：视频翻译 + 语音播放

```javascript
const API_URL = 'https://u895901-9072-0273df24.westc.seetacloud.com:8443';

// 步骤1：上传视频进行手语翻译
async function translateVideo(videoFile) {
  const formData = new FormData();
  formData.append('file', videoFile);
  
  const response = await fetch(`${API_URL}/translate/video`, {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  return result;
}

// 步骤2：将翻译结果转为语音
async function textToSpeech(text, voice = '2222') {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('voice', voice);
  formData.append('speed', '5');
  
  const response = await fetch(`${API_URL}/tts`, {
    method: 'POST',
    body: formData,
  });
  
  // 获取音频 blob
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  return audioUrl;
}

// 完整流程：翻译并播放
async function translateAndPlay(videoFile) {
  try {
    // 1. 翻译视频
    const translateResult = await translateVideo(videoFile);
    
    if (!translateResult.success) {
      throw new Error(translateResult.message);
    }
    
    console.log('翻译结果:', translateResult.text);
    
    // 2. 合成语音
    const audioUrl = await textToSpeech(translateResult.text, '2222');
    
    // 3. 播放语音
    const audio = new Audio(audioUrl);
    audio.play();
    
    return {
      text: translateResult.text,
      audioUrl: audioUrl
    };
  } catch (error) {
    console.error('处理失败:', error);
    throw error;
  }
}

// 使用示例
document.getElementById('videoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const result = await translateAndPlay(file);
    document.getElementById('translationResult').textContent = result.text;
  }
});
```

#### 仅使用语音合成 (TTS)

```javascript
async function speakText(text, voice = '2222') {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('voice', voice);
  
  const response = await fetch(`${API_URL}/tts`, {
    method: 'POST',
    body: formData,
  });
  
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  
  const audio = new Audio(audioUrl);
  audio.play();
}

// 使用示例
speakText('你好，欢迎使用手语翻译服务', '2222');
```

#### EmoLLM 心理咨询对话

```javascript
async function chatWithEmoLLM(message, history = []) {
  const API_URL = 'https://u895901-9072-0273df24.westc.seetacloud.com:8443';

  const messages = [
    ...history,
    { role: 'user', content: message }
  ];

  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: messages,
      max_new_tokens: 512,
      temperature: 0.7,
      top_p: 0.9
    })
  });

  const result = await response.json();

  if (result.status === 'ok') {
    console.log('AI回复:', result.response);
    return result.response;
  } else {
    throw new Error(result.response);
  }
}

// 使用示例
chatWithEmoLLM('我最近感到很焦虑，怎么办？')
  .then(response => {
    console.log(response);
  })
  .catch(error => {
    console.error('对话失败:', error);
  });
```

#### 获取音色列表

```javascript
async function getVoices() {
  const response = await fetch(`${API_URL}/tts/voices`);
  const data = await response.json();
  
  // 渲染音色选择器
  const select = document.getElementById('voiceSelect');
  data.voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.id;
    option.textContent = `${voice.name} - ${voice.description}`;
    select.appendChild(option);
  });
}
```

#### 视频翻译

```javascript
async function translateVideo(videoFile) {
  const API_URL = 'https://u895901-9072-0273df24.westc.seetacloud.com:8443';
  
  const formData = new FormData();
  formData.append('file', videoFile);
  
  try {
    const response = await fetch(`${API_URL}/translate/video`, {
      method: 'POST',
      body: formData,
      // 注意: 不需要设置 Content-Type，浏览器会自动设置
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('翻译结果:', result.text);
      return result.text;
    } else {
      console.error('翻译失败:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('请求错误:', error);
    throw error;
  }
}

// 使用示例
const fileInput = document.getElementById('videoInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const text = await translateVideo(file);
    document.getElementById('result').textContent = text;
  }
});
```

#### 图片翻译

```javascript
async function translateImage(imageFile) {
  const API_URL = 'https://u895901-9072-0273df24.westc.seetacloud.com:8443';
  
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(`${API_URL}/translate/image`, {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  return result;
}

// 使用示例 - 拖拽上传
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const result = await translateImage(file);
    console.log(result.text);
  }
});
```

---

### Vue.js 示例

```vue
<template>
  <div class="translator">
    <input type="file" @change="handleFileChange" accept="video/*,image/*" />
    <button @click="upload" :disabled="!selectedFile || loading">
      {{ loading ? '翻译中...' : '开始翻译' }}
    </button>
    <div v-if="result" class="result">
      <h3>翻译结果:</h3>
      <p>{{ result }}</p>
    </div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedFile: null,
      loading: false,
      result: '',
      error: '',
      API_URL: 'https://u895901-9072-0273df24.westc.seetacloud.com:8443'
    };
  },
  methods: {
    handleFileChange(e) {
      this.selectedFile = e.target.files[0];
      this.result = '';
      this.error = '';
    },
    
    async upload() {
      if (!this.selectedFile) return;
      
      this.loading = true;
      this.error = '';
      
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      
      // 根据文件类型选择端点
      const isVideo = this.selectedFile.type.startsWith('video/');
      const endpoint = isVideo ? '/translate/video' : '/translate/image';
      
      try {
        const response = await fetch(`${this.API_URL}${endpoint}`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
          this.result = data.text;
        } else {
          this.error = data.message;
        }
      } catch (err) {
        this.error = '网络错误: ' + err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

### React 示例

```jsx
import React, { useState, useCallback } from 'react';

const API_URL = 'https://u895901-9072-0273df24.westc.seetacloud.com:8443';

function SignTranslator() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = useCallback((e) => {
    setFile(e.target.files[0]);
    setResult('');
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const isVideo = file.type.startsWith('video/');
    const endpoint = isVideo ? '/translate/video' : '/translate/image';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.text);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('请求失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange}
        accept="video/*,image/*"
      />
      <button onClick={handleSubmit} disabled={!file || loading}>
        {loading ? '翻译中...' : '翻译'}
      </button>
      
      {result && (
        <div className="result">
          <h3>翻译结果:</h3>
          <p>{result}</p>
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default SignTranslator;
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 422 | 文件格式不支持 |
| 500 | 服务器内部错误 |
| 504 | 处理超时（视频太长） |

### 常见错误

| 错误消息 | 原因 | 解决方案 |
|---------|------|---------|
| `不支持的文件格式: .xxx` | 文件扩展名不支持 | 使用 mp4/avi/mov 视频或 jpg/png 图片 |
| `无法打开视频: xxx` | 视频文件损坏或格式问题 | 检查视频文件是否能正常播放 |
| `视频为空` | 视频文件没有内容 | 检查视频文件 |
| `翻译器未初始化` | 模型未加载完成 | 等待服务启动完成 |
| `翻译失败: xxx` | 处理过程中出错 | 检查文件格式或联系管理员 |
| `语音合成引擎未初始化` | TTS 模型未加载 | 检查服务是否启用了 TTS |
| `文本不能为空` | TTS 请求缺少文本 | 提供 text 参数 |

---

## 注意事项

### 1. 文件大小限制

- **建议视频大小**: < 50MB
- **建议图片大小**: < 10MB
- **视频时长**: 建议 < 2分钟（长视频处理时间很长）

### 2. 支持的文件格式

**视频**:
- `.mp4` (推荐)
- `.avi`
- `.mov`
- `.mkv`
- `.flv`
- `.wmv`

**图片**:
- `.jpg`, `.jpeg` (推荐)
- `.png`
- `.bmp`
- `.tiff`
- `.webp`

### 3. 超时设置

**建议超时时间**:
- 健康检查: 5秒
- 图片翻译: 30秒
- 短视频 (<10秒): 60秒
- 中等视频 (10-30秒): 120秒
- 长视频 (>30秒): 300秒
- 文本转语音 (短文本 <50字): 30秒
- 文本转语音 (长文本 >100字): 60秒

### 4. CORS 说明

服务已配置 CORS，支持跨域访问。如需特定域名限制，请联系后端配置。

---

## 测试命令

```bash
# 1. 健康检查
curl https://u895901-9072-0273df24.westc.seetacloud.com:8443/health

# 2. 上传视频
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/translate/video" \
  -F "file=@video.mp4"

# 3. 上传图片
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/translate/image" \
  -F "file=@image.jpg"

# 4. 文本转语音 (保存为 output.wav)
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/tts" \
  -F "text=你好，这是一个语音合成测试" \
  -F "voice=2222" \
  --output output.wav

# 5. 获取音色列表
curl https://u895901-9072-0273df24.westc.seetacloud.com:8443/tts/voices

# 6. EmoLLM 心理咨询对话
curl -X POST "https://u895901-9072-0273df24.westc.seetacloud.com:8443/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "你好，我最近感到很焦虑"}],
    "max_new_tokens": 512,
    "temperature": 0.7
  }'
```

---

## PowerShell 调用示例

详见 `powershell_chat_examples.ps1` 文件，包含：
- 简单对话请求
- 多轮对话（带历史）
- 交互式对话模式
- 批量请求
- 健康检查

快速示例：
```powershell
$body = @{ 
    messages = @(@{ role = "user"; content = "你好，我最近很焦虑" })
    max_new_tokens = 512 
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://u895901-9072-0273df24.westc.seetacloud.com:8443/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

---

## 联系方式

如有问题请联系后端开发。

---

## 更新日志

- **2025-04-07**: 集成 EmoLLM 心理咨询对话功能
- **2025-04-07**: 添加 PowerShell 调用示例
- **2025-04-06**: 集成 ChatTTS 语音合成
- **2025-04-06**: 初始版本 - 手语翻译服务
