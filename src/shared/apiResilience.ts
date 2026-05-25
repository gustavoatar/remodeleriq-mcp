/**
 * API Resilience Utilities
 * Provides timeout, retry, and caching helpers for external API calls
 */

// ============================================
// TYPES
// ============================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOn?: (error: Error, attempt: number) => boolean;
}

export interface TimeoutOptions {
  timeoutMs: number;
  timeoutMessage?: string;
}

export interface FetchWithResilienceOptions extends RetryOptions, Partial<TimeoutOptions> {
  cacheKey?: string;
  cacheTtlMs?: number;
}

// Simple in-memory cache for API responses
const responseCache = new Map<string, { data: unknown; expiresAt: number }>();

// ============================================
// CORE UTILITIES
// ============================================

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, timeoutMessage = 'Request timed out' } = options;
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
    
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    retryOn = defaultRetryCondition,
  } = options;
  
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt >= maxRetries || !retryOn(lastError, attempt)) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500,
        maxDelayMs
      );
      
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Default condition for retrying - retry on transient errors
 */
function defaultRetryCondition(error: Error, _attempt: number): boolean {
  const message = error.message.toLowerCase();
  
  // Retry on network errors
  if (message.includes('network') || message.includes('fetch')) {
    return true;
  }
  
  // Retry on timeout
  if (message.includes('timeout') || message.includes('timed out')) {
    return true;
  }
  
  // Retry on rate limiting
  if (message.includes('429') || message.includes('rate limit')) {
    return true;
  }
  
  // Retry on server errors (5xx)
  if (message.includes('500') || message.includes('502') || 
      message.includes('503') || message.includes('504')) {
    return true;
  }
  
  return false;
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// FETCH HELPERS
// ============================================

/**
 * Fetch with timeout, retry, and optional caching
 */
export async function fetchWithResilience(
  url: string,
  init?: RequestInit,
  options: FetchWithResilienceOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 30000,
    maxRetries = 2,
    baseDelayMs = 1000,
    cacheKey,
    cacheTtlMs,
  } = options;
  
  // Check cache first
  if (cacheKey) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      // Return cached response as a mock Response
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-From-Cache': 'true' }
      });
    }
  }
  
  const fetchFn = async () => {
    const response = await withTimeout(
      fetch(url, init),
      { timeoutMs, timeoutMessage: `Request to ${url} timed out after ${timeoutMs}ms` }
    );
    
    // Don't retry on client errors (4xx) except 429
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      throw error;
    }
    
    // Throw on server errors to trigger retry
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  };
  
  const response = await withRetry(fetchFn, { maxRetries, baseDelayMs });
  
  // Cache successful response if caching is enabled
  if (cacheKey && cacheTtlMs && response.ok) {
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      responseCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + cacheTtlMs
      });
    } catch {
      // Ignore cache errors
    }
  }
  
  return response;
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (value.expiresAt <= now) {
      responseCache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  responseCache.clear();
}

// ============================================
// SPECIALIZED HELPERS
// ============================================

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('timeout') || msg.includes('timed out');
  }
  return false;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || msg.includes('fetch') || msg.includes('connection');
  }
  return false;
}

/**
 * Check if we should show a user-friendly fallback instead of an error
 */
export function shouldUseFallback(error: unknown): boolean {
  return isTimeoutError(error) || isNetworkError(error);
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (isTimeoutError(error)) {
    return 'The request is taking longer than expected. Please try again.';
  }
  if (isNetworkError(error)) {
    return 'Unable to connect. Please check your internet connection.';
  }
  if (error instanceof Error) {
    // Don't expose internal error details
    if (error.message.includes('API') || error.message.includes('key')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
