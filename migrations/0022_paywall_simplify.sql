-- Phase 7H: Paywall simplification
-- Guests now get 3 free analyses (gated by IP) instead of being blocked outright.
-- Logged-in free users continue to get 3 total (already enforced before this change).
-- Add an index on usage_tracking.ip_address so the guest count query stays fast.

CREATE INDEX IF NOT EXISTS idx_usage_tracking_ip_address
  ON usage_tracking(ip_address)
  WHERE ip_address IS NOT NULL;

-- Composite for the exact guest gatekeeper query
CREATE INDEX IF NOT EXISTS idx_usage_tracking_guest_uploads
  ON usage_tracking(ip_address, action_type)
  WHERE user_id IS NULL;
