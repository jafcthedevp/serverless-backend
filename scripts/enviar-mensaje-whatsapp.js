const axios = require('axios');

/**
 * Script para enviar mensaje de prueba de WhatsApp
 * Uso: node scripts/enviar-mensaje-whatsapp.js [numero_destino]
 */

const PHONE_NUMBER_ID = '808365405703506';
const ACCESS_TOKEN = 'EAAT0ngu7fqsBQDXovclsbY5KLvEYSmnA7qFjw4sMxH788fkZB2QnIPjpxZATAfZAUK6fU2erxo5hiV4yVzotXWAdSknwXPxEgAuUYVTa7JyRxKubZAZA5zA2BrboxbG5IYYbL2i4JeMYDBst8BFoa6xI5jtE3kgeuYh553ZBA3tHQoGjfUqRuZBewr2VBEZAS5dcrwZDZD';

// Número de destino (default: vendedor de prueba)
const numeroDestino = process.argv[2] || '51930193795';

async function enviarMensajePrueba() {
  console.log('📱 Enviando mensaje de prueba de WhatsApp...');
  console.log(`   Destino: +${numeroDestino}`);
  console.log('');

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: numeroDestino,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Mensaje enviado exitosamente!');
    console.log('');
    console.log('📊 Respuesta de WhatsApp:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('🎯 Ahora el vendedor debería:');
    console.log('   1. Recibir el mensaje "Hello World" en WhatsApp');
    console.log('   2. Responder con un mensaje de texto');
    console.log('   3. El sistema detectará su mensaje y procesará según su estado');
    console.log('');
  } catch (error) {
    console.error('❌ Error enviando mensaje:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   ', error.message);
    }
    console.log('');
    console.log('💡 Posibles causas:');
    console.log('   - El Access Token expiró');
    console.log('   - El número de teléfono no está verificado en WhatsApp Business');
    console.log('   - El Phone Number ID es incorrecto');
    console.log('   - El número de destino no tiene WhatsApp');
    process.exit(1);
  }
}

enviarMensajePrueba();
