"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiPagoParser = void 0;
const logger_1 = require("@aws-lambda-powertools/logger");
const logger = new logger_1.Logger({
    serviceName: 'overshark-backend',
    logLevel: 'INFO',
});
/**
 * Parser unificado para múltiples métodos de pago
 */
class MultiPagoParser {
    /**
     * Intenta parsear una notificación de Plin
     */
    static parsePlin(texto) {
        try {
            // Patrones similares a Yape pero adaptados para Plin
            const monto = this.extractMonto(texto);
            const nombre_pagador = this.extractNombre(texto, 'plin');
            const numero_operacion = this.extractNumeroOperacion(texto);
            const fecha_hora = this.extractFechaHora(texto);
            if (!monto || !numero_operacion) {
                return null;
            }
            return {
                monto,
                nombre_pagador: nombre_pagador || 'Desconocido',
                codigo_seguridad: '', // Plin no siempre tiene código de seguridad
                numero_operacion,
                fecha_hora: fecha_hora || new Date().toISOString(),
            };
        }
        catch (error) {
            logger.error('Error parseando Plin', { error });
            return null;
        }
    }
    /**
     * Intenta parsear una notificación de BCP
     */
    static parseBCP(texto) {
        try {
            const monto = this.extractMonto(texto);
            const nombre_pagador = this.extractNombre(texto, 'bcp');
            const numero_operacion = this.extractNumeroOperacion(texto);
            const fecha_hora = this.extractFechaHora(texto);
            if (!monto || !numero_operacion) {
                return null;
            }
            return {
                monto,
                nombre_pagador: nombre_pagador || 'Desconocido',
                codigo_seguridad: '',
                numero_operacion,
                fecha_hora: fecha_hora || new Date().toISOString(),
            };
        }
        catch (error) {
            logger.error('Error parseando BCP', { error });
            return null;
        }
    }
    /**
     * Intenta parsear una notificación de Interbank
     */
    static parseInterbank(texto) {
        try {
            const monto = this.extractMonto(texto);
            const nombre_pagador = this.extractNombre(texto, 'interbank');
            const numero_operacion = this.extractNumeroOperacion(texto);
            const fecha_hora = this.extractFechaHora(texto);
            if (!monto || !numero_operacion) {
                return null;
            }
            return {
                monto,
                nombre_pagador: nombre_pagador || 'Desconocido',
                codigo_seguridad: '',
                numero_operacion,
                fecha_hora: fecha_hora || new Date().toISOString(),
            };
        }
        catch (error) {
            logger.error('Error parseando Interbank', { error });
            return null;
        }
    }
    /**
     * Extrae monto de cualquier notificación bancaria
     */
    static extractMonto(texto) {
        const patterns = [
            /S\/\s*([\d,]+\.?\d*)/i,
            /S\/\s*([\d,]+)/i,
            /(\d+\.?\d*)\s*soles?/i,
            /PEN\s*([\d,]+\.?\d*)/i,
            /monto[:\s]*([\d,]+\.?\d*)/i,
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
     * Extrae nombre del pagador
     */
    static extractNombre(texto, _tipo) {
        const patterns = [
            /(?:de|desde|remitente)[:\s]+([^\n]+)/i,
            /(?:nombre|titular)[:\s]+([^\n]+)/i,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
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
     * Extrae número de operación
     */
    static extractNumeroOperacion(texto) {
        const patterns = [
            /Nro\.\s*de\s*operaci[oó]n\s*[\n:]*\s*(\d+)/i,
            /N[uú]mero\s+de\s+operaci[oó]n\s*[\n:]*\s*(\d+)/i,
            /Operaci[oó]n\s*[\n:]*\s*(\d+)/i,
            /Referencia\s*[\n:]*\s*(\d+)/i,
            /Nro\.?\s*operaci[oó]n\s*[\n:]*\s*(\d+)/i,
            /ID\s*transacci[oó]n\s*[\n:]*\s*(\d+)/i,
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
     * Extrae fecha y hora
     */
    static extractFechaHora(texto) {
        const patterns = [
            /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+(\d{4})\s*\|\s*(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)/i,
            /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/,
            /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/,
        ];
        for (const pattern of patterns) {
            const match = texto.match(pattern);
            if (match) {
                try {
                    const fecha = new Date();
                    return fecha.toISOString();
                }
                catch (error) {
                    continue;
                }
            }
        }
        return null;
    }
}
exports.MultiPagoParser = MultiPagoParser;
//# sourceMappingURL=multiPagoParser.js.map