import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GetPlatoDto } from '../../models/PlatoModel';
import { FiltroProducto, ProductoDTO } from '../../models/ProductoModel';
import { PlatoService } from '../../../services/plato.service';
import { ProductoService } from '../../../services/producto.service';
import { MenuService } from '../../../services/menu.service';
import { GetMenuDTO } from '../../models/MenuModel';
import { MenuModalComponent } from '../../modales/menu-modal/menu-modal.component';
import { Page } from '../../models/CommonModels';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css'
})
export class MenusComponent implements OnInit {

  // ✅ Datos mostrados
  menus: GetMenuDTO[] = [];
  pageInfo: Page<GetMenuDTO> | null = null;
  
  // ✅ Filtros
  busqueda: string = '';
  estadoSeleccionado: string = 'TODOS';
  
  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 12;
  
  // ✅ Loading
  cargando: boolean = false;

  // ✅ Datos para modales
  platosDisponibles: GetPlatoDto[] = [];
  productosDisponibles: ProductoDTO[] = [];

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private platoService: PlatoService,
    private productoService: ProductoService,
    private menuService: MenuService
  ) { }

  ngOnInit(): void {
    console.log('Componente de Menús cargado');
    this.cargarPlatosDisponibles();
    this.cargarProductosDisponibles();
    this.cargarMenus();
  }

  // ✅ Cargar platos para los modales
  cargarPlatosDisponibles(): void {
    this.platoService.getPlatosFiltrados(0, 100).subscribe({
      next: (response: any) => {
        if (response?.content) {
          this.platosDisponibles = response.content;
          console.log('Platos cargados para menús:', this.platosDisponibles.length);
        }
      },
      error: (error) => {
        console.error('Error al cargar platos:', error);
      }
    });
  }

  // ✅ Cargar productos para los modales
  cargarProductosDisponibles(): void {
    const filtros: FiltroProducto = {
      page: 0,
      size: 100,
      busqueda: '',
      tipo: undefined,
      activo: true
    };
    
    this.productoService.obtenerProductosConFiltros(filtros).subscribe({
      next: (response: any) => {
        if (response?.content) {
          this.productosDisponibles = response.content;
          console.log('Productos cargados para menús:', this.productosDisponibles.length);
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  // ✅ Cargar menús desde el servicio
  cargarMenus(): void {
    this.cargando = true;

    // Convertir el estado seleccionado al formato que espera el backend
    let estadoFiltro: string | undefined = undefined;
    if (this.estadoSeleccionado === 'ACTIVOS') {
      estadoFiltro = 'ACTIVO';
    } else if (this.estadoSeleccionado === 'INACTIVOS') {
      estadoFiltro = 'INACTIVO';
    }
    // Si es 'TODOS', estadoFiltro queda undefined

    console.log('Aplicando filtros:', {
      pagina: this.paginaActual,
      busqueda: this.busqueda,
      estadoSeleccionado: this.estadoSeleccionado,
      estadoFiltro: estadoFiltro
    });

    this.menuService.getMenusFiltrados(
      this.paginaActual,
      this.tamanoPagina,
      this.busqueda || undefined,
      estadoFiltro
    ).subscribe({
      next: (response: Page<GetMenuDTO>) => {
        this.pageInfo = response;
        this.menus = response.content;
        this.cargando = false;
        console.log('Menús cargados:', this.menus);
      },
      error: (error) => {
        console.error('Error al cargar menús:', error);
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los menús',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  // ✅ Métodos de paginación
  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < (this.pageInfo?.totalPages || 0)) {
      this.paginaActual = pagina;
      this.cargarMenus();
    }
  }

  obtenerPaginasVisibles(): number[] {
    if (!this.pageInfo) return [];

    const totalPaginas = this.pageInfo.totalPages;
    const paginaActual = this.pageInfo.number;
    const paginas: number[] = [];
    const maxPaginasVisibles = 5;

    let inicio = Math.max(0, paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(totalPaginas - 1, inicio + maxPaginasVisibles - 1);

    if (fin - inicio < maxPaginasVisibles - 1) {
      inicio = Math.max(0, fin - maxPaginasVisibles + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  // ✅ Métodos de filtros
  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string): void {
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarMenus();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estadoSeleccionado = 'TODOS';
    this.paginaActual = 0;
    this.cargarMenus();
  }

  // ✅ Métodos de estado
  getEstadoBadgeClass(menu: GetMenuDTO): string {
    return menu.activo ? 'estado-badge estado-disponible' : 'estado-badge estado-no-disponible';
  }

  getEstadoTexto(menu: GetMenuDTO): string {
    return menu.activo ? 'Disponible' : 'No Disponible';
  }

  // ✅ Verificar disponibilidad por fechas
  estaDisponible(menu: GetMenuDTO): boolean {
    if (!menu.activo) return false;
    
    const hoy = new Date();
    const desde = menu.disponibleDesde ? new Date(menu.disponibleDesde) : null;
    const hasta = menu.disponibleHasta ? new Date(menu.disponibleHasta) : null;
    
    if (desde && hoy < desde) return false;
    if (hasta && hoy > hasta) return false;
    
    return true;
  }

  // ✅ Formatear contenidos del menú - LÓGICA SIMPLIFICADA
  formatearContenidos(menu: GetMenuDTO): string {
  if (!menu.productos || menu.productos.length === 0) {
    return 'Sin contenidos';
  }

  const contenidos: string[] = [];
  
  menu.productos.forEach((producto, index) => {
    console.log(`Analizando producto ${index}:`, producto);
    
    const plato = this.platosDisponibles.find(p => p.idPlato === producto.idPlato);
    const prod = this.productosDisponibles.find(p => p.id === producto.idProducto);
    
    if (!plato && !prod) {
      console.warn('No se encontró ni plato ni producto para:', producto);
      return;
    }
    
    if (plato && prod) {
      console.log(`Plato: ${plato.nombre} (${plato.tipoPlato}), Producto: ${prod.nombre} (${prod.tipo})`);
      
      // LÓGICA CORREGIDA:
      // - Si el plato NO es de tipo BEBIDA, es un plato real → mostrar el plato
      // - Si el plato es de tipo BEBIDA y el producto es BEBIDA/ACOMPAÑANTE → mostrar el producto
      
      if (plato.tipoPlato !== 'BEBIDA') {
        // Es un plato real (ENTRADA, PRINCIPAL, POSTRE, etc.)
        contenidos.push(plato.nombre);
        console.log(`→ Mostrando PLATO: ${plato.nombre}`);
      } else {
        // El plato es de tipo BEBIDA, verificar el producto
        if (prod.tipo === 'BEBIDA' || prod.tipo === 'ACOMPAÑANTE') {
          // Es un producto puro
          contenidos.push(prod.nombre);
          console.log(`→ Mostrando PRODUCTO: ${prod.nombre}`);
        } else {
          // Caso raro, mostrar el plato
          contenidos.push(plato.nombre);
          console.log(`→ Mostrando PLATO (caso especial): ${plato.nombre}`);
        }
      }
    } else if (plato) {
      // Solo plato
      contenidos.push(plato.nombre);
      console.log(`→ Mostrando solo plato: ${plato.nombre}`);
    } else if (prod) {
      // Solo producto
      contenidos.push(prod.nombre);
      console.log(`→ Mostrando solo producto: ${prod.nombre}`);
    }
  });
  
  console.log('Contenidos finales:', contenidos);
  return contenidos.join(', ') || 'Sin contenidos';
}

  // ✅ Modal para nuevo menú
  abrirModalNuevoMenu(): void {
    const modalRef = this.modalService.open(MenuModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.platos = this.platosDisponibles;
    modalRef.componentInstance.productos = this.productosDisponibles;

    modalRef.result.then((result) => {
      if (result?.action === 'created') {
        this.cargarMenus(); // Recargar la lista
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Modal para editar menú
  abrirModalEditarMenu(menu: GetMenuDTO): void {
    const modalRef = this.modalService.open(MenuModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.menu = menu;
    modalRef.componentInstance.platos = this.platosDisponibles;
    modalRef.componentInstance.productos = this.productosDisponibles;

    modalRef.result.then((result) => {
      if (result?.action === 'updated') {
        this.cargarMenus(); // Recargar la lista
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Activar/Desactivar menú
  activarDesactivarMenu(menu: GetMenuDTO): void {
    if (!menu.id) return;

    const accion = menu.activo ? 'desactivar' : 'activar';
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas ${accion} este menú?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && menu.id) {
        this.menuService.activarDesactivarMenu(menu.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Éxito',
              text: `Menú ${accion === 'activar' ? 'activado' : 'desactivado'} exitosamente`,
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.cargarMenus();
          },
          error: (error) => {
            console.error(`Error al ${accion} menú:`, error);
            Swal.fire({
              title: 'Error',
              text: `No se pudo ${accion} el menú`,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  // ✅ Eliminar menú
  eliminarMenu(menu: GetMenuDTO): void {
    if (!menu.id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed && menu.id) {
        this.menuService.bajaMenu(menu.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado',
              text: 'Menú eliminado exitosamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.cargarMenus();
          },
          error: (error) => {
            console.error('Error al eliminar menú:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el menú',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

}
