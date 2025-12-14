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
    // Normalizar datos del voucher para matching
    const codigoNormalizado = String(voucher.codigoSeguridad).trim();
    const montoNormalizado = Number(voucher.monto);

    console.log('🔍 Iniciando validación con:', {
      codigoSeguridad: codigoNormalizado,
      codigoTipo: typeof codigoNormalizado,
      monto: montoNormalizado,
      montoTipo: typeof montoNormalizado,
      numeroOperacion: voucher.numeroOperacion,
    });

    // 1. PRIMERO: Verificar si ya fue validado (anti-duplicación)
    // Nota: VENTAS usa PK+SK, así que usamos query en vez de get
    console.log('🔍 Verificando duplicados para numero_operacion:', voucher.numeroOperacion);

    const ventasExistentes = await DynamoDBService.query(
      TABLES.VENTAS,
      'PK = :pk',
      { ':pk': `VENTA#${voucher.numeroOperacion}` }
    ) as VentaValidada[];

    console.log(`📊 Encontradas ${ventasExistentes.length} ventas existentes con este numero_operacion`);

    if (ventasExistentes.length > 0) {
      console.log('⚠️ Venta duplicada encontrada:', {
        numero_operacion: ventasExistentes[0].numero_operacion,
        vendedor: ventasExistentes[0].vendedor_whatsapp,
        fecha_validacion: ventasExistentes[0].fecha_hora_validacion,
      });

      return {
        valido: false,
        razon: 'OPERACION_DUPLICADA',
        mensaje: MatchingService.generarMensajeDuplicado(
          voucher.numeroOperacion,
          ventasExistentes[0].vendedor_whatsapp,
          ventasExistentes[0].fecha_hora_validacion
        ),
      };
    }

    // 2. Buscar notificaciones por código de seguridad y monto (matching simple)
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Usar scan con filtro para buscar por codigo_seguridad + monto
    const todasNotificaciones = await DynamoDBService.scan(
      TABLES.NOTIFICACIONES,
      {
        FilterExpression: 'codigo_seguridad = :codigo AND monto = :monto AND estado = :estado AND created_at > :fecha',
        ExpressionAttributeValues: {
          ':codigo': codigoNormalizado,
          ':monto': montoNormalizado,
          ':estado': 'PENDIENTE_VALIDACION',
          ':fecha': hace24h,
        }
      }
    ) as NotificacionYape[];

    console.log(`📊 Encontradas ${todasNotificaciones.length} notificaciones con código=${codigoNormalizado} y monto=S/${montoNormalizado}`);

    if (todasNotificaciones.length > 0) {
      console.log('Primera notificación encontrada:', {
        PK: todasNotificaciones[0].PK,
        SK: todasNotificaciones[0].SK,
        monto: todasNotificaciones[0].monto,
        codigo_seguridad: todasNotificaciones[0].codigo_seguridad,
      });
    }

    // 2. Tomar la primera notificación que coincida
    const notificacion = todasNotificaciones.length > 0 ? todasNotificaciones[0] : undefined;

    if (!notificacion) {
      // Buscar notificaciones similares para dar mejor feedback
      const notifConCodigo = await DynamoDBService.scan(
        TABLES.NOTIFICACIONES,
        {
          FilterExpression: 'codigo_seguridad = :codigo AND estado = :estado AND created_at > :fecha',
          ExpressionAttributeValues: {
            ':codigo': codigoNormalizado,
            ':estado': 'PENDIENTE_VALIDACION',
            ':fecha': hace24h,
          }
        }
      ) as NotificacionYape[];

      const notifConMonto = await DynamoDBService.scan(
        TABLES.NOTIFICACIONES,
        {
          FilterExpression: 'monto = :monto AND estado = :estado AND created_at > :fecha',
          ExpressionAttributeValues: {
            ':monto': montoNormalizado,
            ':estado': 'PENDIENTE_VALIDACION',
            ':fecha': hace24h,
          }
        }
      ) as NotificacionYape[];

      console.log('❌ No se encontró match exacto. Detalles:', {
        notifConCodigo: notifConCodigo.length,
        notifConMonto: notifConMonto.length,
        codigoBuscado: codigoNormalizado,
        montoBuscado: montoNormalizado,
      });

      // Log de notificaciones encontradas para debugging
      if (notifConCodigo.length > 0) {
        console.log('Notificaciones con mismo código:', notifConCodigo.map(n => ({
          codigo: n.codigo_seguridad,
          monto: n.monto,
          created_at: n.created_at,
        })));
      }
      if (notifConMonto.length > 0) {
        console.log('Notificaciones con mismo monto:', notifConMonto.map(n => ({
          codigo: n.codigo_seguridad,
          monto: n.monto,
          created_at: n.created_at,
        })));
      }

      let mensajeDetalle = '⚠️ No encontramos un pago que coincida.\n\n';

      if (notifConCodigo.length > 0 && notifConMonto.length === 0) {
        mensajeDetalle += `✅ Encontramos un pago con código de seguridad ${voucher.codigoSeguridad}\n` +
          `❌ Pero el monto no coincide\n\n` +
          `En el sistema: S/${notifConCodigo[0].monto}\n` +
          `Tú enviaste: S/${voucher.monto}\n\n` +
          `💡 Verifica que el monto sea correcto`;
      } else if (notifConMonto.length > 0 && notifConCodigo.length === 0) {
        mensajeDetalle += `✅ Encontramos un pago de S/${voucher.monto}\n` +
          `❌ Pero el código de seguridad no coincide\n\n` +
          `Códigos en el sistema: ${notifConMonto.map(n => n.codigo_seguridad).join(', ')}\n` +
          `Tú enviaste: ${voucher.codigoSeguridad}\n\n` +
          `💡 Verifica que el código de seguridad sea correcto`;
      } else {
        mensajeDetalle = '⚠️ No encontramos el pago en nuestro sistema.\n\n' +
          'Verifica:\n' +
          `• El código de seguridad (${voucher.codigoSeguridad})\n` +
          `• El monto (S/${voucher.monto})\n` +
          '• Que el pago se haya realizado a uno de nuestros números\n' +
          '• Que hayan pasado al menos 30 segundos desde el pago';
      }

      return {
        valido: false,
        razon: 'NO_EXISTE_NOTIFICACION',
        mensaje: mensajeDetalle,
      };
    }

    // 3. Realizar matching simple (codigo_seguridad + monto)
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
        fecha_hora_pago: notificacion.fecha_hora || timestamp,
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

      // Actualizar estado de la notificación a VALIDADO
      console.log('🔄 Actualizando notificación a VALIDADO:', {
        table: TABLES.NOTIFICACIONES,
        key: { PK: notificacion.PK, SK: notificacion.SK },
        PK_type: typeof notificacion.PK,
        SK_type: typeof notificacion.SK,
      });

      await DynamoDBService.update(
        TABLES.NOTIFICACIONES,
        { PK: notificacion.PK, SK: notificacion.SK },
        'SET estado = :estado',
        { ':estado': 'VALIDADO' }
      );

      console.log('Venta validada y registrada:', venta);
    }

    // Retornar resultado (ya sea válido o no válido)
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
