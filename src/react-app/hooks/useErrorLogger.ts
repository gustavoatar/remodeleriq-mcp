import { useCallback } from 'react';

interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export function useErrorLogger() {
  const logError = useCallback(async (data: ErrorLogData) => {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          url: data.url || window.location.href,
        }),
      });
    } catch {
      // Silently fail - don't create infinite error loops
      console.error('Failed to log error to server');
    }
  }, []);

  return { logError };
}

// Standalone function for use outside React components
export async function logErrorToServer(data: ErrorLogData): Promise<void> {
  try {
    await fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        url: data.url || window.location.href,
      }),
    });
  } catch {
    console.error('Failed to log error to server');
  }
}
