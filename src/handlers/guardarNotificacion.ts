import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBService, TABLES } from '../utils/dynamodb';
import { YapeParser } from '../services/yapeParser';
import { MultiPagoParser } from '../services/multiPagoParser';
import { PagoDetector } from '../services/pagoDetector';
import { NotificacionYape } from '../types/notificacion';
import { esCodigoValido } from '../config/dispositivos';

// Configurar Logger de Powertools
const logger = new Logger({
  serviceName: 'overshark-backend',
  logLevel: 'INFO',
});

/**
 * Lambda Handler: Guardar Notificación de Yape
 *
 * Endpoint: POST /notificaciones
 * Recibe notificaciones desde las apps móviles instaladas en los 21 dispositivos
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Notificación recibida', {
    path: event.path,
    httpMethod: event.httpMethod,
  });

  try {
    // Validar body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body requerido' }),
      };
    }

    const payload = JSON.parse(event.body);

    // Validar campos requeridos
    if (!payload.texto || !payload.codigo_dispositivo) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Faltan campos requeridos: texto, codigo_dispositivo',
        }),
      };
    }

    // Validar que el código de dispositivo sea válido
    if (!esCodigoValido(payload.codigo_dispositivo)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Código de dispositivo inválido: ${payload.codigo_dispositivo}`,
        }),
      };
    }

    // Detectar tipo de pago
    const tipoPago = PagoDetector.detectarTipoPago(payload.texto);
    logger.info('Tipo de pago detectado', { tipoPago });

    // Intentar parsear según el tipo de pago
    let notificacionParseada = null;

    switch (tipoPago) {
      case 'YAPE':
        notificacionParseada = YapeParser.parseNotificacion(payload.texto);
        break;
      case 'PLIN':
        notificacionParseada = MultiPagoParser.parsePlin(payload.texto);
        break;
      case 'BCP':
        notificacionParseada = MultiPagoParser.parseBCP(payload.texto);
        break;
      case 'INTERBANK':
        notificacionParseada = MultiPagoParser.parseInterbank(payload.texto);
        break;
      default:
        // Para OTRO o IMAGEN_MANUAL, no intentamos parsear
        notificacionParseada = null;
        break;
    }

    // Crear timestamp
    const timestamp = new Date().toISOString();

    // Determinar estado inicial
    const requiereRevisionManual = PagoDetector.requiereRevisionManual(tipoPago);
    const estadoInicial = requiereRevisionManual ? 'REVISION_MANUAL' : 'PENDIENTE_VALIDACION';

    // Si no se pudo parsear, generar un ID temporal basado en timestamp
    const numeroOperacion = notificacionParseada?.numero_operacion ||
                           `TEMP-${Date.now()}-${payload.codigo_dispositivo}`;

    // Crear registro para DynamoDB
    const notificacion: NotificacionYape = {
      PK: `NOTIF#${numeroOperacion}`,
      SK: timestamp,
      tipo_pago: tipoPago,
      texto_raw: payload.texto,
      monto: notificacionParseada?.monto,
      nombre_pagador: notificacionParseada?.nombre_pagador,
      codigo_seguridad: notificacionParseada?.codigo_seguridad,
      numero_operacion: notificacionParseada?.numero_operacion,
      fecha_hora: notificacionParseada?.fecha_hora,
      codigo_dispositivo: payload.codigo_dispositivo,
      estado: estadoInicial,
      parseado: !!notificacionParseada,
      created_at: timestamp,
    };

    // Guardar en DynamoDB
    await DynamoDBService.put(TABLES.NOTIFICACIONES, notificacion);

    // Actualizar última notificación del dispositivo
    await DynamoDBService.update(
      TABLES.DISPOSITIVOS,
      { PK: `DISPOSITIVO#${payload.codigo_dispositivo}` },
      'SET ultima_notificacion = :timestamp',
      { ':timestamp': timestamp }
    );

    logger.info('Notificación guardada exitosamente', {
      numero_operacion: notificacion.numero_operacion,
      monto: notificacion.monto,
      tipo_pago: notificacion.tipo_pago,
      codigo_dispositivo: notificacion.codigo_dispositivo,
      estado: notificacion.estado,
      requiere_revision_manual: requiereRevisionManual,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: requiereRevisionManual
          ? 'Notificación guardada - Requiere revisión manual'
          : 'Notificación guardada exitosamente',
        numero_operacion: numeroOperacion,
        tipo_pago: tipoPago,
        monto: notificacionParseada?.monto,
        codigo_dispositivo: payload.codigo_dispositivo,
        estado: estadoInicial,
        requiere_revision_manual: requiereRevisionManual,
      }),
    };
  } catch (error) {
    logger.error('Error guardando notificación', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
