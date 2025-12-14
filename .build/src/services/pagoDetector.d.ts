import { TipoPago } from '../types/notificacion';
/**
 * Servicio para detectar el tipo de pago basado en el texto de la notificación
 */
export declare class PagoDetector {
    /**
     * Detecta el tipo de pago basado en el contenido del texto
     */
    static detectarTipoPago(texto: string): TipoPago;
    /**
     * Determina si un tipo de pago requiere revisión manual
     */
    static requiereRevisionManual(tipoPago: TipoPago): boolean;
    /**
     * Obtiene el nombre legible del tipo de pago
     */
    static obtenerNombreTipoPago(tipoPago: TipoPago): string;
}
//# sourceMappingURL=pagoDetector.d.ts.map