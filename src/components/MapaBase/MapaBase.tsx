
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';

// Define custom icons for the map
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const reportIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedReportIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter the map
function RecenterAutomatically({ position, maxZoom }: { position: [number, number]; maxZoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (position[0] !== 0 && position[1] !== 0) {
      map.setView(position, maxZoom);
    }
  }, [map, position, maxZoom]);
  
  return null;
}

// Component to track user location
function LocationMarker({ setUserPosition }: { setUserPosition: (pos: [number, number]) => void }) {
  const map = useMap();
  const [accuracy, setAccuracy] = useState<number>(0);
  
  useEffect(() => {
    map.locate({ setView: false, watch: true, enableHighAccuracy: true });
    
    const onLocationFound = (e: L.LocationEvent) => {
      const { lat, lng } = e.latlng;
      setUserPosition([lat, lng]);
      setAccuracy(e.accuracy);
    };
    
    const onLocationError = (e: L.ErrorEvent) => {
      console.warn('Location error:', e.message);
      // Don't show error to user, just log it
    };
    
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    
    return () => {
      map.stopLocate();
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
    };
  }, [map, setUserPosition]);
  
  return null;
}

// User location display component
function UserLocationMarker({ position, accuracy }: { position: [number, number], accuracy: number }) {
  if (position[0] === 0 && position[1] === 0) return null;
  
  return (
    <>
      {/* GPS accuracy circle */}
      <Circle 
        center={position} 
        pathOptions={{ 
          color: '#1EAEDB', 
          fillColor: '#33C3F0', 
          fillOpacity: 0.15,
          weight: 1
        }} 
        radius={accuracy}
      />
      {/* User position circle */}
      <CircleMarker 
        center={position}
        pathOptions={{
          color: '#0053D9',
          fillColor: '#0066FF',
          fillOpacity: 1,
          weight: 2
        }}
        radius={8}
      />
    </>
  );
}

// Componente independiente del mapa para el botón
function ExternalCenterButton({ 
  userPosition, 
  mapRef 
}: { 
  userPosition: [number, number]; 
  mapRef: React.RefObject<L.Map | null>; 
}) {
  const handleCenterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('External center button clicked - centering map view only');
    
    if (userPosition[0] !== 0 && userPosition[1] !== 0 && mapRef.current) {
      mapRef.current.setView(userPosition, 18);
      console.log('Map view centered at user position:', userPosition);
    } else {
      console.warn('User position not available or map not ready');
    }
  };

  return (
    <button 
      onClick={handleCenterClick}
      className="absolute bottom-4 right-4 bg-card text-foreground p-2 rounded-md shadow-md hover:bg-accent focus:outline-none border border-border z-[9999]"
      title="Centrar vista en tu ubicación"
      type="button"
      style={{ 
        pointerEvents: 'auto'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    </button>
  );
}

export interface MapaBaseProps {
  className?: string;
  height?: string;
  initialCenter?: [number, number];
  zoom?: number;
  maxZoom?: number;
  children?: React.ReactNode;
  hideSearchBar?: boolean;
}

const MapaBase: React.FC<MapaBaseProps> = ({
  className,
  height = "h-[500px]",
  initialCenter = [0, 0],
  zoom = 13,
  maxZoom = 18,
  children,
  hideSearchBar = false
}) => {
  const [userPosition, setUserPosition] = useState<[number, number]>([0, 0]);
  const [accuracy, setAccuracy] = useState<number>(30); // Default accuracy radius
  const mapRef = useRef<L.Map | null>(null);

  const handleSearchLocation = (location: { lat: number, lon: number }) => {
    if (mapRef.current) {
      const newPosition: [number, number] = [location.lat, location.lon];
      mapRef.current.flyTo(newPosition, 16);
    }
  };

  // Function to check if userPosition is [0, 0]
  const isDefaultPosition = (pos: [number, number]): boolean => {
    return pos[0] === 0 && pos[1] === 0;
  };

  // Update LocationMarker to also track accuracy
  const handleUserPositionUpdate = (pos: [number, number], acc?: number) => {
    setUserPosition(pos);
    if (acc) setAccuracy(acc);
  };

  return (
    <div className={cn(
      "relative w-full rounded-lg overflow-hidden shadow-lg border border-border bg-card", 
      height, 
      className
    )}>
      <div className="w-full h-full">
        <MapContainer
          {...({ 
            center: initialCenter, 
            zoom, 
            scrollWheelZoom: true 
          } as any)}
          style={{ 
            height: '100%', 
            width: '100%',
            position: 'relative', 
            zIndex: 0 
          }}
          ref={mapRef}
        >
          <TileLayer
            {...({ 
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            } as any)}
          />
          <LocationMarker setUserPosition={setUserPosition} />
          {!isDefaultPosition(userPosition) && (
            <UserLocationMarker position={userPosition} accuracy={accuracy} />
          )}
          {children}
        </MapContainer>
      </div>
      
      {/* Search bar positioned at the top with lower z-index to avoid interfering with navigation */}
      {!hideSearchBar && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-[150px] sm:max-w-[200px] md:max-w-xs px-1 sm:px-2">
          <SearchBar 
            onSearch={handleSearchLocation} 
            userPosition={!isDefaultPosition(userPosition) ? userPosition : null} 
          />
        </div>
      )}

      {/* Botón de centrar completamente fuera del contexto del mapa */}
      <ExternalCenterButton userPosition={userPosition} mapRef={mapRef} />
    </div>
  );
};

export { MapaBase, userIcon, reportIcon, selectedReportIcon, RecenterAutomatically };
