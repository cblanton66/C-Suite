-- Add last_accessed column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when sorting by last_accessed
CREATE INDEX IF NOT EXISTS idx_clients_last_accessed
ON clients(user_email, last_accessed DESC NULLS LAST);

-- Optional: Set initial last_accessed to created_at for existing clients
UPDATE clients
SET last_accessed = created_at
WHERE last_accessed IS NULL;
