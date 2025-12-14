/**
 * Servicio para calcular similitud entre nombres de clientes
 */
export declare class SimilitudService {
    /**
     * Calcula la similitud entre dos nombres
     * Retorna un porcentaje de 0 a 100
     */
    static calcularSimilitud(nombre1: string, nombre2: string): number;
    /**
     * Normaliza un nombre para comparación
     * - Convierte a minúsculas
     * - Elimina acentos
     * - Elimina espacios extra
     * - Elimina caracteres especiales
     */
    private static normalizar;
    /**
     * Calcula similitud usando algoritmo de Levenshtein
     * (Distancia de edición entre dos cadenas)
     */
    static calcularSimilitudLevenshtein(str1: string, str2: string): number;
    /**
     * Verifica si dos nombres son suficientemente similares
     * (usa umbral de 95%)
     */
    static sonSimilares(nombre1: string, nombre2: string, umbral?: number): boolean;
}
//# sourceMappingURL=similitud.d.ts.map