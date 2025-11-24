import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

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
};
