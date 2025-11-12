import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { GetPedidoDto, EstadoPedido, EstadoPedidoDetalle, FiltrosPedido } from '../componentes/models/PedidoModel';
import { AuthService } from './auth.service';
import { PedidoService } from './pedido.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CocinaService {
  private apiUrl = 'http://localhost:8081/api';
  private sseUrl = 'http://localhost:8081/api/sse';
  
  // Subjects para comunicación en tiempo real
  private nuevoPedidoSubject = new Subject<GetPedidoDto>();
  private actualizacionPedidoSubject = new Subject<GetPedidoDto>();
  private conectadoSubject = new BehaviorSubject<boolean>(false);

  // EventSource para recibir eventos del servidor
  private eventSource: EventSource | null = null;
  private reconectarIntervalo: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private pedidoService: PedidoService
  ) {
    this.iniciarConexionTiempoReal();
  }

  // ============= MÉTODOS PRINCIPALES =============

  /**
   * Obtener todos los pedidos activos para cocina
   * Temporalmente usa el servicio de pedidos existente y filtra por estados activos
   */
  obtenerPedidosCocina(): Observable<GetPedidoDto[]> {
    // Filtrar solo pedidos que necesitan atención en cocina
    const filtros: FiltrosPedido = {
      // Buscar pedidos que no estén finalizados ni cancelados
    };
    
    return this.pedidoService.listarPedidos(0, 100, filtros).pipe(
      map(page => {
        // Filtrar solo los pedidos que necesitan atención en cocina
        return page.content.filter(pedido => 
          pedido.estado === EstadoPedido.ORDENADO ||
          pedido.estado === EstadoPedido.EN_PROCESO ||
          pedido.estado === EstadoPedido.LISTO_PARA_ENTREGAR
        );
      })
    );
  }

  /**
   * Actualizar estado de un pedido completo
   * Usa los métodos existentes del PedidoService
   */
  actualizarEstadoPedido(idPedido: number, nuevoEstado: EstadoPedido): Observable<GetPedidoDto> {
    switch (nuevoEstado) {
      case EstadoPedido.EN_PROCESO:
        return this.pedidoService.iniciarPedido(idPedido);
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return this.pedidoService.marcarListoParaEntregar(idPedido);
      case EstadoPedido.ENTREGADO:
        return this.pedidoService.entregarDetalles(idPedido);
      case EstadoPedido.FINALIZADO:
        return this.pedidoService.finalizarPedido(idPedido);
      case EstadoPedido.CANCELADO:
        return this.pedidoService.cancelarPedido(idPedido);
      default:
        // Fallback: usar endpoint genérico si existe
        const headers = this.authService.getAuthHeaders();
        return this.http.put<GetPedidoDto>(
          `${this.apiUrl}/pedido/${idPedido}/estado`, 
          { estado: nuevoEstado }, 
          { headers }
        );
    }
  }

  /**
   * Actualizar estado de un detalle específico del pedido
   * Temporalmente retorna éxito hasta que el backend implemente este endpoint
   */
  actualizarEstadoDetalle(idDetalle: number, nuevoEstado: EstadoPedidoDetalle): Observable<any> {
    // TODO: Implementar en el backend el endpoint para actualizar estado de detalle individual
    console.log(`Actualizando detalle ${idDetalle} a estado ${nuevoEstado}`);
    
    // Por ahora retorna un Observable que emite éxito inmediatamente
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true, message: 'Estado actualizado correctamente' });
        observer.complete();
      }, 500);
    });
  }

  // ============= COMUNICACIÓN TIEMPO REAL =============

  /**
   * Observable para escuchar nuevos pedidos
   */
  onNuevoPedido(): Observable<GetPedidoDto> {
    return this.nuevoPedidoSubject.asObservable();
  }

  /**
   * Observable para escuchar actualizaciones de pedidos
   */
  onActualizacionPedido(): Observable<GetPedidoDto> {
    return this.actualizacionPedidoSubject.asObservable();
  }

  /**
   * Observable para saber si está conectado al SSE
   */
  onConexionEstado(): Observable<boolean> {
    return this.conectadoSubject.asObservable();
  }

  /**
   * Iniciar conexión Server-Sent Events
   */
  private iniciarConexionTiempoReal(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      const token = this.authService.getToken();
      if (!token) {
        console.log('No hay token, no se puede conectar al SSE');
        return;
      }

      // Construir URL con token para autenticación
      const sseUrlConToken = `${this.sseUrl}/cocina?token=${encodeURIComponent(token)}`;
      
      this.eventSource = new EventSource(sseUrlConToken);

      this.eventSource.onopen = () => {
        console.log('✅ Conexión SSE establecida para cocina');
        this.conectadoSubject.next(true);
        this.limpiarReconexion();
      };

      // Escuchar evento de nuevo pedido
      this.eventSource.addEventListener('nuevo-pedido', (event: MessageEvent) => {
        try {
          const pedido: GetPedidoDto = JSON.parse(event.data);
          console.log('🆕 Nuevo pedido recibido via SSE:', pedido);
          this.nuevoPedidoSubject.next(pedido);
        } catch (error) {
          console.error('Error parsing nuevo pedido:', error);
        }
      });

      // Escuchar evento de actualización de pedido
      this.eventSource.addEventListener('pedido-actualizado', (event: MessageEvent) => {
        try {
          const pedido: GetPedidoDto = JSON.parse(event.data);
          console.log('🔄 Pedido actualizado via SSE:', pedido);
          this.actualizacionPedidoSubject.next(pedido);
        } catch (error) {
          console.error('Error parsing pedido actualizado:', error);
        }
      });

      // Escuchar evento de estado de cocina
      this.eventSource.addEventListener('estado-cocina', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📊 Estado cocina actualizado:', data);
          // Aquí puedes manejar estadísticas generales de cocina
        } catch (error) {
          console.error('Error parsing estado cocina:', error);
        }
      });

      this.eventSource.onerror = (error) => {
        console.error('❌ Error en conexión SSE:', error);
        this.conectadoSubject.next(false);
        this.programarReconexion();
      };

    } catch (error) {
      console.error('Error iniciando conexión SSE:', error);
      this.programarReconexion();
    }
  }

  /**
   * Programar reconexión automática
   */
  private programarReconexion(): void {
    this.limpiarReconexion();
    
    this.reconectarIntervalo = setTimeout(() => {
      console.log('🔄 Intentando reconectar SSE...');
      this.iniciarConexionTiempoReal();
    }, 5000); // Reintentar cada 5 segundos
  }

  /**
   * Limpiar interval de reconexión
   */
  private limpiarReconexion(): void {
    if (this.reconectarIntervalo) {
      clearTimeout(this.reconectarIntervalo);
      this.reconectarIntervalo = null;
    }
  }

  /**
   * Desconectar SSE
   */
  desconectar(): void {
    console.log('🔌 Cerrando conexión SSE de cocina');
    
    this.limpiarReconexion();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.conectadoSubject.next(false);
  }

  /**
   * Reconectar manualmente
   */
  reconectar(): void {
    console.log('🔄 Reconectando SSE manualmente...');
    this.desconectar();
    setTimeout(() => {
      this.iniciarConexionTiempoReal();
    }, 1000);
  }

  // ============= MÉTODOS ADICIONALES =============

  /**
   * Obtener estadísticas de cocina
   */
  obtenerEstadisticasCocina(): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/cocina/estadisticas`, { headers });
  }

  /**
   * Marcar un pedido como prioritario
   */
  marcarPrioridad(idPedido: number, esPrioritario: boolean): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put(
      `${this.apiUrl}/pedidos/${idPedido}/prioridad`, 
      { prioritario: esPrioritario }, 
      { headers }
    );
  }

  /**
   * Obtener tiempo estimado para un pedido
   */
  obtenerTiempoEstimado(idPedido: number): Observable<{ tiempoEstimadoMinutos: number }> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<{ tiempoEstimadoMinutos: number }>(
      `${this.apiUrl}/pedidos/${idPedido}/tiempo-estimado`, 
      { headers }
    );
  }

  /**
   * Enviar notificación al mozo cuando el pedido esté listo
   */
  notificarPedidoListo(idPedido: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/pedidos/${idPedido}/notificar-listo`, 
      {}, 
      { headers }
    );
  }
}