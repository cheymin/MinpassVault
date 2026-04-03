-- 添加邮箱验证登录字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_verification_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_verification_expires_at TIMESTAMP WITH TIME ZONE;
