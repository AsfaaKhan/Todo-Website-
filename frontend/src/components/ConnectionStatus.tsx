import React, { useState, useEffect } from 'react';

type ConnectionStatus = 'online' | 'offline' | 'connecting' | 'degraded';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = '',
  showText = true,
  size = 'md'
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [latency, setLatency] = useState<number | null>(null);

  // Determine status based on browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus('connecting');
      // Simulate checking connection quality
      setTimeout(() => {
        setStatus('online');
        setLatency(Math.floor(Math.random() * 100)); // Simulated latency
      }, 500);
    };

    const handleOffline = () => {
      setStatus('offline');
      setLatency(null);
    };

    // Check initial connection status
    if (navigator.onLine) {
      setStatus('online');
    } else {
      setStatus('offline');
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate periodic latency checks
    const latencyInterval = setInterval(() => {
      if (status === 'online') {
        // Simulate a latency check (in a real app, this would ping a server)
        const simulatedLatency = Math.floor(Math.random() * 150);
        setLatency(simulatedLatency);

        // Update status based on latency
        if (simulatedLatency > 100) {
          setStatus('degraded');
        } else if (simulatedLatency <= 100) {
          setStatus('online');
        }
      }
    }, 5000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(latencyInterval);
    };
  }, [status]);

  // Get status properties based on current status
  const getStatusProperties = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'Connected',
          description: latency ? `Latency: ${latency}ms` : 'Good connection'
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: 'Connecting',
          description: 'Establishing connection...'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          text: 'Offline',
          description: 'No connection'
        };
      case 'degraded':
        return {
          color: 'bg-orange-500',
          text: 'Slow connection',
          description: latency ? `Latency: ${latency}ms` : 'High latency'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const { color, text, description } = getStatusProperties();

  // Size-based styling
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        <div className={`${sizeClasses[size]} ${color} rounded-full mr-2 flex-shrink-0`}>
          {status === 'connecting' && (
            <div className="w-full h-full rounded-full animate-ping opacity-75 bg-current" />
          )}
        </div>
        {showText && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">{text}</span>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Additional component for more detailed connection info
interface DetailedConnectionStatusProps {
  className?: string;
}

const DetailedConnectionStatus: React.FC<DetailedConnectionStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [latency, setLatency] = useState<number | null>(null);
  const [downlink, setDownlink] = useState<number | null>(null);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);

  useEffect(() => {
    // Check Network Information API if available
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        setDownlink(conn.downlink || null);
        setEffectiveType(conn.effectiveType || null);
      }
    }

    // Monitor connection changes
    const handleConnectionChange = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn) {
          setDownlink(conn.downlink || null);
          setEffectiveType(conn.effectiveType || null);
        }
      }
    };

    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
    }

    // Cleanup
    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return (
    <div className={`bg-gray-50 p-4 rounded-lg border border-gray-200 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-800">Connection Status</h4>
        <ConnectionStatus showText={false} size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-600">Status:</div>
        <div className="font-medium capitalize">Online</div>

        {latency !== null && (
          <>
            <div className="text-gray-600">Latency:</div>
            <div className="font-medium">{latency}ms</div>
          </>
        )}

        {downlink !== null && (
          <>
            <div className="text-gray-600">Download Speed:</div>
            <div className="font-medium">{downlink} Mbps</div>
          </>
        )}

        {effectiveType && (
          <>
            <div className="text-gray-600">Connection Type:</div>
            <div className="font-medium capitalize">{effectiveType}</div>
          </>
        )}
      </div>
    </div>
  );
};

export { ConnectionStatus, DetailedConnectionStatus };