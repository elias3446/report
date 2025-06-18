
import React, { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { MapaBase, reportIcon, RecenterAutomatically } from './MapaBase';
import { toast } from '@/components/ui/sonner';
import { reverseGeocode } from '@/utils/nominatimUtils';

interface MapaReportesMultiplesProps<T = any> {
  reportes: T[];
  className?: string;
  height?: string;
  onReporteClick?: (reporte: T) => void;
  selectedReporteId?: string | number;
}

interface AddressData {
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    suburb?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface FormattedAddress {
  mainAddress: string;
  reference: string;
}

const MapaReportesMultiples = <T extends { id: string | number; ubicacion: { latitud: number; longitud: number }; titulo: string; descripcion?: string }>(
  {
    reportes,
    className,
    height,
    onReporteClick,
    selectedReporteId
  }: MapaReportesMultiplesProps<T>
) => {
  const [userPosition, setUserPosition] = useState<[number, number]>([0, 0]);
  const [selectedReporte, setSelectedReporte] = useState<T | null>(null);

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  // Update selected reporte when selectedReporteId changes
  useEffect(() => {
    if (selectedReporteId) {
      const reporte = reportes.find(r => r.id === selectedReporteId);
      setSelectedReporte(reporte || null);
    } else {
      setSelectedReporte(null);
    }
  }, [selectedReporteId, reportes]);

  const handleMarkerClick = (reporte: T) => {
    // Set the selected report
    setSelectedReporte(reporte);
    
    // Call the parent component's handler if provided
    if (onReporteClick) {
      onReporteClick(reporte);
    }
  };

  return (
    <div className="space-y-4">
      <MapaBase 
        className={className} 
        height={height} 
        initialCenter={userPosition[0] !== 0 ? userPosition : undefined}
      >
        {/* Center on user position initially */}
        {userPosition[0] !== 0 && !selectedReporte && 
          <RecenterAutomatically position={userPosition} maxZoom={18} />
        }
        
        {/* Center on selected report when clicked */}
        {selectedReporte && 
          <RecenterAutomatically position={[selectedReporte.ubicacion.latitud, selectedReporte.ubicacion.longitud]} maxZoom={18} />
        }
        
        {reportes.map((reporte) => (
          <Marker 
            key={reporte.id} 
            {...({ 
              position: [reporte.ubicacion.latitud, reporte.ubicacion.longitud],
              icon: reportIcon,
              eventHandlers: {
                click: () => handleMarkerClick(reporte),
              }
            } as any)}
          >
            <Popup
              className="custom-popup"
              maxWidth={280}
              minWidth={200}
            >
              <div className="p-2 max-w-xs text-foreground">
                <h3 className="font-medium text-sm mb-1 break-words line-clamp-2">{reporte.titulo}</h3>
                {reporte.descripcion && (
                  <p className="text-xs text-muted-foreground break-words line-clamp-3">{reporte.descripcion}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapaBase>
    </div>
  );
};

export default MapaReportesMultiples;
