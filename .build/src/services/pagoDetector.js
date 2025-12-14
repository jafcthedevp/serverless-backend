"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagoDetector = void 0;
/**
 * Servicio para detectar el tipo de pago basado en el texto de la notificación
 */
class PagoDetector {
    /**
     * Detecta el tipo de pago basado en el contenido del texto
     */
    static detectarTipoPago(texto) {
        const textoLower = texto.toLowerCase();
        // Detectar Yape
        if (textoLower.includes('yape') ||
            textoLower.includes('yapeaste') ||
            textoLower.includes('te yapearon')) {
            return 'YAPE';
        }
        // Detectar Plin
        if (textoLower.includes('plin') ||
            textoLower.includes('plineaste') ||
            textoLower.includes('te plinearon')) {
            return 'PLIN';
        }
        // Detectar BCP
        if (textoLower.includes('bcp') ||
            textoLower.includes('banco de credito') ||
            textoLower.includes('banco de crédito') ||
            textoLower.includes('transferencia bcp')) {
            return 'BCP';
        }
        // Detectar Interbank
        if (textoLower.includes('interbank') ||
            textoLower.includes('transferencia interbank')) {
            return 'INTERBANK';
        }
        // Si no se reconoce, marcarlo como OTRO
        return 'OTRO';
    }
    /**
     * Determina si un tipo de pago requiere revisión manual
     */
    static requiereRevisionManual(tipoPago) {
        return tipoPago !== 'YAPE';
    }
    /**
     * Obtiene el nombre legible del tipo de pago
     */
    static obtenerNombreTipoPago(tipoPago) {
        const nombres = {
            YAPE: 'Yape',
            PLIN: 'Plin',
            BCP: 'BCP',
            INTERBANK: 'Interbank',
            IMAGEN_MANUAL: 'Imagen Manual',
            OTRO: 'Otro método de pago',
        };
        return nombres[tipoPago];
    }
}
exports.PagoDetector = PagoDetector;
//# sourceMappingURL=pagoDetector.js.map