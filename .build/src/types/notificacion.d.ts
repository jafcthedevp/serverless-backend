export type TipoPago = 'YAPE' | 'PLIN' | 'BCP' | 'INTERBANK' | 'IMAGEN_MANUAL' | 'OTRO';
export interface NotificacionYape {
    PK: string;
    SK: string;
    tipo_pago: TipoPago;
    monto?: number;
    nombre_pagador?: string;
    codigo_seguridad?: string;
    numero_operacion?: string;
    fecha_hora?: string;
    texto_raw: string;
    codigo_dispositivo: string;
    estado: 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO' | 'REVISION_MANUAL';
    parseado: boolean;
    created_at: string;
    revisado_por?: string;
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
//# sourceMappingURL=notificacion.d.ts.map