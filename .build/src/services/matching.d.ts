import { NotificacionYape } from '../types/notificacion';
import { VoucherDatos, ResultadoValidacion } from '../types/venta';
/**
 * Servicio para realizar el matching entre notificaciones y vouchers
 */
export declare class MatchingService {
    /**
     * Valida un voucher contra una notificación de Yape
     * Realiza 2 checks obligatorios (matching simple):
     * 1. Código de seguridad (EXACTO)
     * 2. Monto (EXACTO)
     *
     * Nota: El número de operación ya no se usa para matching, solo para anti-duplicación
     */
    static validarVenta(voucher: VoucherDatos, notificacion: NotificacionYape): ResultadoValidacion;
    /**
     * Formatea el mensaje de éxito
     */
    private static formatearMensajeExito;
    /**
     * Formatea los campos que no coinciden para mostrar al usuario
     */
    private static formatearCamposNoCoincidentes;
    /**
     * Verifica si una operación ya fue validada
     */
    static generarMensajeDuplicado(numeroOperacion: string, vendedor: string, fecha: string): string;
}
//# sourceMappingURL=matching.d.ts.map