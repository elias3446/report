
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface AvatarPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string;
  userName?: string;
  userEmail?: string;
}

export const AvatarPreviewModal: React.FC<AvatarPreviewModalProps> = ({
  isOpen,
  onClose,
  avatarUrl,
  userName,
  userEmail,
}) => {
  const getInitials = () => {
    if (userName) {
      const names = userName.split(' ');
      return names.map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Foto de Perfil
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-6">
          <Avatar className="h-48 w-48">
            <AvatarImage 
              src={avatarUrl || ''} 
              alt="Avatar del usuario"
              className="object-cover"
            />
            <AvatarFallback className="text-4xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          {userName && (
            <div className="text-center">
              <h3 className="text-lg font-semibold">{userName}</h3>
              {userEmail && (
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
