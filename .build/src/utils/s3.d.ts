export declare class S3Service {
    /**
     * Sube un archivo a S3
     */
    static subirArchivo(bucket: string, key: string, body: Buffer, contentType?: string): Promise<string>;
    /**
     * Descarga un archivo de S3
     */
    static descargarArchivo(bucket: string, key: string): Promise<Buffer>;
    /**
     * Genera una clave única para el archivo
     */
    static generarKeyVoucher(vendedorWhatsApp: string, extension?: string): string;
}
export declare const S3_BUCKET: string;
//# sourceMappingURL=s3.d.ts.map