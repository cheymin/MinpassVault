# SecureVault 🔐

一个安全、开源的端到端加密密码管理器。

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## ✨ 功能特性

- 🔒 **端到端加密** - AES-256-CBC + PBKDF2 密钥派生
- 🔑 **零知识架构** - 服务器无法访问明文数据
- 🛡️ **二次验证 (2FA)** - TOTP 时间基验证码
- 📦 **多类型支持** - 登录凭证、安全笔记、银行卡、身份信息
- 📁 **文件夹分类** - 自定义组织管理
- ⭐ **收藏功能** - 快速访问常用项目
- 🔧 **密码生成器** - 可自定义长度和字符类型
- 📤 **数据导入** - CSV 格式导入
- ✏️ **编辑功能** - 支持编辑所有类型的密码项目
- 🔐 **登录保护** - 5次失败后锁定15分钟
- ⚙️ **个性化设置** - 自定义网站标题和图标
- 🔄 **初始化系统** - 首次使用自动创建管理员账户

**注意！本项目为学生项目，如果有漏洞可能无法及时更新**

## 预览

![image.png](https://djkl.qzz.io/file/music/1772872359702_image.png)
![image.png](https://djkl.qzz.io/file/music/1772872351071_image.png)

## 🚀 部署

### 方式一：Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdjklmin%2Fpassword)

### 方式二：Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/djklmin/password)

---

## 📋 部署步骤

### 步骤 1：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 注册并创建新项目
2. 进入 SQL Editor，执行以下 SQL：

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
  site_icon TEXT DEFAULT 'https://djkl.qzz.io/file/1770081419896_头像.webp',
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

### 步骤 2：配置环境变量

在 Supabase 控制台，进入 Settings → API，复制以下信息：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key |

#### Vercel 配置
1. 在 Vercel 项目中，进入 Settings → Environment Variables
2. 添加上述两个变量
3. 点击 Redeploy 重新部署

#### Netlify 配置
1. 在 Netlify 项目中，进入 Site settings → Build & deploy → Environment
2. 添加上述两个变量
3. 触发重新部署

---

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
| 部署 | Vercel / Netlify |

## 🎯 使用说明

### 首次使用

1. 访问部署后的网站
2. 系统会自动检测是否为首次使用
3. 创建管理员账户（用户名和主密码）
4. 完成初始化后进入主界面

### 主要功能

| 功能 | 说明 |
|------|------|
| 密码管理 | 添加、编辑、删除各类密码项目 |
| 文件夹管理 | 创建文件夹分类管理密码 |
| 导入功能 | 支持从浏览器导出的 CSV 文件导入 |
| 设置中心 | 修改密码、重置数据库、个性化设置 |

## ⚠️ 注意事项

- 请妥善保管主密码，系统采用零知识架构，无法重置主密码
- 重置数据库将删除所有数据，请谨慎操作
- 建议定期导出数据备份
- 本项目为学生项目，如果有漏洞可能无法及时更新

## 📄 许可

本项目仅供个人使用，禁止商业用途。

---

⭐ **如果这个项目对你有帮助，请给一个 Star！**

©2026 Designed by [min](https://github.com/djklmin) for you!
