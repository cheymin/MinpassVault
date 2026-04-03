-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  encrypted_master_key TEXT NOT NULL,
  salt VARCHAR(255) NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  email_verification_enabled BOOLEAN DEFAULT FALSE,
  login_verification_code VARCHAR(10),
  login_verification_expires_at TIMESTAMP WITH TIME ZONE,
  site_title VARCHAR(255) DEFAULT 'SecureVault密码管理器',
  site_icon TEXT DEFAULT 'https://djkl.qzz.io/file/1.webp',
  verification_code VARCHAR(10),
  verification_expires_at TIMESTAMP WITH TIME ZONE,
  reset_token VARCHAR(50),
  reset_expires_at TIMESTAMP WITH TIME ZONE,
  email_service_type VARCHAR(10) DEFAULT 'smtp',
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_secure BOOLEAN DEFAULT TRUE,
  smtp_user VARCHAR(255),
  smtp_pass TEXT,
  smtp_from VARCHAR(255),
  resend_api_key TEXT,
  resend_from VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vault_items table
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

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_folder_id ON vault_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Create RLS policies for vault_items
CREATE POLICY "Users can view own vault items" ON vault_items
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own vault items" ON vault_items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own vault items" ON vault_items
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own vault items" ON vault_items
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for folders
CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
