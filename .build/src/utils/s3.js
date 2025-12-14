"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_BUCKET = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client = new client_s3_1.S3Client({});
class S3Service {
    /**
     * Sube un archivo a S3
     */
    static async subirArchivo(bucket, key, body, contentType) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType || 'application/octet-stream',
        });
        await s3Client.send(command);
        return key;
    }
    /**
     * Descarga un archivo de S3
     */
    static async descargarArchivo(bucket, key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const response = await s3Client.send(command);
        const stream = response.Body;
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    /**
     * Genera una clave única para el archivo
     */
    static generarKeyVoucher(vendedorWhatsApp, extension = 'jpg') {
        const timestamp = Date.now();
        const numeroLimpio = vendedorWhatsApp.replace(/\D/g, '');
        return `vouchers/${timestamp}-${numeroLimpio}.${extension}`;
    }
}
exports.S3Service = S3Service;
exports.S3_BUCKET = process.env.S3_BUCKET || 'overshark-vouchers';
//# sourceMappingURL=s3.js.map