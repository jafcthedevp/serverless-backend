export type TipoPago = 'YAPE' | 'PLIN' | 'BCP' | 'INTERBANK' | 'IMAGEN_MANUAL' | 'OTRO';

export interface NotificacionYape {
  PK: string; // "NOTIF#03443217"
  SK: string; // "2025-11-22T11:34:00"

  // Tipo de pago detectado
  tipo_pago: TipoPago;

  // Datos parseados de la notificación (pueden ser null si no se pudo parsear)
  monto?: number;
  nombre_pagador?: string;
  codigo_seguridad?: string;
  numero_operacion?: string;
  fecha_hora?: string;

  // Texto raw de la notificación (para revisión manual)
  texto_raw: string;

  // Dispositivo que capturó la notificación
  codigo_dispositivo: string;

  // Control
  estado: 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO' | 'REVISION_MANUAL';
  parseado: boolean;
  created_at: string;

  // Para revisión manual
  revisado_por?: string; // Email/ID del operador
  fecha_revision?: string;
  notas_revision?: string;
}

export interface NotificacionRaw {
  texto: string;
  packageName: string;
  timestamp: number;
  codigo_dispositivo: string;
}

export interface NotificacionParseada {
  monto: number;
  nombre_pagador: string;
  codigo_seguridad: string;
  numero_operacion: string;
  fecha_hora: string;
}
