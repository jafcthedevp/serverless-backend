export interface NotificacionYape {
  PK: string; // "NOTIF#03443217"
  SK: string; // "2025-11-22T11:34:00"

  // Datos parseados de la notificación Yape
  monto: number;
  nombre_pagador: string;
  codigo_seguridad: string;
  numero_operacion: string;
  fecha_hora: string;

  // Dispositivo que capturó la notificación
  codigo_dispositivo: string;

  // Control
  estado: 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO' | 'REVISION_MANUAL';
  parseado: boolean;
  created_at: string;
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
