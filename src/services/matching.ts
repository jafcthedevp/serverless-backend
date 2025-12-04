import { NotificacionYape } from '../types/notificacion';
import { VoucherDatos, ResultadoValidacion } from '../types/venta';
import { SimilitudService } from './similitud';

/**
 * Servicio para realizar el matching entre notificaciones y vouchers
 */
export class MatchingService {
  /**
   * Valida un voucher contra una notificación de Yape
   * Realiza 5 checks obligatorios:
   * 1. Número de operación (único)
   * 2. Código de dispositivo (crítico)
   * 3. Monto (exacto)
   * 4. Nombre (similitud ≥95%)
   * 5. Código de seguridad (exacto)
   */
  static validarVenta(
    voucher: VoucherDatos,
    notificacion: NotificacionYape
  ): ResultadoValidacion {
    // Validar que la notificación tenga los datos requeridos
    if (!notificacion.numero_operacion || !notificacion.monto || !notificacion.nombre_pagador || !notificacion.codigo_seguridad) {
      return {
        valido: false,
        razon: 'NOTIFICACION_INCOMPLETA',
        mensaje: 'La notificación no tiene todos los datos requeridos para validación automática',
      };
    }

    // Check 2: VALIDACIÓN CRÍTICA - Código de dispositivo debe coincidir
    if (notificacion.codigo_dispositivo !== voucher.codigoServicio) {
      return {
        valido: false,
        razon: 'CODIGO_DISPOSITIVO_NO_COINCIDE',
        mensaje: `El pago llegó a ${notificacion.codigo_dispositivo} pero enviaste voucher para ${voucher.codigoServicio}`,
      };
    }

    // Realizar los 5 checks
    const checks = {
      // Check 1: Número de operación (único - validado previamente)
      numeroOperacion: notificacion.numero_operacion === voucher.numeroOperacion,

      // Check 2: Código de dispositivo (crítico - ya validado arriba)
      codigoDispositivo: notificacion.codigo_dispositivo === voucher.codigoServicio,

      // Check 3: Monto EXACTO (sin tolerancia)
      monto: notificacion.monto === voucher.monto,

      // Check 4: Nombre MUY ESTRICTO (≥95% similitud)
      nombre: SimilitudService.calcularSimilitud(
        notificacion.nombre_pagador,
        voucher.nombreCliente
      ) >= 95,

      // Check 5: Código de seguridad OBLIGATORIO
      codigoSeguridad: notificacion.codigo_seguridad === voucher.codigoSeguridad,
    };

    const checksPasados = Object.values(checks).filter((v) => v).length;
    const confianza = (checksPasados / 5) * 100;
    const camposCoincidentes = Object.keys(checks).filter(
      (k) => checks[k as keyof typeof checks]
    );

    // Decisión (requiere 5/5 = 100% o al menos 95% de confianza)
    if (confianza >= 95) {
      return {
        valido: true,
        confianza,
        mensaje: this.formatearMensajeExito(voucher, notificacion),
        campos_coincidentes: camposCoincidentes,
      };
    } else if (confianza >= 60) {
      // Match insuficiente - Revisión manual
      return {
        valido: false,
        razon: 'MATCH_INSUFICIENTE',
        confianza,
        mensaje: `⏳ Los datos no coinciden completamente (${confianza.toFixed(
          1
        )}% confianza).\nUn operador revisará tu solicitud.\n\n` +
        `Campos que no coinciden:\n${this.formatearCamposNoCoincidentes(checks, notificacion, voucher)}`,
        campos_coincidentes: camposCoincidentes,
      };
    } else {
      // Rechazo directo
      return {
        valido: false,
        razon: 'DATOS_NO_COINCIDEN',
        confianza,
        mensaje: `Los datos no coinciden (${confianza.toFixed(1)}% confianza).\n\n` +
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
      const similitud = SimilitudService.calcularSimilitud(
        notificacion.nombre_pagador || '',
        voucher.nombreCliente
      );
      noCoincidentes.push(
        `• Nombre: "${notificacion.nombre_pagador}" ≠ "${voucher.nombreCliente}" (${similitud.toFixed(1)}% similar)`
      );
    }

    if (!checks.codigoSeguridad) {
      noCoincidentes.push(
        `• Código Seguridad: Notificación ${notificacion.codigo_seguridad} ≠ Voucher ${voucher.codigoSeguridad}`
      );
    }

    if (!checks.numeroOperacion) {
      noCoincidentes.push(
        `• Número Operación: ${notificacion.numero_operacion} ≠ ${voucher.numeroOperacion}`
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
