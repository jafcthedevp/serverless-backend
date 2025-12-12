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
    // 1. Buscar notificación por código dispositivo + código seguridad
    const notificacionesCandidatas = await DynamoDBService.queryIndex(
      TABLES.NOTIFICACIONES,
      'DispositivoCodigoIndex',
      'codigo_dispositivo = :dispositivo AND codigo_seguridad = :codigo',
      {
        ':dispositivo': voucher.codigoServicio,
        ':codigo': voucher.codigoSeguridad,
      }
    ) as NotificacionYape[];

    console.log(`Encontradas ${notificacionesCandidatas.length} notificaciones con dispositivo=${voucher.codigoServicio} y código=${voucher.codigoSeguridad}`);

    // 2. Filtrar en memoria por nombre EXACTO, monto EXACTO y estado PENDIENTE
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const notificacion = notificacionesCandidatas.find(n =>
      n.nombre_pagador === voucher.nombreCliente &&  // Nombre EXACTO
      n.monto === voucher.monto &&                    // Monto EXACTO
      n.estado === 'PENDIENTE_VALIDACION' &&          // Solo pendientes
      n.created_at > hace24h                          // Últimas 24 horas
    );

    if (!notificacion) {
      // Buscar si hay notificaciones similares para dar mejor feedback
      const notifConMonto = notificacionesCandidatas.find(n => n.monto === voucher.monto);
      const notifConNombre = notificacionesCandidatas.find(n => n.nombre_pagador === voucher.nombreCliente);

      let mensajeDetalle = '⚠️ No encontramos un pago que coincida exactamente.\n\n';

      if (notifConMonto && !notifConNombre) {
        mensajeDetalle += `✅ Encontramos un pago de S/${voucher.monto}\n` +
          `❌ Pero el nombre no coincide exactamente\n\n` +
          `En el sistema: "${notifConMonto.nombre_pagador}"\n` +
          `Tú enviaste: "${voucher.nombreCliente}"\n\n` +
          `💡 Copia el nombre EXACTAMENTE como aparece en Yape (con espacios, mayúsculas, puntos, etc.)`;
      } else if (notifConNombre && !notifConMonto) {
        mensajeDetalle += `✅ Encontramos un pago de "${voucher.nombreCliente}"\n` +
          `❌ Pero el monto no coincide\n\n` +
          `En el sistema: S/${notifConNombre.monto}\n` +
          `Tú enviaste: S/${voucher.monto}`;
      } else if (notificacionesCandidatas.length > 0) {
        mensajeDetalle += `Encontramos ${notificacionesCandidatas.length} pago(s) con el mismo código de seguridad,\n` +
          `pero ninguno coincide en nombre Y monto.\n\n` +
          `Verifica:\n` +
          `• El nombre sea EXACTAMENTE igual a Yape\n` +
          `• El monto sea correcto\n` +
          `• Que sea un pago de las últimas 24 horas`;
      } else {
        mensajeDetalle = '⚠️ No encontramos el pago en nuestro sistema.\n\n' +
          'Verifica:\n' +
          `• El código del servicio (${voucher.codigoServicio})\n` +
          `• El código de seguridad (${voucher.codigoSeguridad})\n` +
          '• Que el pago se haya realizado a uno de nuestros números\n' +
          '• Que hayan pasado al menos 30 segundos desde el pago';
      }

      return {
        valido: false,
        razon: 'NO_EXISTE_NOTIFICACION',
        mensaje: mensajeDetalle,
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
        fecha_hora_pago: notificacion.fecha_hora || timestamp,
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
