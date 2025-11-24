export interface VentaValidada {
  PK: string; // "VENTA#03443217"
  SK: string; // "2025-11-22T11:35:00"

  // Identificación
  numero_operacion: string;

  // Datos del cliente (quien pagó)
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_ubicacion?: string;

  // Datos del pago
  monto: number;
  codigo_seguridad: string;
  fecha_hora_pago: string;

  // Códigos de servicio
  codigo_servicio_voucher: string; // Del voucher
  codigo_servicio_notificacion: string; // Donde llegó

  // Vendedor que validó (desde WhatsApp)
  vendedor_whatsapp: string;
  vendedor_nombre?: string;

  // Matching
  match_exitoso: boolean;
  confianza_match: number;
  campos_coincidentes: string[];

  // Estado
  estado: 'VALIDADO' | 'RECHAZADO' | 'REVISION_MANUAL';
  validado_por: 'SISTEMA_AUTOMATICO' | 'OPERADOR_MANUAL';
  fecha_hora_validacion: string;

  // Referencia al voucher
  voucher_s3_key?: string;
}

export interface VoucherDatos {
  // De la IMAGEN (Textract)
  monto: number;
  codigoSeguridad: string;
  numeroOperacion: string;
  fechaHora: string;

  // Del TEXTO (vendedor)
  nombreCliente: string;
  codigoServicio: string;
  telefonoCliente?: string;
  ubicacion?: string;

  // Metadata
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
