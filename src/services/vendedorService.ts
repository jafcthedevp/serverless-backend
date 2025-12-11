import { DynamoDBService, TABLES } from '../utils/dynamodb';
import { Vendedor, EstadoVendedor } from '../types/vendedor';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'overshark-backend',
  logLevel: 'INFO',
});

/**
 * Servicio para gestionar vendedores
 */
export class VendedorService {
  /**
   * Obtener vendedor por teléfono
   */
  static async obtenerVendedor(telefono: string): Promise<Vendedor | null> {
    try {
      const vendedor = await DynamoDBService.get(TABLES.VENDEDORES, {
        PK: `VENDEDOR#${telefono}`,
      }) as Vendedor | undefined;

      return vendedor || null;
    } catch (error) {
      logger.error('Error obteniendo vendedor', { error, telefono });
      return null;
    }
  }

  /**
   * Registrar nuevo vendedor (auto-registro)
   */
  static async registrarVendedor(
    telefono: string,
    primerMensaje?: string
  ): Promise<Vendedor> {
    const timestamp = new Date().toISOString();

    const vendedor: Vendedor = {
      PK: `VENDEDOR#${telefono}`,
      telefono,
      estado: 'PENDIENTE' as EstadoVendedor,
      fecha_registro: timestamp,
      primer_mensaje: primerMensaje,
      total_validaciones: 0,
      ultima_actividad: timestamp,
    };

    await DynamoDBService.put(TABLES.VENDEDORES, vendedor);

    logger.info('Nuevo vendedor registrado', { telefono, estado: 'PENDIENTE' });

    return vendedor;
  }

  /**
   * Aprobar vendedor
   */
  static async aprobarVendedor(
    telefono: string,
    adminTelefono: string
  ): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();

      await DynamoDBService.update(
        TABLES.VENDEDORES,
        { PK: `VENDEDOR#${telefono}` },
        'SET estado = :estado, aprobado_por = :admin, fecha_aprobacion = :fecha',
        {
          ':estado': 'APROBADO' as EstadoVendedor,
          ':admin': adminTelefono,
          ':fecha': timestamp,
        }
      );

      logger.info('Vendedor aprobado', { telefono, aprobado_por: adminTelefono });
      return true;
    } catch (error) {
      logger.error('Error aprobando vendedor', { error, telefono });
      return false;
    }
  }

  /**
   * Rechazar vendedor
   */
  static async rechazarVendedor(
    telefono: string,
    adminTelefono: string,
    razon?: string
  ): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();

      await DynamoDBService.update(
        TABLES.VENDEDORES,
        { PK: `VENDEDOR#${telefono}` },
        'SET estado = :estado, aprobado_por = :admin, fecha_aprobacion = :fecha, razon_rechazo = :razon',
        {
          ':estado': 'RECHAZADO' as EstadoVendedor,
          ':admin': adminTelefono,
          ':fecha': timestamp,
          ':razon': razon || 'No especificado',
        }
      );

      logger.info('Vendedor rechazado', { telefono, rechazado_por: adminTelefono, razon });
      return true;
    } catch (error) {
      logger.error('Error rechazando vendedor', { error, telefono });
      return false;
    }
  }

  /**
   * Bloquear vendedor
   */
  static async bloquearVendedor(
    telefono: string,
    adminTelefono: string,
    razon?: string
  ): Promise<boolean> {
    try {
      await DynamoDBService.update(
        TABLES.VENDEDORES,
        { PK: `VENDEDOR#${telefono}` },
        'SET estado = :estado, razon_rechazo = :razon',
        {
          ':estado': 'BLOQUEADO' as EstadoVendedor,
          ':razon': razon || 'No especificado',
        }
      );

      logger.warn('Vendedor bloqueado', { telefono, bloqueado_por: adminTelefono, razon });
      return true;
    } catch (error) {
      logger.error('Error bloqueando vendedor', { error, telefono });
      return false;
    }
  }

  /**
   * Actualizar última actividad
   */
  static async actualizarActividad(telefono: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      await DynamoDBService.update(
        TABLES.VENDEDORES,
        { PK: `VENDEDOR#${telefono}` },
        'SET ultima_actividad = :timestamp, total_validaciones = if_not_exists(total_validaciones, :zero) + :uno',
        {
          ':timestamp': timestamp,
          ':zero': 0,
          ':uno': 1,
        }
      );
    } catch (error) {
      logger.error('Error actualizando actividad vendedor', { error, telefono });
    }
  }

  /**
   * Listar vendedores por estado
   */
  static async listarPorEstado(estado: EstadoVendedor): Promise<Vendedor[]> {
    try {
      const result = await DynamoDBService.query(
        TABLES.VENDEDORES,
        'EstadoIndex',
        'estado = :estado',
        { ':estado': estado }
      );

      return result as Vendedor[];
    } catch (error) {
      logger.error('Error listando vendedores', { error, estado });
      return [];
    }
  }

  /**
   * Verificar si el vendedor puede usar el sistema
   */
  static puedeUsarSistema(vendedor: Vendedor): {
    permitido: boolean;
    razon?: string;
  } {
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
