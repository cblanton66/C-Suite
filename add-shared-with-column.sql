-- Add shared_with column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS shared_with TEXT;

-- Add index for better performance when querying shared clients
CREATE INDEX IF NOT EXISTS idx_clients_shared_with
ON clients(shared_with);

-- Add comment to explain usage
COMMENT ON COLUMN clients.shared_with IS 'Email address of user this client is shared with (optional)';
