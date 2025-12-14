/**
 * Tipos relacionados con vendedores
 */
export type EstadoVendedor = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'BLOQUEADO';
/**
 * Vendedor registrado en el sistema
 */
export interface Vendedor {
    PK: string;
    telefono: string;
    nombre?: string;
    estado: EstadoVendedor;
    fecha_registro: string;
    primer_mensaje?: string;
    total_validaciones?: number;
    ultima_actividad?: string;
    aprobado_por?: string;
    fecha_aprobacion?: string;
    razon_rechazo?: string;
    email?: string;
    ubicacion?: string;
    notas?: string;
}
/**
 * Solicitud de aprobación de vendedor
 */
export interface SolicitudAprobacion {
    telefono: string;
    accion: 'APROBAR' | 'RECHAZAR';
    razon?: string;
    admin_telefono: string;
}
/**
 * Estadísticas de vendedor
 */
export interface EstadisticasVendedor {
    telefono: string;
    nombre?: string;
    total_validaciones: number;
    validaciones_exitosas: number;
    validaciones_rechazadas: number;
    tasa_exito: number;
    primera_validacion: string;
    ultima_validacion: string;
}
//# sourceMappingURL=vendedor.d.ts.map