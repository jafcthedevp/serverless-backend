import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBService, TABLES } from '../utils/dynamodb';
import { YapeParser } from '../services/yapeParser';
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
    httpMethod: event.requestContext.http.method,
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

    // Parsear notificación de Yape
    const notificacionParseada = YapeParser.parseNotificacion(payload.texto);

    if (!notificacionParseada) {
      logger.error('No se pudo parsear la notificación', {
        codigo_dispositivo: payload.codigo_dispositivo,
        texto_length: payload.texto?.length || 0,
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'No se pudo extraer información de la notificación',
        }),
      };
    }

    // Crear timestamp
    const timestamp = new Date().toISOString();

    // Crear registro para DynamoDB
    const notificacion: NotificacionYape = {
      PK: `NOTIF#${notificacionParseada.numero_operacion}`,
      SK: timestamp,
      monto: notificacionParseada.monto,
      nombre_pagador: notificacionParseada.nombre_pagador,
      codigo_seguridad: notificacionParseada.codigo_seguridad,
      numero_operacion: notificacionParseada.numero_operacion,
      fecha_hora: notificacionParseada.fecha_hora,
      codigo_dispositivo: payload.codigo_dispositivo,
      estado: 'PENDIENTE_VALIDACION',
      parseado: true,
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
      codigo_dispositivo: notificacion.codigo_dispositivo,
      estado: notificacion.estado,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notificación guardada exitosamente',
        numero_operacion: notificacionParseada.numero_operacion,
        monto: notificacionParseada.monto,
        codigo_dispositivo: payload.codigo_dispositivo,
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
