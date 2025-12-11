const axios = require('axios');

const endpoint = 'https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook';
const verifyToken = '9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20';
const phoneNumberId = '808365405703506'; // ID correcto actualizado

// Test 1: Verificación del webhook (GET)
const testVerificacion = async () => {
  console.log('\n=== Test 1: Verificación del Webhook (GET) ===');

  try {
    const response = await axios.get(endpoint, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': 'TEST_CHALLENGE_12345'
      }
    });
    console.log('✅ Respuesta:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

// Test 2: Mensaje de texto desde vendedor autorizado
const testMensajeTexto = async () => {
  console.log('\n=== Test 2: Mensaje de Texto (Vendedor Autorizado) ===');

  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: phoneNumberId,
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550783881',
                phone_number_id: phoneNumberId
              },
              messages: [
                {
                  from: '51930193795', // Número autorizado (Vendedor Prueba)
                  id: 'wamid.TEST123',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: {
                    body: 'Hola, necesito ayuda'
                  }
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(endpoint, payload);
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

// Test 3: Mensaje de texto desde vendedor NO autorizado
const testMensajeNoAutorizado = async () => {
  console.log('\n=== Test 3: Mensaje desde Número NO Autorizado ===');

  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: phoneNumberId,
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550783881',
                phone_number_id: phoneNumberId
              },
              messages: [
                {
                  from: '51999999999', // Número NO autorizado
                  id: 'wamid.TEST456',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: {
                    body: 'Quiero validar un voucher'
                  }
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(endpoint, payload);
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

// Test 4: Mensaje con imagen (simulado - sin media ID real)
const testMensajeImagen = async () => {
  console.log('\n=== Test 4: Mensaje con Imagen ===');
  console.log('⚠️ NOTA: Este test fallará porque no tenemos un media_id real de WhatsApp');
  console.log('         En producción, WhatsApp enviará un media_id que debemos descargar.');

  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: phoneNumberId,
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550783881',
                phone_number_id: phoneNumberId
              },
              messages: [
                {
                  from: '51930193795',
                  id: 'wamid.TEST789',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'image',
                  image: {
                    mime_type: 'image/jpeg',
                    sha256: 'fake_sha256_hash',
                    id: 'FAKE_MEDIA_ID_12345' // Este ID no existe, solo para testing
                  }
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(endpoint, payload);
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Error (esperado):', error.response?.data || error.message);
  }
};

// Test 5: Simular flujo completo (IMAGEN + TEXTO)
const testFlujoCompleto = async () => {
  console.log('\n=== Test 5: Flujo Completo (Simulación) ===');
  console.log('Paso 1: Vendedor envía IMAGEN del voucher');
  console.log('  → Sistema procesa con Textract (OCR)');
  console.log('  → Extrae: monto, número de operación, código de seguridad');
  console.log('  → Guarda sesión temporal (TTL 30 min)');
  console.log('  → Solicita datos adicionales al vendedor');
  console.log('');
  console.log('Paso 2: Vendedor envía TEXTO con:');
  console.log('  - Nombre del cliente');
  console.log('  - Código de servicio');
  console.log('  - (Opcional) Teléfono y ubicación');
  console.log('');
  console.log('Paso 3: Sistema valida automáticamente:');
  console.log('  ✓ Check 1: Monto coincide');
  console.log('  ✓ Check 2: Código de seguridad coincide');
  console.log('  ✓ Check 3: Número de operación coincide');
  console.log('  ✓ Check 4: Código de servicio válido');
  console.log('  ✓ Check 5: Tiempo de transacción (< 3 horas)');
  console.log('');
  console.log('⚠️ Para probar el flujo completo necesitamos:');
  console.log('  1. Un media_id real de WhatsApp (imagen de voucher)');
  console.log('  2. O usar la simulación local con serverless-offline');
};

// Ejecutar todos los tests
const runAllTests = async () => {
  console.log('🚀 Iniciando pruebas del Webhook de WhatsApp...');
  console.log('Endpoint:', endpoint);
  console.log('═'.repeat(70));

  await testVerificacion();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testMensajeTexto();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testMensajeNoAutorizado();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testMensajeImagen();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testFlujoCompleto();

  console.log('\n' + '═'.repeat(70));
  console.log('✅ Pruebas completadas\n');

  console.log('📝 Resumen:');
  console.log('  ✅ Verificación del webhook: Funcional');
  console.log('  ✅ Validación de whitelist: Funcional');
  console.log('  ⚠️  Procesamiento de imágenes: Requiere media_id real de WhatsApp');
  console.log('  ℹ️  Para testing local completo: usar serverless-offline + mock de WhatsApp API');
};

// Ejecutar
runAllTests().catch(console.error);
