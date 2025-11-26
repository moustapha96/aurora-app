-- Create rate_limiting table to track authentication attempts
CREATE TABLE IF NOT EXISTS rate_limiting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email, IP address, or user_id
  endpoint TEXT NOT NULL, -- 'login', 'register', 'reset-password', etc.
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ, -- NULL if not blocked, timestamp if blocked
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limiting_identifier_endpoint 
ON rate_limiting(identifier, endpoint);

CREATE INDEX IF NOT EXISTS idx_rate_limiting_blocked_until 
ON rate_limiting(blocked_until) 
WHERE blocked_until IS NOT NULL;

-- Create index for cleanup of old records
CREATE INDEX IF NOT EXISTS idx_rate_limiting_created_at 
ON rate_limiting(created_at);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_rate_limiting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_rate_limiting_updated_at
  BEFORE UPDATE ON rate_limiting
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limiting_updated_at();

-- Enable RLS
ALTER TABLE rate_limiting ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (for Edge Functions)
CREATE POLICY "Service role can manage rate limiting"
  ON rate_limiting
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean up old records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limiting()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limiting
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE rate_limiting IS 'Tracks authentication attempts for rate limiting protection against brute force attacks';
COMMENT ON COLUMN rate_limiting.identifier IS 'Email, IP address, or user_id used to identify the requester';
COMMENT ON COLUMN rate_limiting.endpoint IS 'The endpoint being accessed (login, register, reset-password, etc.)';
COMMENT ON COLUMN rate_limiting.attempt_count IS 'Number of failed attempts in the current window';
COMMENT ON COLUMN rate_limiting.blocked_until IS 'Timestamp until which this identifier is blocked (NULL if not blocked)';

