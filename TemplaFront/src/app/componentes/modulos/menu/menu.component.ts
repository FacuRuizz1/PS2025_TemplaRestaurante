import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GetMenuDTO, MenuConDetalles } from '../../models/MenuModel';
import { MenuModalComponent } from '../../modales/menu-modal/menu-modal.component';
import { GetPlatoDto, TipoPlato } from '../../models/PlatoModel';
import { ProductoDTO, TipoProducto, UnidadMedida, FiltroProducto } from '../../models/ProductoModel';
import { PlatoService } from '../../../services/plato.service';
import { ProductoService } from '../../../services/producto.service';
import { AlertService } from '../../../services/alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {

  // ✅ Datos mostrados (resultado de aplicar filtros)
  menus: MenuConDetalles[] = [];
  
  // ✅ Datos temporales (solo en memoria, sin persistencia)
  private menusTemporales: MenuConDetalles[] = [];
  pageInfo: any = null;
  
  // ✅ Filtros
  busqueda: string = '';
  estadoSeleccionado: string = 'TODOS';
  
  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 12;
  
  // ✅ Loading
  cargando: boolean = false;

  // ✅ Datos reales
  platosDisponibles: GetPlatoDto[] = [];
  productosDisponibles: ProductoDTO[] = [];

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private platoService: PlatoService,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    console.log('Componente de Menú cargado');
    this.cargarMenusDesdeStorage(); // ✅ Cargar datos temporales de la sesión
    this.cargarMenusIniciales();
    this.cargarPlatosDisponibles();
    this.cargarProductosDisponibles();
  }

  // ✅ Cargar platos reales del servicio
  cargarPlatosDisponibles(): void {
    this.platoService.getPlatosFiltrados(0, 100).subscribe({
      next: (response: any) => {
        if (response?.content) {
          this.platosDisponibles = response.content;
          // ✅ Si los platos se cargan exitosamente, el backend está funcionando
          this.marcarBackendDisponible();
        }
      },
      error: (error) => {
        console.error('Error al cargar platos:', error);
        // ✅ Si falla cargar platos, el backend no está disponible
        this.manejarBackendNoDisponible();
      }
    });
  }

  // ✅ Cargar productos reales del servicio  
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
          // ✅ Si los productos se cargan exitosamente, el backend está funcionando
          this.marcarBackendDisponible();
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        // ✅ Si falla cargar productos, el backend no está disponible
        this.manejarBackendNoDisponible();
      }
    });
  }

  // ✅ Cargar menús desde sessionStorage (solo para navegación entre componentes)
  private cargarMenusDesdeStorage(): void {
    try {
      // Solo cargar si el backend estaba disponible en la sesión anterior
      if (this.verificarBackendDisponible()) {
        const menusGuardados = sessionStorage.getItem('menusTemporales');
        if (menusGuardados) {
          this.menusTemporales = JSON.parse(menusGuardados);
          console.log('✅ Menús temporales cargados desde sessionStorage:', this.menusTemporales.length);
        }
      } else {
        console.log('🔄 Backend no estaba disponible - iniciando con lista vacía');
        this.menusTemporales = [];
      }
    } catch (error) {
      console.error('Error al cargar menús desde sessionStorage:', error);
      this.menusTemporales = [];
    }
  }

  // ✅ Guardar menús en sessionStorage (solo durante navegación)
  private guardarMenusEnStorage(): void {
    try {
      sessionStorage.setItem('menusTemporales', JSON.stringify(this.menusTemporales));
      console.log('✅ Menús temporales guardados en sessionStorage');
    } catch (error) {
      console.error('Error al guardar menús en sessionStorage:', error);
    }
  }

  // ✅ Marcar que el backend está disponible
  private marcarBackendDisponible(): void {
    sessionStorage.setItem('backendDisponible', 'true');
    console.log('✅ Backend marcado como disponible');
  }

  // ✅ Manejar cuando el backend no está disponible
  private manejarBackendNoDisponible(): void {
    console.log('❌ Backend no disponible - limpiando datos temporales');
    // Limpiar datos temporales cuando el backend no está disponible
    this.menusTemporales = [];
    sessionStorage.removeItem('menusTemporales');
    sessionStorage.removeItem('backendDisponible');
    this.aplicarFiltros();
    
    // ✅ Mostrar error con SweetAlert (igual que en mesas)
    this.alertService.menu.loadError();
  }

  // ✅ Verificar si el backend estaba disponible en la sesión anterior
  private verificarBackendDisponible(): boolean {
    return sessionStorage.getItem('backendDisponible') === 'true';
  }

  // ✅ Carga inicial - verificar backend y cargar datos
  cargarMenusIniciales(): void {
    this.cargando = true;
    
    // Simular intento de conexión al backend
    setTimeout(() => {
      // Si no hay datos temporales y no hay backend disponible, mostrar error
      if (this.menusTemporales.length === 0 && !this.verificarBackendDisponible()) {
        console.log('📭 No hay menús disponibles y backend no accesible');
        // El error ya se muestra en manejarBackendNoDisponible() cuando fallan platos/productos
      }
      
      this.aplicarFiltros();
      this.cargando = false;
      
      // TODO: Implementar cuando el servicio de menús esté disponible
      /*
      this.menuService.getMenus(0, this.tamanoPagina).subscribe({
        next: (page) => {
          this.menusTemporales = page.content;
          this.pageInfo = page;
          this.menus = page.content;
          this.paginaActual = page.number;
          this.guardarMenusEnStorage(); // ✅ Guardar en sessionStorage para navegación
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar menús:', error);
          this.cargando = false;
          // Si hay error del backend pero tenemos datos temporales, usar esos
          if (this.menusTemporales.length === 0) {
            this.alertService.menu.loadError();
          }
        }
      });
      */
    }, 500);
  }

  // ✅ Métodos de filtros
  onBusquedaChange(): void {
    console.log('Buscar:', this.busqueda);
    this.paginaActual = 0; // Reset pagination when searching
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string): void {
    console.log('Estado seleccionado:', estado);
    this.estadoSeleccionado = estado;
    this.paginaActual = 0; // Reset pagination when filtering
    this.aplicarFiltros();
  }

  // ✅ Método para limpiar filtros
  limpiarFiltros(): void {
    this.busqueda = '';
    this.estadoSeleccionado = 'TODOS';
    this.paginaActual = 0;
    this.aplicarFiltros();
  }

  // ✅ Métodos de paginación
  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
      this.aplicarFiltros();
    }
  }

  paginaSiguiente(): void {
    const totalPaginas = Math.ceil(this.menusTemporales.length / this.tamanoPagina);
    if (this.paginaActual < totalPaginas - 1) {
      this.paginaActual++;
      this.aplicarFiltros();
    }
  }

  // ✅ Obtener total de páginas
  getTotalPaginas(): number {
    return Math.ceil(this.menusTemporales.length / this.tamanoPagina);
  }

  // ✅ Aplicar filtros (sin persistencia, igual que otros componentes)
  aplicarFiltros(): void {
    console.log('Aplicando filtros...');
    console.log('Busqueda:', this.busqueda);
    console.log('Estado:', this.estadoSeleccionado);
    console.log('Menús temporales disponibles:', this.menusTemporales.length);
    
    // Filtrar directamente (sin simulación de backend ni storage)
    let menusFiltrados = [...this.menusTemporales];
    
    // Filtro por búsqueda
    if (this.busqueda && this.busqueda.trim() !== '') {
      const busquedaLower = this.busqueda.toLowerCase().trim();
      menusFiltrados = menusFiltrados.filter(menu => 
        menu.nombre.toLowerCase().includes(busquedaLower) ||
        (menu.descripcion && menu.descripcion.toLowerCase().includes(busquedaLower)) ||
        (menu.nombrePlato && menu.nombrePlato.toLowerCase().includes(busquedaLower)) ||
        (menu.nombreProducto && menu.nombreProducto.toLowerCase().includes(busquedaLower))
      );
    }
    
    // Filtro por estado
    if (this.estadoSeleccionado && this.estadoSeleccionado !== 'TODOS') {
      menusFiltrados = menusFiltrados.filter(menu => {
        if (this.estadoSeleccionado === 'ACTIVOS') {
          return menu.activo === true;
        } else if (this.estadoSeleccionado === 'INACTIVOS') {
          return menu.activo === false;
        }
        return true;
      });
    }
    
    // Aplicar paginación
    const totalElements = menusFiltrados.length;
    const totalPages = Math.ceil(totalElements / this.tamanoPagina);
    const inicio = this.paginaActual * this.tamanoPagina;
    const fin = inicio + this.tamanoPagina;
    
    // Crear estructura de página (igual que otros componentes)
    this.pageInfo = {
      content: menusFiltrados.slice(inicio, fin),
      number: this.paginaActual,
      totalElements: totalElements,
      totalPages: totalPages
    };
    
    // Asignar resultados
    this.menus = this.pageInfo.content;
    this.paginaActual = this.pageInfo.number;
    
    console.log('✅ Filtros aplicados, menús cargados:', this.menus.length);
    console.log('📊 Total elementos:', totalElements, 'Total páginas:', totalPages);
  }

  // ✅ Método para obtener clase CSS del badge de estado
  getEstadoBadgeClass(menu: GetMenuDTO): string {
    return menu.activo ? 'estado-badge estado-disponible' : 'estado-badge estado-no-disponible';
  }

  getEstadoTexto(menu: GetMenuDTO): string {
    return menu.activo ? 'Disponible' : 'No Disponible';
  }

  // ✅ Método para formatear los contenidos (usando datos de ejemplo)
  formatearContenidos(menu: MenuConDetalles): string {
    console.log(`📋 Formateando contenidos para menú "${menu.nombre}":`, {
      id: menu.id,
      nombrePlato: menu.nombrePlato,
      nombreProducto: menu.nombreProducto
    });
    
    let contenidos = [];
    if (menu.nombrePlato) contenidos.push(menu.nombrePlato);
    if (menu.nombreProducto) contenidos.push(menu.nombreProducto);
    
    const resultado = contenidos.join(', ');
    console.log(`📋 Resultado formateado: "${resultado}"`);
    return resultado;
  }

  // ✅ Método para verificar disponibilidad por fechas
  estaDisponible(menu: GetMenuDTO): boolean {
    if (!menu.activo) return false;
    
    const hoy = new Date();
    const desde = menu.disponibleDesde ? new Date(menu.disponibleDesde) : null;
    const hasta = menu.disponibleHasta ? new Date(menu.disponibleHasta) : null;
    
    if (desde && hoy < desde) return false;
    if (hasta && hoy > hasta) return false;
    
    return true;
  }

  // ✅ Método para abrir modal de edición
  abrirModalEditarMenu(menu: GetMenuDTO): void {
    console.log('Editar menú:', menu);
    
    const modalRef = this.modalService.open(MenuModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // Pasar datos al modal
    modalRef.componentInstance.menu = menu;
    modalRef.componentInstance.platos = this.platosDisponibles; // ✅ Datos reales
    modalRef.componentInstance.productos = this.productosDisponibles; // ✅ Datos reales

    // Manejar resultado
    modalRef.result.then((result) => {
      if (result?.action === 'updated' && menu.id) {
        console.log('Menú actualizado:', result.menu);
        this.actualizarMenuEnLista(menu.id, result.menu);
        this.alertService.menu.updated();
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Método para abrir modal de nuevo menú
  abrirModalNuevoMenu(): void {
    const modalRef = this.modalService.open(MenuModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // Pasar datos al modal
    modalRef.componentInstance.platos = this.platosDisponibles; // ✅ Datos reales
    modalRef.componentInstance.productos = this.productosDisponibles; // ✅ Datos reales

    // Manejar resultado
    modalRef.result.then((result) => {
      if (result?.action === 'created') {
        console.log('Menú creado:', result.menu);
        this.agregarMenuALista(result.menu);
        this.alertService.menu.created();
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Método para recargar la lista de menús
  recargarMenus(): void {
    console.log('Recargando lista de menús...');
    // Resetear filtros y recargar
    this.busqueda = '';
    this.estadoSeleccionado = 'TODOS';
    this.paginaActual = 0;
    this.cargarMenusIniciales();
  }

  // ✅ Método para limpiar datos temporales
  limpiarDatosLocales(): void {
    this.menusTemporales = [];
    this.aplicarFiltros();
    console.log('✅ Datos temporales limpiados');
  }

  // ✅ Método para eliminar un menú específico
  eliminarMenu(menuId: number): void {
    const index = this.menusTemporales.findIndex((m: MenuConDetalles) => m.id === menuId);
    if (index !== -1) {
      this.menusTemporales.splice(index, 1);
      this.guardarMenusEnStorage(); // ✅ Persistir cambios en sessionStorage
      this.aplicarFiltros();
      console.log('✅ Menú eliminado:', menuId);
    }
  }

  // ✅ Agregar nuevo menú a la lista
  agregarMenuALista(nuevoMenu: any): void {
    // Convertir a formato de visualización
    const menuParaVista: MenuConDetalles = {
      ...nuevoMenu,
      id: Date.now(), // ID único basado en timestamp
      nombrePlato: this.obtenerNombrePlatos(nuevoMenu),
      nombreProducto: this.obtenerNombreProductos(nuevoMenu)
    };
    
    // Agregar al almacén temporal
    this.menusTemporales.unshift(menuParaVista);
    
    // ✅ Persistir cambios en sessionStorage para navegación
    this.guardarMenusEnStorage();
    
    // Reaplicar filtros para mostrar el nuevo menú
    this.aplicarFiltros();
    
    console.log('Menú agregado temporalmente:', menuParaVista);
    console.log('Total menús temporales:', this.menusTemporales.length);
  }

  // ✅ Actualizar menú específico en la lista
  actualizarMenuEnLista(menuId: number, menuActualizado: any): void {
    console.log('=== ACTUALIZANDO MENÚ EN LISTA ===');
    console.log('Menu ID:', menuId);
    console.log('Menu actualizado recibido:', menuActualizado);
    console.log('Platos disponibles:', this.platosDisponibles.length);
    console.log('Productos disponibles:', this.productosDisponibles.length);
    
    // Actualizar en el almacén temporal
    const indexLocal = this.menusTemporales.findIndex((m: MenuConDetalles) => m.id === menuId);
    if (indexLocal !== -1) {
      console.log('Menú encontrado en almacén temporal, índice:', indexLocal);
      console.log('Menú anterior:', this.menusTemporales[indexLocal]);
      
      // Calcular nuevos nombres con debug
      const nombrePlato = this.obtenerNombrePlatos(menuActualizado) || '';
      const nombreProducto = this.obtenerNombreProductos(menuActualizado) || '';
      
      console.log('Nombres calculados:');
      console.log('- Platos:', `"${nombrePlato}"`);
      console.log('- Productos:', `"${nombreProducto}"`);
      
      // Mantener el ID original y actualizar el resto
      const menuParaVista: MenuConDetalles = {
        ...menuActualizado,
        id: menuId, // Mantener ID original
        nombrePlato: nombrePlato,
        nombreProducto: nombreProducto
      };
      
      // ✅ Actualizar el menú en el almacén temporal
      this.menusTemporales[indexLocal] = menuParaVista;
      
      // ✅ Persistir cambios en sessionStorage para navegación
      this.guardarMenusEnStorage();
      
      // ✅ Reaplicar filtros para reflejar los cambios en la vista
      this.aplicarFiltros();
      
      // ✅ Forzar detección de cambios
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      console.log('Menú actualizado temporalmente:', menuParaVista);
      console.log('Total menús temporales:', this.menusTemporales.length);
      console.log('Menús visibles después de filtros:', this.menus.length);
      console.log('=== FIN ACTUALIZACIÓN ===');
    } else {
      console.log('ERROR: Menú no encontrado con ID:', menuId);
    }
  }

  // ✅ Obtener nombres de platos del menú
  private obtenerNombrePlatos(menu: any): string {
    console.log('🍽️ Obteniendo nombres de platos para:', menu.nombre);
    console.log('Productos del menú:', menu.productos);
    
    // ✅ Si no hay productos, devolver cadena vacía
    if (!menu.productos || !Array.isArray(menu.productos) || menu.productos.length === 0) {
      console.log('❌ No hay productos en el menú - devolviendo cadena vacía');
      return '';
    }
    
    const platos = menu.productos
      .filter((p: any) => {
        // ✅ Verificar que realmente tenga un idPlato válido
        const esPlato = p.idPlato && p.idPlato > 0;
        console.log(`Evaluando producto: idPlato=${p.idPlato || 'undefined'}, idProducto=${p.idProducto || 'undefined'}, es plato: ${esPlato}`);
        return esPlato;
      })
      .map((p: any) => {
        const plato = this.platosDisponibles.find(pl => pl.idPlato === p.idPlato);
        console.log(`🔍 Buscando plato con ID ${p.idPlato}:`, plato?.nombre || 'NO ENCONTRADO');
        return plato?.nombre || `Plato #${p.idPlato}`;
      });
    
    const resultado = platos.length > 0 ? platos.join(', ') : '';
    console.log('✅ Nombres de platos resultado:', `"${resultado}"`);
    return resultado;
  }

  // ✅ Obtener nombres de productos del menú
  private obtenerNombreProductos(menu: any): string {
    console.log('🥤 Obteniendo nombres de productos para:', menu.nombre);
    
    // ✅ Si no hay productos, devolver cadena vacía
    if (!menu.productos || !Array.isArray(menu.productos) || menu.productos.length === 0) {
      console.log('❌ No hay productos en el menú - devolviendo cadena vacía');
      return '';
    }
    
    const productos = menu.productos
      .filter((p: any) => {
        // ✅ Verificar que sea un producto puro (sin idPlato) y tenga idProducto válido
        const esProducto = p.idProducto && p.idProducto > 0 && (!p.idPlato || p.idPlato === 0);
        console.log(`Evaluando para productos: idPlato=${p.idPlato || 'undefined'}, idProducto=${p.idProducto || 'undefined'}, es producto: ${esProducto}`);
        return esProducto;
      })
      .map((p: any) => {
        const producto = this.productosDisponibles.find(pr => pr.id === p.idProducto);
        console.log(`🔍 Buscando producto con ID ${p.idProducto}:`, producto?.nombre || 'NO ENCONTRADO');
        return producto?.nombre || `Producto #${p.idProducto}`;
      });
    
    const resultado = productos.length > 0 ? productos.join(', ') : '';
    console.log('✅ Nombres de productos resultado:', `"${resultado}"`);
    return resultado;
  }

}