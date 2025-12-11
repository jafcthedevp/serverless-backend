/**
 * Script de prueba: Enviar mensaje de WhatsApp
 *
 * Uso:
 * node scripts/test-whatsapp-envio.js [numero_destino] [mensaje]
 *
 * Ejemplo:
 * node scripts/test-whatsapp-envio.js 51987654321 "Hola, este es un mensaje de prueba"
 */

const axios = require('axios');

// Credenciales (actualizadas)
const PHONE_NUMBER_ID = '934971743027376';
const ACCESS_TOKEN = 'EAAT0ngu7fqsBQO2awT51Wzh5j03VcvCh8tbtRGjyjM54KIaZBZB8OAlU7fQc1f6LUsvga23FSnfczxp7ZAQgwG7TQ4VZC71JGJzTdOSZC37Ilr0DzKYAsLcfbgPaxbyMncy6fxwoE7AvnvbmOrL1N83yshnzpWbhQZAgHOSHBuCTJ6i2dtXgHZA7hH1ZBegdZA1osCcT37lMk4Fle0Jq0LXHf7dsZAz6qqb5N50PHa2jJ2OL9yjOeEsAdaZAUZAMqSBjryqDx8SdveRE7FaxnBE0S2t5DMsd3WQJaZA834CQZAfgZDZD';

async function enviarMensaje(destinatario, mensaje) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinatario,
    type: 'text',
    text: {
      preview_url: false,
      body: mensaje,
    },
  };

  try {
    console.log(`📤 Enviando mensaje a: ${destinatario}`);
    console.log(`📝 Mensaje: ${mensaje}`);
    console.log(`🔑 Phone Number ID: ${PHONE_NUMBER_ID}`);
    console.log(`🔗 URL: ${url}\n`);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    console.log('✅ Mensaje enviado exitosamente!');
    console.log('📊 Respuesta de WhatsApp API:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('❌ Error enviando mensaje:');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Datos:', JSON.stringify(error.response.data, null, 2));

      // Errores comunes
      if (error.response.data?.error?.code === 131000) {
        console.error('\n⚠️  Error 131000: El usuario no ha iniciado conversación con el bot');
        console.error('Solución: El usuario debe enviarte el primer mensaje por WhatsApp');
      } else if (error.response.data?.error?.code === 190) {
        console.error('\n⚠️  Error 190: Token de acceso inválido o expirado');
        console.error('Solución: Genera un nuevo token en Meta Business Suite');
      }
    } else {
      console.error('Error:', error.message);
    }

    throw error;
  }
}

// Ejecutar desde línea de comandos
const args = process.argv.slice(2);
const destinatario = args[0];
const mensaje = args[1] || 'Mensaje de prueba desde el sistema Overshark';

if (!destinatario) {
  console.error('❌ Error: Debes proporcionar un número de destino');
  console.log('\nUso: node scripts/test-whatsapp-envio.js [numero] [mensaje]');
  console.log('Ejemplo: node scripts/test-whatsapp-envio.js 51987654321 "Hola mundo"');
  process.exit(1);
}

// Validar formato del número
if (!/^\d+$/.test(destinatario)) {
  console.error('❌ Error: El número solo debe contener dígitos (sin + ni espacios)');
  console.log('Correcto: 51987654321');
  console.log('Incorrecto: +51 987 654 321');
  process.exit(1);
}

console.log('🚀 Iniciando prueba de envío de mensaje de WhatsApp\n');
console.log('=' .repeat(60));

enviarMensaje(destinatario, mensaje)
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Prueba completada exitosamente');
  })
  .catch((error) => {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Prueba fallida');
    process.exit(1);
  });
