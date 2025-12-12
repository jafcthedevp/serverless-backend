/**
 * Script para crear y aprobar vendedor directamente
 * Útil para setup inicial sin esperar auto-registro
 *
 * Uso: npx ts-node scripts/crear-vendedor-aprobado.ts <telefono> [nombre]
 * Ejemplo: npx ts-node scripts/crear-vendedor-aprobado.ts 51930193795 "Vendedor Prueba"
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { DynamoDBService, TABLES } from '../src/utils/dynamodb';
import { Vendedor } from '../src/types/vendedor';

async function crearYAprobarVendedor() {
  const telefono = process.argv[2];
  const nombre = process.argv[3];

  if (!telefono) {
    console.error('❌ Error: Debes proporcionar un número de teléfono');
    console.log('\nUso: npx ts-node scripts/crear-vendedor-aprobado.ts <telefono> [nombre]');
    console.log('Ejemplo: npx ts-node scripts/crear-vendedor-aprobado.ts 51930193795 "Vendedor Prueba"\n');
    process.exit(1);
  }

  console.log(`\n🔍 Creando vendedor: ${telefono}...`);

  try {
    const timestamp = new Date().toISOString();

    const vendedor: Vendedor = {
      PK: `VENDEDOR#${telefono}`,
      telefono,
      nombre: nombre || undefined,
      estado: 'APROBADO',
      fecha_registro: timestamp,
      total_validaciones: 0,
      ultima_actividad: timestamp,
      aprobado_por: 'SCRIPT_SETUP',
      fecha_aprobacion: timestamp,
      primer_mensaje: 'Vendedor creado mediante script de setup inicial',
    };

    await DynamoDBService.put(TABLES.VENDEDORES, vendedor);

    console.log(`\n✅ Vendedor creado y aprobado exitosamente!`);
    console.log(`   Teléfono: ${telefono}`);
    if (nombre) {
      console.log(`   Nombre: ${nombre}`);
    }
    console.log(`   Estado: APROBADO`);
    console.log(`   Fecha: ${timestamp}`);
    console.log(`\n🎉 El vendedor ${telefono} puede usar el sistema inmediatamente.\n`);
  } catch (error) {
    console.error('\n❌ Error creando vendedor:', error);
    process.exit(1);
  }
}

crearYAprobarVendedor()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
