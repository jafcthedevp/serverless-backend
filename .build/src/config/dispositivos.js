"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISPOSITIVOS_CONFIG = void 0;
exports.obtenerDispositivoPorCodigo = obtenerDispositivoPorCodigo;
exports.listarCodigosDispositivos = listarCodigosDispositivos;
exports.esCodigoValido = esCodigoValido;
/**
 * Configuración de los 21 dispositivos que reciben pagos
 */
exports.DISPOSITIVOS_CONFIG = [
    // OVERSHARK - LIMA (4 dispositivos)
    {
        codigo: 'L1-000',
        nombre: 'Lima 1',
        telefono_completo: '+51981139000',
        ultimos_digitos: '000',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'LIMA',
    },
    {
        codigo: 'L2-378',
        nombre: 'Lima 2',
        telefono_completo: '+51981139378',
        ultimos_digitos: '378',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'LIMA',
    },
    {
        codigo: 'L3-711',
        nombre: 'Lima 3',
        telefono_completo: '+51981139711',
        ultimos_digitos: '711',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'LIMA',
    },
    {
        codigo: 'L4-138',
        nombre: 'Lima 4',
        telefono_completo: '+51981139138',
        ultimos_digitos: '138',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'LIMA',
    },
    // OVERSHARK - PROVINCIA (7 dispositivos)
    {
        codigo: 'P1-556',
        nombre: 'Provincia 1',
        telefono_completo: '+51981139556',
        ultimos_digitos: '556',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'PROVINCIA',
    },
    {
        codigo: 'P1-A-375',
        nombre: 'Provincia 1-A',
        telefono_completo: '+51981139375',
        ultimos_digitos: '375',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'PROVINCIA',
    },
    {
        codigo: 'P2-576',
        nombre: 'Provincia 2',
        telefono_completo: '+51981139576',
        ultimos_digitos: '576',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'PROVINCIA',
    },
    {
        codigo: 'P3-825',
        nombre: 'Provincia 3',
        telefono_completo: '+51981139825',
        ultimos_digitos: '825',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'PROVINCIA',
    },
    {
        codigo: 'P4-101',
        nombre: 'Provincia 4',
        telefono_completo: '+51981139101',
        ultimos_digitos: '101',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'PROVINCIA',
    },
    {
        codigo: 'P4-A-262',
        nombre: 'Provincia 4-A',
        telefono_completo: '+51981139262',
        ultimos_digitos: '262',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'PROVINCIA',
    },
    {
        codigo: 'P5-795',
        nombre: 'Provincia 5',
        telefono_completo: '+51981139795',
        ultimos_digitos: '795',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'PROVINCIA',
    },
    // OVERSHARK - TIKTOK (4 dispositivos)
    {
        codigo: 'TK1-320',
        nombre: 'TikTok 1',
        telefono_completo: '+51981139320',
        ultimos_digitos: '320',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'TIKTOK',
    },
    {
        codigo: 'TK2-505',
        nombre: 'TikTok 2',
        telefono_completo: '+51981139505',
        ultimos_digitos: '505',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'TIKTOK',
    },
    {
        codigo: 'TK3-016',
        nombre: 'TikTok 3',
        telefono_completo: '+51981139016',
        ultimos_digitos: '016',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'TIKTOK',
    },
    {
        codigo: 'TK6-600',
        nombre: 'TikTok 6',
        telefono_completo: '+51981139600',
        ultimos_digitos: '600',
        tipo: 'YAPE',
        empresa: 'OVERSHARK',
        ubicacion: 'TIKTOK',
    },
    // OVERSHARK - TRANSFERENCIAS (2 dispositivos)
    {
        codigo: 'TRANSF.0102',
        nombre: 'Transferencia Overshark 0102',
        ultimos_digitos: '0102',
        tipo: 'TRANSFERENCIA',
        empresa: 'OVERSHARK',
        ubicacion: 'TRANSFERENCIA',
    },
    {
        codigo: 'TRANSF.5094',
        nombre: 'Transferencia Overshark 5094',
        ultimos_digitos: '5094',
        tipo: 'TRANSFERENCIA',
        empresa: 'OVERSHARK',
        ubicacion: 'TRANSFERENCIA',
    },
    // BRAVO'S - YAPE (2 dispositivos)
    {
        codigo: 'PUB BRAV-829',
        nombre: "Pub Bravo's",
        telefono_completo: '+51981139829',
        ultimos_digitos: '829',
        tipo: 'YAPE',
        empresa: 'BRAVOS',
        ubicacion: 'LIMA',
    },
    {
        codigo: 'LIVE BRAV-402',
        nombre: "Live Bravo's",
        telefono_completo: '+51981139402',
        ultimos_digitos: '402',
        tipo: 'YAPE',
        empresa: 'BRAVOS',
        ubicacion: 'LIMA',
    },
    // BRAVO'S - TRANSFERENCIAS (2 dispositivos)
    {
        codigo: 'TRANSF.4006',
        nombre: "Transferencia Bravo's 4006",
        ultimos_digitos: '4006',
        tipo: 'TRANSFERENCIA',
        empresa: 'BRAVOS',
        ubicacion: 'TRANSFERENCIA',
    },
    {
        codigo: 'TRANSF.0040',
        nombre: "Transferencia Bravo's 0040",
        ultimos_digitos: '0040',
        tipo: 'TRANSFERENCIA',
        empresa: 'BRAVOS',
        ubicacion: 'TRANSFERENCIA',
    },
];
/**
 * Obtiene un dispositivo por su código
 */
function obtenerDispositivoPorCodigo(codigo) {
    return exports.DISPOSITIVOS_CONFIG.find((d) => d.codigo === codigo);
}
/**
 * Lista todos los códigos de dispositivos
 */
function listarCodigosDispositivos() {
    return exports.DISPOSITIVOS_CONFIG.map((d) => d.codigo);
}
/**
 * Valida si un código de dispositivo existe
 */
function esCodigoValido(codigo) {
    return exports.DISPOSITIVOS_CONFIG.some((d) => d.codigo === codigo);
}
//# sourceMappingURL=dispositivos.js.map