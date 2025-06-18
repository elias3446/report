
// Función para normalizar texto (eliminar acentos, convertir a minúsculas)
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
};

// Lista ampliada de lugares comunes para búsqueda predictiva
export const commonPlaces = [
  "Universidad",
  "Hospital",
  "Parque",
  "Escuela",
  "Colegio",
  "Biblioteca",
  "Museo",
  "Centro Comercial",
  "Estadio",
  "Terminal",
  "Mercado",
  "Plaza",
  "Banco",
  "Restaurant",
  "Hotel",
  "Aeropuerto",
  "Farmacia",
  "Supermercado",
  "Iglesia",
  "Teatro",
  "Cine",
  "Gimnasio",
  "Tienda",
  "Café",
  "Bar",
  "Oficina",
  "Correo",
  "Estación",
  "Gasolinera",
  "Playa"
];

// Función mejorada para obtener sugerencias predictivas
export const getPredictiveSuggestions = (query: string): string[] => {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const normalizedQuery = normalizeText(query);
  
  return commonPlaces
    .filter(place => normalizeText(place).includes(normalizedQuery))
    .slice(0, 5);
};

// Lista de lugares específicos con ubicaciones populares
export const popularLocations = [
  "Parque La Carolina, Quito",
  "Malecón 2000, Guayaquil",
  "Universidad Central del Ecuador, Quito",
  "Plaza de la Independencia, Quito", 
  "Playa Montañita, Santa Elena",
  "Aeropuerto Mariscal Sucre, Quito",
  "Terminal Terrestre, Guayaquil",
  "Estadio Rodrigo Paz Delgado, Quito",
  "Catedral Metropolitana, Cuenca",
  "Hospital Metropolitano, Quito"
];

// Función para obtener ubicaciones populares que coinciden con la búsqueda
export const getMatchingPopularLocations = (query: string): string[] => {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const normalizedQuery = normalizeText(query);
  
  return popularLocations
    .filter(location => normalizeText(location).includes(normalizedQuery))
    .slice(0, 3);
};
