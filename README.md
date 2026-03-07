# SecureVault 🔐

一个安全、开源的端到端加密密码管理器。

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-2.45-3ECF8E?style=flat-square&logo=supabase)

## ✨ 功能特性

- 🔒 **端到端加密** - AES-256-CBC + PBKDF2 密钥派生
- 🔑 **零知识架构** - 服务器无法访问明文数据
- 🛡️ **二次验证 (2FA)** - TOTP 时间基验证码
- 📦 **多类型支持** - 登录凭证、安全笔记、银行卡、身份信息
- 📁 **文件夹分类** - 自定义组织管理
- ⭐ **收藏功能** - 快速访问常用项目
- 🔧 **密码生成器** - 可自定义长度和字符类型
- 📤 **数据导入/导出** - JSON 格式备份与迁移

## 🚀 部署到 Vercel

### 步骤 1：一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/djklmin/password)

点击上方按钮，将项目克隆到你的 GitHub 并部署到 Vercel。

### 步骤 2：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 注册并创建新项目
2. 进入 **SQL Editor**，执行以下 SQL：

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_master_key TEXT NOT NULL,
  salt VARCHAR(255) NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for vault_items" ON vault_items FOR ALL USING (true);
CREATE POLICY "Enable all for folders" ON folders FOR ALL USING (true);
```

### 步骤 3：配置环境变量

1. 在 Supabase 控制台，进入 **Settings** → **API**
2. 复制 **Project URL** 和 **anon public** key
3. 在 Vercel 项目中，进入 **Settings** → **Environment Variables**
4. 添加以下变量：


| 变量名                          | 值                        |
| ------------------------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | 你的 Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key    |

### 步骤 4：重新部署

在 Vercel 控制台点击 **Redeploy**，项目即可正常运行。

## 🔐 安全架构

用户密码 → PBKDF2 (100,000次迭代) → 派生密钥
↓
AES-256-CBC 加密
↓
加密数据存储到 Supabase
(服务器无法解密)

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Supabase (PostgreSQL)
- **加密**: CryptoJS (AES-256-CBC)
- **部署**: Vercel

---

⭐ 如果这个项目对你有帮助，请给一个 Star！
