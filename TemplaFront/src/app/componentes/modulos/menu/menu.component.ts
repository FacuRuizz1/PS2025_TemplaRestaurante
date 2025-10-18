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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {

  // ✅ Datos de ejemplo (luego conectarás con el backend)
  menus: MenuConDetalles[] = [];
  
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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('Componente de Menú cargado');
    this.cargarMenusDeEjemplo();
    this.cargarPlatosDisponibles();
    this.cargarProductosDisponibles();
  }

  // ✅ Cargar platos reales del servicio
  cargarPlatosDisponibles(): void {
    this.platoService.getPlatosFiltrados(0, 100).subscribe({
      next: (response: any) => {
        if (response?.content) {
          this.platosDisponibles = response.content;
        }
      },
      error: (error) => {
        console.error('Error al cargar platos:', error);
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
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  // ✅ Datos de ejemplo para mostrar el diseño
  private cargarMenusDeEjemplo(): void {
    this.menus = [
      {
        id: 1,
        nombre: 'Menú Ejecutivo',
        descripcion: 'Menú completo perfecto para el almuerzo',
        precio: 15.50,
        activo: true,
        disponibleDesde: '2024-01-01',
        disponibleHasta: '2024-12-31',
        productos: [
          { idPlato: 1, idProducto: 101 },
          { idProducto: 201 }, // Solo producto (bebida)
          { idProducto: 301 }  // Solo producto (acompañante)
        ],
        // Información enriquecida para la UI
        nombrePlato: 'Milanesa con papas fritas',
        nombreProducto: 'Coca Cola 500ml, Ensalada mixta'
      },
      {
        id: 2,
        nombre: 'Menú Vegetariano',
        descripcion: 'Opción saludable y deliciosa',
        precio: 12.00,
        activo: true,
        disponibleDesde: '2024-01-01',
        disponibleHasta: '2024-12-31',
        productos: [
          { idPlato: 2, idProducto: 102 },
          { idProducto: 202 },
          { idProducto: 302 }
        ],
        nombrePlato: 'Ensalada César',
        nombreProducto: 'Agua con gas, Pan integral'
      },
      {
        id: 3,
        nombre: 'Menú del Día',
        descripcion: 'La especialidad de hoy',
        precio: 18.00,
        activo: false,
        disponibleDesde: '2024-01-01',
        disponibleHasta: '2024-06-30',
        productos: [
          { idPlato: 3, idProducto: 103 },
          { idProducto: 203 },
          { idProducto: 303 }
        ],
        nombrePlato: 'Pescado a la plancha',
        nombreProducto: 'Jugo natural, Puré de papas'
      }
    ];
  }

  // ✅ Métodos de filtros
  onBusquedaChange(): void {
    console.log('Buscar:', this.busqueda);
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string): void {
    console.log('Estado seleccionado:', estado);
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  // ✅ Aplicar filtros a la lista de menús
  aplicarFiltros(): void {
    // Recargar datos desde el ejemplo base
    this.cargarMenusDeEjemplo();
    
    // Aplicar filtros
    let menusFiltrados = [...this.menus];

    // Filtro por búsqueda
    if (this.busqueda && this.busqueda.trim()) {
      const terminoBusqueda = this.busqueda.toLowerCase().trim();
      menusFiltrados = menusFiltrados.filter(menu => 
        menu.nombre.toLowerCase().includes(terminoBusqueda) ||
        menu.descripcion?.toLowerCase().includes(terminoBusqueda) ||
        menu.nombrePlato?.toLowerCase().includes(terminoBusqueda) ||
        menu.nombreProducto?.toLowerCase().includes(terminoBusqueda)
      );
    }

    // Filtro por estado
    if (this.estadoSeleccionado !== 'TODOS') {
      const estadoBoolean = this.estadoSeleccionado === 'ACTIVOS';
      menusFiltrados = menusFiltrados.filter(menu => menu.activo === estadoBoolean);
    }

    // Actualizar la lista
    this.menus = menusFiltrados;
    console.log(`Filtros aplicados: ${menusFiltrados.length} menús encontrados`);
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
        this.actualizarMenuEnLista(menu.id, result.menu); // ✅ Actualizar específico
        
        // ✅ Mostrar mensaje de éxito
        Swal.fire({
          title: '¡Éxito!',
          text: 'Menú actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#8bc34a'
        });
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
        this.agregarMenuALista(result.menu); // ✅ Agregar a la lista
        
        // ✅ Mostrar mensaje de éxito
        Swal.fire({
          title: '¡Éxito!',
          text: 'Menú creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#8bc34a'
        });
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Método para recargar la lista de menús
  recargarMenus(): void {
    console.log('Recargando lista de menús...');
    this.cargarMenusDeEjemplo(); // Por ahora recarga los ejemplos
    // TODO: Aquí llamarías al servicio de menús cuando esté implementado
  }

  // ✅ Agregar nuevo menú a la lista
  agregarMenuALista(nuevoMenu: any): void {
    // Convertir a formato de visualización
    const menuParaVista: MenuConDetalles = {
      ...nuevoMenu,
      id: this.menus.length + 1, // ID temporal
      nombrePlato: this.obtenerNombrePlatos(nuevoMenu),
      nombreProducto: this.obtenerNombreProductos(nuevoMenu)
    };
    
    // Agregar al inicio de la lista
    this.menus.unshift(menuParaVista);
    console.log('Menú agregado a la lista:', menuParaVista);
  }

  // ✅ Actualizar menú específico en la lista
  actualizarMenuEnLista(menuId: number, menuActualizado: any): void {
    console.log('=== ACTUALIZANDO MENÚ EN LISTA ===');
    console.log('Menu ID:', menuId);
    console.log('Menu actualizado recibido:', menuActualizado);
    console.log('Platos disponibles:', this.platosDisponibles.length);
    console.log('Productos disponibles:', this.productosDisponibles.length);
    
    const index = this.menus.findIndex(m => m.id === menuId);
    if (index !== -1) {
      console.log('Menú encontrado en índice:', index);
      console.log('Menú anterior:', this.menus[index]);
      
      // Calcular nuevos nombres con debug
      const nombrePlato = this.obtenerNombrePlatos(menuActualizado) || '';
      const nombreProducto = this.obtenerNombreProductos(menuActualizado) || '';
      
      console.log('Nombres calculados:');
      console.log('- Platos:', `"${nombrePlato}"`);
      console.log('- Productos:', `"${nombreProducto}"`);
      
      // Mantener el ID original y actualizar el resto - FORZAR valores vacíos si no hay contenido
      const menuParaVista: MenuConDetalles = {
        ...menuActualizado,
        id: menuId, // Mantener ID original
        nombrePlato: nombrePlato, // Forzar cadena vacía si no hay platos
        nombreProducto: nombreProducto // Forzar cadena vacía si no hay productos
      };
      
      // ✅ Actualizar el menú en el array
      this.menus[index] = menuParaVista;
      
      // ✅ Crear completamente nuevo array con objetos nuevos para forzar re-render
      this.menus = this.menus.map((m, i) => i === index ? { 
        ...menuParaVista, 
        _updateKey: Date.now() // Clave única para forzar actualización
      } : { ...m });
      
      // ✅ Forzar detección de cambios y marcar para revisar
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      console.log('Menú actualizado en la lista:', menuParaVista);
      console.log('Array actualizado:', this.menus[index]);
      console.log('Estado completo del array después de actualizar:');
      this.menus.forEach((m, i) => {
        console.log(`  ${i}: ID=${m.id}, Nombre="${m.nombre}", Platos="${m.nombrePlato}", Productos="${m.nombreProducto}"`);
      });
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