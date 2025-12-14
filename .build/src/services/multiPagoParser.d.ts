import { NotificacionParseada } from '../types/notificacion';
/**
 * Parser unificado para múltiples métodos de pago
 */
export declare class MultiPagoParser {
    /**
     * Intenta parsear una notificación de Plin
     */
    static parsePlin(texto: string): NotificacionParseada | null;
    /**
     * Intenta parsear una notificación de BCP
     */
    static parseBCP(texto: string): NotificacionParseada | null;
    /**
     * Intenta parsear una notificación de Interbank
     */
    static parseInterbank(texto: string): NotificacionParseada | null;
    /**
     * Extrae monto de cualquier notificación bancaria
     */
    private static extractMonto;
    /**
     * Extrae nombre del pagador
     */
    private static extractNombre;
    /**
     * Extrae número de operación
     */
    private static extractNumeroOperacion;
    /**
     * Extrae fecha y hora
     */
    private static extractFechaHora;
}
//# sourceMappingURL=multiPagoParser.d.ts.map