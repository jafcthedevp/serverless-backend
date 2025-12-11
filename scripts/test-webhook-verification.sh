#!/bin/bash
# Script para probar la verificación del webhook manualmente

WEBHOOK_URL="https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook"
VERIFY_TOKEN="9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20"

echo "🔍 Probando verificación del webhook de WhatsApp"
echo ""
echo "📍 URL: $WEBHOOK_URL"
echo "🔑 Token: ${VERIFY_TOKEN:0:20}..."
echo ""

# Simular la petición de verificación que hace Meta/Facebook
echo "📤 Enviando petición GET de verificación..."
echo ""

RESPONSE=$(curl -w "\n\nHTTP_STATUS:%{http_code}" -s -X GET \
  "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=CHALLENGE_TEST_12345")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📥 Respuesta recibida:"
echo "Status Code: $HTTP_STATUS"
echo "Body: $BODY"
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
    if [ "$BODY" == "CHALLENGE_TEST_12345" ]; then
        echo "✅ ¡Verificación EXITOSA!"
        echo "   El webhook está respondiendo correctamente."
    else
        echo "⚠️  Status 200 pero respuesta incorrecta"
        echo "   Se esperaba: CHALLENGE_TEST_12345"
        echo "   Se recibió: $BODY"
    fi
else
    echo "❌ Verificación FALLIDA"
    echo "   Se esperaba status 200, se recibió: $HTTP_STATUS"
    echo ""
    echo "💡 Posibles causas:"
    echo "   1. Token de verificación incorrecto"
    echo "   2. Error en el código del handler"
    echo "   3. Problema con el API Gateway"
fi
