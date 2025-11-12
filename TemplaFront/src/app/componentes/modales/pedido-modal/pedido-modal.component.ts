import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { GetPedidoDto, PostPedidoDto, PostPedidoDetalleDto } from '../../models/PedidoModel';
import { GetMesaDto } from '../../models/MesasModel';
import { GetPlatoDto } from '../../models/PlatoModel';
import { MesaService } from '../../../services/mesa.service';
import { PlatoService } from '../../../services/plato.service';
import { PedidoService } from '../../../services/pedido.service';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { MenuService } from '../../../services/menu.service';
import { ProductoService } from '../../../services/producto.service';
import { GetMenuDTO } from '../../models/MenuModel';
import { ProductoDTO } from '../../models/ProductoModel';

export interface ItemDetalle {
  id: number;
  nombre: string;
  tipo: 'PLATO' | 'MENU' | 'PRODUCTO';
  precio: number;
  cantidad: number;
  estado?: string;
  esNuevo?: boolean; // ✅ Marcar si es un item nuevo agregado en esta sesión
}

@Component({
  selector: 'app-pedido-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pedido-modal.component.html',
  styleUrl: './pedido-modal.component.css'
})
export class PedidoModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() pedidoData: GetPedidoDto | null = null;
  @Input() soloLectura: boolean = false;
  @Input() mesaSeleccionada: GetMesaDto | null = null; // ✅ Mesa preseleccionada desde mapa
  @Input() idMozoLogueado: number = 1; // ✅ ID del mozo desde mapa

  pedidoForm!: FormGroup;

  // Listas para los selects
  mesas: GetMesaDto[] = [];
  platos: GetPlatoDto[] = [];
  menus: GetMenuDTO[] = [];
  productos: ProductoDTO[] = [];

  // Tipos de item
  tiposItem = [
    { valor: 'PLATO', texto: 'Plato' },
    { valor: 'MENU', texto: 'Menú' },
    { valor: 'PRODUCTO', texto: 'Producto' }
  ];

  // Items disponibles según el tipo seleccionado
  itemsDisponibles: any[] = [];

  // Selecciones actuales para agregar detalle
  tipoItemSeleccionado = '';
  itemSeleccionado: number | null = null;
  cantidadSeleccionada: number = 1;

  // Items agregados al pedido
  detallesAgregados: ItemDetalle[] = [];

  // Estado
  guardando = false;
  cargandoDatos = true;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private mesaService: MesaService,
    private platoService: PlatoService,
    private menuService: MenuService,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    console.log('🔍 Iniciando modal de pedido...');
    
    // ✅ Obtener ID del mozo logueado usando el nuevo método
    const userId = this.authService.getUserId();
    if (userId !== null && typeof userId === 'number') {
      this.idMozoLogueado = userId;
    } else {
      console.warn('⚠️ No se pudo obtener ID del usuario desde el token JWT');
      console.warn('⚠️ El backend debe incluir "userId" o "id" numérico en el JWT');
    }
    
    console.log('👤 ID Mozo logueado:', this.idMozoLogueado);
    console.log('👤 Tipo:', typeof this.idMozoLogueado);
    console.log('🍽️ Mesa preseleccionada:', this.mesaSeleccionada);

    this.inicializarFormulario();
    this.cargarDatosIniciales();

    // ✅ Si hay mesa preseleccionada, setearla en el formulario
    if (this.mesaSeleccionada) {
      this.pedidoForm.patchValue({
        idMesa: this.mesaSeleccionada.idMesa
      });
      // Deshabilitar el campo para que no se pueda cambiar
      this.pedidoForm.get('idMesa')?.disable();
    }

    if (this.soloLectura) {
      this.pedidoForm.disable();
    }
  }

  // ✅ Inicializar formulario reactivo
  inicializarFormulario(): void {
    this.pedidoForm = this.formBuilder.group({
      idMesa: ['', Validators.required]
    });
  }

  // ✅ Cargar datos para los selects
  cargarDatosIniciales(): void {
    this.cargandoDatos = true;
    this.cargarMesas();
    this.cargarPlatos();
    this.cargarProductos();
    this.cargarMenus();
  }

  private cargarMesas(): void {
    this.mesaService.getMesasFiltradas(0, 100, '', 'DISPONIBLE').subscribe({
      next: (response) => {
        this.mesas = response.content;
        console.log('✅ Mesas cargadas:', this.mesas.length);
        this.cargasCompletadas.mesas = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando mesas:', error);
        this.cargandoDatos = false;
        alert('Error al cargar las mesas');
      }
    });
  }

  // ✅ MODIFICAR cargarPlatos (línea ~125)
  private cargarPlatos(): void {
    this.platoService.getPlatosFiltrados(0, 100, '', undefined, 'DISPONIBLES').subscribe({
      next: (response) => {
        this.platos = response.content;
        console.log('✅ Platos cargados:', this.platos.length);
        this.cargasCompletadas.platos = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando platos:', error);
        this.cargandoDatos = false;
        alert('Error al cargar los platos');
      }
    });
  }

  // ✅ MODIFICAR cargarProductos (línea ~141)
  private cargarProductos(): void {
    this.productoService.obtenerProductosConFiltros({
      page: 0,
      size: 100,
      busqueda: '',
      tipo: undefined,
      activo: true
    }).subscribe({
      next: (response) => {
        this.productos = response.content.filter(
          p => p.tipo === 'BEBIDA' || p.tipo === 'ACOMPAÑANTE'
        );
        console.log('✅ Productos cargados:', this.productos.length);
        this.cargasCompletadas.productos = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        this.cargandoDatos = false;
        alert('Error al cargar los productos');
      }
    });
  }

  private cargarMenus(): void {
    this.menuService.getMenusFiltrados(0, 100, '', 'ACTIVO').subscribe({
      next: (response) => {
        this.menus = response.content;
        console.log('✅ Menús cargados:', this.menus.length);
        this.cargasCompletadas.menus = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando menús:', error);
        this.cargandoDatos = false;
        alert('Error al cargar los menús');
      }
    });
  }

  private cargasCompletadas = {
    mesas: false,
    platos: false,
    productos: false,
    menus: false
  };

  private verificarCargaCompleta(): void {
    console.log('🔍 Verificando cargas:', this.cargasCompletadas);

    const todosCargados = this.cargasCompletadas.mesas &&
      this.cargasCompletadas.platos &&
      this.cargasCompletadas.productos &&
      this.cargasCompletadas.menus; // ✅ AGREGAR esta línea

    console.log('¿Todos cargados?', todosCargados);

    if (todosCargados) {
      this.cargandoDatos = false;
      console.log('✅ Todos los datos cargados');

      // Si es solo lectura o edición, cargar datos del pedido
      if ((this.isEditMode || this.soloLectura) && this.pedidoData) {
        console.log('📋 Cargando datos del pedido para edición/visualización');
        this.cargarDatosParaEdicion();
      }
    }
  }

  // ✅ Cuando cambia el tipo seleccionado, cargar items correspondientes
  onTipoItemChange(): void {
    console.log('Tipo seleccionado:', this.tipoItemSeleccionado);
    this.itemsDisponibles = [];
    this.itemSeleccionado = null;

    if (!this.tipoItemSeleccionado) return;

    switch (this.tipoItemSeleccionado) {
      case 'PLATO':
        this.itemsDisponibles = this.platos.map(plato => ({
          id: plato.idPlato,
          nombre: plato.nombre,
          precio: plato.precio
        }));
        break;

      case 'MENU':
        this.itemsDisponibles = this.menus.map(menu => ({
          id: menu.id,
          nombre: menu.nombre,
          precio: menu.precio
        }));
        break;

      case 'PRODUCTO':
        this.itemsDisponibles = this.productos.map(producto => ({
          id: producto.id!,
          nombre: producto.nombre,
          precio: producto.precio
        }));
        break;
    }

    console.log('Items disponibles:', this.itemsDisponibles);
  }

  // ✅ Agregar detalle al pedido
  agregarDetalle(): void {
    console.log('Agregar detalle:', {
      tipo: this.tipoItemSeleccionado,
      item: this.itemSeleccionado,
      cantidad: this.cantidadSeleccionada
    });

    if (!this.tipoItemSeleccionado || !this.itemSeleccionado || this.cantidadSeleccionada < 1) {
      alert('Complete todos los campos para agregar el detalle');
      return;
    }

    const item = this.itemsDisponibles.find(i => i.id === Number(this.itemSeleccionado));
    if (!item) {
      console.log('Item no encontrado');
      return;
    }

    // Agregar a la lista visual
    this.detallesAgregados.push({
      id: item.id,
      nombre: item.nombre,
      tipo: this.tipoItemSeleccionado as 'PLATO' | 'MENU' | 'PRODUCTO',
      precio: item.precio,
      cantidad: this.cantidadSeleccionada,
      esNuevo: true // ✅ Marcar como nuevo item agregado en esta sesión
    });

    console.log('✅ Detalle agregado. Total detalles:', this.detallesAgregados);

    // Resetear selección
    this.tipoItemSeleccionado = '';
    this.itemSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.itemsDisponibles = [];
  }

  // ✅ Quitar detalle del pedido (solo para items nuevos sin estado)
  quitarDetalle(index: number): void {
    this.detallesAgregados.splice(index, 1);
  }

  // ✅ Cancelar detalle del pedido (para items con estado PENDIENTE)
  cancelarDetalle(idDetalle: number): void {
    if (!this.pedidoData) {
      console.error('No hay pedido cargado');
      return;
    }

    this.alertService.showConfirmation('Confirmar Cancelación', '¿Está seguro que desea cancelar este item?', 'Sí, cancelar').then((result) => {
      if (result.isConfirmed) {
        // ✅ Llamar al servicio para cancelar todos los detalles pendientes del pedido
        // Nota: El backend cancela todos los detalles PENDIENTES, no uno específico
        this.guardando = true;
        this.pedidoService.cancelarDetalles(this.pedidoData!.idPedido).subscribe({
          next: (response) => {
            console.log('✅ Detalles cancelados:', response);
            this.guardando = false;
            
            // Actualizar los detalles con la respuesta del backend
            this.detallesAgregados = response.detalles.map(detalle => ({
              id: detalle.idPedidoDetalle,
              nombre: detalle.nombreItem,
              tipo: detalle.tipo,
              precio: detalle.precioUnitario,
              cantidad: detalle.cantidad,
              estado: detalle.estado
            }));
            
            this.alertService.showSuccess('Item Cancelado', 'El item ha sido cancelado exitosamente');
          },
          error: (error: any) => {
            console.error('❌ Error al cancelar detalle:', error);
            this.guardando = false;
            this.alertService.showError('Error al Cancelar', error.error?.message || 'Error desconocido');
          }
        });
      }
    });
  }

  // ✅ Calcular total del pedido
  calcularTotal(): number {
    return this.detallesAgregados.reduce((total, detalle) => {
      return total + (detalle.precio * detalle.cantidad);
    }, 0);
  }

  // ✅ Cargar datos para edición (agregar items a pedido existente)
  cargarDatosParaEdicion(): void {
    if (!this.pedidoData) return;

    // ✅ Si es modo edición, setear la mesa del pedido (aunque no se muestre)
    if (this.isEditMode) {
      const mesaEncontrada = this.mesas.find(m => m.numeroMesa === this.pedidoData!.numeroMesa);

      if (mesaEncontrada) {
        this.pedidoForm.patchValue({
          idMesa: mesaEncontrada.idMesa
        });
      }
    }

    // ✅ Cargar los detalles existentes (tanto en modo edición como solo lectura)
    if ((this.isEditMode || this.soloLectura) && this.pedidoData.detalles) {
      this.detallesAgregados = this.pedidoData.detalles.map(detalle => ({
        id: detalle.idPedidoDetalle,  // ✅ Usar el ID del detalle para poder identificarlo
        nombre: detalle.nombreItem,
        tipo: detalle.tipo,
        precio: detalle.precioUnitario,
        cantidad: detalle.cantidad,
        estado: detalle.estado,
        esNuevo: false // ✅ Items existentes NO son nuevos
      }));
    }

    console.log(this.soloLectura ? 'Modo visualización' : (this.isEditMode ? 'Modo edición: Agregar items al pedido existente' : 'Modo crear pedido nuevo'));
  }

  // ✅ Validar formulario
  esFormularioValido(): boolean {
    if (this.soloLectura) return false; // No permitir guardar en modo solo lectura

    const tieneDetalles = this.detallesAgregados.length > 0;

    // ✅ Si es modo edición, solo validar que haya detalles
    if (this.isEditMode) {
      return tieneDetalles;
    }

    // ✅ Si es modo crear, validar mesa Y detalles
    // Si la mesa viene preseleccionada, considerar válida
    const mesaValida = this.mesaSeleccionada ? true : this.pedidoForm.valid;
    return mesaValida && tieneDetalles;
  }

  // ✅ Guardar pedido
  onGuardar(): void {
    console.log('🚀 Guardando pedido...');

    if (!this.esFormularioValido()) {
      if (!this.pedidoForm.valid) {
        alert('Seleccione una mesa');
      } else if (this.detallesAgregados.length === 0) {
        alert('Debe agregar al menos un detalle al pedido');
      }
      return;
    }

    this.guardando = true;

    const formValue = this.pedidoForm.value;

    // ✅ Usar mesaSeleccionada si existe, sino usar el valor del formulario
    const idMesa = this.mesaSeleccionada 
      ? this.mesaSeleccionada.idMesa 
      : parseInt(formValue.idMesa);

    // ✅ Transformar detalles de ItemDetalle a PostPedidoDetalleDto
    // En modo edición: Solo enviar items NUEVOS (esNuevo === true)
    // En modo crear: Enviar TODOS los items
    const itemsAEnviar = this.isEditMode 
      ? this.detallesAgregados.filter(d => d.esNuevo === true)
      : this.detallesAgregados;

    console.log('📋 Items a enviar al backend:', itemsAEnviar.length);
    console.log('📋 Items nuevos:', itemsAEnviar);

    const detallesDTO: PostPedidoDetalleDto[] = itemsAEnviar.map(detalle => ({
      idPlato: detalle.tipo === 'PLATO' ? detalle.id : 0,
      idMenu: detalle.tipo === 'MENU' ? detalle.id : 0,
      idProducto: detalle.tipo === 'PRODUCTO' ? detalle.id : 0,
      cantidad: detalle.cantidad
    }));

    const pedidoDTO: PostPedidoDto = {
      idMesa: idMesa,
      idMozo: 1,
      detalles: detallesDTO
    };

    console.log('✅ Pedido a guardar:', pedidoDTO);
    console.log('🔍 Debug - idMesa:', idMesa);
    console.log('🔍 Debug - idMozo:', 1);
    console.log('🔍 Debug - detalles count:', detallesDTO.length);

    /* ✅ Validar que el mozo esté asignado
    if (!this.idMozoLogueado || this.idMozoLogueado === 0) {
      this.guardando = false;
      alert('Error: No se pudo obtener el ID del mozo logueado');
      return;
    }*/

    // ✅ Llamar al backend para crear o actualizar el pedido
    if (this.isEditMode && this.pedidoData) {
      // Modo edición: actualizar pedido existente
      this.pedidoService.actualizarPedido(this.pedidoData.idPedido, pedidoDTO).subscribe({
        next: (response: GetPedidoDto) => {
          console.log('✅ Pedido actualizado exitosamente:', response);
          this.guardando = false;
          this.activeModal.close({
            accion: 'actualizado',
            pedido: response
          });
        },
        error: (error: any) => {
          console.error('❌ Error al actualizar pedido:', error);
          this.guardando = false;
          alert('Error al actualizar el pedido: ' + (error.error?.message || error.message || 'Error desconocido'));
        }
      });
    } else {
      this.pedidoService.crearPedido(pedidoDTO).subscribe({
        next: (response: GetPedidoDto) => {
          console.log('✅ Pedido creado exitosamente:', response);
          this.guardando = false;
          this.activeModal.close({
            accion: 'crear',
            pedido: response
          });
        },
        error: (error: any) => {
          this.guardando = false;
          alert('Error al crear el pedido: ' + (error.error?.message || error.message || 'Error desconocido'));
        }
      });
    }
  }

  // ✅ Cancelar
  onCancelar(): void {
    this.activeModal.dismiss('cancel');
  }

  /**
   * ✅ Verificar si hay items con estado LISTO
   */
  hayItemsListos(): boolean {
    return this.detallesAgregados.some(d => d.estado === 'LISTO_PARA_ENTREGAR');
  }

  /**
   * ✅ Entregar todos los items que están LISTO
   */
  entregarItemsListos(): void {
    if (!this.pedidoData) return;

    const itemsListos = this.detallesAgregados.filter(d => d.estado === 'LISTO_PARA_ENTREGAR');
    
    if (itemsListos.length === 0) {
      this.alertService.showInfo('Sin Items Listos', 'No hay items listos para entregar.');
      return;
    }

    const mensaje = `¿Desea entregar ${itemsListos.length} item(s) listo(s)?`;
    this.alertService.showConfirmation('Confirmar Entrega', mensaje, 'Sí, entregar').then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        
        // Llamar al backend para marcar como ENTREGADO todos los items LISTO
        this.pedidoService.entregarDetalles(this.pedidoData!.idPedido).subscribe({
          next: (response) => {
            console.log('✅ Items entregados:', response);
            
            // ✅ Actualizar los datos del pedido con la respuesta del backend
            this.pedidoData = response;
            this.detallesAgregados = response.detalles.map(detalle => ({
              id: detalle.idPedidoDetalle,
              nombre: detalle.nombreItem,
              tipo: detalle.tipo,
              precio: detalle.precioUnitario,
              cantidad: detalle.cantidad,
              estado: detalle.estado,
              esNuevo: false
            }));
            
            this.guardando = false;
            this.alertService.showSuccess('Items Entregados', `${itemsListos.length} item(s) entregado(s) exitosamente`);
          },
          error: (error: any) => {
            console.error('❌ Error al entregar items:', error);
            this.guardando = false;
            this.alertService.showError('Error al Entregar', error.error?.message || 'Error desconocido');
          }
        });
      }
    });
  }

  /**
   * ✅ Verificar si todos los detalles están entregados
   */
  todosPedidosEntregados(): boolean {
    if (this.detallesAgregados.length === 0) return false;
    return this.detallesAgregados.every(d => d.estado === 'ENTREGADO');
  }

  /**
   * ✅ Finalizar pedido completo
   */
  finalizarPedido(): void {
    if (!this.pedidoData) return;

    if (!this.todosPedidosEntregados()) {
      this.alertService.showError('No se Puede Finalizar', 'Aún hay items sin entregar.');
      return;
    }

    this.alertService.showConfirmation('Confirmar Finalización', '¿Está seguro que desea finalizar este pedido?', 'Sí, finalizar').then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        this.pedidoService.finalizarPedido(this.pedidoData!.idPedido).subscribe({
          next: (response) => {
            console.log('✅ Pedido finalizado:', response);
            this.guardando = false;
            this.activeModal.close({
              accion: 'finalizado',
              pedido: response
            });
          },
          error: (error: any) => {
            console.error('❌ Error al finalizar pedido:', error);
            this.guardando = false;
            this.alertService.showError('Error al Finalizar', error.error?.message || 'Error desconocido');
          }
        });
      }
    });
  }

  formatearFecha(fechaHora: number[] | string): string {
    if (Array.isArray(fechaHora)) {
      const [year, month, day, hour, minute] = fechaHora;

      const fecha = new Date(year, month - 1, day, hour, minute);

      const dd = String(fecha.getDate()).padStart(2, '0');
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const yyyy = fecha.getFullYear();
      const hh = String(fecha.getHours()).padStart(2, '0');
      const min = String(fecha.getMinutes()).padStart(2, '0');

      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }
    return fechaHora;
  }

  /**
   * ✅ Obtener texto del estado
   */
  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'ORDENADO': 'Ordenado',
      'EN_PROCESO': 'En Proceso',
      'LISTO_PARA_ENTREGAR': 'Listo',
      'ENTREGADO': 'Entregado',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  /**
   * ✅ Obtener clase CSS para el badge del estado
   */
  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'ORDENADO': 'badge-warning',
      'EN_PROCESO': 'badge-info',
      'LISTO_PARA_ENTREGAR': 'badge-primary',
      'ENTREGADO': 'badge-success',
      'FINALIZADO': 'badge-secondary',
      'CANCELADO': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  }


  getEstadoDetalleTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'EN_PREPARACION': 'En Preparación',
      'LISTO': 'Listo',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  /**
   * ✅ Obtener clase CSS para el estado del detalle
   */
  getEstadoDetalleClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'PENDIENTE': 'estado-pendiente',
      'EN_PREPARACION': 'estado-en-preparacion',
      'LISTO': 'estado-listo',
      'ENTREGADO': 'estado-entregado',
      'CANCELADO': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  /**
   * ✅ Obtener color para el badge de estado de mesa
   */
  getColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'DISPONIBLE': '#84C473',        // templa-green
      'OCUPADA': '#e2e3e5',           // templa-bg-ocupada (gris pastel)
      'RESERVADA': '#d2a46d',         // templa-gold
      'FUERA_SERVICIO': '#C47373'     // templa-red
    };
    return colores[estado] || '#e2e3e5';
  }
}