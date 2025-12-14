import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda Handler: Listar Notificaciones Pendientes de Revisión Manual
 *
 * Endpoint: GET /dashboard/pendientes
 * Retorna todas las notificaciones con estado REVISION_MANUAL
 */
export declare const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=listarPendientes.d.ts.map