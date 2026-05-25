import { WifiOff, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface AlertBannerProps {
  type: 'offline' | 'slow' | 'error';
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AlertBanner({ type, message, dismissible = true, onDismiss }: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const configs = {
    offline: {
      icon: WifiOff,
      bg: 'bg-gray-900',
      text: 'text-white',
      defaultMessage: "You're offline. Some features may not work until you reconnect.",
    },
    slow: {
      icon: WifiOff,
      bg: 'bg-amber-500',
      text: 'text-white',
      defaultMessage: 'Slow connection detected. Analysis may take longer than usual.',
    },
    error: {
      icon: AlertTriangle,
      bg: 'bg-red-500',
      text: 'text-white',
      defaultMessage: 'Something went wrong. Please try again.',
    },
  };

  const config = configs[type];
  const Icon = config.icon;
  const displayMessage = message || config.defaultMessage;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`${config.bg} ${config.text} px-4 py-3 fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{displayMessage}</span>
      {dismissible && (
        <button 
          onClick={handleDismiss}
          className="ml-4 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Network-aware banner that auto-shows/hides based on connection
export function NetworkStatusBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Reset dismissed state when coming back online
  useState(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  if (isOnline || dismissed) return null;

  return (
    <AlertBanner 
      type="offline" 
      dismissible={true}
      onDismiss={() => setDismissed(true)}
    />
  );
}
