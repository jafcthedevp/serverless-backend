# 🔐 Setup de Autenticación para Dashboard

Sistema de autenticación con AWS Cognito para Dashboard de Overshark con 2 roles: **Admin** y **Contador**.

---

## 🚀 **Paso 1: Ejecutar script de configuración**

```bash
# Dar permisos de ejecución (Linux/Mac)
chmod +x scripts/setup-cognito.sh

# Ejecutar script
bash scripts/setup-cognito.sh
```

O **manualmente**:

```bash
# 1. Crear User Pool
aws cognito-idp create-user-pool \
  --pool-name overshark-dashboard-users \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
  --auto-verified-attributes email \
  --username-attributes email \
  --region us-east-1

# 2. Anotar el USER_POOL_ID de la respuesta

# 3. Crear App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name overshark-dashboard-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region us-east-1

# 4. Anotar el CLIENT_ID de la respuesta

# 5. Crear grupos
aws cognito-idp create-group \
  --user-pool-id <USER_POOL_ID> \
  --group-name Admin \
  --description "Administradores" \
  --region us-east-1

aws cognito-idp create-group \
  --user-pool-id <USER_POOL_ID> \
  --group-name Contador \
  --description "Contadores" \
  --region us-east-1

# 6. Crear usuario admin
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username admin@overshark.com \
  --user-attributes Name=email,Value=admin@overshark.com Name=email_verified,Value=true \
  --temporary-password "Temporal123!" \
  --message-action SUPPRESS \
  --region us-east-1

# 7. Agregar admin al grupo Admin
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username admin@overshark.com \
  --group-name Admin \
  --region us-east-1

# 8. Crear usuario contador
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username contador@overshark.com \
  --user-attributes Name=email,Value=contador@overshark.com Name=email_verified,Value=true \
  --temporary-password "Temporal123!" \
  --message-action SUPPRESS \
  --region us-east-1

# 9. Agregar contador al grupo Contador
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username contador@overshark.com \
  --group-name Contador \
  --region us-east-1
```

---

## 📋 **Paso 2: Guardar credenciales en SSM Parameter Store**

```bash
# Guardar USER_POOL_ID
aws ssm put-parameter \
  --name "overshark-backend-dev-COGNITO_USER_POOL_ID" \
  --value "<USER_POOL_ID>" \
  --type String \
  --region us-east-1

# Guardar CLIENT_ID
aws ssm put-parameter \
  --name "overshark-backend-dev-COGNITO_CLIENT_ID" \
  --value "<CLIENT_ID>" \
  --type String \
  --region us-east-1
```

---

## 📋 **Paso 3: Deploy del backend**

```bash
npx serverless deploy --region us-east-1
```

---

## 📋 **Paso 4: Configurar Frontend Next.js**

### **Instalar dependencias:**
```bash
npm install @aws-amplify/auth aws-amplify
```

### **Crear archivo `.env.local`:**
```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_API_URL=https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com
```

### **Crear `lib/auth.ts`:**
```typescript
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
    }
  }
});

export class AuthService {
  static async login(email: string, password: string) {
    try {
      const user = await signIn({ username: email, password });
      return { success: true, user };
    } catch (error: any) {
      if (error.name === 'NewPasswordRequiredError') {
        return { success: false, needsNewPassword: true, error };
      }
      return { success: false, error };
    }
  }

  static async changePassword(email: string, oldPassword: string, newPassword: string) {
    try {
      const user = await signIn({ username: email, password: oldPassword });
      // Aquí manejar el cambio de password si es temporal
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async logout() {
    await signOut();
  }

  static async getToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }

  static async getCurrentUser() {
    try {
      return await getCurrentUser();
    } catch {
      return null;
    }
  }

  static async getUserGroups(): Promise<string[]> {
    try {
      const session = await fetchAuthSession();
      const groups = session.tokens?.idToken?.payload['cognito:groups'];
      return Array.isArray(groups) ? groups : groups ? [groups] : [];
    } catch {
      return [];
    }
  }

  static async isAdmin(): Promise<boolean> {
    const groups = await this.getUserGroups();
    return groups.includes('Admin');
  }
}
```

### **Crear `lib/api.ts`:**
```typescript
import { AuthService } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export class DashboardAPI {
  private static async getHeaders() {
    const token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async listarPendientes() {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE}/dashboard/pendientes`, {
      headers,
    });

    if (response.status === 401) {
      throw new Error('No autorizado');
    }

    if (!response.ok) {
      throw new Error('Error al cargar notificaciones');
    }

    return response.json();
  }

  static async validarNotificacion(data: {
    numero_operacion: string;
    accion: 'APROBAR' | 'RECHAZAR';
    operador_id: string;
    notas?: string;
    monto?: number;
  }) {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE}/dashboard/validar`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      throw new Error('No autorizado');
    }

    if (response.status === 403) {
      throw new Error('Solo administradores pueden aprobar/rechazar');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al validar notificación');
    }

    return response.json();
  }
}
```

---

## 👥 **Usuarios por defecto**

| Email | Password | Rol | Permisos |
|-------|----------|-----|----------|
| `admin@overshark.com` | `Temporal123!` | Admin | Ver y Aprobar/Rechazar |
| `contador@overshark.com` | `Temporal123!` | Contador | Solo Ver |

⚠️ **Los usuarios deben cambiar su password en el primer login**

---

## 🔐 **Permisos por Rol**

### **Admin:**
- ✅ Ver notificaciones pendientes (`GET /dashboard/pendientes`)
- ✅ Aprobar notificaciones (`POST /dashboard/validar` con `accion: APROBAR`)
- ✅ Rechazar notificaciones (`POST /dashboard/validar` con `accion: RECHAZAR`)

### **Contador:**
- ✅ Ver notificaciones pendientes (`GET /dashboard/pendientes`)
- ❌ NO puede aprobar/rechazar (devuelve 403 Forbidden)

---

## 🧪 **Probar autenticación**

### **1. Login:**
```bash
# Obtener token de Cognito
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id <CLIENT_ID> \
  --auth-parameters USERNAME=admin@overshark.com,PASSWORD=Temporal123! \
  --region us-east-1
```

### **2. Usar token en requests:**
```bash
# Listar pendientes (requiere autenticación)
curl https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes \
  -H "Authorization: Bearer <ID_TOKEN>"

# Sin token → 401 Unauthorized
curl https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes
```

---

## 📝 **Agregar más usuarios**

```bash
# Crear nuevo usuario
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username nuevo@overshark.com \
  --user-attributes Name=email,Value=nuevo@overshark.com Name=email_verified,Value=true \
  --temporary-password "Temporal123!" \
  --region us-east-1

# Agregar al grupo Admin o Contador
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username nuevo@overshark.com \
  --group-name Admin \
  --region us-east-1
```

---

## 🔄 **Resetear password de un usuario**

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username admin@overshark.com \
  --password "NuevoPassword123!" \
  --permanent \
  --region us-east-1
```

---

## 📊 **Resumen de flujo:**

```
1. Usuario accede al dashboard → /login
2. Ingresa email y password
3. Frontend hace login con Cognito
4. Cognito devuelve JWT token con grupos
5. Frontend guarda token
6. Frontend hace request a /dashboard/pendientes con token
7. API Gateway valida token automáticamente
8. Si es válido → Lambda procesa request
9. Si token inválido/expirado → 401
10. Si usuario intenta aprobar sin ser Admin → 403
```
