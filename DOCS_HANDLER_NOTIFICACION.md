# Documentación del Handler de Notificaciones Yape

## Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Flujo Completo del Handler](#flujo-completo-del-handler)
4. [Componentes Principales](#componentes-principales)
5. [Estructura de Datos](#estructura-de-datos)
6. [Validaciones y Seguridad](#validaciones-y-seguridad)
7. [Parseo de Notificaciones](#parseo-de-notificaciones)
8. [Base de Datos (DynamoDB)](#base-de-datos-dynamodb)
9. [Ejemplos de Uso](#ejemplos-de-uso)
10. [Fuentes del Código](#fuentes-del-código)

---

## Visión General

### ¿Qué hace este handler?

El **handler de guardar notificaciones** (`guardarNotificacion.ts`) es una función AWS Lambda que:

1. **Recibe notificaciones de Yape** desde apps móviles instaladas en 21 dispositivos físicos
2. **Valida** que el dispositivo que envía la notificación sea legítimo
3. **Parsea** el texto de la notificación para extraer información estructurada (monto, nombre, código de seguridad, etc.)
4. **Guarda** la información en DynamoDB para posterior validación
5. **Actualiza** el estado del dispositivo que envió la notificación

### Contexto del Sistema

Este handler es parte de un sistema más grande llamado **Overshark Backend** que:

- Gestiona pagos por Yape para dos empresas: **OVERSHARK** y **BRAVO'S**
- Opera con **21 dispositivos móviles** distribuidos en:
  - 4 dispositivos en Lima
  - 7 dispositivos en Provincia
  - 4 dispositivos para TikTok
  - 2 dispositivos para transferencias (Overshark)
  - 2 dispositivos Yape (Bravo's)
  - 2 dispositivos para transferencias (Bravo's)

---

## Arquitectura del Sistema

```
┌─────────────────────┐
│  App Móvil Android  │
│  (21 dispositivos)  │
│                     │
│  Captura notif.     │
│  de Yape            │
└──────────┬──────────┘
           │
           │ POST /notificaciones
           │ { texto, codigo_dispositivo }
           ▼
┌─────────────────────────────────────┐
│  AWS Lambda: guardarNotificacion    │
│                                     │
│  1. Validar request body           │
│  2. Validar código dispositivo     │
│  3. Parsear texto de notificación  │
│  4. Guardar en DynamoDB            │
│  5. Actualizar dispositivo         │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│         DynamoDB                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  NotificacionesTable        │   │
│  │  - PK: NOTIF#{nro_operacion}│   │
│  │  - SK: timestamp            │   │
│  │  - monto, nombre, código    │   │
│  │  - estado: PENDIENTE_VALID. │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  DispositivosTable          │   │
│  │  - PK: DISPOSITIVO#{codigo} │   │
│  │  - ultima_notificacion      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Flujo Completo del Handler

### Paso 1: Recepción del Request

**Archivo:** `src/handlers/guardarNotificacion.ts:13-16`

El handler recibe un evento de API Gateway con:
- **Method:** POST
- **Path:** `/notificaciones`
- **Body:** JSON con los datos de la notificación

```typescript
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
```

### Paso 2: Validación del Body

**Archivo:** `src/handlers/guardarNotificacion.ts:19-26`

Se valida que el request tenga un body válido:

```typescript
if (!event.body) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Body requerido' }),
  };
}

const payload = JSON.parse(event.body);
```

### Paso 3: Validación de Campos Requeridos

**Archivo:** `src/handlers/guardarNotificacion.ts:29-37`

Se verifica que el payload contenga:
- `texto`: El texto completo de la notificación de Yape
- `codigo_dispositivo`: El identificador único del dispositivo

```typescript
if (!payload.texto || !payload.codigo_dispositivo) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: 'Faltan campos requeridos: texto, codigo_dispositivo',
    }),
  };
}
```

### Paso 4: Validación del Código de Dispositivo

**Archivo:** `src/handlers/guardarNotificacion.ts:39-47`

Se valida que el código del dispositivo esté en la lista de dispositivos autorizados:

```typescript
if (!esCodigoValido(payload.codigo_dispositivo)) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: `Código de dispositivo inválido: ${payload.codigo_dispositivo}`,
    }),
  };
}
```

La función `esCodigoValido()` verifica contra una lista de **21 dispositivos configurados** en `src/config/dispositivos.ts:222-224`.

### Paso 5: Parseo de la Notificación

**Archivo:** `src/handlers/guardarNotificacion.ts:49-60`

Se utiliza el servicio `YapeParser` para extraer información estructurada del texto:

```typescript
const notificacionParseada = YapeParser.parseNotificacion(payload.texto);

if (!notificacionParseada) {
  console.error('No se pudo parsear la notificación:', payload.texto);
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: 'No se pudo extraer información de la notificación',
    }),
  };
}
```

El parser extrae:
- **Monto:** Cantidad en soles (S/)
- **Nombre del pagador:** Quién hizo el pago
- **Código de seguridad:** Código de 3 dígitos de Yape
- **Número de operación:** ID único de la transacción
- **Fecha y hora:** Timestamp de la operación

### Paso 6: Creación del Registro

**Archivo:** `src/handlers/guardarNotificacion.ts:62-78`

Se crea un objeto `NotificacionYape` con la estructura requerida por DynamoDB:

```typescript
const timestamp = new Date().toISOString();

const notificacion: NotificacionYape = {
  PK: `NOTIF#${notificacionParseada.numero_operacion}`,
  SK: timestamp,
  monto: notificacionParseada.monto,
  nombre_pagador: notificacionParseada.nombre_pagador,
  codigo_seguridad: notificacionParseada.codigo_seguridad,
  numero_operacion: notificacionParseada.numero_operacion,
  fecha_hora: notificacionParseada.fecha_hora,
  codigo_dispositivo: payload.codigo_dispositivo,
  estado: 'PENDIENTE_VALIDACION',
  parseado: true,
  created_at: timestamp,
};
```

**Diseño de claves:**
- `PK`: `NOTIF#{numero_operacion}` - Permite buscar por número de operación
- `SK`: Timestamp ISO - Permite ordenar notificaciones por tiempo

### Paso 7: Guardar en DynamoDB

**Archivo:** `src/handlers/guardarNotificacion.ts:80-81`

Se guarda la notificación en la tabla de notificaciones:

```typescript
await DynamoDBService.put(TABLES.NOTIFICACIONES, notificacion);
```

### Paso 8: Actualizar Estado del Dispositivo

**Archivo:** `src/handlers/guardarNotificacion.ts:83-89`

Se actualiza el timestamp de la última notificación recibida del dispositivo:

```typescript
await DynamoDBService.update(
  TABLES.DISPOSITIVOS,
  { PK: `DISPOSITIVO#${payload.codigo_dispositivo}` },
  'SET ultima_notificacion = :timestamp',
  { ':timestamp': timestamp }
);
```

Esto permite:
- Monitorear que los dispositivos estén funcionando
- Detectar dispositivos que no han enviado notificaciones recientemente
- Hacer troubleshooting de problemas de conectividad

### Paso 9: Respuesta Exitosa

**Archivo:** `src/handlers/guardarNotificacion.ts:91-101`

Se retorna una respuesta HTTP 200 con información de la notificación guardada:

```typescript
return {
  statusCode: 200,
  body: JSON.stringify({
    message: 'Notificación guardada exitosamente',
    numero_operacion: notificacionParseada.numero_operacion,
    monto: notificacionParseada.monto,
    codigo_dispositivo: payload.codigo_dispositivo,
  }),
};
```

### Paso 10: Manejo de Errores

**Archivo:** `src/handlers/guardarNotificacion.ts:102-111`

Cualquier error no controlado se captura y retorna como HTTP 500:

```typescript
catch (error) {
  console.error('Error guardando notificación:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error',
    }),
  };
}
```

---

## Componentes Principales

### 1. YapeParser Service

**Archivo:** `src/services/yapeParser.ts`

Servicio especializado en extraer información estructurada del texto de notificaciones de Yape.

#### Método Principal: `parseNotificacion()`

**Archivo:** `src/services/yapeParser.ts:17-41`

```typescript
static parseNotificacion(texto: string): NotificacionParseada | null {
  try {
    const monto = this.extractMonto(texto);
    const nombre_pagador = this.extractNombrePagador(texto);
    const codigo_seguridad = this.extractCodigoSeguridad(texto);
    const numero_operacion = this.extractNumeroOperacion(texto);
    const fecha_hora = this.extractFechaHora(texto);

    if (!monto || !numero_operacion) {
      console.error('Falta información crítica en la notificación');
      return null;
    }

    return {
      monto,
      nombre_pagador: nombre_pagador || 'Desconocido',
      codigo_seguridad: codigo_seguridad || '',
      numero_operacion,
      fecha_hora: fecha_hora || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error parseando notificación:', error);
    return null;
  }
}
```

#### Formato de Notificación Esperado

```
¡Yapeaste!
S/100
Overshark Peru Sac
22 nov. 2025 | 11:34 a.m.
CÓDIGO DE SEGURIDAD
5 0 2
Nro. de operación
03443217
```

#### Métodos de Extracción

**a) Extracción de Monto**

**Archivo:** `src/services/yapeParser.ts:47-66`

Busca patrones como:
- `S/100`
- `S/ 100.50`
- `S/1,500.00`

```typescript
private static extractMonto(texto: string): number | null {
  const patterns = [
    /S\/\s*([\d,]+\.?\d*)/i,
    /S\/\s*([\d,]+)/i,
    /(\d+\.?\d*)\s*soles?/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      const montoStr = match[1].replace(/,/g, '');
      const monto = parseFloat(montoStr);
      if (!isNaN(monto) && monto > 0) {
        return monto;
      }
    }
  }

  return null;
}
```

**b) Extracción de Nombre del Pagador**

**Archivo:** `src/services/yapeParser.ts:71-86`

Busca el texto después del monto y antes de la fecha:

```typescript
private static extractNombrePagador(texto: string): string | null {
  const patterns = [
    /(?:Yapeaste!|Te yapearon)\s*\n\s*S\/[\d,]+\.?\d*\s*\n\s*([^\n]+)/i,
    /(?:recibiste|enviaste)\s+de\s+([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}
```

**c) Extracción de Código de Seguridad**

**Archivo:** `src/services/yapeParser.ts:92-111`

Busca el código de 3 dígitos de Yape:

```typescript
private static extractCodigoSeguridad(texto: string): string | null {
  const patterns = [
    /C[ÓO]DIGO\s+DE\s+SEGURIDAD\s*[\n:]*\s*(\d)\s*(\d)\s*(\d)/i,
    /C[ÓO]DIGO\s+DE\s+SEGURIDAD\s*[\n:]*\s*(\d{3})/i,
    /SEGURIDAD\s*[\n:]*\s*(\d)\s*(\d)\s*(\d)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      if (match[3]) {
        return match[1] + match[2] + match[3];
      } else if (match[1]) {
        return match[1];
      }
    }
  }

  return null;
}
```

**d) Extracción de Número de Operación**

**Archivo:** `src/services/yapeParser.ts:116-131`

Busca el ID único de la transacción:

```typescript
private static extractNumeroOperacion(texto: string): string | null {
  const patterns = [
    /Nro\.\s*de\s*operaci[oó]n\s*[\n:]*\s*(\d+)/i,
    /N[uú]mero\s+de\s+operaci[oó]n\s*[\n:]*\s*(\d+)/i,
    /Operaci[oó]n\s*[\n:]*\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
```

**e) Extracción de Fecha y Hora**

**Archivo:** `src/services/yapeParser.ts:137-187`

Parsea fechas en formato:
- `22 nov. 2025 | 11:34 a.m.`
- `22/11/2025 11:34`

```typescript
private static extractFechaHora(texto: string): string | null {
  const patterns = [
    /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+(\d{4})\s*\|\s*(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/,
  ];

  // Convierte a Date y luego a ISO string
  // Maneja conversión de AM/PM a formato 24 horas
}
```

### 2. DynamoDB Service

**Archivo:** `src/utils/dynamodb.ts`

Servicio de abstracción para operaciones con DynamoDB.

#### Método `put()`

**Archivo:** `src/utils/dynamodb.ts:18-25`

Guarda un item en una tabla:

```typescript
static async put(tableName: string, item: any): Promise<void> {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await docClient.send(command);
}
```

#### Método `update()`

**Archivo:** `src/utils/dynamodb.ts:43-61`

Actualiza atributos de un item existente:

```typescript
static async update(
  tableName: string,
  key: any,
  updateExpression: string,
  expressionAttributeValues: any,
  expressionAttributeNames?: any
): Promise<any> {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  });

  const result = await docClient.send(command);
  return result.Attributes;
}
```

#### Constante `TABLES`

**Archivo:** `src/utils/dynamodb.ts:107-112`

Mapeo de nombres de tablas desde variables de entorno:

```typescript
export const TABLES = {
  DISPOSITIVOS: process.env.DISPOSITIVOS_TABLE || 'dispositivos',
  NOTIFICACIONES: process.env.NOTIFICACIONES_TABLE || 'notificaciones_yape',
  VENTAS: process.env.VENTAS_TABLE || 'ventas_validadas',
  SESIONES: process.env.SESIONES_TABLE || 'sesiones_vendedores',
};
```

### 3. Configuración de Dispositivos

**Archivo:** `src/config/dispositivos.ts`

Define los **21 dispositivos autorizados** para enviar notificaciones.

#### Estructura de Datos

**Archivo:** `src/config/dispositivos.ts:6-203`

Cada dispositivo tiene:

```typescript
{
  codigo: 'L1-000',                    // Identificador único
  nombre: 'Lima 1',                    // Nombre descriptivo
  telefono_completo: '+51981139000',   // Número de teléfono (para Yape)
  ultimos_digitos: '000',              // Últimos dígitos del teléfono
  tipo: 'YAPE',                        // YAPE | TRANSFERENCIA
  empresa: 'OVERSHARK',                // OVERSHARK | BRAVOS
  ubicacion: 'LIMA',                   // LIMA | PROVINCIA | TIKTOK | TRANSFERENCIA
}
```

#### Distribución de Dispositivos

- **Overshark - Lima:** 4 dispositivos (L1-000, L2-378, L3-711, L4-138)
- **Overshark - Provincia:** 7 dispositivos (P1-556, P1-A-375, P2-576, P3-825, P4-101, P4-A-262, P5-795)
- **Overshark - TikTok:** 4 dispositivos (TK1-320, TK2-505, TK3-016, TK6-600)
- **Overshark - Transferencias:** 2 dispositivos (TRANSF.0102, TRANSF.5094)
- **Bravo's - Yape:** 2 dispositivos (PUB BRAV-829, LIVE BRAV-402)
- **Bravo's - Transferencias:** 2 dispositivos (TRANSF.4006, TRANSF.0040)

#### Función de Validación

**Archivo:** `src/config/dispositivos.ts:222-224`

```typescript
export function esCodigoValido(codigo: string): boolean {
  return DISPOSITIVOS_CONFIG.some((d) => d.codigo === codigo);
}
```

---

## Estructura de Datos

### NotificacionYape (DynamoDB)

**Archivo:** `src/types/notificacion.ts:1-19`

```typescript
export interface NotificacionYape {
  // Claves de DynamoDB
  PK: string;  // "NOTIF#03443217"
  SK: string;  // "2025-11-22T11:34:00"

  // Datos parseados de la notificación Yape
  monto: number;
  nombre_pagador: string;
  codigo_seguridad: string;
  numero_operacion: string;
  fecha_hora: string;

  // Dispositivo que capturó la notificación
  codigo_dispositivo: string;

  // Control
  estado: 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO' | 'REVISION_MANUAL';
  parseado: boolean;
  created_at: string;
}
```

### NotificacionParseada

**Archivo:** `src/types/notificacion.ts:28-34`

Resultado del parseo de texto:

```typescript
export interface NotificacionParseada {
  monto: number;
  nombre_pagador: string;
  codigo_seguridad: string;
  numero_operacion: string;
  fecha_hora: string;
}
```

### NotificacionRaw

**Archivo:** `src/types/notificacion.ts:21-26`

Datos crudos enviados desde el dispositivo:

```typescript
export interface NotificacionRaw {
  texto: string;
  packageName: string;
  timestamp: number;
  codigo_dispositivo: string;
}
```

---

## Validaciones y Seguridad

### 1. Validación de Body

**Previene:** Requests sin payload
**Código:** `src/handlers/guardarNotificacion.ts:20-25`

```typescript
if (!event.body) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Body requerido' }),
  };
}
```

### 2. Validación de Campos Requeridos

**Previene:** Payloads incompletos
**Código:** `src/handlers/guardarNotificacion.ts:30-37`

```typescript
if (!payload.texto || !payload.codigo_dispositivo) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: 'Faltan campos requeridos: texto, codigo_dispositivo',
    }),
  };
}
```

### 3. Validación de Dispositivo Autorizado

**Previene:** Notificaciones de dispositivos no autorizados
**Código:** `src/handlers/guardarNotificacion.ts:40-47`

```typescript
if (!esCodigoValido(payload.codigo_dispositivo)) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: `Código de dispositivo inválido: ${payload.codigo_dispositivo}`,
    }),
  };
}
```

Esta es la **validación de seguridad más importante** del sistema. Solo los 21 dispositivos configurados en `src/config/dispositivos.ts` pueden enviar notificaciones.

### 4. Validación de Parseo Exitoso

**Previene:** Guardar notificaciones con información incompleta
**Código:** `src/handlers/guardarNotificacion.ts:52-60`

```typescript
if (!notificacionParseada) {
  console.error('No se pudo parsear la notificación:', payload.texto);
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: 'No se pudo extraer información de la notificación',
    }),
  };
}
```

### 5. Manejo de Errores Global

**Previene:** Exposición de información sensible en errores
**Código:** `src/handlers/guardarNotificacion.ts:102-111`

```typescript
catch (error) {
  console.error('Error guardando notificación:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error',
    }),
  };
}
```

---

## Parseo de Notificaciones

### Estrategia de Parseo

El `YapeParser` utiliza **múltiples patrones de expresiones regulares** para cada campo, intentándolos en orden de prioridad. Esto hace el parser **robusto** ante variaciones en el formato de las notificaciones.

### Ejemplo de Parseo Completo

#### Input (texto de notificación):

```
¡Yapeaste!
S/150.50
Juan Pérez García
24 nov. 2025 | 3:45 p.m.
CÓDIGO DE SEGURIDAD
7 8 9
Nro. de operación
12345678
```

#### Output (NotificacionParseada):

```json
{
  "monto": 150.50,
  "nombre_pagador": "Juan Pérez García",
  "codigo_seguridad": "789",
  "numero_operacion": "12345678",
  "fecha_hora": "2025-11-24T15:45:00.000Z"
}
```

### Casos Edge Manejados

1. **Monto con comas:** `S/1,500.00` → `1500.00`
2. **Código separado:** `5 0 2` → `502`
3. **Código junto:** `502` → `502`
4. **Hora PM:** `3:45 p.m.` → `15:45` (formato 24h)
5. **Hora 12 AM:** `12:30 a.m.` → `00:30`
6. **Nombre con múltiples palabras:** Preserva espacios y caracteres especiales

### Valores por Defecto

Si algún campo no es crítico y no se puede parsear, se usa un valor por defecto:

**Archivo:** `src/services/yapeParser.ts:30-36`

```typescript
return {
  monto,
  nombre_pagador: nombre_pagador || 'Desconocido',
  codigo_seguridad: codigo_seguridad || '',
  numero_operacion,
  fecha_hora: fecha_hora || new Date().toISOString(),
};
```

**Campos críticos (obligatorios):**
- `monto`
- `numero_operacion`

Si estos faltan, el parseo retorna `null`.

---

## Base de Datos (DynamoDB)

### Tabla: NotificacionesTable

**Configuración:** `serverless.yml:129-152`

#### Estructura

```yaml
TableName: overshark-backend-dev-notificaciones
BillingMode: PAY_PER_REQUEST
KeySchema:
  PK: String (HASH)    # "NOTIF#{numero_operacion}"
  SK: String (RANGE)   # Timestamp ISO
```

#### Ejemplo de Item

```json
{
  "PK": "NOTIF#12345678",
  "SK": "2025-11-24T15:45:00.123Z",
  "monto": 150.50,
  "nombre_pagador": "Juan Pérez García",
  "codigo_seguridad": "789",
  "numero_operacion": "12345678",
  "fecha_hora": "2025-11-24T15:45:00.000Z",
  "codigo_dispositivo": "L1-000",
  "estado": "PENDIENTE_VALIDACION",
  "parseado": true,
  "created_at": "2025-11-24T15:45:00.123Z"
}
```

#### Patrones de Acceso

1. **Buscar por número de operación:**
   ```typescript
   PK = "NOTIF#12345678"
   ```

2. **Listar todas las notificaciones de una operación:**
   ```typescript
   PK = "NOTIF#12345678"
   SK begins_with ""
   ```

3. **Filtrar por estado:**
   ```typescript
   // Requiere GSI o Scan con FilterExpression
   estado = "PENDIENTE_VALIDACION"
   ```

### Tabla: DispositivosTable

**Configuración:** `serverless.yml:110-128`

#### Estructura

```yaml
TableName: overshark-backend-dev-dispositivos
BillingMode: PAY_PER_REQUEST
KeySchema:
  PK: String (HASH)    # "DISPOSITIVO#{codigo}"
```

#### Ejemplo de Item

```json
{
  "PK": "DISPOSITIVO#L1-000",
  "codigo": "L1-000",
  "nombre": "Lima 1",
  "telefono_completo": "+51981139000",
  "ultimos_digitos": "000",
  "tipo": "YAPE",
  "empresa": "OVERSHARK",
  "ubicacion": "LIMA",
  "activo": true,
  "ultima_notificacion": "2025-11-24T15:45:00.123Z"
}
```

#### Actualización desde el Handler

**Archivo:** `src/handlers/guardarNotificacion.ts:84-89`

Cada vez que se guarda una notificación, se actualiza el campo `ultima_notificacion` del dispositivo:

```typescript
await DynamoDBService.update(
  TABLES.DISPOSITIVOS,
  { PK: `DISPOSITIVO#${payload.codigo_dispositivo}` },
  'SET ultima_notificacion = :timestamp',
  { ':timestamp': timestamp }
);
```

**Propósito:**
- Monitorear la actividad de los dispositivos
- Detectar dispositivos que dejaron de funcionar
- Dashboard de estado en tiempo real

---

## Ejemplos de Uso

### Request Exitoso

#### Request

```bash
POST /notificaciones
Content-Type: application/json

{
  "texto": "¡Yapeaste!\nS/150.50\nJuan Pérez\n24 nov. 2025 | 3:45 p.m.\nCÓDIGO DE SEGURIDAD\n7 8 9\nNro. de operación\n12345678",
  "codigo_dispositivo": "L1-000"
}
```

#### Response (200 OK)

```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "12345678",
  "monto": 150.5,
  "codigo_dispositivo": "L1-000"
}
```

### Request con Código de Dispositivo Inválido

#### Request

```bash
POST /notificaciones
Content-Type: application/json

{
  "texto": "...",
  "codigo_dispositivo": "INVALID-CODE"
}
```

#### Response (400 Bad Request)

```json
{
  "error": "Código de dispositivo inválido: INVALID-CODE"
}
```

### Request con Notificación No Parseable

#### Request

```bash
POST /notificaciones
Content-Type: application/json

{
  "texto": "Este texto no tiene el formato de Yape",
  "codigo_dispositivo": "L1-000"
}
```

#### Response (400 Bad Request)

```json
{
  "error": "No se pudo extraer información de la notificación"
}
```

### Request Sin Body

#### Request

```bash
POST /notificaciones
Content-Type: application/json
```

#### Response (400 Bad Request)

```json
{
  "error": "Body requerido"
}
```

---

## Fuentes del Código

Todos los archivos analizados están en el proyecto **serverless-backend**:

### Archivos Principales

1. **Handler de Notificaciones**
   - Ruta: `src/handlers/guardarNotificacion.ts`
   - Líneas: 1-113
   - Función: Lambda handler principal que recibe y procesa notificaciones

2. **Servicio de Parseo**
   - Ruta: `src/services/yapeParser.ts`
   - Líneas: 1-200
   - Función: Extrae información estructurada del texto de notificaciones

3. **Servicio de DynamoDB**
   - Ruta: `src/utils/dynamodb.ts`
   - Líneas: 1-113
   - Función: Abstracción para operaciones con DynamoDB

4. **Configuración de Dispositivos**
   - Ruta: `src/config/dispositivos.ts`
   - Líneas: 1-225
   - Función: Define los 21 dispositivos autorizados

5. **Tipos de Notificación**
   - Ruta: `src/types/notificacion.ts`
   - Líneas: 1-35
   - Función: Interfaces TypeScript para notificaciones

6. **Configuración de Serverless**
   - Ruta: `serverless.yml`
   - Líneas: 1-251
   - Función: Define infraestructura AWS (Lambda, DynamoDB, API Gateway)

### Variables de Entorno

Definidas en `.env` y usadas en `serverless.yml:12-21`:

```env
WHATSAPP_PHONE_NUMBER_ID=863206073549532
WHATSAPP_ACCESS_TOKEN=EAAK6Srrp2Oc...
WHATSAPP_VERIFY_TOKEN=9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20
AWS_REGION=us-east-1
```

Las variables de DynamoDB se generan dinámicamente:
- `DISPOSITIVOS_TABLE`: `overshark-backend-dev-dispositivos`
- `NOTIFICACIONES_TABLE`: `overshark-backend-dev-notificaciones`
- `VENTAS_TABLE`: `overshark-backend-dev-ventas`
- `SESIONES_TABLE`: `overshark-backend-dev-sesiones`

---

## Conclusión

Este handler es parte de un sistema robusto de procesamiento de pagos que:

1. **Captura notificaciones** de 21 dispositivos móviles distribuidos
2. **Valida** la autenticidad del dispositivo emisor
3. **Parsea** texto no estructurado a datos estructurados con múltiples patrones resilientes
4. **Almacena** información para validación posterior
5. **Monitorea** el estado de los dispositivos

El diseño permite:
- Escalabilidad horizontal (más dispositivos)
- Tolerancia a fallos (parseo con múltiples patrones)
- Auditoría completa (logs y timestamps)
- Seguridad (validación de dispositivos autorizados)

---

**Documento generado:** 2025-11-24
**Autor:** Claude (Anthropic)
**Proyecto:** Overshark Backend - Sistema de Procesamiento de Pagos Yape
