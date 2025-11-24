import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

export class S3Service {
  /**
   * Sube un archivo a S3
   */
  static async subirArchivo(
    bucket: string,
    key: string,
    body: Buffer,
    contentType?: string
  ): Promise<string> {
    const command = new PutObjectCommand({
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
  static async descargarArchivo(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const stream = response.Body as any;
    const chunks: any[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: any) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Genera una clave única para el archivo
   */
  static generarKeyVoucher(vendedorWhatsApp: string, extension: string = 'jpg'): string {
    const timestamp = Date.now();
    const numeroLimpio = vendedorWhatsApp.replace(/\D/g, '');
    return `vouchers/${timestamp}-${numeroLimpio}.${extension}`;
  }
}

export const S3_BUCKET = process.env.S3_BUCKET || 'overshark-vouchers';
