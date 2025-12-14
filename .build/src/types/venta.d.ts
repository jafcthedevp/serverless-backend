export interface VentaValidada {
    PK: string;
    SK: string;
    numero_operacion: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    cliente_ubicacion?: string;
    monto: number;
    codigo_seguridad: string;
    fecha_hora_pago: string;
    codigo_servicio_voucher: string;
    codigo_servicio_notificacion: string;
    vendedor_whatsapp: string;
    vendedor_nombre?: string;
    match_exitoso: boolean;
    confianza_match: number;
    campos_coincidentes: string[];
    estado: 'VALIDADO' | 'RECHAZADO' | 'REVISION_MANUAL';
    validado_por: 'SISTEMA_AUTOMATICO' | 'OPERADOR_MANUAL';
    fecha_hora_validacion: string;
    voucher_s3_key?: string;
}
export interface VoucherDatos {
    monto: number;
    codigoSeguridad: string;
    numeroOperacion: string;
    fechaHora: string;
    nombreCliente: string;
    codigoServicio: string;
    telefonoCliente?: string;
    ubicacion?: string;
    vendedorWhatsApp: string;
    voucherUrl?: string;
}
export interface ResultadoValidacion {
    valido: boolean;
    confianza?: number;
    razon?: string;
    mensaje: string;
    campos_coincidentes?: string[];
}
//# sourceMappingURL=venta.d.ts.map