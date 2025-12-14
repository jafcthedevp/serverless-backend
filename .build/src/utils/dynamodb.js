"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLES = exports.DynamoDBService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Configurar cliente de DynamoDB
const client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});
class DynamoDBService {
    /**
     * Guarda un item en DynamoDB
     */
    static async put(tableName, item) {
        const command = new lib_dynamodb_1.PutCommand({
            TableName: tableName,
            Item: item,
        });
        await docClient.send(command);
    }
    /**
     * Obtiene un item de DynamoDB
     */
    static async get(tableName, key) {
        const command = new lib_dynamodb_1.GetCommand({
            TableName: tableName,
            Key: key,
        });
        const result = await docClient.send(command);
        return result.Item;
    }
    /**
     * Actualiza un item en DynamoDB
     */
    static async update(tableName, key, updateExpression, expressionAttributeValues, expressionAttributeNames) {
        const command = new lib_dynamodb_1.UpdateCommand({
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
    static async query(tableName, keyConditionExpression, expressionAttributeValues, expressionAttributeNames) {
        const command = new lib_dynamodb_1.QueryCommand({
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
    static async queryIndex(tableName, indexName, keyConditionExpression, expressionAttributeValues, expressionAttributeNames, filterExpression) {
        const command = new lib_dynamodb_1.QueryCommand({
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
    static async delete(tableName, key) {
        const command = new lib_dynamodb_1.DeleteCommand({
            TableName: tableName,
            Key: key,
        });
        await docClient.send(command);
    }
    /**
     * Escanea la tabla completa con filtros opcionales
     */
    static async scan(tableName, options) {
        const command = new lib_dynamodb_1.ScanCommand({
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
    static async exists(tableName, key) {
        const item = await this.get(tableName, key);
        return !!item;
    }
}
exports.DynamoDBService = DynamoDBService;
/**
 * Nombres de las tablas (se obtienen de variables de entorno)
 */
exports.TABLES = {
    DISPOSITIVOS: process.env.DISPOSITIVOS_TABLE || 'dispositivos',
    NOTIFICACIONES: process.env.NOTIFICACIONES_TABLE || 'notificaciones_yape',
    VENTAS: process.env.VENTAS_TABLE || 'ventas_validadas',
    SESIONES: process.env.SESIONES_TABLE || 'sesiones_vendedores',
    VENDEDORES: process.env.VENDEDORES_TABLE || 'vendedores',
};
//# sourceMappingURL=dynamodb.js.map