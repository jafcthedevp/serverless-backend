import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda Handler: Webhook de WhatsApp
 *
 * Endpoint: POST /webhook
 * GET /webhook (para verificación)
 *
 * Recibe mensajes de WhatsApp Business API
 * Maneja el flujo de validación de vouchers (IMAGEN + TEXTO)
 */
export declare const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=webhookWhatsApp.d.ts.map