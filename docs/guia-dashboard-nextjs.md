# 🎨 Guía de Desarrollo - Dashboard Overshark con Next.js

Guía completa para desarrollar el dashboard de validación manual usando **Next.js 14+**, **shadcn/ui**, **DAL (Data Access Layer)** con arquitectura limpia y segura.

---

## 📋 **Índice**

1. [Setup Inicial](#1-setup-inicial)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Autenticación con Cognito](#3-autenticación-con-cognito)
4. [Data Access Layer (DAL)](#4-data-access-layer-dal)
5. [Componentes UI](#5-componentes-ui)
6. [Páginas y Rutas](#6-páginas-y-rutas)
7. [Seguridad](#7-seguridad)
8. [Variables de Entorno](#8-variables-de-entorno)
9. [Testing](#9-testing)

---

## 1. Setup Inicial

### **Crear proyecto Next.js:**
```bash
npx create-next-app@latest overshark-dashboard
```

**Opciones recomendadas:**
```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … Yes
✔ Would you like to use App Router? … Yes
✔ Would you like to customize the default import alias? … No
```

### **Instalar dependencias:**
```bash
cd overshark-dashboard

# shadcn/ui
npx shadcn@latest init

# AWS Amplify para autenticación
npm install @aws-amplify/auth aws-amplify

# Utilidades
npm install date-fns zod
npm install -D @types/node
```

### **Configurar shadcn/ui:**
```
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Would you like to use CSS variables for colors? › Yes
```

### **Instalar componentes de shadcn:**
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add form
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
```

---

## 2. Estructura del Proyecto

```
overshark-dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── loading.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── lib/
│   │   ├── dal/
│   │   │   ├── auth.dal.ts          # DAL para autenticación
│   │   │   └── notificaciones.dal.ts # DAL para notificaciones
│   │   ├── api/
│   │   │   └── client.ts             # Cliente HTTP base
│   │   ├── auth/
│   │   │   ├── cognito.ts            # Configuración Cognito
│   │   │   └── session.ts            # Manejo de sesión
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   └── notificacion.types.ts
│   │   └── utils.ts
│   │
│   ├── components/
│   │   ├── ui/                       # Componentes shadcn
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── protected-route.tsx
│   │   ├── dashboard/
│   │   │   ├── notificaciones-table.tsx
│   │   │   ├── notificacion-card.tsx
│   │   │   ├── validar-dialog.tsx
│   │   │   └── stats-cards.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── user-menu.tsx
│   │   └── providers/
│   │       └── auth-provider.tsx
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-notificaciones.ts
│   │   └── use-toast.ts
│   │
│   └── middleware.ts                 # Middleware de autenticación
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Autenticación con Cognito

### **`.env.local`:**
```env
# API
NEXT_PUBLIC_API_URL=https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# App
NEXT_PUBLIC_APP_NAME=Overshark Dashboard
```

### **`src/lib/auth/cognito.ts`:**
```typescript
import { Amplify } from 'aws-amplify';

// Configurar Amplify una sola vez
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
    }
  }
});

export const cognitoConfig = {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
};
```

### **`src/lib/types/auth.types.ts`:**
```typescript
export type UserRole = 'Admin' | 'Contador';

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}
```

### **`src/lib/dal/auth.dal.ts`:** (Data Access Layer)
```typescript
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  updatePassword,
  type SignInOutput,
} from '@aws-amplify/auth';
import type { User, LoginCredentials, AuthSession } from '../types/auth.types';

/**
 * Data Access Layer para autenticación
 * Maneja toda la lógica de autenticación con Cognito
 */
export class AuthDAL {
  /**
   * Iniciar sesión
   */
  static async login(credentials: LoginCredentials): Promise<SignInOutput> {
    try {
      const result = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      return result;
    } catch (error: any) {
      console.error('Error en login:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario actual
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const cognitoUser = await getCurrentUser();
      const session = await fetchAuthSession();

      const groups = session.tokens?.idToken?.payload['cognito:groups'];
      const roles = Array.isArray(groups) ? groups : groups ? [groups] : [];

      return {
        id: cognitoUser.userId,
        email: cognitoUser.username,
        name: session.tokens?.idToken?.payload['name'] as string,
        roles: roles as any[],
      };
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  /**
   * Obtener token de autenticación
   */
  static async getToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }

  /**
   * Obtener sesión completa
   */
  static async getSession(): Promise<AuthSession | null> {
    try {
      const user = await this.getCurrentUser();
      const token = await this.getToken();

      if (!user || !token) return null;

      const session = await fetchAuthSession();
      const expiresAt = session.tokens?.idToken?.payload.exp as number;

      return {
        user,
        token,
        expiresAt: expiresAt * 1000, // Convertir a milliseconds
      };
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  static async hasRole(role: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.roles.includes(role as any) || false;
    } catch {
      return false;
    }
  }

  /**
   * Verificar si el usuario es Admin
   */
  static async isAdmin(): Promise<boolean> {
    return this.hasRole('Admin');
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await updatePassword({ oldPassword, newPassword });
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      throw new Error(error.message || 'Error al cambiar contraseña');
    }
  }

  /**
   * Verificar si la sesión está activa
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) return false;

      // Verificar si el token no ha expirado
      return Date.now() < session.expiresAt;
    } catch {
      return false;
    }
  }
}
```

---

## 4. Data Access Layer (DAL)

### **`src/lib/types/notificacion.types.ts`:**
```typescript
export type TipoPago = 'YAPE' | 'PLIN' | 'BCP' | 'INTERBANK' | 'IMAGEN_MANUAL' | 'OTRO';
export type EstadoNotificacion = 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO' | 'REVISION_MANUAL';

export interface Notificacion {
  id: string;
  numero_operacion?: string;
  tipo_pago: TipoPago;
  monto?: number;
  nombre_pagador?: string;
  codigo_dispositivo: string;
  texto_raw: string;
  parseado: boolean;
  created_at: string;
  estado: EstadoNotificacion;
  revisado_por?: string;
  fecha_revision?: string;
  notas_revision?: string;
}

export interface ValidarNotificacionRequest {
  numero_operacion: string;
  accion: 'APROBAR' | 'RECHAZAR';
  operador_id: string;
  notas?: string;
  monto?: number;
  nombre_pagador?: string;
  codigo_seguridad?: string;
  fecha_hora?: string;
}

export interface ValidarNotificacionResponse {
  message: string;
  numero_operacion: string;
  estado_anterior: string;
  estado_nuevo: string;
  operador_id: string;
  fecha_revision: string;
}

export interface ListarPendientesResponse {
  total: number;
  notificaciones: Notificacion[];
}
```

### **`src/lib/api/client.ts`:**
```typescript
import { AuthDAL } from '../dal/auth.dal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Cliente HTTP base con autenticación
 */
export class APIClient {
  /**
   * Obtener headers con autenticación
   */
  private static async getHeaders(): Promise<HeadersInit> {
    const token = await AuthDAL.getToken();

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Manejar respuestas de error
   */
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      throw new APIError(
        error.error || error.message || 'Error en la petición',
        response.status,
        error
      );
    }

    return response.json();
  }

  /**
   * GET request
   */
  static async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  static async post<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  static async put<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  static async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }
}
```

### **`src/lib/dal/notificaciones.dal.ts`:**
```typescript
import { APIClient } from '../api/client';
import type {
  Notificacion,
  ValidarNotificacionRequest,
  ValidarNotificacionResponse,
  ListarPendientesResponse,
} from '../types/notificacion.types';

/**
 * Data Access Layer para notificaciones
 * Maneja toda la comunicación con la API de notificaciones
 */
export class NotificacionesDAL {
  /**
   * Listar notificaciones pendientes de revisión manual
   */
  static async listarPendientes(params?: {
    limit?: number;
    tipo_pago?: string;
  }): Promise<ListarPendientesResponse> {
    const queryParams = new URLSearchParams();

    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    if (params?.tipo_pago) {
      queryParams.append('tipo_pago', params.tipo_pago);
    }

    const query = queryParams.toString();
    const endpoint = `/dashboard/pendientes${query ? `?${query}` : ''}`;

    return APIClient.get<ListarPendientesResponse>(endpoint);
  }

  /**
   * Validar notificación (aprobar o rechazar)
   */
  static async validarNotificacion(
    data: ValidarNotificacionRequest
  ): Promise<ValidarNotificacionResponse> {
    return APIClient.post<ValidarNotificacionResponse>(
      '/dashboard/validar',
      data
    );
  }

  /**
   * Aprobar notificación
   */
  static async aprobar(
    numero_operacion: string,
    operador_id: string,
    notas?: string,
    datosCorregidos?: {
      monto?: number;
      nombre_pagador?: string;
      codigo_seguridad?: string;
    }
  ): Promise<ValidarNotificacionResponse> {
    return this.validarNotificacion({
      numero_operacion,
      accion: 'APROBAR',
      operador_id,
      notas,
      ...datosCorregidos,
    });
  }

  /**
   * Rechazar notificación
   */
  static async rechazar(
    numero_operacion: string,
    operador_id: string,
    notas?: string
  ): Promise<ValidarNotificacionResponse> {
    return this.validarNotificacion({
      numero_operacion,
      accion: 'RECHAZAR',
      operador_id,
      notas,
    });
  }
}
```

---

## 5. Componentes UI

### **`src/hooks/use-auth.ts`:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthDAL } from '@/lib/dal/auth.dal';
import type { User } from '@/lib/types/auth.types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await AuthDAL.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await AuthDAL.login({ email, password });
      await checkAuth();
      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  };

  const logout = async () => {
    try {
      await AuthDAL.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const isAdmin = user?.roles.includes('Admin') || false;
  const isContador = user?.roles.includes('Contador') || false;

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isContador,
    login,
    logout,
    refresh: checkAuth,
  };
}
```

### **`src/hooks/use-notificaciones.ts`:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { NotificacionesDAL } from '@/lib/dal/notificaciones.dal';
import type { Notificacion } from '@/lib/types/notificacion.types';
import { useToast } from '@/hooks/use-toast';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await NotificacionesDAL.listarPendientes();
      setNotificaciones(response.notificaciones);
    } catch (err: any) {
      const mensaje = err.message || 'Error al cargar notificaciones';
      setError(mensaje);
      toast({
        title: 'Error',
        description: mensaje,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const aprobar = async (
    numero_operacion: string,
    operador_id: string,
    notas?: string
  ) => {
    try {
      await NotificacionesDAL.aprobar(numero_operacion, operador_id, notas);

      toast({
        title: 'Notificación aprobada',
        description: 'La notificación ha sido aprobada exitosamente',
      });

      // Recargar lista
      await cargarNotificaciones();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al aprobar notificación',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const rechazar = async (
    numero_operacion: string,
    operador_id: string,
    notas?: string
  ) => {
    try {
      await NotificacionesDAL.rechazar(numero_operacion, operador_id, notas);

      toast({
        title: 'Notificación rechazada',
        description: 'La notificación ha sido rechazada',
      });

      // Recargar lista
      await cargarNotificaciones();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al rechazar notificación',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    notificaciones,
    loading,
    error,
    refresh: cargarNotificaciones,
    aprobar,
    rechazar,
  };
}
```

### **`src/components/auth/login-form.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Overshark Dashboard</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder al dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@overshark.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### **`src/components/dashboard/notificaciones-table.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNotificaciones } from '@/hooks/use-notificaciones';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ValidarDialog } from './validar-dialog';
import type { Notificacion } from '@/lib/types/notificacion.types';

export function NotificacionesTable() {
  const { user, isAdmin } = useAuth();
  const { notificaciones, loading, refresh } = useNotificaciones();
  const [selectedNotif, setSelectedNotif] = useState<Notificacion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleValidar = (notificacion: Notificacion) => {
    setSelectedNotif(notificacion);
    setDialogOpen(true);
  };

  const handleSuccess = async () => {
    setDialogOpen(false);
    setSelectedNotif(null);
    await refresh();
  };

  if (loading) {
    return <div className="text-center py-8">Cargando notificaciones...</div>;
  }

  if (notificaciones.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay notificaciones pendientes de revisión
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Dispositivo</TableHead>
            <TableHead>Estado</TableHead>
            {isAdmin && <TableHead>Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {notificaciones.map((notif) => (
            <TableRow key={notif.id}>
              <TableCell>
                {formatDistance(new Date(notif.created_at), new Date(), {
                  addSuffix: true,
                  locale: es,
                })}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{notif.tipo_pago}</Badge>
              </TableCell>
              <TableCell>
                {notif.monto ? `S/ ${notif.monto.toFixed(2)}` : 'N/A'}
              </TableCell>
              <TableCell>{notif.nombre_pagador || 'N/A'}</TableCell>
              <TableCell>
                <code className="text-xs">{notif.codigo_dispositivo}</code>
              </TableCell>
              <TableCell>
                <Badge variant={notif.parseado ? 'default' : 'secondary'}>
                  {notif.parseado ? 'Parseado' : 'Sin parsear'}
                </Badge>
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handleValidar(notif)}
                  >
                    Validar
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedNotif && (
        <ValidarDialog
          notificacion={selectedNotif}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
```

### **`src/components/dashboard/validar-dialog.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { NotificacionesDAL } from '@/lib/dal/notificaciones.dal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Notificacion } from '@/lib/types/notificacion.types';

interface ValidarDialogProps {
  notificacion: Notificacion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ValidarDialog({
  notificacion,
  open,
  onOpenChange,
  onSuccess,
}: ValidarDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAprobar = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      await NotificacionesDAL.aprobar(
        notificacion.numero_operacion || notificacion.id.replace('NOTIF#', ''),
        user.email,
        notas
      );

      toast({
        title: 'Notificación aprobada',
        description: 'La notificación ha sido aprobada exitosamente',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al aprobar notificación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      await NotificacionesDAL.rechazar(
        notificacion.numero_operacion || notificacion.id.replace('NOTIF#', ''),
        user.email,
        notas
      );

      toast({
        title: 'Notificación rechazada',
        description: 'La notificación ha sido rechazada',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al rechazar notificación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Validar Notificación</DialogTitle>
          <DialogDescription>
            Revisa los detalles y decide si aprobar o rechazar la notificación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Tipo de Pago</p>
              <p className="text-sm text-muted-foreground">{notificacion.tipo_pago}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Monto</p>
              <p className="text-sm text-muted-foreground">
                {notificacion.monto ? `S/ ${notificacion.monto.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Nombre</p>
              <p className="text-sm text-muted-foreground">
                {notificacion.nombre_pagador || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Dispositivo</p>
              <p className="text-sm text-muted-foreground">
                {notificacion.codigo_dispositivo}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Texto Original</p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              {notificacion.texto_raw}
            </pre>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Agrega notas sobre esta validación..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRechazar}
            disabled={loading}
          >
            Rechazar
          </Button>
          <Button
            onClick={handleAprobar}
            disabled={loading}
          >
            Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. Páginas y Rutas

### **`src/middleware.ts`:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Por ahora, solo redirigir a login si no hay sesión
  // La verificación real se hace en el cliente con Cognito

  const { pathname } = request.nextUrl;

  // Permitir acceso a login y assets públicos
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Para rutas protegidas, la verificación se hace en el cliente
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### **`src/app/(auth)/login/page.tsx`:**
```typescript
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <LoginForm />
    </div>
  );
}
```

### **`src/app/(dashboard)/dashboard/page.tsx`:**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { NotificacionesTable } from '@/components/dashboard/notificaciones-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overshark</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user.email} ({user.roles.join(', ')})
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Cerrar Sesión
        </Button>
      </div>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones Pendientes</CardTitle>
          <CardDescription>
            Revisa y valida las notificaciones que requieren revisión manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificacionesTable />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 7. Seguridad

### **Mejores prácticas implementadas:**

✅ **Autenticación con JWT**: Tokens seguros gestionados por AWS Cognito
✅ **Autorización por roles**: Admin puede aprobar, Contador solo ver
✅ **HTTPS obligatorio**: API Gateway solo acepta HTTPS
✅ **Tokens de corta duración**: Los tokens de Cognito expiran (configurable)
✅ **Validación en backend**: La Lambda verifica el rol antes de aprobar
✅ **Sin credenciales en frontend**: Las credenciales nunca se exponen
✅ **CORS configurado**: Solo dominios autorizados pueden hacer requests
✅ **Rate limiting**: API Gateway tiene límites de requests

### **Variables de entorno (.env.example):**
```env
# API
NEXT_PUBLIC_API_URL=https://YOUR_API_GATEWAY_URL

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# App
NEXT_PUBLIC_APP_NAME=Overshark Dashboard
```

---

## 8. Variables de Entorno

### **Archivo `.env.example`:**
```env
# ============================================
# API Configuration
# ============================================
NEXT_PUBLIC_API_URL=https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com

# ============================================
# AWS Cognito Configuration
# ============================================
# Obtener estos valores después de ejecutar scripts/setup-cognito.sh
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# ============================================
# App Configuration
# ============================================
NEXT_PUBLIC_APP_NAME=Overshark Dashboard
```

---

## 9. Testing

### **Instalar dependencias de testing:**
```bash
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

### **Ejemplo de test (`src/lib/dal/__tests__/auth.dal.test.ts`):**
```typescript
import { AuthDAL } from '../auth.dal';

// Mock de AWS Amplify
jest.mock('@aws-amplify/auth');

describe('AuthDAL', () => {
  describe('login', () => {
    it('debería iniciar sesión exitosamente', async () => {
      // Test implementation
    });

    it('debería manejar errores de credenciales inválidas', async () => {
      // Test implementation
    });
  });

  describe('hasRole', () => {
    it('debería verificar si el usuario tiene rol de Admin', async () => {
      // Test implementation
    });
  });
});
```

---

## 📝 **Checklist de Desarrollo**

### **Setup Inicial:**
- [ ] Crear proyecto Next.js
- [ ] Instalar shadcn/ui
- [ ] Configurar Tailwind CSS
- [ ] Instalar AWS Amplify

### **Autenticación:**
- [ ] Ejecutar script `setup-cognito.sh`
- [ ] Guardar credenciales en `.env.local`
- [ ] Implementar `AuthDAL`
- [ ] Crear hook `useAuth`
- [ ] Crear componente `LoginForm`

### **Dashboard:**
- [ ] Implementar `NotificacionesDAL`
- [ ] Crear hook `useNotificaciones`
- [ ] Crear tabla de notificaciones
- [ ] Crear dialog de validación
- [ ] Implementar lógica de aprobar/rechazar

### **Seguridad:**
- [ ] Configurar middleware de autenticación
- [ ] Implementar verificación de roles en UI
- [ ] Validar permisos en cada acción

### **Testing:**
- [ ] Escribir tests para DAL
- [ ] Escribir tests para hooks
- [ ] Escribir tests para componentes

---

## 🚀 **Comandos Útiles**

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview de producción
npm start

# Linting
npm run lint

# Testing
npm test
```

---

## 📚 **Recursos Adicionales**

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [AWS Amplify Auth](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ✅ **Principios de Arquitectura**

1. **Separación de responsabilidades**: DAL maneja API, componentes manejan UI
2. **Reutilización**: Hooks personalizados para lógica compartida
3. **Type Safety**: TypeScript en todo el proyecto
4. **Seguridad primero**: Autenticación y autorización en todos los niveles
5. **Simple y mantenible**: Código claro y bien documentado

---

**¡Listo para empezar a desarrollar!** 🎉
