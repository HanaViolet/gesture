# AI对话功能访问控制接口

用于控制小程序端 AI对话助手（psychology 页面）的访问权限。小程序在点击入口时将请求此接口，根据返回状态决定是否允许进入页面。

---

## 接口概览

| 项目 | 内容 |
|------|------|
| 接口地址 | `GET /feature/ai-access` |
| Content-Type | `application/json` |
| 鉴权方式 | 可选（如需要用户级控制，可传 openid 或 token） |

---

## 请求参数

### Query 参数（可选）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| openid | string | 否 | 用户唯一标识，如需针对个别用户灰度开放则传入 |

### 请求示例

```http
GET /feature/ai-access?openid=xxxxxxxxxx HTTP/1.1
Host: api.example.com
```

---

## 响应参数

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | integer | 是 | 业务状态码，`0` 表示成功 |
| message | string | 是 | 提示文案，审核未通过时展示给用户 |
| data | object | 是 | 数据体 |
| data.enabled | boolean | 是 | `true` = 功能已开放，允许访问；`false` = 功能未开放 |
| data.reason | string | 否 | 未开放原因，可用于日志或扩展展示 |

---

## 响应示例

### 场景一：审核通过，功能已开放

```json
{
  "code": 0,
  "message": "功能已开放",
  "data": {
    "enabled": true
  }
}
```

前端行为：正常跳转到 `pages/psychology/psychology` 页面。

---

### 场景二：审核中，暂不开放

```json
{
  "code": 0,
  "message": "AI对话助手正在审核中，即将开放，敬请期待",
  "data": {
    "enabled": false,
    "reason": "under_review"
  }
}
```

前端行为：弹窗提示 `message` 内容，不跳转页面。

---

### 场景三：功能已关闭

```json
{
  "code": 0,
  "message": "该功能暂时下线维护中",
  "data": {
    "enabled": false,
    "reason": "maintenance"
  }
}
```

前端行为：弹窗提示 `message` 内容，不跳转页面。

---

## 业务状态码

| code | 含义 | 前端处理建议 |
|------|------|-------------|
| 0 | 请求成功 | 根据 `data.enabled` 判断 |
| 50001 | 接口异常 | 降级处理：允许访问（避免功能完全卡死） |
| 50002 | 参数错误 | 降级处理：允许访问 |

---

## 前端降级策略建议

1. **接口超时或网络错误**：允许用户进入页面，避免功能完全不可用。
2. **接口返回非 200**：同上，降级允许访问。
3. **请求时机**：点击入口时实时请求，可配合启动时预加载结果缓存，减少等待。

---

## 后端实现参考

最简单的方式：在数据库或配置中心维护一个开关。

```python
# 伪代码示例
@app.get("/feature/ai-access")
def check_ai_access(openid: str = None):
    # 从配置中心读取开关状态
    config = get_config("ai_psychology_enabled")

    if config.status == "enabled":
        return { "code": 0, "message": "功能已开放", "data": { "enabled": True } }

    if config.status == "under_review":
        return {
            "code": 0,
            "message": "AI对话助手正在审核中，即将开放，敬请期待",
            "data": { "enabled": False, "reason": "under_review" }
        }

    return {
        "code": 0,
        "message": "该功能暂时下线维护中",
        "data": { "enabled": False, "reason": "maintenance" }
    }
```

---

## 扩展建议（可选）

如需支持**灰度发布**（先让部分用户体验），可在后端根据 `openid` 做哈希分流：

```python
# 灰度：openid 哈希末位为 0-4 的用户先开放
if config.status == "gradual":
    hash_val = hash(openid) % 10
    enabled = hash_val < 5
    return { "code": 0, "message": "...", "data": { "enabled": enabled } }
```
