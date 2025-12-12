import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

// Configurar cliente de DynamoDB
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export class DynamoDBService {
  /**
   * Guarda un item en DynamoDB
   */
  static async put(tableName: string, item: any): Promise<void> {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await docClient.send(command);
  }

  /**
   * Obtiene un item de DynamoDB
   */
  static async get(tableName: string, key: any): Promise<any> {
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });

    const result = await docClient.send(command);
    return result.Item;
  }

  /**
   * Actualiza un item en DynamoDB
   */
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

  /**
   * Query items en DynamoDB
   */
  static async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: any,
    expressionAttributeNames?: any
  ): Promise<any[]> {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }

  /**
   * Query items usando un Global Secondary Index (GSI)
   */
  static async queryIndex(
    tableName: string,
    indexName: string,
    keyConditionExpression: string,
    expressionAttributeValues: any,
    expressionAttributeNames?: any,
    filterExpression?: string
  ): Promise<any[]> {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      FilterExpression: filterExpression,
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }

  /**
   * Elimina un item de DynamoDB
   */
  static async delete(tableName: string, key: any): Promise<void> {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });

    await docClient.send(command);
  }

  /**
   * Escanea la tabla completa con filtros opcionales
   */
  static async scan(
    tableName: string,
    options?: {
      FilterExpression?: string;
      ExpressionAttributeValues?: any;
      ExpressionAttributeNames?: any;
      Limit?: number;
    }
  ): Promise<any[]> {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: options?.FilterExpression,
      ExpressionAttributeValues: options?.ExpressionAttributeValues,
      ExpressionAttributeNames: options?.ExpressionAttributeNames,
      Limit: options?.Limit,
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }

  /**
   * Verifica si un item existe
   */
  static async exists(tableName: string, key: any): Promise<boolean> {
    const item = await this.get(tableName, key);
    return !!item;
  }
}

/**
 * Nombres de las tablas (se obtienen de variables de entorno)
 */
export const TABLES = {
  DISPOSITIVOS: process.env.DISPOSITIVOS_TABLE || 'dispositivos',
  NOTIFICACIONES: process.env.NOTIFICACIONES_TABLE || 'notificaciones_yape',
  VENTAS: process.env.VENTAS_TABLE || 'ventas_validadas',
  SESIONES: process.env.SESIONES_TABLE || 'sesiones_vendedores',
  VENDEDORES: process.env.VENDEDORES_TABLE || 'vendedores',
};
