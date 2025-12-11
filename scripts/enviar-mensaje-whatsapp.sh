#!/bin/bash

# Script para enviar mensaje de prueba de WhatsApp
# Uso: ./scripts/enviar-mensaje-whatsapp.sh [numero_destino]

PHONE_NUMBER_ID="808365405703506"
ACCESS_TOKEN="EAAU32RdwUpoBQAn8i2r04jD5CXCPbjMHP391IHRxGxMB05KGVS20fDy16qDZBhObqdzbZAD1rKfvCrFlgJ9YLWZCCazss8TZCObbHufXKYtSCAZA6hgreEzhiWp4ZCFwrluxG3Svz3ZCVAFND9NZBiSiSlkwB5E4034uPSeKEYz9QpH8TVVZBwt95vRrF0fCuLDctnAZDZD"
NUMERO_DESTINO="${1:-51930193795}"  # Default: vendedor de prueba

echo "📱 Enviando mensaje de prueba de WhatsApp..."
echo "   Destino: +$NUMERO_DESTINO"
echo ""

curl -i -X POST \
  "https://graph.facebook.com/v22.0/$PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"$NUMERO_DESTINO\",
    \"type\": \"template\",
    \"template\": {
      \"name\": \"hello_world\",
      \"language\": {
        \"code\": \"en_US\"
      }
    }
  }"

echo ""
echo ""
echo "✅ Mensaje enviado!"
