
import React from 'react';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';

const Notifications = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground">
          Gestiona todas tus notificaciones del sistema
        </p>
      </div>
      
      <NotificationsPanel />
    </div>
  );
};

export default Notifications;
