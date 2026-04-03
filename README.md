# SecureVault 🔐

一个安全、开源的端到端加密密码管理器。

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## ✨ 功能特性

### 核心功能
- 🔒 **端到端加密** - AES-256-CBC + PBKDF2 密钥派生
- 🔑 **零知识架构** - 服务器无法访问明文数据
- 🛡️ **二次验证 (2FA)** - TOTP 时间基验证码
- 📦 **多类型支持** - 登录凭证、安全笔记、银行卡、身份信息
- 📁 **文件夹分类** - 自定义组织管理
- ⭐ **收藏功能** - 快速访问常用项目
- 🔧 **密码生成器** - 可自定义长度和字符类型
- 📤 **数据导出** - JSON 和 CSV 格式导出
- 📥 **数据导入** - CSV 格式导入，支持浏览器密码管理器
- ✏️ **编辑功能** - 支持编辑所有类型的密码项目
- 🔐 **登录保护** - 5次失败后锁定15分钟
- ⏰ **会话管理** - 15分钟登录时效，增强安全性

### 新增功能 (v2.3)
- 📱 **响应式设计** - 完美适配移动设备，支持各种屏幕尺寸
- 🎨 **UI 全面美化** - 渐变背景、发光效果、动画过渡、现代化设计
- 🎨 **Font Awesome 图标** - 使用专业图标库替换 emoji，提升视觉一致性
- 📱 **手机端汉堡菜单** - 移动端添加三横线菜单，访问所有功能
- � **邮件功能** - 支持 SMTP 和 Resend 两种邮件服务，用于密码重置
- 🔑 **忘记密码** - 用户可以通过邮箱重置密码
- ⚙️ **可视化配置** - 所有配置在界面中完成，无需配置环境变量
- 🔔 **提示弹窗系统** - 操作成功/失败时显示美观的通知提示

### 个性化设置
- ⚙️ **网站标题** - 自定义网站标题
- 🖼️ **网站图标** - 自定义网站图标
- 🔄 **初始化系统** - 首次使用自动创建管理员账户
- 📊 **数据管理** - 支持重置数据库

**注意！本项目为学生项目，如果有漏洞可能无法及时更新**

## 📸 预览

![image.png](https://djkl.qzz.io/file/music/1772872359702_image.png)
![image.png](https://djkl.qzz.io/file/music/1772872351071_image.png)

## 🚀 快速开始

### 方式 1：一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdjklmin%2Fpassword)

点击上方按钮，将项目克隆到你的 GitHub 并部署到 Vercel。

### 方式 2：一键部署到 Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/djklmin/password)

点击上方按钮，将项目克隆到你的 GitHub 并部署到 Netlify。

**Netlify 部署配置**：

1. 点击部署按钮后，Netlify 会自动导入项目
2. 在构建设置中配置：
   - **构建命令**: `npm run build`
   - **发布目录**: `.next`
   - **Node 版本**: `18` 或更高
3. 在环境变量中添加：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase anon key
4. 点击"部署站点"开始部署

### 方式 3：本地开发

```bash
# 克隆项目
git clone https://github.com/djklmin/password.git
cd password

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env.local

# 配置环境变量（见下方说明）
# 编辑 .env.local 文件

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 即可查看。

## ⚙️ 配置说明

### 环境变量配置

在 `.env.local` 文件中配置以下变量：

```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**注意**：SMTP 和 Resend 邮件配置可在设置页面中直接配置，无需设置环境变量。

### 数据库配置

#### 首次使用（推荐）

首次访问网站时，系统会自动引导你：
1. 创建管理员账户
2. 可选择配置自己的 Supabase 数据库
3. 完成初始化

#### 手动配置数据库

如果你有自己的 Supabase 项目，执行以下 SQL：

```sql
-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  encrypted_master_key TEXT NOT NULL,
  salt VARCHAR(255) NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  site_title VARCHAR(255) DEFAULT 'SecureVault密码管理器',
  site_icon TEXT DEFAULT 'https://djkl.qzz.io/file/1.webp',
  email VARCHAR(255),
  verification_code VARCHAR(10),
  verification_expires_at TIMESTAMP WITH TIME ZONE,
  reset_token VARCHAR(50),
  reset_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 vault_items 表
CREATE TABLE IF NOT EXISTS vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('login', 'secure_note', 'card', 'identity')),
  name VARCHAR(255) NOT NULL,
  encrypted_data TEXT NOT NULL,
  folder_id UUID,
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 folders 表
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_folder_id ON vault_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- 启用行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Enable all for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for vault_items" ON vault_items FOR ALL USING (true);
CREATE POLICY "Enable all for folders" ON folders FOR ALL USING (true);

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 邮件配置（可选）

在设置页面中配置邮件服务，支持两种方式：

#### 方式 1：SMTP 配置

1. 进入设置页面
2. 点击"配置邮件服务"
3. 选择"SMTP"类型
4. 填写以下信息：
   - SMTP 服务器（如：smtp.gmail.com）
   - 端口（如：587）
   - 是否使用 SSL/TLS
   - 用户名（邮箱地址）
   - 密码（邮箱密码或应用专用密码）
   - 发件人地址

**Gmail 用户注意**：
- 需要开启两步验证
- 生成应用专用密码（不是登录密码）

#### 方式 2：Resend 配置（推荐）

[Resend](https://resend.com) 是一个现代化的邮件 API 服务，配置更简单：

1. 注册 [Resend](https://resend.com) 账号
2. 获取 API Key
3. 进入设置页面
4. 点击"配置邮件服务"
5. 选择"Resend"类型
6. 填写 API Key 和发件人地址

**Resend 优势**：
- 免费额度充足（每月 3000 封）
- 配置简单，无需 SMTP 服务器
- 发送成功率高

## 🔐 安全架构

```
用户密码 → PBKDF2 (100,000次迭代) → 派生密钥
                ↓
         AES-256-CBC 加密
                ↓
    加密数据存储到 Supabase (服务器无法解密)
```

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS |
| 后端 | Supabase (PostgreSQL) |
| 加密 | CryptoJS (AES-256-CBC) |
| 图标 | Font Awesome |
| 邮件 | Nodemailer |
| 部署 | Vercel |

## 🎯 使用说明

### 首次使用

1. 访问部署后的网站
2. 系统会自动检测是否为首次使用
3. 创建管理员账户（用户名和主密码）
4. 可选择配置自己的数据库
5. 完成初始化后进入主界面

### 主要功能

| 功能 | 说明 |
|------|------|
| 密码管理 | 添加、编辑、删除各类密码项目 |
| 文件夹管理 | 创建文件夹分类管理密码 |
| 导入导出 | 支持 JSON 和 CSV 格式的数据导入导出 |
| 设置中心 | 修改密码、重置数据库、个性化设置、SMTP 配置 |
| 忘记密码 | 通过邮箱重置密码（需配置 SMTP） |

## 📄 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本历史和更新内容。

## ⚠️ 注意事项

- 请妥善保管主密码，系统采用零知识架构，无法重置主密码
- 重置数据库将删除所有数据，请谨慎操作
- 建议定期导出数据备份
- 本项目为学生项目，如果有漏洞可能无法及时更新
- SMTP 邮件功能为可选配置，不配置不影响基本功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

本项目仅供个人使用，禁止商业用途。

---

⭐ **如果这个项目对你有帮助，请给一个 Star！**

©2026 Designed by [min](https://github.com/djklmin) for you!