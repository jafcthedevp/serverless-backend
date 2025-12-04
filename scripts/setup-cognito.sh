#!/bin/bash

# Script para configurar AWS Cognito para el Dashboard Overshark
# Usuarios: Admin y Contador

REGION="us-east-1"
POOL_NAME="overshark-dashboard-users"

echo "📋 Creando User Pool en Cognito..."

# Crear User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name $POOL_NAME \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" \
  --auto-verified-attributes email \
  --username-attributes email \
  --mfa-configuration OFF \
  --region $REGION \
  --query 'UserPool.Id' \
  --output text)

echo "✅ User Pool creado: $USER_POOL_ID"

# Crear App Client
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name overshark-dashboard-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region $REGION \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "✅ App Client creado: $CLIENT_ID"

# Crear grupo Admin
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name Admin \
  --description "Administradores con acceso completo" \
  --region $REGION

echo "✅ Grupo Admin creado"

# Crear grupo Contador
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name Contador \
  --description "Contadores con acceso de solo lectura" \
  --region $REGION

echo "✅ Grupo Contador creado"

# Crear usuario Admin
echo ""
echo "📝 Creando usuario admin@overshark.com..."
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@overshark.com \
  --user-attributes Name=email,Value=admin@overshark.com Name=email_verified,Value=true \
  --temporary-password "Temporal123!" \
  --message-action SUPPRESS \
  --region $REGION

# Agregar admin al grupo Admin
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@overshark.com \
  --group-name Admin \
  --region $REGION

echo "✅ Usuario admin@overshark.com creado (Password: Temporal123!)"

# Crear usuario Contador
echo ""
echo "📝 Creando usuario contador@overshark.com..."
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username contador@overshark.com \
  --user-attributes Name=email,Value=contador@overshark.com Name=email_verified,Value=true \
  --temporary-password "Temporal123!" \
  --message-action SUPPRESS \
  --region $REGION

# Agregar contador al grupo Contador
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username contador@overshark.com \
  --group-name Contador \
  --region $REGION

echo "✅ Usuario contador@overshark.com creado (Password: Temporal123!)"

echo ""
echo "=========================================="
echo "🎉 Configuración completada!"
echo "=========================================="
echo ""
echo "📋 Guarda esta información:"
echo ""
echo "USER_POOL_ID=$USER_POOL_ID"
echo "CLIENT_ID=$CLIENT_ID"
echo "REGION=$REGION"
echo ""
echo "👥 Usuarios creados:"
echo "  - admin@overshark.com (Grupo: Admin) - Password: Temporal123!"
echo "  - contador@overshark.com (Grupo: Contador) - Password: Temporal123!"
echo ""
echo "⚠️  Los usuarios deben cambiar su password en el primer login"
echo ""
echo "📝 Agrega estas variables a tu .env del frontend:"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID"
echo "NEXT_PUBLIC_COGNITO_REGION=$REGION"
