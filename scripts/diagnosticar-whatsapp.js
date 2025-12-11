#!/usr/bin/env node
/**
 * Script de diagnóstico para WhatsApp Business API
 * Verifica la configuración y estado de la cuenta
 */

const https = require('https');

// Configuración desde variables de entorno o SSM
const PHONE_NUMBER_ID = '808365405703506';
const ACCESS_TOKEN = 'EAAU32RdwUpoBQAn8i2r04jD5CXCPbjMHP391IHRxGxMB05KGVS20fDy16qDZBhObqdzbZAD1rKfvCrFlgJ9YLWZCCazss8TZCObbHufXKYtSCAZA6hgreEzhiWp4ZCFwrluxG3Svz3ZCVAFND9NZBiSiSlkwB5E4034uPSeKEYz9QpH8TVVZBwt95vRrF0fCuLDctnAZDZD';

console.log('🔍 Diagnóstico de WhatsApp Business API\n');

// 1. Verificar información del número de teléfono
console.log('📱 Verificando información del número de teléfono...');
const phoneInfoUrl = `/v21.0/${PHONE_NUMBER_ID}?access_token=${ACCESS_TOKEN}`;

https.get(`https://graph.facebook.com${phoneInfoUrl}`, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n✅ Información del número de teléfono:');
    const phoneInfo = JSON.parse(data);
    console.log(JSON.stringify(phoneInfo, null, 2));

    if (phoneInfo.error) {
      console.log('\n❌ Error obteniendo información del teléfono:');
      console.log(phoneInfo.error);
      return;
    }

    console.log('\n📝 Estado de verificación:', phoneInfo.verified_name || 'No verificado');
    console.log('📞 Número:', phoneInfo.display_phone_number);
    console.log('🔢 Quality Rating:', phoneInfo.quality_rating || 'N/A');

    // 2. Verificar límites de mensajería
    console.log('\n📊 Verificando límites de mensajería...');
    const limitsUrl = `/v21.0/${PHONE_NUMBER_ID}/message_templates?access_token=${ACCESS_TOKEN}&limit=5`;

    https.get(`https://graph.facebook.com${limitsUrl}`, (res2) => {
      let data2 = '';

      res2.on('data', (chunk) => {
        data2 += chunk;
      });

      res2.on('end', () => {
        const templates = JSON.parse(data2);
        console.log('\n✅ Plantillas de mensaje disponibles:');
        if (templates.data && templates.data.length > 0) {
          templates.data.forEach(t => {
            console.log(`  - ${t.name} (${t.status})`);
          });
        } else {
          console.log('  ⚠️  No hay plantillas configuradas');
        }

        console.log('\n💡 Notas importantes:');
        console.log('1. Para enviar mensajes a usuarios, ellos deben iniciar la conversación primero');
        console.log('2. O debes usar plantillas de mensaje aprobadas por Meta');
        console.log('3. El error 131000 generalmente indica:');
        console.log('   - El número destino no ha iniciado conversación con el bot');
        console.log('   - El número no está registrado en WhatsApp');
        console.log('   - La ventana de 24 horas ha expirado');
        console.log('\n🔗 Para configurar el webhook correctamente:');
        console.log('   1. Ve a: https://developers.facebook.com/apps');
        console.log('   2. Selecciona tu app de WhatsApp');
        console.log('   3. Ve a WhatsApp > Configuration');
        console.log('   4. Asegúrate de que el webhook esté suscrito a "messages"');
      });
    }).on('error', (err) => {
      console.error('❌ Error verificando plantillas:', err.message);
    });
  });
}).on('error', (err) => {
  console.error('❌ Error verificando número de teléfono:', err.message);
  console.log('\n💡 Verifica que:');
  console.log('1. El ACCESS_TOKEN sea válido y no haya expirado');
  console.log('2. El PHONE_NUMBER_ID sea correcto');
  console.log('3. Tengas permisos de whatsapp_business_messaging');
});
