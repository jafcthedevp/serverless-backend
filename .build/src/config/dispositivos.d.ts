import { Dispositivo } from '../types/dispositivo';
/**
 * Configuración de los 21 dispositivos que reciben pagos
 */
export declare const DISPOSITIVOS_CONFIG: Omit<Dispositivo, 'PK' | 'activo' | 'ultima_notificacion'>[];
/**
 * Obtiene un dispositivo por su código
 */
export declare function obtenerDispositivoPorCodigo(codigo: string): typeof DISPOSITIVOS_CONFIG[0] | undefined;
/**
 * Lista todos los códigos de dispositivos
 */
export declare function listarCodigosDispositivos(): string[];
/**
 * Valida si un código de dispositivo existe
 */
export declare function esCodigoValido(codigo: string): boolean;
//# sourceMappingURL=dispositivos.d.ts.map