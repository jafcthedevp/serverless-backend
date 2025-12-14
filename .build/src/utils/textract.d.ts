export declare class TextractService {
    /**
     * Extrae texto de una imagen almacenada en S3
     */
    static extraerTextoDeS3(bucket: string, key: string): Promise<string>;
    /**
     * Extrae texto de un buffer de imagen
     */
    static extraerTextoDeBuffer(imageBuffer: Buffer): Promise<string>;
    /**
     * Procesa los bloques de Textract y extrae el texto línea por línea
     */
    private static procesarBloques;
    /**
     * Extrae texto con información de confianza
     */
    static extraerTextoConConfianza(bucket: string, key: string): Promise<{
        texto: string;
        confianza: number;
    }>;
}
//# sourceMappingURL=textract.d.ts.map