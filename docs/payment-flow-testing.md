# Payment Flow Manual Testing Checklist

## Pre-requisites
- Access to Stripe test mode dashboard
- Test email accounts (Gmail works best for receiving emails)
- Browser with dev tools open for console/network monitoring

---

## Test 1: Magic Link Login (Non-Payment)

### Steps:
1. **Go to**: `/auth/magic-link`
2. **Enter email**: Use your test email
3. **Click**: "Send Magic Link"
4. **Check email**: Should receive "Sign in to RemodelerIQ" email
5. **Click**: The "Sign In to RemodelerIQ" button in email
6. **Verify**: 
   - You're redirected to the app
   - You're logged in (check header shows your email/profile)

### Expected Results:
- [ ] Magic link email arrives within 30 seconds
- [ ] Email subject: "Sign in to RemodelerIQ"
- [ ] Link works and creates session
- [ ] Session persists across page refreshes
- [ ] Link expires after 30 minutes (test by waiting)
- [ ] Used link shows error "This link has already been used"

---

## Test 2: Guest Checkout (New User Payment)

### Steps:
1. **Log out** (if logged in)
2. **Go to**: `/premium`
3. **Click**: "Go Premium" button
4. **Stripe checkout**: 
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/28)
   - CVC: Any 3 digits (e.g., 123)
   - Use a NEW email address you haven't used before
5. **Complete payment**
6. **Check email**: Should receive welcome email

### Expected Results:
- [ ] Redirected to Stripe checkout (not Google login)
- [ ] Payment succeeds with test card
- [ ] Redirected to `/settings?payment=success&guest=true`
- [ ] Green welcome banner appears on Settings page
- [ ] Welcome email received with:
  - [ ] Subject contains "🔑" key emoji (not 🎉)
  - [ ] "Analyze Bids" green button (#1F9C4C)
  - [ ] "Sign In & Get Started" button (magic link)
  - [ ] Expiration date (1 year from now)
- [ ] Clicking magic link in email logs you in as premium user

---

## Test 3: Logged-In User Upgrade

### Steps:
1. **Sign in** with Google OAuth (existing free account)
2. **Go to**: `/premium`
3. **Click**: "Upgrade to Premium"
4. **Complete**: Stripe checkout
5. **Verify**: Premium access

### Expected Results:
- [ ] Checkout uses your logged-in email
- [ ] Redirected to `/settings?payment=success`
- [ ] Welcome banner shown
- [ ] Premium features unlocked:
  - [ ] Price Analysis visible (not blurred)
  - [ ] Contractor Pulse visible
  - [ ] Questions to Ask visible
  - [ ] Market Analysis tab accessible
  - [ ] Negotiation tab accessible
  - [ ] Export button works (no lock icon)

---

## Test 4: Settings Welcome Banner

### Manual URL Tests:
1. **Visit**: `/settings?payment=success` → Banner should appear
2. **Visit**: `/settings?welcome=true` → Banner should appear
3. **Visit**: `/settings` (no params) → No banner
4. **Click**: X button on banner → Banner dismisses

### Expected Results:
- [ ] Banner shows green gradient with sparkles icon
- [ ] "Welcome to Premium! 🎉" title
- [ ] "Analyze Your First Bid" button works
- [ ] Banner dismisses when clicking X

---

## Test 5: Tier Access Controls

### Guest (Not Logged In):
1. **Log out completely**
2. **Upload a bid** (should work first 3 times)
3. **Verify locked features**:
   - [ ] Price Analysis is blurred with "Sign Up Free" overlay
   - [ ] Contractor Pulse is blurred
   - [ ] Questions to Ask is blurred
   - [ ] Market Analysis tab shows lock icon
   - [ ] Negotiation tab shows lock icon
   - [ ] Export button shows lock icon, redirects to /premium

### Free User (Logged In, Not Premium):
1. **Sign in** (Google OAuth)
2. **Verify**:
   - [ ] Price Analysis visible (unlocked for free users)
   - [ ] Other premium features still locked
   - [ ] 1 analysis per day limit

### Premium User:
1. **Sign in as premium user** (via magic link after payment)
2. **Verify ALL features unlocked**:
   - [ ] All cards visible without blur
   - [ ] All tabs accessible
   - [ ] Export works
   - [ ] Unlimited analyses

---

## Test 6: Session Persistence

### Steps:
1. **Log in via magic link**
2. **Close browser completely**
3. **Reopen browser and visit app**
4. **Verify still logged in**

### Expected Results:
- [ ] Session persists for 60 days
- [ ] Cookie named `riq_session` exists
- [ ] `/api/auth/me` returns user data

---

## Test 7: Logout Flow

### Steps:
1. **Log in** (via magic link or Google)
2. **Click logout** (in header dropdown)
3. **Verify logged out**

### Expected Results:
- [ ] Session cookie cleared
- [ ] Redirected to home page
- [ ] Header shows "Sign In" button
- [ ] `/api/auth/me` returns `{ user: null }`

---

## Test 8: Email Content Verification

### Welcome Email Checklist:
- [ ] Subject: `Welcome [Name] to RemodelerIQ Premium Yearly Access 🔑`
- [ ] Header: `Welcome [Name] to RemodelerIQ Premium! 🔑`
- [ ] "Hello [Name]," greeting
- [ ] "Unlimited Analyses" bullet point
- [ ] "Lifetime Priority Support" bullet point
- [ ] **"Analyze Bids" button** - Green (#1F9C4C), links to `/?view=upload`
- [ ] Expiration date (formatted as "Month Day, Year")
- [ ] **"Sign In & Get Started" button** - Links to magic link URL
- [ ] "This sign-in link expires in 1 hour" note
- [ ] Help email: help@remodeleriq.com

### Magic Link Login Email Checklist:
- [ ] Subject: "Sign in to RemodelerIQ"
- [ ] "Sign In to RemodelerIQ" button
- [ ] "This link will expire in 30 minutes"
- [ ] "If you didn't request this link, you can safely ignore this email"

---

## Common Issues & Debugging

### Email Not Arriving:
- Check spam folder
- In dev mode, emails only go to app owner's email
- Check Mocha dashboard for email logs

### Magic Link "Invalid or Expired":
- Token only valid for 30 min (login) or 60 min (welcome)
- Each token can only be used once
- Check database: `SELECT * FROM magic_link_tokens ORDER BY created_at DESC LIMIT 5`

### Payment Not Creating Premium:
- Check Stripe webhook logs in dashboard
- Verify webhook URL is correct
- Check worker logs for errors

### Session Not Persisting:
- Check cookies in dev tools (look for `riq_session`)
- Cookie must be httpOnly, secure, sameSite=lax
- Check database: `SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 5`

---

## API Endpoints for Manual Testing

```bash
# Request magic link
curl -X POST https://remodeleriq.com/api/auth/magic-link/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check current user (with session cookie)
curl https://remodeleriq.com/api/auth/me \
  -H "Cookie: riq_session=YOUR_SESSION_TOKEN"

# Verify magic link token
curl "https://remodeleriq.com/api/auth/magic-link/verify?token=YOUR_TOKEN"
```

---

## Database Queries for Verification

```sql
-- Check recent magic link tokens
SELECT * FROM magic_link_tokens ORDER BY created_at DESC LIMIT 10;

-- Check user sessions
SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 10;

-- Check premium users
SELECT * FROM user_profiles WHERE is_premium = 1;

-- Check user by email
SELECT * FROM user_profiles WHERE email = 'test@example.com';
```
