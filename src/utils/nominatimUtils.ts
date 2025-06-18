
// Utility functions for handling OpenCage Data API with Nominatim as fallback

const OPENCAGE_BASE_URL = 'https://api.opencagedata.com/geocode/v1';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// OpenCage API Key
const OPENCAGE_API_KEY = 'a856780aad6e43cd94566ade0185c706';

const REQUEST_DELAY = 1000;
let lastRequestTime = 0;

// Rate limiting function
const waitForRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    const waitTime = REQUEST_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// Fetch with timeout
const fetchWithTimeout = async (url: string, options: any = {}, timeout: number = 8000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// OpenCage Data fetch (primary service)
const openCageFetch = async (query: string): Promise<any> => {
  const url = `${OPENCAGE_BASE_URL}/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&language=es&pretty=1`;
  console.log(`🌐 Fetching from OpenCage: ${url}`);
  
  const response = await fetchWithTimeout(url);
  
  if (!response.ok) {
    throw new Error(`OpenCage API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};

// Nominatim fetch as fallback
const nominatimFetch = async (endpoint: string): Promise<any> => {
  await waitForRateLimit();
  
  const url = `${NOMINATIM_BASE_URL}${endpoint}`;
  console.log(`🔄 Fallback: Fetching from Nominatim: ${url}`);
  
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'GeoReport-App/1.0 (https://example.com/contact)',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};

// Convert OpenCage result to Nominatim-like format
const convertOpenCageToNominatim = (openCageData: any): any => {
  if (!openCageData || !openCageData.results || openCageData.results.length === 0) {
    return null;
  }
  
  const result = openCageData.results[0];
  const components = result.components;
  
  return {
    lat: result.geometry.lat.toString(),
    lon: result.geometry.lng.toString(),
    display_name: result.formatted || 'Ubicación encontrada',
    address: {
      road: components.road || components.street,
      house_number: components.house_number,
      city: components.city || components.town || components.village,
      suburb: components.suburb || components.neighbourhood || components.neighborhood,
      state: components.state || components.province || components.region,
      country: components.country,
      postcode: components.postcode || components.postal_code,
      amenity: components.amenity,
      building: components.building,
      tourism: components.tourism,
      shop: components.shop
    }
  };
};

export const reverseGeocode = async (lat: number, lon: number): Promise<any> => {
  try {
    console.log(`🔍 Reverse geocoding: ${lat}, ${lon}`);
    const query = `${lat},${lon}`;
    const data = await openCageFetch(query);
    
    if (data && data.results && data.results.length > 0) {
      console.log('✅ Reverse geocoding successful with OpenCage');
      return convertOpenCageToNominatim(data);
    } else {
      throw new Error('No data returned from OpenCage');
    }
  } catch (error) {
    console.warn('⚠️ OpenCage reverse geocoding failed, trying Nominatim:', error);
    
    try {
      const endpoint = `/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`;
      const data = await nominatimFetch(endpoint);
      
      if (data && data.display_name) {
        console.log('✅ Reverse geocoding successful with Nominatim fallback');
        return data;
      } else {
        throw new Error('No data returned from Nominatim');
      }
    } catch (nominatimError) {
      console.error('❌ Both geocoding services failed:', nominatimError);
      
      // Return a basic fallback with coordinates only
      return {
        lat: lat.toString(),
        lon: lon.toString(),
        display_name: `Coordenadas: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        address: {
          road: '',
          city: '',
          country: ''
        }
      };
    }
  }
};

export const searchLocation = async (query: string, countryCode?: string): Promise<any[]> => {
  try {
    console.log(`🔍 Searching location: ${query}`);
    const searchQuery = countryCode ? `${query}, ${countryCode}` : query;
    const data = await openCageFetch(searchQuery);
    
    if (data && data.results && data.results.length > 0) {
      console.log(`✅ Found ${data.results.length} search results with OpenCage`);
      return data.results.map((result: any) => {
        const converted = convertOpenCageToNominatim({ results: [result] });
        return {
          lat: parseFloat(converted.lat),
          lon: parseFloat(converted.lon),
          display_name: converted.display_name,
          address: converted.address
        };
      });
    } else {
      throw new Error('No search results from OpenCage');
    }
  } catch (error) {
    console.warn('⚠️ OpenCage search failed, trying Nominatim:', error);
    
    try {
      const countryFilter = countryCode ? `&countrycodes=${countryCode}` : '';
      const endpoint = `/search?format=json&q=${encodeURIComponent(query)}${countryFilter}&limit=15&addressdetails=1`;
      const data = await nominatimFetch(endpoint);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Found ${data.length} search results with Nominatim fallback`);
        return data.map((item: any) => ({
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          display_name: item.display_name,
          address: item.address
        }));
      } else {
        throw new Error('No search results from Nominatim');
      }
    } catch (nominatimError) {
      console.error('❌ Both search services failed:', nominatimError);
      throw new Error('Location search failed with all services');
    }
  }
};

// Función para formatear direcciones de forma más legible
export const formatAddressForDisplay = (addressData: any): { mainAddress: string; reference: string; details: string } => {
  if (!addressData) {
    return {
      mainAddress: "Dirección no disponible",
      reference: "Sin información de ubicación",
      details: ""
    };
  }

  const { address, display_name } = addressData;
  
  if (!address || (!address.road && !address.city && !address.state && !address.country)) {
    // Si no hay datos de dirección útiles, usar display_name como fallback
    if (display_name && display_name !== `Coordenadas: ${addressData.lat}, ${addressData.lon}`) {
      const parts = display_name.split(',').map(p => p.trim());
      return {
        mainAddress: parts.slice(0, 2).join(', ') || "Dirección no disponible",
        reference: parts.slice(2).join(', ') || "Sin referencia",
        details: ""
      };
    }
    
    return {
      mainAddress: "Dirección no disponible",
      reference: "Sin información de ubicación",
      details: ""
    };
  }

  // Construir dirección principal: Estado, Calle [Número], Código postal, Ciudad, País
  const mainAddressParts = [];
  
  // Agregar estado/provincia primero
  if (address.state) {
    mainAddressParts.push(address.state);
  }
  
  // Agregar calle con número si existe
  if (address.road) {
    const streetPart = address.house_number 
      ? `${address.road} ${address.house_number}`
      : address.road;
    mainAddressParts.push(streetPart);
  }
  
  // Agregar código postal
  if (address.postcode) {
    mainAddressParts.push(address.postcode);
  }
  
  // Agregar ciudad
  const cityName = address.city || address.town || address.village;
  if (cityName) {
    mainAddressParts.push(cityName);
  }
  
  // Agregar país
  if (address.country) {
    mainAddressParts.push(address.country);
  }
  
  let mainAddress = mainAddressParts.length > 0 ? mainAddressParts.join(', ') : '';
  
  // Si no hay dirección principal construida, usar elementos alternativos
  if (!mainAddress || mainAddress.trim() === '') {
    if (address.amenity) {
      mainAddress = address.amenity;
    } else if (address.building) {
      mainAddress = address.building;
    } else if (address.tourism) {
      mainAddress = address.tourism;
    } else if (address.shop) {
      mainAddress = address.shop;
    } else if (display_name) {
      // Usar la primera parte del display_name como fallback
      const parts = display_name.split(',');
      mainAddress = parts[0]?.trim() || 'Dirección no disponible';
    } else {
      mainAddress = 'Dirección no disponible';
    }
  }
  
  // Construir referencia (barrio/zona, ciudad, país)
  const referenceParts = [];
  
  // Agregar barrio/zona
  const neighborhood = address.neighbourhood || address.suburb || address.quarter;
  if (neighborhood) {
    referenceParts.push(neighborhood);
  }
  
  // Agregar ciudad para referencia
  const refCityName = address.city || address.town || address.village;
  if (refCityName) {
    referenceParts.push(refCityName);
  }
  
  // Agregar país para referencia
  if (address.country) {
    referenceParts.push(address.country);
  }

  let reference = referenceParts.join(', ');
  
  // Si no hay referencia construida, usar partes del display_name
  if (!reference || reference.trim() === '') {
    if (display_name) {
      const parts = display_name.split(',');
      // Tomar las partes que no están en mainAddress
      const refParts = parts.slice(1, 3).map(p => p.trim()).filter(p => p && !mainAddress.includes(p));
      reference = refParts.length > 0 ? refParts.join(', ') : 'Sin referencia';
    } else {
      reference = 'Sin referencia';
    }
  }

  return {
    mainAddress: mainAddress || "Dirección no disponible",
    reference: reference || "Sin referencia",
    details: ""
  };
};
