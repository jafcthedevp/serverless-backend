"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextractService = void 0;
const client_textract_1 = require("@aws-sdk/client-textract");
const textractClient = new client_textract_1.TextractClient({});
class TextractService {
    /**
     * Extrae texto de una imagen almacenada en S3
     */
    static async extraerTextoDeS3(bucket, key) {
        const command = new client_textract_1.DetectDocumentTextCommand({
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
    static async extraerTextoDeBuffer(imageBuffer) {
        const command = new client_textract_1.DetectDocumentTextCommand({
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
    static procesarBloques(blocks) {
        const lineas = blocks
            .filter((block) => block.BlockType === 'LINE')
            .map((block) => block.Text || '')
            .filter((text) => text.trim().length > 0);
        return lineas.join('\n');
    }
    /**
     * Extrae texto con información de confianza
     */
    static async extraerTextoConConfianza(bucket, key) {
        const command = new client_textract_1.DetectDocumentTextCommand({
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
        const confianzaPromedio = confianzas.reduce((sum, conf) => sum + conf, 0) / confianzas.length;
        return {
            texto: textos.join('\n'),
            confianza: confianzaPromedio,
        };
    }
}
exports.TextractService = TextractService;
//# sourceMappingURL=textract.js.map