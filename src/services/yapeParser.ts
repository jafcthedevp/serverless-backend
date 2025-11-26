import { Logger } from '@aws-lambda-powertools/logger';
import { NotificacionParseada } from '../types/notificacion';

const logger = new Logger({
  serviceName: 'overshark-backend',
  logLevel: 'INFO',
});

export class YapeParser {
  /**
   * Parsea una notificación de Yape capturada desde Android
   *
   * Formato esperado:
   * "¡Yapeaste!
   *  S/100
   *  Overshark Peru Sac
   *  22 nov. 2025 | 11:34 a.m.
   *  CÓDIGO DE SEGURIDAD
   *  5 0 2
   *  Nro. de operación
   *  03443217"
   */
  static parseNotificacion(texto: string): NotificacionParseada | null {
    try {
      const monto = this.extractMonto(texto);
      const nombre_pagador = this.extractNombrePagador(texto);
      const codigo_seguridad = this.extractCodigoSeguridad(texto);
      const numero_operacion = this.extractNumeroOperacion(texto);
      const fecha_hora = this.extractFechaHora(texto);

      if (!monto || !numero_operacion) {
        logger.warn('Falta información crítica en la notificación', {
          tiene_monto: !!monto,
          tiene_numero_operacion: !!numero_operacion,
        });
        return null;
      }

      return {
        monto,
        nombre_pagador: nombre_pagador || 'Desconocido',
        codigo_seguridad: codigo_seguridad || '',
        numero_operacion,
        fecha_hora: fecha_hora || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error parseando notificación', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Extrae el monto de la notificación
   * Busca patrones como: "S/100", "S/ 100.50", "S/1,500.00"
   */
  private static extractMonto(texto: string): number | null {
    const patterns = [
      /S\/\s*([\d,]+\.?\d*)/i,
      /S\/\s*([\d,]+)/i,
      /(\d+\.?\d*)\s*soles?/i,
    ];

    for (const pattern of patterns) {
      const match = texto.match(pattern);
      if (match) {
        const montoStr = match[1].replace(/,/g, '');
        const monto = parseFloat(montoStr);
        if (!isNaN(monto) && monto > 0) {
          return monto;
        }
      }
    }

    return null;
  }

  /**
   * Extrae el nombre del pagador
   */
  private static extractNombrePagador(texto: string): string | null {
    // Buscar después de "Yapeaste!" o "Te yapearon" y antes de la fecha
    const patterns = [
      /(?:Yapeaste!|Te yapearon)\s*\n\s*S\/[\d,]+\.?\d*\s*\n\s*([^\n]+)/i,
      /(?:recibiste|enviaste)\s+de\s+([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = texto.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extrae el código de seguridad
   * Busca patrones como: "5 0 2", "502", "217"
   */
  private static extractCodigoSeguridad(texto: string): string | null {
    const patterns = [
      /C[ÓO]DIGO\s+DE\s+SEGURIDAD\s*[\n:]*\s*(\d)\s*(\d)\s*(\d)/i,
      /C[ÓO]DIGO\s+DE\s+SEGURIDAD\s*[\n:]*\s*(\d{3})/i,
      /SEGURIDAD\s*[\n:]*\s*(\d)\s*(\d)\s*(\d)/i,
    ];

    for (const pattern of patterns) {
      const match = texto.match(pattern);
      if (match) {
        if (match[3]) {
          return match[1] + match[2] + match[3];
        } else if (match[1]) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Extrae el número de operación
   */
  private static extractNumeroOperacion(texto: string): string | null {
    const patterns = [
      /Nro\.\s*de\s*operaci[oó]n\s*[\n:]*\s*(\d+)/i,
      /N[uú]mero\s+de\s+operaci[oó]n\s*[\n:]*\s*(\d+)/i,
      /Operaci[oó]n\s*[\n:]*\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = texto.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extrae la fecha y hora
   * Busca patrones como: "22 nov. 2025 | 11:34 a.m."
   */
  private static extractFechaHora(texto: string): string | null {
    const patterns = [
      /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+(\d{4})\s*\|\s*(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/,
    ];

    const meses: { [key: string]: number } = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    };

    for (const pattern of patterns) {
      const match = texto.match(pattern);
      if (match) {
        try {
          if (match[2] && isNaN(Number(match[2]))) {
            // Formato: "22 nov. 2025 | 11:34 a.m."
            const dia = parseInt(match[1]);
            const mes = meses[match[2].toLowerCase()];
            const año = parseInt(match[3]);
            let hora = parseInt(match[4]);
            const minuto = parseInt(match[5]);
            const periodo = match[6];

            if (periodo.toLowerCase() === 'p.m.' && hora !== 12) {
              hora += 12;
            } else if (periodo.toLowerCase() === 'a.m.' && hora === 12) {
              hora = 0;
            }

            const fecha = new Date(año, mes, dia, hora, minuto);
            return fecha.toISOString();
          } else {
            // Formato: "22/11/2025 11:34"
            const dia = parseInt(match[1]);
            const mes = parseInt(match[2]) - 1;
            const año = parseInt(match[3]);
            const hora = parseInt(match[4]);
            const minuto = parseInt(match[5]);

            const fecha = new Date(año, mes, dia, hora, minuto);
            return fecha.toISOString();
          }
        } catch (error) {
          logger.debug('Error parseando fecha', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return null;
  }

  /**
   * Parsea texto extraído de Textract (voucher de imagen)
   */
  static parseVoucherTextract(textoExtraido: string): {
    monto: number;
    codigoSeguridad: string;
    numeroOperacion: string;
    fechaHora: string;
  } {
    return {
      monto: this.extractMonto(textoExtraido) || 0,
      codigoSeguridad: this.extractCodigoSeguridad(textoExtraido) || '',
      numeroOperacion: this.extractNumeroOperacion(textoExtraido) || '',
      fechaHora: this.extractFechaHora(textoExtraido) || new Date().toISOString(),
    };
  }
}
