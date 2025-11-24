import { VoucherDatos, VentaValidada, ResultadoValidacion } from '../types/venta';
import { NotificacionYape } from '../types/notificacion';
import { DynamoDBService, TABLES } from '../utils/dynamodb';
import { MatchingService } from '../services/matching';

/**
 * Valida un voucher contra las notificaciones de Yape
 * Implementa el algoritmo de matching de 5 checks
 */
export async function validarVoucher(voucher: VoucherDatos): Promise<ResultadoValidacion> {
  try {
    // 1. Buscar notificación por número de operación
    const notificacion = await DynamoDBService.get(TABLES.NOTIFICACIONES, {
      PK: `NOTIF#${voucher.numeroOperacion}`,
    }) as NotificacionYape | undefined;

    if (!notificacion) {
      return {
        valido: false,
        razon: 'NO_EXISTE_NOTIFICACION',
        mensaje:
          '⚠️ No encontramos el pago en nuestro sistema.\n\n' +
          'Verifica:\n' +
          '• El número de operación sea correcto\n' +
          '• Que el pago se haya realizado a uno de nuestros números\n' +
          '• Que hayan pasado al menos 30 segundos desde el pago',
      };
    }

    // 2. Verificar si ya fue validado (anti-duplicación)
    const ventaExistente = await DynamoDBService.get(TABLES.VENTAS, {
      PK: `VENTA#${voucher.numeroOperacion}`,
    }) as VentaValidada | undefined;

    if (ventaExistente) {
      return {
        valido: false,
        razon: 'OPERACION_DUPLICADA',
        mensaje: MatchingService.generarMensajeDuplicado(
          voucher.numeroOperacion,
          ventaExistente.vendedor_whatsapp,
          ventaExistente.fecha_hora_validacion
        ),
      };
    }

    // 3. Realizar matching de 5 checks
    const resultadoMatching = MatchingService.validarVenta(voucher, notificacion);

    // 4. Si es válido, registrar la venta
    if (resultadoMatching.valido) {
      const timestamp = new Date().toISOString();

      const venta: VentaValidada = {
        PK: `VENTA#${voucher.numeroOperacion}`,
        SK: timestamp,
        numero_operacion: voucher.numeroOperacion,
        cliente_nombre: voucher.nombreCliente,
        cliente_telefono: voucher.telefonoCliente,
        cliente_ubicacion: voucher.ubicacion,
        monto: voucher.monto,
        codigo_seguridad: voucher.codigoSeguridad,
        fecha_hora_pago: notificacion.fecha_hora,
        codigo_servicio_voucher: voucher.codigoServicio,
        codigo_servicio_notificacion: notificacion.codigo_dispositivo,
        vendedor_whatsapp: voucher.vendedorWhatsApp,
        match_exitoso: true,
        confianza_match: resultadoMatching.confianza || 100,
        campos_coincidentes: resultadoMatching.campos_coincidentes || [],
        estado: 'VALIDADO',
        validado_por: 'SISTEMA_AUTOMATICO',
        fecha_hora_validacion: timestamp,
        voucher_s3_key: voucher.voucherUrl,
      };

      // Guardar venta validada
      await DynamoDBService.put(TABLES.VENTAS, venta);

      // Actualizar estado de la notificación
      await DynamoDBService.update(
        TABLES.NOTIFICACIONES,
        { PK: `NOTIF#${voucher.numeroOperacion}`, SK: notificacion.SK },
        'SET estado = :estado',
        { ':estado': 'VALIDADO' }
      );

      console.log('Venta validada y registrada:', venta);
    } else if (resultadoMatching.razon === 'MATCH_INSUFICIENTE') {
      // Registrar para revisión manual
      const timestamp = new Date().toISOString();

      const venta: VentaValidada = {
        PK: `VENTA#${voucher.numeroOperacion}`,
        SK: timestamp,
        numero_operacion: voucher.numeroOperacion,
        cliente_nombre: voucher.nombreCliente,
        cliente_telefono: voucher.telefonoCliente,
        cliente_ubicacion: voucher.ubicacion,
        monto: voucher.monto,
        codigo_seguridad: voucher.codigoSeguridad,
        fecha_hora_pago: notificacion.fecha_hora,
        codigo_servicio_voucher: voucher.codigoServicio,
        codigo_servicio_notificacion: notificacion.codigo_dispositivo,
        vendedor_whatsapp: voucher.vendedorWhatsApp,
        match_exitoso: false,
        confianza_match: resultadoMatching.confianza || 0,
        campos_coincidentes: resultadoMatching.campos_coincidentes || [],
        estado: 'REVISION_MANUAL',
        validado_por: 'SISTEMA_AUTOMATICO',
        fecha_hora_validacion: timestamp,
        voucher_s3_key: voucher.voucherUrl,
      };

      await DynamoDBService.put(TABLES.VENTAS, venta);

      // Actualizar estado de la notificación
      await DynamoDBService.update(
        TABLES.NOTIFICACIONES,
        { PK: `NOTIF#${voucher.numeroOperacion}`, SK: notificacion.SK },
        'SET estado = :estado',
        { ':estado': 'REVISION_MANUAL' }
      );

      console.log('Venta marcada para revisión manual:', venta);
    }

    return resultadoMatching;
  } catch (error) {
    console.error('Error validando voucher:', error);
    throw error;
  }
}

/**
 * Lambda Handler (opcional - por si se quiere exponer como endpoint independiente)
 */
export const handler = async (event: any): Promise<any> => {
  try {
    const voucher: VoucherDatos = JSON.parse(event.body);
    const resultado = await validarVoucher(voucher);

    return {
      statusCode: resultado.valido ? 200 : 400,
      body: JSON.stringify(resultado),
    };
  } catch (error) {
    console.error('Error en handler validarConMatch:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
