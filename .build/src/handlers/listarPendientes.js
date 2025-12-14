"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@aws-lambda-powertools/logger");
const dynamodb_1 = require("../utils/dynamodb");
const logger = new logger_1.Logger({
    serviceName: 'overshark-backend',
    logLevel: 'INFO',
});
/**
 * Lambda Handler: Listar Notificaciones Pendientes de Revisión Manual
 *
 * Endpoint: GET /dashboard/pendientes
 * Retorna todas las notificaciones con estado REVISION_MANUAL
 */
const handler = async (event) => {
    logger.info('Listando notificaciones pendientes de revisión manual');
    try {
        // Obtener parámetros de query
        const queryParams = event.queryStringParameters || {};
        const limite = parseInt(queryParams.limit || '50');
        const tipoPago = queryParams.tipo_pago; // Filtrar por tipo de pago (opcional)
        // Escanear tabla de notificaciones buscando estado REVISION_MANUAL
        const resultado = await dynamodb_1.DynamoDBService.scan(dynamodb_1.TABLES.NOTIFICACIONES, {
            FilterExpression: 'estado = :estado',
            ExpressionAttributeValues: {
                ':estado': 'REVISION_MANUAL',
            },
        });
        let notificaciones = resultado;
        // Filtrar por tipo de pago si se especifica
        if (tipoPago) {
            notificaciones = notificaciones.filter((n) => n.tipo_pago === tipoPago);
        }
        // Ordenar por fecha de creación (más recientes primero)
        notificaciones.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        // Limitar resultados
        notificaciones = notificaciones.slice(0, limite);
        logger.info('Notificaciones pendientes encontradas', {
            total: notificaciones.length,
            tipo_pago: tipoPago,
        });
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                total: notificaciones.length,
                notificaciones: notificaciones.map((n) => ({
                    id: n.PK,
                    numero_operacion: n.numero_operacion,
                    tipo_pago: n.tipo_pago,
                    monto: n.monto,
                    nombre_pagador: n.nombre_pagador,
                    codigo_dispositivo: n.codigo_dispositivo,
                    texto_raw: n.texto_raw,
                    parseado: n.parseado,
                    created_at: n.created_at,
                    estado: n.estado,
                })),
            }),
        };
    }
    catch (error) {
        logger.error('Error listando notificaciones pendientes', {
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
exports.handler = handler;
//# sourceMappingURL=listarPendientes.js.map