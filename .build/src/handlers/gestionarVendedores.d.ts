import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda Handler: Gestión de Vendedores
 *
 * Endpoint: POST /dashboard/vendedores/aprobar
 * Endpoint: GET /dashboard/vendedores
 * Requiere autenticación (Cognito)
 */
export declare const aprobarHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * Listar vendedores (con filtro opcional por estado)
 */
export declare const listarHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=gestionarVendedores.d.ts.map