
/**
 * Utility functions for handling maps and location services
 */

export interface LocationData {
  latitud: number;
  longitud: number;
  direccion?: string;
  referencia?: string;
}

/**
 * Opens a location in Google Maps using coordinates
 */
export const openInGoogleMaps = (location: LocationData) => {
  const { latitud, longitud } = location;
  
  if (!latitud || !longitud) {
    console.warn('No se pueden abrir las coordenadas en Google Maps: coordenadas faltantes');
    return;
  }

  // Crear URL de Google Maps con las coordenadas
  const googleMapsUrl = `https://www.google.com/maps?q=${latitud},${longitud}`;
  
  // Abrir en una nueva pestaña
  window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Opens a location in Google Maps using an address string
 */
export const openAddressInGoogleMaps = (address: string) => {
  if (!address || address.trim() === '') {
    console.warn('No se puede abrir la dirección en Google Maps: dirección vacía');
    return;
  }

  // Codificar la dirección para URL
  const encodedAddress = encodeURIComponent(address.trim());
  const googleMapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
  
  // Abrir en una nueva pestaña
  window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Gets a Google Maps URL for embedding
 */
export const getGoogleMapsEmbedUrl = (location: LocationData, zoom: number = 15): string => {
  const { latitud, longitud } = location;
  
  if (!latitud || !longitud) {
    return '';
  }

  return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${longitud}!3d${latitud}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1234567890!5m2!1sen!2s&z=${zoom}`;
};

/**
 * Formats coordinates for display
 */
export const formatCoordinates = (latitud: number, longitud: number, precision: number = 6): string => {
  return `${latitud.toFixed(precision)}, ${longitud.toFixed(precision)}`;
};
