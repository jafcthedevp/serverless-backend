"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Servicio para interactuar con WhatsApp Business API
 */
class WhatsAppService {
    constructor(phoneNumberId, accessToken) {
        this.apiVersion = 'v18.0';
        this.phoneNumberId = phoneNumberId;
        this.accessToken = accessToken;
    }
    /**
     * Envía un mensaje de texto a un número de WhatsApp
     */
    async enviarMensaje(destinatario, mensaje) {
        const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: destinatario,
            type: 'text',
            text: {
                preview_url: false,
                body: mensaje,
            },
        };
        try {
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });
            console.log('Mensaje enviado exitosamente:', response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Error enviando mensaje WhatsApp:', error.response?.data);
                throw new Error(`Error enviando mensaje: ${error.response?.data?.error?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Descarga un archivo multimedia de WhatsApp
     */
    async descargarMedia(mediaId) {
        try {
            // Paso 1: Obtener URL del archivo
            const mediaUrl = await this.obtenerUrlMedia(mediaId);
            // Paso 2: Descargar el archivo
            const response = await axios_1.default.get(mediaUrl, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Error descargando media:', error.response?.data);
                throw new Error(`Error descargando media: ${error.response?.data?.error?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Obtiene la URL de descarga de un archivo multimedia
     */
    async obtenerUrlMedia(mediaId) {
        const url = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });
        return response.data.url;
    }
    /**
     * Verifica el webhook de WhatsApp
     */
    static verificarWebhook(mode, token, verifyToken) {
        return mode === 'subscribe' && token === verifyToken;
    }
    /**
     * Formatea un número de teléfono para WhatsApp
     * Elimina caracteres especiales y asegura formato correcto
     */
    static formatearNumero(numero) {
        // Eliminar caracteres no numéricos
        let numeroLimpio = numero.replace(/\D/g, '');
        // Si no tiene código de país, agregar +51 (Perú)
        if (!numeroLimpio.startsWith('51')) {
            numeroLimpio = '51' + numeroLimpio;
        }
        return numeroLimpio;
    }
}
exports.WhatsAppService = WhatsAppService;
/**
 * Mensajes predefinidos del sistema
 */
WhatsAppService.MENSAJES = {
    BIENVENIDA: `¡Hola! 👋 Soy el asistente de validación de pagos Yape.

Para validar un pago, envíame:
1️⃣ La imagen del voucher de Yape
2️⃣ Los datos del cliente

📌 *Comandos útiles:*
• Escribe "cancelar" o "reiniciar" para empezar de nuevo`,
    IMAGEN_RECIBIDA: `✅ Imagen recibida correctamente.

Ahora envíame los datos del cliente:

*Línea 1:* Nombre completo
*Línea 2:* Teléfono (opcional)

Ejemplo:
Jesus F. Anthony C.
987654321

💡 Si necesitas empezar de nuevo, escribe "cancelar"`,
    ERROR_FORMATO: `❌ Formato incorrecto.

Por favor envía los datos del cliente:

*Línea 1:* Nombre completo
*Línea 2:* Teléfono (opcional)

Ejemplo:
Jesus F. Anthony C.
987654321

💡 Escribe "cancelar" si quieres empezar de nuevo`,
    ERROR_IMAGEN: `❌ No pude procesar la imagen.

Por favor:
• Asegúrate que la imagen sea clara
• Que se vean bien todos los datos
• Reenvía la imagen`,
    PROCESANDO: `⏳ Procesando tu solicitud...`,
};
//# sourceMappingURL=whatsapp.js.map