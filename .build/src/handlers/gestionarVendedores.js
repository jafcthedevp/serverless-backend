"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarHandler = exports.aprobarHandler = void 0;
const logger_1 = require("@aws-lambda-powertools/logger");
const vendedorService_1 = require("../services/vendedorService");
const logger = new logger_1.Logger({
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
const aprobarHandler = async (event) => {
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
            success = await vendedorService_1.VendedorService.aprobarVendedor(payload.telefono, adminTelefono);
            mensaje = success
                ? `Vendedor ${payload.telefono} aprobado correctamente`
                : 'Error al aprobar vendedor';
        }
        else if (payload.accion === 'RECHAZAR') {
            if (!payload.razon) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: 'El campo "razon" es requerido al rechazar',
                    }),
                };
            }
            success = await vendedorService_1.VendedorService.rechazarVendedor(payload.telefono, adminTelefono, payload.razon);
            mensaje = success
                ? `Vendedor ${payload.telefono} rechazado correctamente`
                : 'Error al rechazar vendedor';
        }
        else if (payload.accion === 'BLOQUEAR') {
            success = await vendedorService_1.VendedorService.bloquearVendedor(payload.telefono, adminTelefono, payload.razon);
            mensaje = success
                ? `Vendedor ${payload.telefono} bloqueado correctamente`
                : 'Error al bloquear vendedor';
        }
        else {
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
        }
        else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: mensaje }),
            };
        }
    }
    catch (error) {
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
exports.aprobarHandler = aprobarHandler;
/**
 * Listar vendedores (con filtro opcional por estado)
 */
const listarHandler = async (event) => {
    logger.info('Solicitud de listado de vendedores', {
        path: event.path,
        httpMethod: event.httpMethod,
    });
    try {
        const estado = event.queryStringParameters?.estado;
        let vendedores;
        if (estado) {
            // Listar por estado específico
            vendedores = await vendedorService_1.VendedorService.listarPorEstado(estado);
        }
        else {
            // Listar todos (usando scan)
            const result = await Promise.resolve().then(() => __importStar(require('../utils/dynamodb')));
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
    }
    catch (error) {
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
exports.listarHandler = listarHandler;
//# sourceMappingURL=gestionarVendedores.js.map