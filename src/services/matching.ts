import { NotificacionYape } from '../types/notificacion';
import { VoucherDatos, ResultadoValidacion } from '../types/venta';

/**
 * Servicio para realizar el matching entre notificaciones y vouchers
 */
export class MatchingService {
  /**
   * Valida un voucher contra una notificación de Yape
   * Realiza 4 checks obligatorios:
   * 1. Código de dispositivo (crítico - EXACTO)
   * 2. Código de seguridad (EXACTO)
   * 3. Nombre (EXACTO 100%)
   * 4. Monto (EXACTO)
   *
   * Nota: El número de operación ya no se usa para matching, solo para anti-duplicación
   */
  static validarVenta(
    voucher: VoucherDatos,
    notificacion: NotificacionYape
  ): ResultadoValidacion {
    // Validar que la notificación tenga los datos requeridos
    if (!notificacion.monto || !notificacion.nombre_pagador || !notificacion.codigo_seguridad) {
      return {
        valido: false,
        razon: 'NOTIFICACION_INCOMPLETA',
        mensaje: 'La notificación no tiene todos los datos requeridos para validación automática',
      };
    }

    // Check 1: VALIDACIÓN CRÍTICA - Código de dispositivo debe coincidir
    if (notificacion.codigo_dispositivo !== voucher.codigoServicio) {
      return {
        valido: false,
        razon: 'CODIGO_DISPOSITIVO_NO_COINCIDE',
        mensaje: `El pago llegó a ${notificacion.codigo_dispositivo} pero enviaste voucher para ${voucher.codigoServicio}`,
      };
    }

    // Realizar los 4 checks
    const checks = {
      // Check 1: Código de dispositivo (crítico - ya validado arriba)
      codigoDispositivo: notificacion.codigo_dispositivo === voucher.codigoServicio,

      // Check 2: Código de seguridad EXACTO
      codigoSeguridad: notificacion.codigo_seguridad === voucher.codigoSeguridad,

      // Check 3: Nombre EXACTO (100% igual - sin tolerancia)
      nombre: notificacion.nombre_pagador === voucher.nombreCliente,

      // Check 4: Monto EXACTO (sin tolerancia)
      monto: notificacion.monto === voucher.monto,
    };

    const checksPasados = Object.values(checks).filter((v) => v).length;
    const confianza = (checksPasados / 4) * 100;
    const camposCoincidentes = Object.keys(checks).filter(
      (k) => checks[k as keyof typeof checks]
    );

    // Decisión (requiere 4/4 = 100% para aprobación automática)
    if (confianza === 100) {
      return {
        valido: true,
        confianza,
        mensaje: this.formatearMensajeExito(voucher, notificacion),
        campos_coincidentes: camposCoincidentes,
      };
    } else if (confianza >= 75) {
      // 3/4 checks pasados - Revisión manual
      return {
        valido: false,
        razon: 'MATCH_INSUFICIENTE',
        confianza,
        mensaje: `⏳ Los datos no coinciden completamente (${confianza.toFixed(
          0
        )}% confianza).\nUn operador revisará tu solicitud.\n\n` +
        `Campos que no coinciden:\n${this.formatearCamposNoCoincidentes(checks, notificacion, voucher)}`,
        campos_coincidentes: camposCoincidentes,
      };
    } else {
      // Menos de 3/4 checks - Rechazo directo
      return {
        valido: false,
        razon: 'DATOS_NO_COINCIDEN',
        confianza,
        mensaje: `❌ Los datos no coinciden (${confianza.toFixed(0)}% confianza).\n\n` +
        `${this.formatearCamposNoCoincidentes(checks, notificacion, voucher)}`,
        campos_coincidentes: camposCoincidentes,
      };
    }
  }

  /**
   * Formatea el mensaje de éxito
   */
  private static formatearMensajeExito(
    voucher: VoucherDatos,
    notificacion: NotificacionYape
  ): string {
    return `✅ Venta validada correctamente

📋 Detalles:
• Cliente: ${voucher.nombreCliente}
${voucher.telefonoCliente ? `• Teléfono: ${voucher.telefonoCliente}\n` : ''}${voucher.ubicacion ? `• Ubicación: ${voucher.ubicacion}\n` : ''}• Servicio: ${voucher.codigoServicio}
• Monto: S/${voucher.monto.toFixed(2)}
• Operación: ${voucher.numeroOperacion}
• Código Seguridad: ${voucher.codigoSeguridad}
• Fecha: ${notificacion.fecha_hora ? new Date(notificacion.fecha_hora).toLocaleString('es-PE') : 'N/A'}`;
  }

  /**
   * Formatea los campos que no coinciden para mostrar al usuario
   */
  private static formatearCamposNoCoincidentes(
    checks: { [key: string]: boolean },
    notificacion: NotificacionYape,
    voucher: VoucherDatos
  ): string {
    const noCoincidentes: string[] = [];

    if (!checks.monto) {
      noCoincidentes.push(
        `• Monto: Notificación S/${notificacion.monto?.toFixed(2)} ≠ Voucher S/${voucher.monto.toFixed(2)}`
      );
    }

    if (!checks.nombre) {
      noCoincidentes.push(
        `• Nombre: "${notificacion.nombre_pagador}" ≠ "${voucher.nombreCliente}"\n  💡 El nombre debe ser EXACTAMENTE igual (mayúsculas, espacios, puntos, etc.)`
      );
    }

    if (!checks.codigoSeguridad) {
      noCoincidentes.push(
        `• Código Seguridad: Notificación ${notificacion.codigo_seguridad} ≠ Voucher ${voucher.codigoSeguridad}`
      );
    }

    return noCoincidentes.join('\n');
  }

  /**
   * Verifica si una operación ya fue validada
   */
  static generarMensajeDuplicado(
    numeroOperacion: string,
    vendedor: string,
    fecha: string
  ): string {
    return `Este pago ya fue validado

Operación: ${numeroOperacion}
Validado por: ${vendedor}
Fecha: ${new Date(fecha).toLocaleString('es-PE')}

No se puede validar el mismo pago dos veces.`;
  }
}
