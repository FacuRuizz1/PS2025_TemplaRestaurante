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
import { AuthService } from '../../../services/auth.service';
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
  @Input() soloLectura: boolean = false; // ✅ AGREGAR ESTA LÍNEA

  pedidoForm!: FormGroup;

  // Listas para los selects
  mesas: GetMesaDto[] = [];
  platos: GetPlatoDto[] = [];
  menus: GetMenuDTO[] = [];
  productos: ProductoDTO[] = [];

  // ID del usuario logueado (mozo)
  idMozoLogueado: number = 1;

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
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Obtener ID del usuario logueado
    //this.idMozoLogueado = this.authService.getIdUsuario();
    console.log('👤 ID Mozo logueado:', this.idMozoLogueado);

    this.inicializarFormulario();
    this.cargarDatosIniciales();

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
      cantidad: this.cantidadSeleccionada
    });

    console.log('✅ Detalle agregado. Total detalles:', this.detallesAgregados);

    // Resetear selección
    this.tipoItemSeleccionado = '';
    this.itemSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.itemsDisponibles = [];
  }

  // ✅ Quitar detalle del pedido
  quitarDetalle(index: number): void {
    this.detallesAgregados.splice(index, 1);
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

    // Si es solo lectura, cargar los detalles existentes
    if (this.soloLectura && this.pedidoData.detalles) {
      this.detallesAgregados = this.pedidoData.detalles.map(detalle => ({
        id: detalle.idItem,
        nombre: detalle.nombreItem,
        tipo: detalle.tipo,
        precio: detalle.precioUnitario,
        cantidad: detalle.cantidad,
        estado: detalle.estado
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
    const mesaValida = this.pedidoForm.valid;
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

    // ✅ Transformar detalles de ItemDetalle a PostPedidoDetalleDto
    const detallesDTO: PostPedidoDetalleDto[] = this.detallesAgregados.map(detalle => ({
      idPlato: detalle.tipo === 'PLATO' ? detalle.id : 0,
      idMenu: detalle.tipo === 'MENU' ? detalle.id : 0,
      idProducto: detalle.tipo === 'PRODUCTO' ? detalle.id : 0,
      cantidad: detalle.cantidad
    }));

    const pedidoDTO: PostPedidoDto = {
      idMesa: parseInt(formValue.idMesa),
      idMozo: this.idMozoLogueado,
      detalles: detallesDTO
    };

    console.log('✅ Pedido a guardar:', pedidoDTO);

    this.activeModal.close({
      accion: this.isEditMode ? 'agregar' : 'crear',
      pedido: pedidoDTO
    });
  }

  // ✅ Cancelar
  onCancelar(): void {
    this.activeModal.dismiss('cancel');
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
      'EN_PREPARACION': 'estado-preparacion',
      'LISTO': 'estado-listo',
      'ENTREGADO': 'estado-entregado',
      'CANCELADO': 'estado-cancelado'
    };
    return clases[estado] || 'estado-default';
  }
}