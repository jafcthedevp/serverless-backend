export interface Dispositivo {
    PK: string;
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
    PK: string;
    estado: 'ESPERANDO_IMAGEN' | 'ESPERANDO_DATOS_TEXTO';
    datosImagen?: {
        monto: number;
        codigoSeguridad: string;
        numeroOperacion: string;
        fechaHora: string;
    };
    s3Key?: string;
    created_at: string;
    ttl: number;
}
//# sourceMappingURL=dispositivo.d.ts.map