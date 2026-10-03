import { getStoredApiKey } from './authService';

export interface ApodItem {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
  copyright?: string;
}

const NASA_API_BASE = 'https://api.nasa.gov/planetary/apod';

/**
 * Consumo de recursos de la API pasando la autorización.
 * Obtiene una lista de imágenes aleatorias de la NASA tras autenticar.
 * 
 * @param count Número de imágenes a solicitar (por defecto 10)
 * @returns Promesa que resuelve a una lista de ApodItem filtrada por tipo 'image'
 */
export async function fetchNasaApod(
  count: number = 10
): Promise<ApodItem[]> {
  const userApiKey = await getStoredApiKey();

  if (!userApiKey) {
    throw new Error('UNAUTHORIZED');
  }

  const url = `${NASA_API_BASE}?api_key=${encodeURIComponent(userApiKey)}&count=${count}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 500) {
      throw new Error('La API de la NASA está fuera de servicio (Error 500).');
    }
    
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
      // Ignorar fallas de lectura de JSON de error
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as ApodItem[];

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de la API de la NASA no tiene el formato de lista esperado.');
  }

  // Filtrar únicamente los recursos de tipo imagen
  return data.filter((item) => item.media_type === 'image');
}
