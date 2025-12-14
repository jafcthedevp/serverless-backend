import { NotificacionYape } from '../types/notificacion';
import { VoucherDatos, ResultadoValidacion } from '../types/venta';

/**
 * Servicio para realizar el matching entre notificaciones y vouchers
 */
export class MatchingService {
  /**
   * Valida un voucher contra una notificación de Yape
   * Realiza 2 checks obligatorios (matching simple):
   * 1. Código de seguridad (EXACTO)
   * 2. Monto (EXACTO)
   *
   * Nota: El número de operación ya no se usa para matching, solo para anti-duplicación
   */
  static validarVenta(
    voucher: VoucherDatos,
    notificacion: NotificacionYape
  ): ResultadoValidacion {
    // Validar que la notificación tenga los datos requeridos
    if (!notificacion.monto || !notificacion.codigo_seguridad) {
      return {
        valido: false,
        razon: 'NOTIFICACION_INCOMPLETA',
        mensaje: 'La notificación no tiene todos los datos requeridos para validación automática',
      };
    }

    // Realizar los 2 checks (codigo_seguridad y monto)
    const checks = {
      // Check 1: Código de seguridad EXACTO
      codigoSeguridad: notificacion.codigo_seguridad === voucher.codigoSeguridad,

      // Check 2: Monto EXACTO (sin tolerancia)
      monto: notificacion.monto === voucher.monto,
    };

    const checksPasados = Object.values(checks).filter((v) => v).length;
    const confianza = (checksPasados / 2) * 100;
    const camposCoincidentes = Object.keys(checks).filter(
      (k) => checks[k as keyof typeof checks]
    );

    // Decisión (requiere 2/2 = 100% para aprobación automática)
    if (confianza === 100) {
      return {
        valido: true,
        confianza,
        mensaje: this.formatearMensajeExito(voucher, notificacion),
        campos_coincidentes: camposCoincidentes,
      };
    } else {
      // Si no pasan ambos checks, rechazar
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
