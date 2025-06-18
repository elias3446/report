
import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, XCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'trend-up' | 'trend-down';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, title: string, message: string, data?: any) => void;
  showDataUpdate: (message: string, hasIncrease?: boolean) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'error': return XCircle;
    case 'warning': return AlertTriangle;
    case 'info': return Info;
    case 'trend-up': return TrendingUp;
    case 'trend-down': return TrendingDown;
    default: return Info;
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      data,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50

    const Icon = getIcon(type);
    
    toast(title, {
      description: message,
      icon: <Icon className="h-4 w-4" />,
      className: `
        ${type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
        ${type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}
        ${type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}
        ${type === 'trend-up' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
        ${type === 'trend-down' ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}
      `,
    });
  }, []);

  const showDataUpdate = useCallback((message: string, hasIncrease?: boolean) => {
    showNotification(
      hasIncrease ? 'trend-up' : 'trend-down',
      'Actualización de Datos',
      message
    );
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification('error', 'Error', message);
  }, [showNotification]);

  const showSuccess = useCallback((message: string) => {
    showNotification('success', 'Éxito', message);
  }, [showNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      showDataUpdate,
      showError,
      showSuccess,
      clearNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
