/**
 * Servicio para calcular similitud entre nombres de clientes
 */
export class SimilitudService {
  /**
   * Calcula la similitud entre dos nombres
   * Retorna un porcentaje de 0 a 100
   */
  static calcularSimilitud(nombre1: string, nombre2: string): number {
    const n1 = this.normalizar(nombre1);
    const n2 = this.normalizar(nombre2);

    // Comparación exacta
    if (n1 === n2) return 100;

    // Uno contiene al otro (nombres con iniciales)
    if (n1.includes(n2) || n2.includes(n1)) return 95;

    // Algoritmo de similitud basado en palabras
    const palabras1 = n1.split(' ').filter(p => p.length > 0);
    const palabras2 = n2.split(' ').filter(p => p.length > 0);

    if (palabras1.length === 0 || palabras2.length === 0) return 0;

    let coincidencias = 0;
    palabras1.forEach(p1 => {
      if (palabras2.some(p2 => p2.includes(p1) || p1.includes(p2))) {
        coincidencias++;
      }
    });

    const total = Math.max(palabras1.length, palabras2.length);
    return (coincidencias / total) * 100;
  }

  /**
   * Normaliza un nombre para comparación
   * - Convierte a minúsculas
   * - Elimina acentos
   * - Elimina espacios extra
   * - Elimina caracteres especiales
   */
  private static normalizar(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, ' ') // Espacios únicos
      .trim();
  }

  /**
   * Calcula similitud usando algoritmo de Levenshtein
   * (Distancia de edición entre dos cadenas)
   */
  static calcularSimilitudLevenshtein(str1: string, str2: string): number {
    const s1 = this.normalizar(str1);
    const s2 = this.normalizar(str2);

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0) return len2 === 0 ? 100 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = [];

    // Inicializar matriz
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Llenar matriz
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Eliminación
          matrix[i][j - 1] + 1, // Inserción
          matrix[i - 1][j - 1] + cost // Sustitución
        );
      }
    }

    const distancia = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    const similitud = ((maxLen - distancia) / maxLen) * 100;

    return Math.max(0, Math.min(100, similitud));
  }

  /**
   * Verifica si dos nombres son suficientemente similares
   * (usa umbral de 95%)
   */
  static sonSimilares(nombre1: string, nombre2: string, umbral: number = 95): boolean {
    const similitud = this.calcularSimilitud(nombre1, nombre2);
    return similitud >= umbral;
  }
}
