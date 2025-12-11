#!/bin/bash
# Script temporal para ver logs del webhook

LOG_GROUP="/aws/lambda/overshark-backend-dev-webhookWhatsApp"

echo "📋 Últimos eventos del webhook de WhatsApp:"
echo ""

aws logs tail "$LOG_GROUP" --since 24h --format short 2>&1 | head -100
