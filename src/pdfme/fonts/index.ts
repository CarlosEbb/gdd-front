// fonts.ts
import type { Font } from '@pdfme/common';

// Función para cargar las fuentes desde un archivo
export const loadFont = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al cargar la fuente desde ${url}`);
  }
  return response.arrayBuffer();
};

// Inicializar y devolver todas las fuentes
export const initializeFonts = async (): Promise<Font> => {
  const ruta = `${import.meta.env.PUBLIC_BASE_URL}/uploads/fonts`;
  const tipo = `Regular`;//Regular Bold Italic
  const roboto = await loadFont(`${ruta}/Roboto/Roboto-${tipo}.ttf`);
  const OpenSans = await loadFont(`${ruta}/OpenSans/OpenSans-${tipo}.ttf`);
  const ComicNeue = await loadFont(`${ruta}/ComicNeue/ComicNeue-${tipo}.ttf`);

  return {
    Roboto: {
      data: roboto, // URL directa de la fuente
      fallback: true, // Usar esta fuente como predeterminada si no se especifica otra
    },
    OpenSans: {
      data: OpenSans, 
      fallback: false,
    },
    ComicNeue: {
      data: ComicNeue,
      fallback: false,
    },
  };
};