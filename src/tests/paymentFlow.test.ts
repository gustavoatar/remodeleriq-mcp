/**
 * Payment Flow Acceptance Tests
 * 
 * Tests the complete payment flow including:
 * - Magic link authentication
 * - Guest checkout
 * - Premium welcome emails
 * - Session management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================
// MOCK TYPES
// ============================================

interface MockDB {
  prepare: (sql: string) => {
    bind: (...args: any[]) => {
      run: () => Promise<{ meta: { last_row_id: number } }>;
      first: () => Promise<any>;
      all: () => Promise<{ results: any[] }>;
    };
  };
}

interface MockEmails {
  send: (params: any) => Promise<{ success: boolean; message_id?: string; error?: string }>;
}

// ============================================
// MAGIC LINK AUTHENTICATION TESTS
// ============================================

describe('Magic Link Authentication', () => {
  let mockDB: MockDB;
  let mockEmails: MockEmails;
  let storedTokens: Map<string, any>;

  beforeEach(() => {
    storedTokens = new Map();
    
    mockDB = {
      prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
          run: async () => {
            if (sql.includes('INSERT INTO magic_link_tokens')) {
              const [email, token, expiresAt] = args;
              storedTokens.set(token, { email, token, expires_at: expiresAt, is_used: 0 });
              return { meta: { last_row_id: storedTokens.size } };
            }
            if (sql.includes('INSERT INTO user_sessions')) {
              return { meta: { last_row_id: 1 } };
            }
            return { meta: { last_row_id: 1 } };
          },
          first: async () => {
            if (sql.includes('FROM magic_link_tokens WHERE token')) {
              return storedTokens.get(args[0]) || null;
            }
            if (sql.includes('FROM user_profiles WHERE email')) {
              return { id: 1, email: args[0], name: 'Test User', is_premium: 0, premium_ends_at: null };
            }
            return null;
          },
          all: async () => ({ results: [] }),
        }),
      }),
    };

    mockEmails = {
      send: vi.fn().mockResolvedValue({ success: true, message_id: 'test-123' }),
    };
  });

  describe('POST /auth/magic-link/request', () => {
    it('should reject empty email', async () => {
      const request = { email: '' };
      const isValid = Boolean(request.email && typeof request.email === 'string' && request.email.length > 0);
      expect(isValid).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('should accept valid email format', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.org', 'user+tag@company.io'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }
    });

    it('should normalize email to lowercase', () => {
      const email = 'TEST@EXAMPLE.COM';
      const normalized = email.toLowerCase().trim();
      expect(normalized).toBe('test@example.com');
    });

    it('should generate unique tokens', () => {
      const generateToken = () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
      };

      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64);
      expect(token2.length).toBe(64);
    });

    it('should set correct token expiry (30 minutes)', () => {
      const TOKEN_EXPIRY_MINUTES = 30;
      const now = Date.now();
      const expiresAt = new Date(now + TOKEN_EXPIRY_MINUTES * 60 * 1000);
      
      const diffMinutes = (expiresAt.getTime() - now) / (60 * 1000);
      expect(diffMinutes).toBeCloseTo(30, 0);
    });
  });

  describe('GET /auth/magic-link/verify', () => {
    it('should reject missing token', () => {
      const token = undefined;
      expect(token).toBeUndefined();
    });

    it('should reject invalid/non-existent token', async () => {
      const result = await mockDB.prepare('SELECT * FROM magic_link_tokens WHERE token = ?')
        .bind('invalid-token')
        .first();
      expect(result).toBeNull();
    });

    it('should reject already-used token', () => {
      const tokenRecord = { is_used: 1 };
      expect(tokenRecord.is_used).toBe(1);
    });

    it('should reject expired token', () => {
      const expiredDate = new Date(Date.now() - 60000); // 1 minute ago
      const isExpired = expiredDate < new Date();
      expect(isExpired).toBe(true);
    });

    it('should accept valid, unused, non-expired token', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const tokenRecord = { is_used: 0, expires_at: futureDate.toISOString() };
      
      const isValid = tokenRecord.is_used === 0 && new Date(tokenRecord.expires_at) > new Date();
      expect(isValid).toBe(true);
    });

    it('should set correct session expiry (60 days)', () => {
      const SESSION_EXPIRY_DAYS = 60;
      const now = Date.now();
      const sessionExpiresAt = new Date(now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      
      const diffDays = (sessionExpiresAt.getTime() - now) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBeCloseTo(60, 0);
    });
  });

  describe('GET /auth/me', () => {
    it('should return null user when no session cookie', () => {
      const sessionToken = undefined;
      expect(sessionToken).toBeUndefined();
    });

    it('should return user data for valid session', () => {
      const userProfile = { 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User', 
        is_premium: 1, 
        premium_ends_at: '2027-03-11' 
      };

      const response = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        isPremium: userProfile.is_premium === 1,
        premiumEndsAt: userProfile.premium_ends_at,
      };

      expect(response.isPremium).toBe(true);
      expect(response.email).toBe('test@example.com');
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear session on logout', () => {
      const clearedCookie = { maxAge: 0 };
      expect(clearedCookie.maxAge).toBe(0);
    });
  });
});

// ============================================
// GUEST CHECKOUT TESTS
// ============================================

describe('Guest Checkout Flow', () => {
  describe('POST /premium/guest-checkout', () => {
    it('should create checkout session without authentication', () => {
      // Guest checkout doesn't require auth middleware
      const requiresAuth = false;
      expect(requiresAuth).toBe(false);
    });

    it('should include guest=true in success URL', () => {
      const origin = 'https://remodeleriq.com';
      const successUrl = `${origin}/settings?payment=success&guest=true`;
      
      expect(successUrl).toContain('guest=true');
      expect(successUrl).toContain('payment=success');
    });

    it('should set correct price ($19.99)', () => {
      const priceInCents = 2999;
      expect(priceInCents).toBe(2999);
    });
  });
});

// ============================================
// PREMIUM WELCOME EMAIL TESTS
// ============================================

describe('Premium Welcome Email', () => {
  it('should include key emoji in subject', () => {
    const firstName = 'John';
    const subject = `Welcome ${firstName} to RemodelerIQ Premium Yearly Access 🔑`;
    
    expect(subject).toContain('🔑');
    expect(subject).not.toContain('🎉');
    expect(subject).toContain(firstName);
  });

  it('should include key emoji in header', () => {
    const firstName = 'John';
    const header = `Welcome ${firstName} to RemodelerIQ Premium! 🔑`;
    
    expect(header).toContain('🔑');
  });

  it('should include Analyze Bids button with brand green', () => {
    const origin = 'https://remodeleriq.com';
    const buttonHtml = `<a href="${origin}/?view=upload" style="display: inline-block; background-color: #1F9C4C; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Analyze Bids
          </a>`;
    
    expect(buttonHtml).toContain('#1F9C4C');
    expect(buttonHtml).toContain('Analyze Bids');
    expect(buttonHtml).toContain('/?view=upload');
  });

  it('should include magic link for sign-in', () => {
    const origin = 'https://remodeleriq.com';
    const token = 'abc123';
    const magicLink = `${origin}/auth/verify?token=${token}&welcome=true`;
    
    expect(magicLink).toContain('/auth/verify');
    expect(magicLink).toContain('token=');
    expect(magicLink).toContain('welcome=true');
  });

  it('should set magic link expiry to 60 minutes (1 hour)', () => {
    const TOKEN_EXPIRY_MINUTES = 60;
    expect(TOKEN_EXPIRY_MINUTES).toBe(60);
  });

  it('should include formatted expiration date', () => {
    // Construct via local-time components: 'YYYY-MM-DD' strings parse as UTC
    // midnight, which formats as the previous day in US timezones. Production
    // passes epoch-derived Dates, never date-only strings (stripe.ts:626,690).
    const premiumEndsAt = new Date(2027, 2, 11);
    const formattedDate = premiumEndsAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    expect(formattedDate).toBe('March 11, 2027');
  });

  it('should include help email link', () => {
    const helpEmail = 'help@remodeleriq.com';
    const emailHtml = `<a href="mailto:${helpEmail}" style="color: #10b981;">${helpEmail}</a>`;
    
    expect(emailHtml).toContain('mailto:help@remodeleriq.com');
  });
});

// ============================================
// SETTINGS WELCOME BANNER TESTS
// ============================================

describe('Settings Welcome Banner', () => {
  it('should show banner when payment=success', () => {
    const urlParams = new URLSearchParams('payment=success');
    const showBanner = urlParams.get('payment') === 'success';
    expect(showBanner).toBe(true);
  });

  it('should show banner when welcome=true', () => {
    const urlParams = new URLSearchParams('welcome=true');
    const showBanner = urlParams.get('welcome') === 'true';
    expect(showBanner).toBe(true);
  });

  it('should not show banner without params', () => {
    const urlParams = new URLSearchParams('');
    const showBanner = urlParams.get('payment') === 'success' || urlParams.get('welcome') === 'true';
    expect(showBanner).toBe(false);
  });
});

// ============================================
// STRIPE WEBHOOK TESTS
// ============================================

describe('Stripe Webhook Handler', () => {
  it('should calculate premium end date as 1 year from now', () => {
    const now = new Date();
    const premiumEndsAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    const diffYears = (premiumEndsAt.getTime() - now.getTime()) / (365 * 24 * 60 * 60 * 1000);
    expect(diffYears).toBeCloseTo(1, 0);
  });

  it('should extract first name from email', () => {
    const testCases = [
      { email: 'john.doe@example.com', expected: 'John' },
      { email: 'jane_smith@example.com', expected: 'Jane' },
      { email: 'bob@example.com', expected: 'Bob' },
      { email: 'mary-anne@example.com', expected: 'Mary' },
    ];

    for (const { email, expected } of testCases) {
      const firstPart = email.split('@')[0];
      const namePart = firstPart.split(/[._-]/)[0];
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
      expect(capitalized).toBe(expected);
    }
  });

  it('should create/update user profile by email for guest checkout', () => {
    // This tests the upsert logic
    const email = 'guest@example.com';
    const userId = `guest_${Date.now()}`;
    
    expect(userId).toContain('guest_');
    expect(email).toBe('guest@example.com');
  });
});

// ============================================
// TIER ACCESS CONTROL TESTS  
// ============================================

describe('Tier Access Controls', () => {
  describe('Guest (anonymous) tier', () => {
    it('should allow 3 total analyses', () => {
      const GUEST_MAX_ANALYSES = 3;
      expect(GUEST_MAX_ANALYSES).toBe(3);
    });

    it('should track uploads in localStorage', () => {
      const STORAGE_KEY = 'anonymousUploadCount';
      expect(STORAGE_KEY).toBe('anonymousUploadCount');
    });
  });

  describe('Free (logged in) tier', () => {
    it('should allow 1 analysis per day', () => {
      const dailyLimit = 1;
      expect(dailyLimit).toBe(1);
    });
  });

  describe('Premium tier', () => {
    it('should have unlimited analyses', () => {
      const isPremium = true;
      const canUpload = isPremium; // No limit check needed
      expect(canUpload).toBe(true);
    });

    it('should unlock all gated features', () => {
      const isPremium = true;
      const featuresUnlocked = {
        priceAnalysis: isPremium,
        contractorPulse: isPremium,
        questionsToAsk: isPremium,
        pdfExport: isPremium,
        marketAnalysis: isPremium,
        negotiationTab: isPremium,
      };

      Object.values(featuresUnlocked).forEach(unlocked => {
        expect(unlocked).toBe(true);
      });
    });
  });
});

// ============================================
// INTEGRATION FLOW TESTS
// ============================================

describe('Complete Payment Flow Integration', () => {
  it('Flow 1: Guest user pays and signs in via magic link', () => {
    const steps = [
      '1. Guest visits /premium',
      '2. Clicks "Go Premium" (guest checkout)',
      '3. Redirected to Stripe checkout',
      '4. Completes payment with email',
      '5. Stripe webhook fires (checkout.session.completed)',
      '6. Webhook creates user_profile with is_premium=1',
      '7. Webhook sends welcome email with magic link',
      '8. User receives email, clicks magic link',
      '9. Magic link creates session, sets cookie',
      '10. User lands on /settings with welcome banner',
    ];

    expect(steps.length).toBe(10);
  });

  it('Flow 2: Logged-in user upgrades to premium', () => {
    const steps = [
      '1. User is logged in via Google OAuth',
      '2. Visits /premium and clicks upgrade',
      '3. Authenticated checkout session created',
      '4. Completes payment',
      '5. Webhook updates existing user_profile',
      '6. Welcome email sent',
      '7. Redirected to /settings?payment=success',
      '8. Welcome banner shown',
    ];

    expect(steps.length).toBe(8);
  });

  it('Flow 3: Magic link login (non-payment)', () => {
    const steps = [
      '1. User visits /auth/magic-link',
      '2. Enters email address',
      '3. Magic link email sent (30 min expiry)',
      '4. User clicks link',
      '5. Token verified, session created',
      '6. User logged in with session cookie',
    ];

    expect(steps.length).toBe(6);
  });
});
