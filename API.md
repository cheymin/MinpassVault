# API 文档

## 概述

SecureVault 提供 RESTful API 接口，用于第三方应用集成和未来功能扩展。

## 基础信息

- **Base URL**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

目前 API 处于开发阶段，未来将支持以下认证方式：
- API Key
- OAuth 2.0
- JWT Token

## 端点

### 1. 健康检查

检查 API 服务状态。

**请求**
```
GET /api/health
```

**响应**
```json
{
  "status": "ok",
  "version": "1.3.0",
  "timestamp": "2026-03-28T00:00:00.000Z",
  "features": [
    "end-to-end-encryption",
    "two-factor-authentication",
    "vault-management",
    "password-generator",
    "import-export",
    "responsive-design"
  ]
}
```

### 2. 获取保险库项目

获取指定用户的所有保险库项目。

**请求**
```
GET /api/vault?userId={userId}
```

**参数**
- `userId` (string, required): 用户 ID

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "login",
      "name": "项目名称",
      "encrypted_data": "{\"username\":\"...\",\"password\":\"...\"}",
      "folder_id": "uuid",
      "favorite": false,
      "created_at": "2026-03-28T00:00:00.000Z",
      "updated_at": "2026-03-28T00:00:00.000Z"
    }
  ],
  "count": 10
}
```

### 3. 创建保险库项目

创建新的保险库项目。

**请求**
```
POST /api/vault
Content-Type: application/json

{
  "userId": "uuid",
  "type": "login",
  "name": "项目名称",
  "data": {
    "username": "用户名",
    "password": "密码",
    "url": "https://example.com",
    "notes": "备注"
  },
  "folderId": "uuid",
  "favorite": false
}
```

**参数**
- `userId` (string, required): 用户 ID
- `type` (string, required): 项目类型 (`login`, `secure_note`, `card`, `identity`)
- `name` (string, required): 项目名称
- `data` (object, required): 项目数据（将被加密存储）
- `folderId` (string, optional): 文件夹 ID
- `favorite` (boolean, optional): 是否收藏

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "login",
    "name": "项目名称",
    "encrypted_data": "{\"username\":\"...\",\"password\":\"...\"}",
    "folder_id": null,
    "favorite": false,
    "created_at": "2026-03-28T00:00:00.000Z",
    "updated_at": "2026-03-28T00:00:00.000Z"
  }
}
```

## 错误响应

所有错误响应都遵循以下格式：

```json
{
  "error": "错误描述"
}
```

### HTTP 状态码

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权（未来实现）
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 数据类型

### 项目类型 (type)

- `login`: 登录凭证
- `secure_note`: 安全笔记
- `card`: 银行卡
- `identity`: 身份信息

### 登录凭证数据结构

```json
{
  "username": "string",
  "password": "string",
  "url": "string",
  "notes": "string"
}
```

### 安全笔记数据结构

```json
{
  "content": "string"
}
```

### 银行卡数据结构

```json
{
  "cardholderName": "string",
  "cardNumber": "string",
  "expiryDate": "string",
  "cvv": "string",
  "notes": "string"
}
```

### 身份信息数据结构

```json
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "notes": "string"
}
```

## 安全性

- 所有敏感数据在存储前都会被加密
- API 使用 HTTPS 加密传输
- 支持两步验证（2FA）
- 实施速率限制（未来实现）

## 限制

- 当前 API 处于开发阶段
- 部分功能可能尚未完全实现
- 建议在生产环境使用前进行充分测试

## 未来计划

- [ ] API Key 认证
- [ ] OAuth 2.0 支持
- [ ] Webhook 通知
- [ ] 批量操作
- [ ] 搜索和过滤 API
- [ ] 文件夹管理 API
- [ ] 密码生成器 API
- [ ] 导入导出 API
- [ ] 速率限制
- [ ] 审计日志

## 示例代码

### JavaScript (Fetch)

```javascript
// 获取健康状态
fetch('/api/health')
  .then(response => response.json())
  .then(data => console.log(data));

// 获取保险库项目
fetch('/api/vault?userId=user-uuid')
  .then(response => response.json())
  .then(data => console.log(data));

// 创建新项目
fetch('/api/vault', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    type: 'login',
    name: '示例网站',
    data: {
      username: 'user@example.com',
      password: 'password123',
      url: 'https://example.com',
      notes: '示例备注'
    },
    favorite: false
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### Python (Requests)

```python
import requests

# 获取健康状态
response = requests.get('http://localhost:3000/api/health')
print(response.json())

# 获取保险库项目
response = requests.get(
    'http://localhost:3000/api/vault',
    params={'userId': 'user-uuid'}
)
print(response.json())

# 创建新项目
response = requests.post(
    'http://localhost:3000/api/vault',
    json={
        'userId': 'user-uuid',
        'type': 'login',
        'name': '示例网站',
        'data': {
            'username': 'user@example.com',
            'password': 'password123',
            'url': 'https://example.com',
            'notes': '示例备注'
        },
        'favorite': False
    }
)
print(response.json())
```

## 支持

如有问题或建议，请访问 [GitHub Issues](https://github.com/djklmin/passowrduser/issues)。