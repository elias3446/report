
import React, { useState, useEffect, useCallback } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapaBase, selectedReportIcon, RecenterAutomatically } from './MapaBase';
import { toast } from '@/components/ui/sonner';
import { reverseGeocode } from '@/utils/nominatimUtils';

interface MapaReporteEditableProps<T = any> {
  reporte: T;
  className?: string;
  height?: string;
  onPosicionActualizada?: (nuevaPos: [number, number]) => void;
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

// Componente que maneja tanto el marcador arrastrable como los eventos de doble clic en el mapa
const EditableMarker: React.FC<{
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  title: string;
  description?: string;
}> = ({ position, setPosition, title, description }) => {
  // Capturar eventos del mapa, incluyendo el doble clic
  const map = useMapEvents({
    dblclick(e) {
      // Actualizar la posición al lugar donde se hizo doble clic
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
    }
  });

  // Manejar el arrastre del marcador
  const eventHandlers = {
    dragend(e: any) {
      const marker = e.target;
      const position = marker.getLatLng();
      setPosition([position.lat, position.lng]);
    }
  };

  return (
    <Marker 
      {...({ 
        position, 
        icon: selectedReportIcon,
        draggable: true,
        eventHandlers 
      } as any)}
    >
      <Popup>
        <div className="text-foreground">
          <h3 className="font-medium text-lg">{title}</h3>
          {description && <p className="text-sm mt-1">{description}</p>}
          <p className="text-xs mt-2 text-muted-foreground">Arrastre el marcador o haga doble clic en el mapa para actualizar la posición</p>
        </div>
      </Popup>
    </Marker>
  );
};

const MapaReporteEditable: React.FC<MapaReporteEditableProps> = ({
  reporte,
  className,
  height,
  onPosicionActualizada
}) => {
  // Inicializar la posición desde el reporte - usar las propiedades correctas
  const initialPosition: [number, number] = [
    Number(reporte.latitud) || 0, 
    Number(reporte.longitud) || 0
  ];
  const [position, setPosition] = useState<[number, number]>(initialPosition);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
  
  console.log('🗺️ MapaReporteEditable - Reporte object:', reporte);
  console.log('🗺️ MapaReporteEditable - Initial position:', initialPosition);

  const handlePositionChange = useCallback((newPos: [number, number]) => {
    console.log('📍 Position changed to:', newPos);
    setPosition(newPos);
    if (onPosicionActualizada) {
      onPosicionActualizada(newPos);
    }
  }, [onPosicionActualizada]);

  // Fetch address data when position changes using new utility
  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        setIsLoadingAddress(true);
        const [lat, lon] = position;
        
        // Solo hacer la llamada si las coordenadas son válidas
        if (lat !== 0 && lon !== 0) {
          const data = await reverseGeocode(lat, lon);
          setAddressData(data);
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        toast.error("No se pudo obtener la dirección. Verifique su conexión a internet.");
        setAddressData(null);
      } finally {
        setIsLoadingAddress(false);
      }
    };
    
    // Add a small delay to avoid rapid API calls
    const timeoutId = setTimeout(fetchAddressData, 500);
    return () => clearTimeout(timeoutId);
  }, [position]);

  // Format address for display
  const formatAddress = (): string | FormattedAddress => {
    if (!addressData) return "Obteniendo dirección...";
    
    const { address } = addressData;
    if (!address) return addressData.display_name;
    
    // Create main address line with complete display_name
    const mainAddress = addressData.display_name;
    
    // Create reference (area information)
    const reference = [
      address.suburb,
      address.city,
      address.state,
      address.country
    ].filter(Boolean).join(", ");
    
    return { mainAddress, reference };
  };

  // Get formatted address
  const formattedAddress = formatAddress();

  console.log('🗺️ MapaReporteEditable - Current position:', position);

  // Si no hay coordenadas válidas, mostrar mensaje
  if (initialPosition[0] === 0 && initialPosition[1] === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <p className="text-yellow-800 dark:text-yellow-200">Este reporte no tiene coordenadas válidas para mostrar en el mapa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MapaBase 
        className={className} 
        height={height}
        initialCenter={initialPosition}
        zoom={16}
      >
        <RecenterAutomatically position={position} maxZoom={16} />
        
        <EditableMarker 
          position={position}
          setPosition={handlePositionChange}
          title={reporte.title || reporte.titulo || 'Reporte'}
          description={reporte.description || reporte.descripcion}
        />
      </MapaBase>

      <div className="p-4 bg-card text-foreground rounded-md shadow-sm border border-border">
        <h3 className="text-lg font-medium mb-2">Ubicación del reporte</h3>
        
        {isLoadingAddress ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        ) : addressData ? (
          <div className="space-y-2">
            <div>
              <p className="font-medium">Dirección:</p>
              <p className="text-muted-foreground">
                {typeof formattedAddress === 'string' 
                  ? formattedAddress 
                  : (formattedAddress.mainAddress || "No disponible")}
              </p>
            </div>
            <div>
              <p className="font-medium">Referencia:</p>
              <p className="text-muted-foreground">
                {typeof formattedAddress === 'string' 
                  ? "" 
                  : (formattedAddress.reference || "No disponible")}
              </p>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ({position[0].toFixed(6)}, {position[1].toFixed(6)})
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No se pudo obtener la información de la dirección</p>
        )}
      </div>
    </div>
  );
};

export default MapaReporteEditable;
