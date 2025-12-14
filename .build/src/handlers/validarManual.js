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
 * Lambda Handler: Validación Manual de Notificaciones
 *
 * Endpoint: POST /dashboard/validar
 * Permite aprobar o rechazar notificaciones que requieren revisión manual
 */
const handler = async (event) => {
    logger.info('Procesando validación manual');
    try {
        // Verificar que el usuario tenga rol de Admin
        const groups = event.requestContext.authorizer?.jwt?.claims['cognito:groups'];
        const userGroups = typeof groups === 'string' ? [groups] : groups || [];
        if (!userGroups.includes('Admin')) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    error: 'Acceso denegado. Solo administradores pueden aprobar/rechazar notificaciones.',
                }),
            };
        }
        // Validar body
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Body requerido' }),
            };
        }
        const payload = JSON.parse(event.body);
        // Validar campos requeridos
        if (!payload.numero_operacion || !payload.accion || !payload.operador_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Faltan campos requeridos: numero_operacion, accion, operador_id',
                }),
            };
        }
        if (!['APROBAR', 'RECHAZAR'].includes(payload.accion)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Acción inválida. Debe ser APROBAR o RECHAZAR',
                }),
            };
        }
        // Buscar la notificación usando Query (porque PK solo no es suficiente para tabla con SK)
        const notificaciones = await dynamodb_1.DynamoDBService.query(dynamodb_1.TABLES.NOTIFICACIONES, 'PK = :pk', { ':pk': `NOTIF#${payload.numero_operacion}` });
        if (!notificaciones || notificaciones.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: `Notificación no encontrada: ${payload.numero_operacion}`,
                }),
            };
        }
        const notificacion = notificaciones[0];
        // Verificar que esté en estado REVISION_MANUAL
        if (notificacion.estado !== 'REVISION_MANUAL') {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `La notificación no está en estado REVISION_MANUAL (estado actual: ${notificacion.estado})`,
                }),
            };
        }
        // Actualizar la notificación
        const timestamp = new Date().toISOString();
        const nuevoEstado = payload.accion === 'APROBAR' ? 'VALIDADO' : 'RECHAZADO';
        // Preparar datos actualizados
        const datosActualizados = {
            estado: nuevoEstado,
            revisado_por: payload.operador_id,
            fecha_revision: timestamp,
            notas_revision: payload.notas,
        };
        // Si se aprueba y se proporcionan datos corregidos, actualizarlos
        if (payload.accion === 'APROBAR') {
            if (payload.monto !== undefined)
                datosActualizados.monto = payload.monto;
            if (payload.nombre_pagador)
                datosActualizados.nombre_pagador = payload.nombre_pagador;
            if (payload.codigo_seguridad)
                datosActualizados.codigo_seguridad = payload.codigo_seguridad;
            if (payload.fecha_hora)
                datosActualizados.fecha_hora = payload.fecha_hora;
        }
        // Construir expresión de actualización
        const updateExpressions = [];
        const expressionAttributeValues = {};
        Object.entries(datosActualizados).forEach(([key, value]) => {
            updateExpressions.push(`${key} = :${key}`);
            expressionAttributeValues[`:${key}`] = value;
        });
        await dynamodb_1.DynamoDBService.update(dynamodb_1.TABLES.NOTIFICACIONES, { PK: notificacion.PK, SK: notificacion.SK }, `SET ${updateExpressions.join(', ')}`, expressionAttributeValues);
        logger.info('Validación manual completada', {
            numero_operacion: payload.numero_operacion,
            accion: payload.accion,
            operador_id: payload.operador_id,
            nuevo_estado: nuevoEstado,
        });
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: `Notificación ${payload.accion === 'APROBAR' ? 'aprobada' : 'rechazada'} exitosamente`,
                numero_operacion: payload.numero_operacion,
                estado_anterior: 'REVISION_MANUAL',
                estado_nuevo: nuevoEstado,
                operador_id: payload.operador_id,
                fecha_revision: timestamp,
            }),
        };
    }
    catch (error) {
        logger.error('Error en validación manual', {
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
//# sourceMappingURL=validarManual.js.map