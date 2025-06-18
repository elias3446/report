
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink } from 'lucide-react';
import { openInGoogleMaps, type LocationData } from '@/utils/mapsUtils';
import { cn } from '@/lib/utils';

interface GoogleMapsButtonProps {
  location: LocationData;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export const GoogleMapsButton: React.FC<GoogleMapsButtonProps> = ({
  location,
  variant = 'outline',
  size = 'sm',
  className,
  children,
  showIcon = true
}) => {
  const handleOpenInGoogleMaps = () => {
    openInGoogleMaps(location);
  };

  const hasValidLocation = location?.latitud && location?.longitud;

  if (!hasValidLocation) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenInGoogleMaps}
      className={cn('flex items-center gap-2', className)}
      title="Abrir en Google Maps"
    >
      {showIcon && <MapPin className="h-4 w-4" />}
      {children || 'Ver en Google Maps'}
      <ExternalLink className="h-3 w-3 ml-1" />
    </Button>
  );
};
