import { Vendedor, EstadoVendedor } from '../types/vendedor';
/**
 * Servicio para gestionar vendedores
 */
export declare class VendedorService {
    /**
     * Obtener vendedor por teléfono
     */
    static obtenerVendedor(telefono: string): Promise<Vendedor | null>;
    /**
     * Registrar nuevo vendedor (auto-registro)
     */
    static registrarVendedor(telefono: string, primerMensaje?: string): Promise<Vendedor>;
    /**
     * Aprobar vendedor
     */
    static aprobarVendedor(telefono: string, adminTelefono: string): Promise<boolean>;
    /**
     * Rechazar vendedor
     */
    static rechazarVendedor(telefono: string, adminTelefono: string, razon?: string): Promise<boolean>;
    /**
     * Bloquear vendedor
     */
    static bloquearVendedor(telefono: string, adminTelefono: string, razon?: string): Promise<boolean>;
    /**
     * Actualizar última actividad
     */
    static actualizarActividad(telefono: string): Promise<void>;
    /**
     * Listar vendedores por estado
     */
    static listarPorEstado(estado: EstadoVendedor): Promise<Vendedor[]>;
    /**
     * Verificar si el vendedor puede usar el sistema
     */
    static puedeUsarSistema(vendedor: Vendedor): {
        permitido: boolean;
        razon?: string;
    };
}
//# sourceMappingURL=vendedorService.d.ts.map