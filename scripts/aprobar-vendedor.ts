/**
 * Script para aprobar vendedor manualmente
 * Útil para aprobar el primer vendedor antes de tener acceso al dashboard
 *
 * Uso: npx ts-node scripts/aprobar-vendedor.ts <telefono>
 * Ejemplo: npx ts-node scripts/aprobar-vendedor.ts 51957614218
 */

import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

import { DynamoDBService, TABLES } from '../src/utils/dynamodb';
import { VendedorService } from '../src/services/vendedorService';

async function aprobarVendedor() {
  const telefono = process.argv[2];

  if (!telefono) {
    console.error('❌ Error: Debes proporcionar un número de teléfono');
    console.log('\nUso: npx ts-node scripts/aprobar-vendedor.ts <telefono>');
    console.log('Ejemplo: npx ts-node scripts/aprobar-vendedor.ts 51957614218\n');
    process.exit(1);
  }

  console.log(`\n🔍 Buscando vendedor: ${telefono}...`);

  try {
    // Verificar si existe
    const vendedor = await VendedorService.obtenerVendedor(telefono);

    if (!vendedor) {
      console.error(`\n❌ Vendedor no encontrado: ${telefono}`);
      console.log('\nEl vendedor debe enviar un mensaje por WhatsApp primero para auto-registrarse.');
      process.exit(1);
    }

    console.log(`\n✅ Vendedor encontrado:`);
    console.log(`   Teléfono: ${vendedor.telefono}`);
    console.log(`   Estado actual: ${vendedor.estado}`);
    console.log(`   Fecha registro: ${vendedor.fecha_registro}`);
    if (vendedor.nombre) {
      console.log(`   Nombre: ${vendedor.nombre}`);
    }

    if (vendedor.estado === 'APROBADO') {
      console.log('\n⚠️  Este vendedor ya está APROBADO');
      process.exit(0);
    }

    // Aprobar
    console.log(`\n✅ Aprobando vendedor...`);
    const success = await VendedorService.aprobarVendedor(telefono, 'SCRIPT_ADMIN');

    if (success) {
      console.log(`\n🎉 ¡Vendedor aprobado exitosamente!`);
      console.log(`   El vendedor ${telefono} ahora puede usar el sistema.\n`);
    } else {
      console.error('\n❌ Error al aprobar vendedor');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Función para listar vendedores pendientes
async function listarPendientes() {
  console.log('\n📋 Listando vendedores pendientes...\n');

  try {
    const pendientes = await VendedorService.listarPorEstado('PENDIENTE');

    if (pendientes.length === 0) {
      console.log('✨ No hay vendedores pendientes de aprobación\n');
      return;
    }

    console.log(`📊 Total: ${pendientes.length} vendedor(es) pendiente(s)\n`);

    pendientes.forEach((v, index) => {
      console.log(`${index + 1}. Teléfono: ${v.telefono}`);
      console.log(`   Estado: ${v.estado}`);
      console.log(`   Registro: ${new Date(v.fecha_registro).toLocaleString()}`);
      if (v.primer_mensaje) {
        console.log(`   Primer mensaje: "${v.primer_mensaje.substring(0, 50)}..."`);
      }
      console.log('');
    });

    console.log('Para aprobar un vendedor, ejecuta:');
    console.log('npx ts-node scripts/aprobar-vendedor.ts <telefono>\n');
  } catch (error) {
    console.error('❌ Error listando pendientes:', error);
    process.exit(1);
  }
}

// Detectar modo
const comando = process.argv[2];

if (comando === '--listar' || comando === '-l') {
  listarPendientes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
} else {
  aprobarVendedor()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
