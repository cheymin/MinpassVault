-- 添加邮件相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP WITH TIME ZONE;

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- 更新 RLS 策略以允许服务端访问
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Service can access users" ON users
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own vault items" ON vault_items;
DROP POLICY IF EXISTS "Users can insert own vault items" ON vault_items;
DROP POLICY IF EXISTS "Users can update own vault items" ON vault_items;
DROP POLICY IF EXISTS "Users can delete own vault items" ON vault_items;

CREATE POLICY "Users can view own vault items" ON vault_items
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own vault items" ON vault_items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own vault items" ON vault_items
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own vault items" ON vault_items
  FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Service can access vault items" ON vault_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;

CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Service can access folders" ON folders
  FOR ALL USING (true) WITH CHECK (true);