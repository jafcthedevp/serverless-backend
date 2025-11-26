import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WhatsAppWebhook, WhatsAppMessage } from '../types/whatsapp';
import { WhatsAppService } from '../services/whatsapp';
import { DynamoDBService, TABLES } from '../utils/dynamodb';
import { SesionVendedor } from '../types/dispositivo';
import { S3Service, S3_BUCKET } from '../utils/s3';
import { TextractService } from '../utils/textract';
import { YapeParser } from '../services/yapeParser';
import { VoucherDatos } from '../types/venta';

const whatsappService = new WhatsAppService(
  process.env.WHATSAPP_PHONE_NUMBER_ID!,
  process.env.WHATSAPP_ACCESS_TOKEN!
);

/**
 * Lambda Handler: Webhook de WhatsApp
 *
 * Endpoint: POST /webhook
 * GET /webhook (para verificación)
 *
 * Recibe mensajes de WhatsApp Business API
 * Maneja el flujo de validación de vouchers (IMAGEN + TEXTO)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Obtener método HTTP (compatible con HTTP API v2 y REST API)
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';

    // Verificación del webhook (GET request)
    if (httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const mode = queryParams['hub.mode'];
      const token = queryParams['hub.token'];
      const challenge = queryParams['hub.challenge'];

      if (
        WhatsAppService.verificarWebhook(
          mode || '',
          token || '',
          process.env.WHATSAPP_VERIFY_TOKEN!
        )
      ) {
        console.log('Webhook verificado exitosamente, challenge:', challenge);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
          body: challenge || '',
        };
      } else {
        console.log('Webhook verificación fallida - token inválido');
        return {
          statusCode: 403,
          body: 'Forbidden',
        };
      }
    }

    // Procesar mensaje (POST request)
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body requerido' }),
      };
    }

    const webhook: WhatsAppWebhook = JSON.parse(event.body);

    // Procesar cada mensaje
    for (const entry of webhook.entry) {
      for (const change of entry.changes) {
        const messages = change.value.messages;

        if (messages && messages.length > 0) {
          for (const message of messages) {
            await procesarMensaje(message);
          }
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Procesado exitosamente' }),
    };
  } catch (error) {
    console.error('Error en webhook WhatsApp:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Procesa un mensaje de WhatsApp
 */
async function procesarMensaje(message: WhatsAppMessage): Promise<void> {
  const from = message.from;

  try {
    // Obtener sesión del vendedor
    let sesion = await DynamoDBService.get(TABLES.SESIONES, {
      PK: `SESION#${from}`,
    }) as SesionVendedor | undefined;

    if (message.type === 'image') {
      // PASO 1: Vendedor envía IMAGEN del voucher
      await procesarImagen(message, from);
    } else if (message.type === 'text') {
      if (sesion?.estado === 'ESPERANDO_DATOS_TEXTO') {
        // PASO 2: Vendedor envía TEXTO con datos adicionales
        await procesarTexto(message, from, sesion);
      } else {
        // Mensaje de ayuda
        await whatsappService.enviarMensaje(from, WhatsAppService.MENSAJES.BIENVENIDA);
      }
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    await whatsappService.enviarMensaje(
      from,
      '❌ Ocurrió un error procesando tu mensaje. Por favor intenta nuevamente.'
    );
  }
}

/**
 * Procesa la imagen del voucher (PASO 1)
 */
async function procesarImagen(message: WhatsAppMessage, from: string): Promise<void> {
  try {
    // Notificar que estamos procesando
    await whatsappService.enviarMensaje(from, WhatsAppService.MENSAJES.PROCESANDO);

    // Descargar imagen desde WhatsApp
    const imageBuffer = await whatsappService.descargarMedia(message.image!.id);

    // Guardar en S3
    const s3Key = S3Service.generarKeyVoucher(from, 'jpg');
    await S3Service.subirArchivo(S3_BUCKET, s3Key, imageBuffer, 'image/jpeg');

    // Procesar con Textract (OCR)
    const { texto, confianza } = await TextractService.extraerTextoConConfianza(
      S3_BUCKET,
      s3Key
    );

    console.log(`Texto extraído (confianza: ${confianza}%):`, texto);

    // Parsear datos de la imagen
    const datosImagen = YapeParser.parseVoucherTextract(texto);

    // Validar que se extrajo información crítica
    if (!datosImagen.numeroOperacion || !datosImagen.monto) {
      await whatsappService.enviarMensaje(from, WhatsAppService.MENSAJES.ERROR_IMAGEN);
      return;
    }

    // Crear sesión temporal (TTL 30 minutos)
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutos

    const sesion: SesionVendedor = {
      PK: `SESION#${from}`,
      estado: 'ESPERANDO_DATOS_TEXTO',
      datosImagen,
      s3Key,
      created_at: timestamp,
      ttl,
    };

    await DynamoDBService.put(TABLES.SESIONES, sesion);

    // Solicitar datos adicionales
    await whatsappService.enviarMensaje(from, WhatsAppService.MENSAJES.IMAGEN_RECIBIDA);
  } catch (error) {
    console.error('Error procesando imagen:', error);
    await whatsappService.enviarMensaje(from, WhatsAppService.MENSAJES.ERROR_IMAGEN);
  }
}

/**
 * Procesa el texto con datos adicionales (PASO 2)
 */
async function procesarTexto(
  message: WhatsAppMessage,
  from: string,
  sesion: SesionVendedor
): Promise<void> {
  try {
    const texto = message.text!.body;
    const lineas = texto.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    // Validar formato (al menos 2 líneas: nombre y código)
    if (lineas.length < 2) {
      await whatsappService.enviarMensaje(from, WhatsAppService.MENSAJES.ERROR_FORMATO);
      return;
    }

    // Parsear datos del texto
    const nombreCliente = lineas[0];
    const codigoServicio = lineas[1].toUpperCase();

    // Crear voucher completo combinando datos de IMAGEN + TEXTO
    const voucherCompleto: VoucherDatos = {
      // De la IMAGEN (Textract)
      monto: sesion.datosImagen!.monto!,
      codigoSeguridad: sesion.datosImagen!.codigoSeguridad!,
      numeroOperacion: sesion.datosImagen!.numeroOperacion!,
      fechaHora: sesion.datosImagen!.fechaHora!,
      // Del TEXTO (vendedor)
      nombreCliente,
      codigoServicio,
      telefonoCliente: lineas[2], // Opcional
      ubicacion: lineas[3], // Opcional
      // Metadata
      vendedorWhatsApp: from,
      voucherUrl: sesion.s3Key,
    };

    // Validar con matching (importamos el handler)
    const { validarVoucher } = await import('./validarConMatch');
    const resultado = await validarVoucher(voucherCompleto);

    // Enviar respuesta al vendedor
    await whatsappService.enviarMensaje(from, resultado.mensaje);

    // Limpiar sesión
    await DynamoDBService.delete(TABLES.SESIONES, { PK: `SESION#${from}` });
  } catch (error) {
    console.error('Error procesando texto:', error);
    await whatsappService.enviarMensaje(
      from,
      '❌ Ocurrió un error validando el voucher. Por favor intenta nuevamente.'
    );
  }
}
