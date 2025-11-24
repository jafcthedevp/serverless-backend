export interface Dispositivo {
  PK: string; // "DISPOSITIVO#TK6-600"
  codigo: string;
  nombre: string;
  telefono_completo?: string;
  ultimos_digitos?: string;
  tipo: 'YAPE' | 'TRANSFERENCIA';
  empresa: 'OVERSHARK' | 'BRAVOS';
  ubicacion: 'LIMA' | 'PROVINCIA' | 'TIKTOK' | 'TRANSFERENCIA';
  activo: boolean;
  ultima_notificacion?: string;
}

export interface SesionVendedor {
  PK: string; // "SESION#51957614218"
  estado: 'ESPERANDO_IMAGEN' | 'ESPERANDO_DATOS_TEXTO';

  // Datos extraídos de la imagen
  datosImagen?: {
    monto: number;
    codigoSeguridad: string;
    numeroOperacion: string;
    fechaHora: string;
  };

  // Referencia al voucher en S3
  s3Key?: string;

  // Control
  created_at: string;
  ttl: number; // Expira en 30 minutos
}
