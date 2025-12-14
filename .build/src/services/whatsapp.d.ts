/**
 * Servicio para interactuar con WhatsApp Business API
 */
export declare class WhatsAppService {
    private phoneNumberId;
    private accessToken;
    private apiVersion;
    constructor(phoneNumberId: string, accessToken: string);
    /**
     * Envía un mensaje de texto a un número de WhatsApp
     */
    enviarMensaje(destinatario: string, mensaje: string): Promise<void>;
    /**
     * Descarga un archivo multimedia de WhatsApp
     */
    descargarMedia(mediaId: string): Promise<Buffer>;
    /**
     * Obtiene la URL de descarga de un archivo multimedia
     */
    private obtenerUrlMedia;
    /**
     * Verifica el webhook de WhatsApp
     */
    static verificarWebhook(mode: string, token: string, verifyToken: string): boolean;
    /**
     * Formatea un número de teléfono para WhatsApp
     * Elimina caracteres especiales y asegura formato correcto
     */
    static formatearNumero(numero: string): string;
    /**
     * Mensajes predefinidos del sistema
     */
    static readonly MENSAJES: {
        BIENVENIDA: string;
        IMAGEN_RECIBIDA: string;
        ERROR_FORMATO: string;
        ERROR_IMAGEN: string;
        PROCESANDO: string;
    };
}
//# sourceMappingURL=whatsapp.d.ts.map