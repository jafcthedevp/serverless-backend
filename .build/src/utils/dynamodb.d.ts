export declare class DynamoDBService {
    /**
     * Guarda un item en DynamoDB
     */
    static put(tableName: string, item: any): Promise<void>;
    /**
     * Obtiene un item de DynamoDB
     */
    static get(tableName: string, key: any): Promise<any>;
    /**
     * Actualiza un item en DynamoDB
     */
    static update(tableName: string, key: any, updateExpression: string, expressionAttributeValues: any, expressionAttributeNames?: any): Promise<any>;
    /**
     * Query items en DynamoDB
     */
    static query(tableName: string, keyConditionExpression: string, expressionAttributeValues: any, expressionAttributeNames?: any): Promise<any[]>;
    /**
     * Query items usando un Global Secondary Index (GSI)
     */
    static queryIndex(tableName: string, indexName: string, keyConditionExpression: string, expressionAttributeValues: any, expressionAttributeNames?: any, filterExpression?: string): Promise<any[]>;
    /**
     * Elimina un item de DynamoDB
     */
    static delete(tableName: string, key: any): Promise<void>;
    /**
     * Escanea la tabla completa con filtros opcionales
     */
    static scan(tableName: string, options?: {
        FilterExpression?: string;
        ExpressionAttributeValues?: any;
        ExpressionAttributeNames?: any;
        Limit?: number;
    }): Promise<any[]>;
    /**
     * Verifica si un item existe
     */
    static exists(tableName: string, key: any): Promise<boolean>;
}
/**
 * Nombres de las tablas (se obtienen de variables de entorno)
 */
export declare const TABLES: {
    DISPOSITIVOS: string;
    NOTIFICACIONES: string;
    VENTAS: string;
    SESIONES: string;
    VENDEDORES: string;
};
//# sourceMappingURL=dynamodb.d.ts.map