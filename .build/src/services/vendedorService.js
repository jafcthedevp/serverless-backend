"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendedorService = void 0;
const dynamodb_1 = require("../utils/dynamodb");
const logger_1 = require("@aws-lambda-powertools/logger");
const logger = new logger_1.Logger({
    serviceName: 'overshark-backend',
    logLevel: 'INFO',
});
/**
 * Servicio para gestionar vendedores
 */
class VendedorService {
    /**
     * Obtener vendedor por teléfono
     */
    static async obtenerVendedor(telefono) {
        try {
            const vendedor = await dynamodb_1.DynamoDBService.get(dynamodb_1.TABLES.VENDEDORES, {
                PK: `VENDEDOR#${telefono}`,
            });
            return vendedor || null;
        }
        catch (error) {
            logger.error('Error obteniendo vendedor', { error, telefono });
            return null;
        }
    }
    /**
     * Registrar nuevo vendedor (auto-registro)
     */
    static async registrarVendedor(telefono, primerMensaje) {
        const timestamp = new Date().toISOString();
        const vendedor = {
            PK: `VENDEDOR#${telefono}`,
            telefono,
            estado: 'PENDIENTE',
            fecha_registro: timestamp,
            primer_mensaje: primerMensaje,
            total_validaciones: 0,
            ultima_actividad: timestamp,
        };
        await dynamodb_1.DynamoDBService.put(dynamodb_1.TABLES.VENDEDORES, vendedor);
        logger.info('Nuevo vendedor registrado', { telefono, estado: 'PENDIENTE' });
        return vendedor;
    }
    /**
     * Aprobar vendedor
     */
    static async aprobarVendedor(telefono, adminTelefono) {
        try {
            const timestamp = new Date().toISOString();
            await dynamodb_1.DynamoDBService.update(dynamodb_1.TABLES.VENDEDORES, { PK: `VENDEDOR#${telefono}` }, 'SET estado = :estado, aprobado_por = :admin, fecha_aprobacion = :fecha', {
                ':estado': 'APROBADO',
                ':admin': adminTelefono,
                ':fecha': timestamp,
            });
            logger.info('Vendedor aprobado', { telefono, aprobado_por: adminTelefono });
            return true;
        }
        catch (error) {
            logger.error('Error aprobando vendedor', { error, telefono });
            return false;
        }
    }
    /**
     * Rechazar vendedor
     */
    static async rechazarVendedor(telefono, adminTelefono, razon) {
        try {
            const timestamp = new Date().toISOString();
            await dynamodb_1.DynamoDBService.update(dynamodb_1.TABLES.VENDEDORES, { PK: `VENDEDOR#${telefono}` }, 'SET estado = :estado, aprobado_por = :admin, fecha_aprobacion = :fecha, razon_rechazo = :razon', {
                ':estado': 'RECHAZADO',
                ':admin': adminTelefono,
                ':fecha': timestamp,
                ':razon': razon || 'No especificado',
            });
            logger.info('Vendedor rechazado', { telefono, rechazado_por: adminTelefono, razon });
            return true;
        }
        catch (error) {
            logger.error('Error rechazando vendedor', { error, telefono });
            return false;
        }
    }
    /**
     * Bloquear vendedor
     */
    static async bloquearVendedor(telefono, adminTelefono, razon) {
        try {
            await dynamodb_1.DynamoDBService.update(dynamodb_1.TABLES.VENDEDORES, { PK: `VENDEDOR#${telefono}` }, 'SET estado = :estado, razon_rechazo = :razon', {
                ':estado': 'BLOQUEADO',
                ':razon': razon || 'No especificado',
            });
            logger.warn('Vendedor bloqueado', { telefono, bloqueado_por: adminTelefono, razon });
            return true;
        }
        catch (error) {
            logger.error('Error bloqueando vendedor', { error, telefono });
            return false;
        }
    }
    /**
     * Actualizar última actividad
     */
    static async actualizarActividad(telefono) {
        try {
            const timestamp = new Date().toISOString();
            await dynamodb_1.DynamoDBService.update(dynamodb_1.TABLES.VENDEDORES, { PK: `VENDEDOR#${telefono}` }, 'SET ultima_actividad = :timestamp, total_validaciones = if_not_exists(total_validaciones, :zero) + :uno', {
                ':timestamp': timestamp,
                ':zero': 0,
                ':uno': 1,
            });
        }
        catch (error) {
            logger.error('Error actualizando actividad vendedor', { error, telefono });
        }
    }
    /**
     * Listar vendedores por estado
     */
    static async listarPorEstado(estado) {
        try {
            const result = await dynamodb_1.DynamoDBService.query(dynamodb_1.TABLES.VENDEDORES, 'EstadoIndex', 'estado = :estado', { ':estado': estado });
            return result;
        }
        catch (error) {
            logger.error('Error listando vendedores', { error, estado });
            return [];
        }
    }
    /**
     * Verificar si el vendedor puede usar el sistema
     */
    static puedeUsarSistema(vendedor) {
        if (vendedor.estado === 'APROBADO') {
            return { permitido: true };
        }
        if (vendedor.estado === 'PENDIENTE') {
            return {
                permitido: false,
                razon: 'Tu solicitud está pendiente de aprobación. Un administrador la revisará pronto.',
            };
        }
        if (vendedor.estado === 'BLOQUEADO') {
            return {
                permitido: false,
                razon: `Tu acceso ha sido bloqueado. Razón: ${vendedor.razon_rechazo || 'No especificado'}`,
            };
        }
        if (vendedor.estado === 'RECHAZADO') {
            return {
                permitido: false,
                razon: `Tu solicitud fue rechazada. Razón: ${vendedor.razon_rechazo || 'No especificado'}`,
            };
        }
        return {
            permitido: false,
            razon: 'Estado desconocido. Contacta al administrador.',
        };
    }
}
exports.VendedorService = VendedorService;
//# sourceMappingURL=vendedorService.js.map