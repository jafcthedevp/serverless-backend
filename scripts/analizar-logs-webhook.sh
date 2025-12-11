#!/bin/bash
# Script para analizar logs y ver qué tipo de eventos están llegando

echo "🔍 Analizando logs del webhook para identificar tipos de eventos..."
echo ""

LOGS=$(MSYS_NO_PATHCONV=1 aws logs tail /aws/lambda/overshark-backend-dev-webhookWhatsApp --since 6h --format short 2>&1)

echo "📊 Buscando eventos con 'messages' (mensajes entrantes):"
echo "$LOGS" | grep -o '"messages":\[' | wc -l | awk '{print "  Encontrados: " $1 " eventos"}'

echo ""
echo "📊 Buscando eventos con 'statuses' (estados de mensajes enviados):"
echo "$LOGS" | grep -o '"statuses":\[' | wc -l | awk '{print "  Encontrados: " $1 " eventos"}'

echo ""
echo "📊 Buscando eventos con 'contacts' (info de contacto del remitente):"
echo "$LOGS" | grep -o '"contacts":\[' | wc -l | awk '{print "  Encontrados: " $1 " eventos"}'

echo ""
echo "📊 Verificando campos 'field':"
FIELD_MESSAGES=$(echo "$LOGS" | grep -o '"field":"messages"' | wc -l)
echo "  field: messages = $FIELD_MESSAGES eventos"

echo ""
echo "📊 Buscando errores en mensajes salientes:"
echo "$LOGS" | grep -o '"status":"failed"' | wc -l | awk '{print "  Mensajes fallidos: " $1}'

echo ""
echo "💡 Interpretación:"
echo "  - Si 'messages' > 0: Estás recibiendo mensajes de usuarios ✅"
echo "  - Si 'statuses' > 0: El webhook recibe notificaciones de estado ✅"
echo "  - Si solo hay 'statuses' y no 'messages': Los usuarios NO están escribiendo ⚠️"
