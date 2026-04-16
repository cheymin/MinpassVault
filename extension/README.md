# SecureVault 浏览器扩展

安全的密码管理器和两步验证器浏览器扩展，支持 WebDAV 同步。

## 功能

- 🔐 **密码管理** - 安全存储和管理密码
- 📱 **两步验证** - TOTP 验证码生成器
- ☁️ **WebDAV 同步** - 支持 WebDAV 自动同步
- 🔒 **密码保护** - 扩展独立密码保护，默认 `admin`

## 安装

### Chrome / Edge

1. 下载 `securevault-extension.zip`
2. 解压到文件夹
3. 打开 `chrome://extensions/` (或 `edge://extensions/`)
4. 启用"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压的文件夹

### Firefox

1. 下载 `securevault-extension.zip`
2. 打开 `about:debugging#/runtime/this-firefox`
3. 点击"临时载入附加组件"
4. 选择 zip 文件

## 使用

### 首次使用

1. 点击扩展图标
2. 输入默认密码 `admin`
3. 点击设置修改密码

### 添加两步验证

1. 打开扩展设置
2. 在"两步验证器"部分输入名称和密钥
3. 点击"添加"

### WebDAV 同步

1. 打开扩展设置
2. 填写 WebDAV 地址、用户名、密码
3. 点击"测试连接"验证
4. 启用"自动同步"或手动点击"立即同步"

## 构建

```bash
cd extension
node build.js
```

构建产物在 `dist/` 文件夹中。

## 图标

需要准备以下尺寸的 PNG 图标：
- `icons/icon16.png` (16x16)
- `icons/icon32.png` (32x32)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

## 安全

- 所有数据存储在本地浏览器存储中
- 扩展密码使用哈希存储
- WebDAV 使用 Basic 认证
- 建议配合 HTTPS 使用

## 许可证

MIT License
