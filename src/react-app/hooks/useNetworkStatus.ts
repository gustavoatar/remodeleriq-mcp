import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    effectiveType: null,
  });

  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as Navigator & { 
      connection?: { effectiveType?: string; downlink?: number } 
    }).connection;

    const isSlowConnection = connection 
      ? (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || (connection.downlink !== undefined && connection.downlink < 1))
      : false;

    setStatus({
      isOnline: navigator.onLine,
      isSlowConnection,
      effectiveType: connection?.effectiveType || null,
    });
  }, []);

  useEffect(() => {
    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    const connection = (navigator as Navigator & { 
      connection?: { addEventListener?: (event: string, handler: () => void) => void } 
    }).connection;
    
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, [updateNetworkStatus]);

  return status;
}
