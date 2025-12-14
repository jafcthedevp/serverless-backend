"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@aws-lambda-powertools/logger");
const dynamodb_1 = require("../utils/dynamodb");
const yapeParser_1 = require("../services/yapeParser");
const multiPagoParser_1 = require("../services/multiPagoParser");
const pagoDetector_1 = require("../services/pagoDetector");
const dispositivos_1 = require("../config/dispositivos");
// Configurar Logger de Powertools
const logger = new logger_1.Logger({
    serviceName: 'overshark-backend',
    logLevel: 'INFO',
});
/**
 * Lambda Handler: Guardar Notificación de Yape
 *
 * Endpoint: POST /notificaciones
 * Recibe notificaciones desde las apps móviles instaladas en los 21 dispositivos
 */
const handler = async (event) => {
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
        if (!(0, dispositivos_1.esCodigoValido)(payload.codigo_dispositivo)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Código de dispositivo inválido: ${payload.codigo_dispositivo}`,
                }),
            };
        }
        // Detectar tipo de pago
        const tipoPago = pagoDetector_1.PagoDetector.detectarTipoPago(payload.texto);
        logger.info('Tipo de pago detectado', { tipoPago });
        // Intentar parsear según el tipo de pago
        let notificacionParseada = null;
        switch (tipoPago) {
            case 'YAPE':
                notificacionParseada = yapeParser_1.YapeParser.parseNotificacion(payload.texto);
                break;
            case 'PLIN':
                notificacionParseada = multiPagoParser_1.MultiPagoParser.parsePlin(payload.texto);
                break;
            case 'BCP':
                notificacionParseada = multiPagoParser_1.MultiPagoParser.parseBCP(payload.texto);
                break;
            case 'INTERBANK':
                notificacionParseada = multiPagoParser_1.MultiPagoParser.parseInterbank(payload.texto);
                break;
            default:
                // Para OTRO o IMAGEN_MANUAL, no intentamos parsear
                notificacionParseada = null;
                break;
        }
        // Crear timestamp
        const timestamp = new Date().toISOString();
        // Determinar estado inicial
        const requiereRevisionManual = pagoDetector_1.PagoDetector.requiereRevisionManual(tipoPago);
        const estadoInicial = requiereRevisionManual ? 'REVISION_MANUAL' : 'PENDIENTE_VALIDACION';
        // Intentar parsear manualmente si el parser principal falla
        let montoParsed = notificacionParseada?.monto;
        let codigoSeguridadParsed = notificacionParseada?.codigo_seguridad;
        let nombrePagadorParsed = notificacionParseada?.nombre_pagador;
        // Si el parser falló, intentar extraer al menos monto y código de seguridad
        if (!notificacionParseada && tipoPago === 'YAPE') {
            montoParsed = yapeParser_1.YapeParser.extractMonto(payload.texto) || undefined;
            codigoSeguridadParsed = yapeParser_1.YapeParser.extractCodigoSeguridad(payload.texto) || undefined;
            nombrePagadorParsed = yapeParser_1.YapeParser.extractNombrePagador(payload.texto) || undefined;
            logger.info('Parser parcial ejecutado', {
                monto: montoParsed,
                codigo: codigoSeguridadParsed,
                nombre: nombrePagadorParsed,
            });
        }
        // Si no se pudo parsear, generar un ID temporal basado en timestamp
        const numeroOperacion = notificacionParseada?.numero_operacion ||
            `TEMP-${Date.now()}-${payload.codigo_dispositivo}`;
        // Crear registro para DynamoDB
        const notificacion = {
            PK: `NOTIF#${numeroOperacion}`,
            SK: timestamp,
            tipo_pago: tipoPago,
            texto_raw: payload.texto,
            monto: montoParsed,
            nombre_pagador: nombrePagadorParsed,
            codigo_seguridad: codigoSeguridadParsed,
            numero_operacion: notificacionParseada?.numero_operacion,
            fecha_hora: notificacionParseada?.fecha_hora,
            codigo_dispositivo: payload.codigo_dispositivo,
            estado: estadoInicial,
            parseado: !!notificacionParseada,
            created_at: timestamp,
        };
        // Guardar en DynamoDB
        await dynamodb_1.DynamoDBService.put(dynamodb_1.TABLES.NOTIFICACIONES, notificacion);
        // Actualizar última notificación del dispositivo
        await dynamodb_1.DynamoDBService.update(dynamodb_1.TABLES.DISPOSITIVOS, { PK: `DISPOSITIVO#${payload.codigo_dispositivo}` }, 'SET ultima_notificacion = :timestamp', { ':timestamp': timestamp });
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
    }
    catch (error) {
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
exports.handler = handler;
//# sourceMappingURL=guardarNotificacion.js.map