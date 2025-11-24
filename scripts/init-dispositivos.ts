/**
 * Script para inicializar la tabla de dispositivos en DynamoDB
 * Inserta los 21 dispositivos configurados
 *
 * Uso: npx ts-node scripts/init-dispositivos.ts
 */

import { DynamoDBService, TABLES } from '../src/utils/dynamodb';
import { DISPOSITIVOS_CONFIG } from '../src/config/dispositivos';
import { Dispositivo } from '../src/types/dispositivo';

async function initDispositivos() {
  console.log('Inicializando dispositivos en DynamoDB...\n');

  try {
    for (const config of DISPOSITIVOS_CONFIG) {
      const dispositivo: Dispositivo = {
        PK: `DISPOSITIVO#${config.codigo}`,
        ...config,
        activo: true,
        ultima_notificacion: undefined,
      };

      await DynamoDBService.put(TABLES.DISPOSITIVOS, dispositivo);

      console.log(`✅ Dispositivo ${config.codigo} (${config.nombre}) creado`);
    }

    console.log('\n✅ Todos los dispositivos fueron inicializados correctamente');
    console.log(`Total: ${DISPOSITIVOS_CONFIG.length} dispositivos`);

    // Resumen
    console.log('\n📊 Resumen:');
    const porEmpresa = DISPOSITIVOS_CONFIG.reduce((acc, d) => {
      acc[d.empresa] = (acc[d.empresa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`- OVERSHARK: ${porEmpresa.OVERSHARK} dispositivos`);
    console.log(`- BRAVO'S: ${porEmpresa.BRAVOS} dispositivos`);

    const porTipo = DISPOSITIVOS_CONFIG.reduce((acc, d) => {
      acc[d.tipo] = (acc[d.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n- YAPE: ${porTipo.YAPE} dispositivos`);
    console.log(`- TRANSFERENCIA: ${porTipo.TRANSFERENCIA} dispositivos`);

  } catch (error) {
    console.error('❌ Error inicializando dispositivos:', error);
    process.exit(1);
  }
}

// Ejecutar script
initDispositivos()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });
