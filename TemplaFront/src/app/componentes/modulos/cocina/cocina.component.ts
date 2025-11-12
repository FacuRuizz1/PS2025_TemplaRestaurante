import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetPedidoDto, GetPedidoDetalleDto, EstadoPedido, EstadoPedidoDetalle } from '../../models/PedidoModel';
import { CocinaService } from '../../../services/cocina.service';
import { AlertService } from '../../../services/alert.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cocina.component.html',
  styleUrl: './cocina.component.css'
})
export class CocinaComponent implements OnInit, OnDestroy {
  pedidos: GetPedidoDto[] = [];
  pedidosFiltrados: GetPedidoDto[] = [];
  isLoading = false;
  
  // Referencias a los enums para usar en el template
  EstadoPedido = EstadoPedido;
  EstadoPedidoDetalle = EstadoPedidoDetalle;

  private subscriptions: Subscription[] = [];

  constructor(
    private cocinaService: CocinaService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.cargarPedidos();
    this.configurarActualizacionTiempoReal();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.cocinaService.desconectar();
  }

  cargarPedidos() {
    this.isLoading = true;
    this.cocinaService.obtenerPedidosCocina().subscribe({
      next: (pedidos: GetPedidoDto[]) => {
        this.pedidos = pedidos;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar pedidos:', error);
        this.alertService.showError('Error al cargar los pedidos de cocina', 'Error');
        this.isLoading = false;
      }
    });
  }

  configurarActualizacionTiempoReal() {
    console.log('🔌 Configurando actualización en tiempo real para cocina...');
    
    // Suscribirse a nuevos pedidos
    const nuevoPedidoSub = this.cocinaService.onNuevoPedido().subscribe((pedido: GetPedidoDto) => {
      console.log('🍽️ Nuevo pedido recibido en cocina:', pedido);
      this.pedidos.unshift(pedido);
      this.aplicarFiltros();
      this.mostrarNotificacionNuevoPedido(pedido);
    });

    // Suscribirse a actualizaciones de pedidos
    const actualizacionSub = this.cocinaService.onActualizacionPedido().subscribe((pedidoActualizado: GetPedidoDto) => {
      console.log('🔄 Pedido actualizado en cocina:', pedidoActualizado);
      const index = this.pedidos.findIndex(p => p.idPedido === pedidoActualizado.idPedido);
      if (index !== -1) {
        this.pedidos[index] = pedidoActualizado;
        this.aplicarFiltros();
      } else {
        console.log('⚠️ Pedido actualizado no encontrado en la lista, agregándolo:', pedidoActualizado);
        // Si el pedido no existe en la lista, agregarlo (puede ser que se creó antes de abrir cocina)
        this.pedidos.unshift(pedidoActualizado);
        this.aplicarFiltros();
      }
    });

    this.subscriptions.push(nuevoPedidoSub, actualizacionSub);
  }

  aplicarFiltros() {
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      // Solo mostrar pedidos que necesitan atención en cocina
      return pedido.estado === EstadoPedido.ORDENADO || 
             pedido.estado === EstadoPedido.EN_PROCESO ||
             pedido.estado === EstadoPedido.LISTO_PARA_ENTREGAR;
    });
  }

  cambiarEstadoPedido(pedido: GetPedidoDto, nuevoEstado: EstadoPedido) {
    // Si el estado es LISTO_PARA_ENTREGAR, mostrar mensaje especial
    let tituloConfirmacion = '¿Confirmar cambio de estado?';
    let textoConfirmacion = `¿Cambiar pedido ${pedido.idPedido} a ${nuevoEstado}?`;
    
    if (nuevoEstado === EstadoPedido.LISTO_PARA_ENTREGAR) {
      tituloConfirmacion = '¿Pedido listo para entregar?';
      textoConfirmacion = `El pedido ${pedido.idPedido} será marcado como listo y automáticamente entregado. Desaparecerá de la pantalla de cocina.`;
    }

    Swal.fire({
      title: tituloConfirmacion,
      text: textoConfirmacion,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si es LISTO_PARA_ENTREGAR, hacer la secuencia completa
        if (nuevoEstado === EstadoPedido.LISTO_PARA_ENTREGAR) {
          this.procesarPedidoListoYEntregar(pedido);
        } else {
          // Para otros estados, comportamiento normal
          this.actualizarEstadoPedido(pedido, nuevoEstado);
        }
      }
    });
  }

  private procesarPedidoListoYEntregar(pedido: GetPedidoDto) {
    // Paso 1: Marcar como LISTO_PARA_ENTREGAR
    this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.LISTO_PARA_ENTREGAR).subscribe({
      next: (pedidoListo: GetPedidoDto) => {
        console.log('✅ Pedido marcado como listo:', pedidoListo);
        
        // Paso 2: Después de un pequeño delay, marcar como ENTREGADO
        setTimeout(() => {
          this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.ENTREGADO).subscribe({
            next: (pedidoEntregado: GetPedidoDto) => {
              console.log('📦 Pedido marcado como entregado:', pedidoEntregado);
              
              // Remover el pedido de la lista (desaparece de cocina)
              this.pedidos = this.pedidos.filter(p => p.idPedido !== pedido.idPedido);
              this.aplicarFiltros();
              
              this.alertService.showSuccess(`Pedido #${pedido.idPedido} entregado correctamente`, 'Pedido Completado');
            },
            error: (error: any) => {
              console.error('Error al marcar como entregado:', error);
              this.alertService.showError('Error al completar la entrega del pedido', 'Error');
            }
          });
        }, 1000); // 1 segundo de delay para mostrar el cambio
      },
      error: (error: any) => {
        console.error('Error al marcar como listo:', error);
        this.alertService.showError('Error al marcar el pedido como listo', 'Error');
      }
    });
  }

  private actualizarEstadoPedido(pedido: GetPedidoDto, nuevoEstado: EstadoPedido) {
    this.cocinaService.actualizarEstadoPedido(pedido.idPedido, nuevoEstado).subscribe({
      next: (pedidoActualizado: GetPedidoDto) => {
        const index = this.pedidos.findIndex(p => p.idPedido === pedido.idPedido);
        if (index !== -1) {
          // Si el nuevo estado es ENTREGADO o FINALIZADO, remover de la lista
          if (nuevoEstado === EstadoPedido.ENTREGADO || nuevoEstado === EstadoPedido.FINALIZADO) {
            this.pedidos = this.pedidos.filter(p => p.idPedido !== pedido.idPedido);
          } else {
            this.pedidos[index] = pedidoActualizado;
          }
          this.aplicarFiltros();
        }
        this.alertService.showSuccess('Estado del pedido actualizado correctamente', 'Éxito');
      },
      error: (error: any) => {
        console.error('Error al actualizar estado:', error);
        this.alertService.showError('Error al actualizar el estado del pedido', 'Error');
      }
    });
  }

  cambiarEstadoDetalle(pedido: GetPedidoDto, detalle: GetPedidoDetalleDto, nuevoEstado: EstadoPedidoDetalle) {
    this.cocinaService.actualizarEstadoDetalle(detalle.idPedidoDetalle, nuevoEstado).subscribe({
      next: () => {
        detalle.estado = nuevoEstado;
        this.alertService.showSuccess('Estado del item actualizado correctamente', 'Éxito');
      },
      error: (error: any) => {
        console.error('Error al actualizar estado del detalle:', error);
        this.alertService.showError('Error al actualizar el estado del item', 'Error');
      }
    });
  }

  obtenerColorEstado(estado: string): string {
    // Usar los mismos colores que el componente de pedidos
    switch (estado) {
      case EstadoPedido.ORDENADO:
        return '#856404'; // warning text color
      case EstadoPedido.EN_PROCESO:
        return '#0c5460'; // info text color
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return '#004085'; // primary text color
      case EstadoPedido.ENTREGADO:
        return '#155724'; // success text color
      case EstadoPedido.FINALIZADO:
        return '#155724'; // success text color
      case EstadoPedido.CANCELADO:
        return '#721c24'; // danger text color
      default:
        return '#383d41'; // secondary text color
    }
  }

  obtenerColorFondoEstado(estado: string): string {
    // Usar los mismos colores de fondo que el componente de pedidos
    switch (estado) {
      case EstadoPedido.ORDENADO:
        return '#fff3cd'; // warning background
      case EstadoPedido.EN_PROCESO:
        return '#d1ecf1'; // info background
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return '#cce7ff'; // primary background
      case EstadoPedido.ENTREGADO:
        return '#d4edda'; // success background
      case EstadoPedido.FINALIZADO:
        return '#d4edda'; // success background
      case EstadoPedido.CANCELADO:
        return '#f8d7da'; // danger background
      default:
        return '#e2e3e5'; // secondary background
    }
  }

  obtenerColorEstadoDetalle(estado: EstadoPedidoDetalle): string {
    switch (estado) {
      case EstadoPedidoDetalle.PENDIENTE:
        return '#856404'; // warning text color
      case EstadoPedidoDetalle.EN_PREPARACION:
        return '#0c5460'; // info text color
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return '#004085'; // primary text color
      case EstadoPedidoDetalle.ENTREGADO:
        return '#155724'; // success text color
      case EstadoPedidoDetalle.CANCELADO:
        return '#721c24'; // danger text color
      default:
        return '#383d41'; // secondary text color
    }
  }

  obtenerColorFondoEstadoDetalle(estado: EstadoPedidoDetalle): string {
    switch (estado) {
      case EstadoPedidoDetalle.PENDIENTE:
        return '#fff3cd'; // warning background
      case EstadoPedidoDetalle.EN_PREPARACION:
        return '#d1ecf1'; // info background
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return '#cce7ff'; // primary background
      case EstadoPedidoDetalle.ENTREGADO:
        return '#d4edda'; // success background
      case EstadoPedidoDetalle.CANCELADO:
        return '#f8d7da'; // danger background
      default:
        return '#e2e3e5'; // secondary background
    }
  }

  formatearFecha(fecha: number[] | string): string {
    if (Array.isArray(fecha)) {
      // Si es array [año, mes, día, hora, minuto, segundo]
      const fechaObj = new Date(fecha[0], fecha[1] - 1, fecha[2], fecha[3], fecha[4], fecha[5]);
      return fechaObj.toLocaleString('es-ES');
    } else {
      // Si es string
      return new Date(fecha).toLocaleString('es-ES');
    }
  }

  private mostrarNotificacionNuevoPedido(pedido: GetPedidoDto) {
    // Notificación visual
    this.alertService.showInfo(`Nuevo pedido #${pedido.idPedido} - Mesa ${pedido.numeroMesa}`, 'Nuevo Pedido');
    
    // Notificación de sonido (opcional)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nuevo Pedido en Cocina', {
        body: `Pedido #${pedido.idPedido} - Mesa ${pedido.numeroMesa}`,
        icon: 'assets/iconos/cocina.png'
      });
    }
  }



  getPosiblesEstados(estadoActual: EstadoPedido): EstadoPedido[] {
    switch (estadoActual) {
      case EstadoPedido.ORDENADO:
        return [EstadoPedido.EN_PROCESO, EstadoPedido.CANCELADO];
      case EstadoPedido.EN_PROCESO:
        return [EstadoPedido.LISTO_PARA_ENTREGAR, EstadoPedido.CANCELADO];
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        // No mostrar botones para LISTO_PARA_ENTREGAR ya que se auto-procesa
        return [];
      default:
        return [];
    }
  }

  getPosiblesEstadosDetalle(estadoActual: EstadoPedidoDetalle): EstadoPedidoDetalle[] {
    switch (estadoActual) {
      case EstadoPedidoDetalle.PENDIENTE:
        return [EstadoPedidoDetalle.EN_PREPARACION, EstadoPedidoDetalle.CANCELADO];
      case EstadoPedidoDetalle.EN_PREPARACION:
        return [EstadoPedidoDetalle.LISTO_PARA_ENTREGAR, EstadoPedidoDetalle.CANCELADO];
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return [EstadoPedidoDetalle.ENTREGADO];
      default:
        return [];
    }
  }

  // Función trackBy para optimizar el renderizado
  trackByPedidoId(index: number, pedido: GetPedidoDto): number {
    return pedido.idPedido;
  }

  // Métodos auxiliares para el template
  getPosiblesEstadosString(estado: string): EstadoPedido[] {
    return this.getPosiblesEstados(estado as EstadoPedido);
  }

  getPosiblesEstadosDetalleString(estado: EstadoPedidoDetalle): EstadoPedidoDetalle[] {
    return this.getPosiblesEstadosDetalle(estado);
  }

  // Métodos para obtener clases CSS de badges (iguales que PedidoService)
  obtenerClaseBadgeEstado(estado: string): string {
    switch (estado) {
      case EstadoPedido.ORDENADO:
        return 'badge-warning';
      case EstadoPedido.EN_PROCESO:
        return 'badge-info';
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return 'badge-primary';
      case EstadoPedido.ENTREGADO:
        return 'badge-success';
      case EstadoPedido.FINALIZADO:
        return 'badge-success';
      case EstadoPedido.CANCELADO:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  obtenerClaseBadgeEstadoDetalle(estado: EstadoPedidoDetalle): string {
    switch (estado) {
      case EstadoPedidoDetalle.PENDIENTE:
        return 'badge-warning';
      case EstadoPedidoDetalle.EN_PREPARACION:
        return 'badge-info';
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return 'badge-primary';
      case EstadoPedidoDetalle.ENTREGADO:
        return 'badge-success';
      case EstadoPedidoDetalle.CANCELADO:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}