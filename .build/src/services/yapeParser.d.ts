import { NotificacionParseada } from '../types/notificacion';
export declare class YapeParser {
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
    static parseNotificacion(texto: string): NotificacionParseada | null;
    /**
     * Extrae el monto de la notificación
     * Busca patrones como: "S/100", "S/ 100.50", "S/1,500.00"
     */
    static extractMonto(texto: string): number | null;
    /**
     * Extrae el nombre del pagador
     */
    static extractNombrePagador(texto: string): string | null;
    /**
     * Extrae el código de seguridad
     * Busca patrones como: "5 0 2", "502", "217"
     */
    static extractCodigoSeguridad(texto: string): string | null;
    /**
     * Extrae el número de operación
     */
    private static extractNumeroOperacion;
    /**
     * Extrae la fecha y hora
     * Busca patrones como: "22 nov. 2025 | 11:34 a.m."
     */
    private static extractFechaHora;
    /**
     * Parsea texto extraído de Textract (voucher de imagen)
     */
    static parseVoucherTextract(textoExtraido: string): {
        monto: number;
        codigoSeguridad: string;
        numeroOperacion: string;
        fechaHora: string;
    };
}
//# sourceMappingURL=yapeParser.d.ts.map