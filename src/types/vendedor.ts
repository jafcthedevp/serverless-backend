/**
 * Tipos relacionados con vendedores
 */

export type EstadoVendedor = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'BLOQUEADO';

/**
 * Vendedor registrado en el sistema
 */
export interface Vendedor {
  PK: string; // VENDEDOR#{telefono}
  telefono: string; // Formato: 51957614218 (sin +)
  nombre?: string; // Nombre del vendedor
  estado: EstadoVendedor;

  // Metadata
  fecha_registro: string; // ISO timestamp
  primer_mensaje?: string; // Primer mensaje que envió
  total_validaciones?: number; // Contador de validaciones realizadas
  ultima_actividad?: string; // ISO timestamp

  // Aprobación
  aprobado_por?: string; // Teléfono del admin que aprobó
  fecha_aprobacion?: string; // ISO timestamp
  razon_rechazo?: string; // Si fue rechazado, por qué

  // Opcional
  email?: string;
  ubicacion?: string; // Lima, Provincia, etc.
  notas?: string; // Notas del administrador
}

/**
 * Solicitud de aprobación de vendedor
 */
export interface SolicitudAprobacion {
  telefono: string;
  accion: 'APROBAR' | 'RECHAZAR';
  razon?: string; // Requerido si es RECHAZAR
  admin_telefono: string; // Quien aprueba/rechaza
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
  tasa_exito: number; // Porcentaje
  primera_validacion: string;
  ultima_validacion: string;
}
