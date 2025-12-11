import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { VendedorService } from '../services/vendedorService';
import { EstadoVendedor } from '../types/vendedor';

const logger = new Logger({
  serviceName: 'overshark-backend',
  logLevel: 'INFO',
});

/**
 * Lambda Handler: Gestión de Vendedores
 *
 * Endpoint: POST /dashboard/vendedores/aprobar
 * Endpoint: GET /dashboard/vendedores
 * Requiere autenticación (Cognito)
 */
export const aprobarHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Solicitud de aprobación de vendedor', {
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
    if (!payload.telefono || !payload.accion) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Campos requeridos: telefono, accion (APROBAR o RECHAZAR)',
        }),
      };
    }

    // Obtener teléfono del administrador desde Cognito claims
    const adminTelefono = event.requestContext.authorizer?.claims?.phone_number || 'admin';

    let success = false;
    let mensaje = '';

    if (payload.accion === 'APROBAR') {
      success = await VendedorService.aprobarVendedor(payload.telefono, adminTelefono);
      mensaje = success
        ? `Vendedor ${payload.telefono} aprobado correctamente`
        : 'Error al aprobar vendedor';
    } else if (payload.accion === 'RECHAZAR') {
      if (!payload.razon) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'El campo "razon" es requerido al rechazar',
          }),
        };
      }

      success = await VendedorService.rechazarVendedor(
        payload.telefono,
        adminTelefono,
        payload.razon
      );
      mensaje = success
        ? `Vendedor ${payload.telefono} rechazado correctamente`
        : 'Error al rechazar vendedor';
    } else if (payload.accion === 'BLOQUEAR') {
      success = await VendedorService.bloquearVendedor(
        payload.telefono,
        adminTelefono,
        payload.razon
      );
      mensaje = success
        ? `Vendedor ${payload.telefono} bloqueado correctamente`
        : 'Error al bloquear vendedor';
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Acción inválida. Debe ser APROBAR, RECHAZAR o BLOQUEAR',
        }),
      };
    }

    if (success) {
      logger.info('Vendedor gestionado exitosamente', {
        telefono: payload.telefono,
        accion: payload.accion,
        admin: adminTelefono,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: mensaje,
          telefono: payload.telefono,
          accion: payload.accion,
          timestamp: new Date().toISOString(),
        }),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: mensaje }),
      };
    }
  } catch (error) {
    logger.error('Error gestionando vendedor', {
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

/**
 * Listar vendedores (con filtro opcional por estado)
 */
export const listarHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Solicitud de listado de vendedores', {
    path: event.path,
    httpMethod: event.httpMethod,
  });

  try {
    const estado = event.queryStringParameters?.estado as EstadoVendedor | undefined;

    let vendedores;

    if (estado) {
      // Listar por estado específico
      vendedores = await VendedorService.listarPorEstado(estado);
    } else {
      // Listar todos (usando scan)
      const result = await import('../utils/dynamodb');
      const scanResult = await result.DynamoDBService.scan(result.TABLES.VENDEDORES);
      vendedores = scanResult;
    }

    logger.info('Vendedores listados exitosamente', {
      total: vendedores.length,
      estado: estado || 'todos',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        total: vendedores.length,
        estado: estado || 'todos',
        vendedores,
      }),
    };
  } catch (error) {
    logger.error('Error listando vendedores', {
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
