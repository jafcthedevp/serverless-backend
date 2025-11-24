import {
  TextractClient,
  DetectDocumentTextCommand,
  Block,
} from '@aws-sdk/client-textract';

const textractClient = new TextractClient({});

export class TextractService {
  /**
   * Extrae texto de una imagen almacenada en S3
   */
  static async extraerTextoDeS3(bucket: string, key: string): Promise<string> {
    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
    });

    const response = await textractClient.send(command);
    return this.procesarBloques(response.Blocks || []);
  }

  /**
   * Extrae texto de un buffer de imagen
   */
  static async extraerTextoDeBuffer(imageBuffer: Buffer): Promise<string> {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBuffer,
      },
    });

    const response = await textractClient.send(command);
    return this.procesarBloques(response.Blocks || []);
  }

  /**
   * Procesa los bloques de Textract y extrae el texto línea por línea
   */
  private static procesarBloques(blocks: Block[]): string {
    const lineas = blocks
      .filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text || '')
      .filter((text) => text.trim().length > 0);

    return lineas.join('\n');
  }

  /**
   * Extrae texto con información de confianza
   */
  static async extraerTextoConConfianza(
    bucket: string,
    key: string
  ): Promise<{ texto: string; confianza: number }> {
    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
    });

    const response = await textractClient.send(command);
    const blocks = response.Blocks || [];

    const lineas = blocks.filter((block) => block.BlockType === 'LINE');

    if (lineas.length === 0) {
      return { texto: '', confianza: 0 };
    }

    const textos = lineas.map((block) => block.Text || '');
    const confianzas = lineas.map((block) => block.Confidence || 0);

    const confianzaPromedio =
      confianzas.reduce((sum, conf) => sum + conf, 0) / confianzas.length;

    return {
      texto: textos.join('\n'),
      confianza: confianzaPromedio,
    };
  }
}
