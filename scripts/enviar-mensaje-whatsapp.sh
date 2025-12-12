#!/bin/bash

# Script para enviar mensaje de prueba de WhatsApp
# Uso: ./scripts/enviar-mensaje-whatsapp.sh [numero_destino]

PHONE_NUMBER_ID="808365405703506"
ACCESS_TOKEN="EAAT0ngu7fqsBQDXovclsbY5KLvEYSmnA7qFjw4sMxH788fkZB2QnIPjpxZATAfZAUK6fU2erxo5hiV4yVzotXWAdSknwXPxEgAuUYVTa7JyRxKubZAZA5zA2BrboxbG5IYYbL2i4JeMYDBst8BFoa6xI5jtE3kgeuYh553ZBA3tHQoGjfUqRuZBewr2VBEZAS5dcrwZDZD"
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
