import { VoucherDatos, ResultadoValidacion } from '../types/venta';
/**
 * Valida un voucher contra las notificaciones de Yape
 * Implementa el algoritmo de matching de 5 checks
 */
export declare function validarVoucher(voucher: VoucherDatos): Promise<ResultadoValidacion>;
/**
 * Lambda Handler (opcional - por si se quiere exponer como endpoint independiente)
 */
export declare const handler: (event: any) => Promise<any>;
//# sourceMappingURL=validarConMatch.d.ts.map