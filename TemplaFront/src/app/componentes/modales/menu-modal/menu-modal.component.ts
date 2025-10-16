import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GetMenuDTO, PostMenuDTO, PostProductosMenuDto } from '../../models/MenuModel';
import { GetPlatoDto } from '../../models/PlatoModel';
import { ProductoDTO } from '../../models/ProductoModel';

export interface ItemMenu {
  id: number;
  nombre: string;
  tipo: 'PLATO' | 'PRODUCTO';
  tipoEspecifico: string; // TipoPlato o TipoProducto
}

@Component({
  selector: 'app-menu-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-modal.component.html',
  styleUrl: './menu-modal.component.css'
})
export class MenuModalComponent implements OnInit {

  @Input() menu?: GetMenuDTO;
  @Input() platos: GetPlatoDto[] = [];
  @Input() productos: ProductoDTO[] = [];

  // ✅ Formulario
  menuForm = {
    nombre: '',
    descripcion: '',
    precio: 0,
    disponibleDesde: '',
    disponibleHasta: '',
    productos: [] as PostProductosMenuDto[]
  };

  // ✅ Estado adicional
  activo = true;

  // ✅ Estado del formulario
  esEdicion = false;
  guardando = false;

  // ✅ Tipos de contenido para el menú
  tiposContenido = [
    { valor: 'PLATO', texto: 'Plato' },
    { valor: 'BEBIDA', texto: 'Bebida' },
    { valor: 'ACOMPAÑANTE', texto: 'Acompañante' }
  ];

  // ✅ Items disponibles según el tipo seleccionado
  itemsDisponibles: ItemMenu[] = [];
  
  // ✅ Selecciones actuales
  tipoSeleccionado = '';
  itemSeleccionado: number | null = null;
  itemsAgregados: ItemMenu[] = [];

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.esEdicion = !!this.menu;
    
    if (this.esEdicion && this.menu) {
      this.cargarDatosMenu();
    } else {
      // Configurar fechas por defecto para nuevo menú
      const hoy = new Date();
      this.menuForm.disponibleDesde = hoy.toISOString().split('T')[0];
      
      const finAno = new Date(hoy.getFullYear(), 11, 31);
      this.menuForm.disponibleHasta = finAno.toISOString().split('T')[0];
    }
  }

  private cargarDatosMenu(): void {
    if (!this.menu) return;
    
    this.menuForm = {
      nombre: this.menu.nombre,
      descripcion: this.menu.descripcion || '',
      precio: this.menu.precio,
      disponibleDesde: this.menu.disponibleDesde || '',
      disponibleHasta: this.menu.disponibleHasta || '',
      productos: [...this.menu.productos]
    };
    
    this.activo = this.menu.activo;
  }

  // ✅ Cuando cambia el tipo seleccionado, cargar items correspondientes
  onTipoChange(): void {
    console.log('onTipoChange llamado con:', this.tipoSeleccionado);
    this.itemsDisponibles = [];
    this.itemSeleccionado = null;

    if (!this.tipoSeleccionado) return;

    switch (this.tipoSeleccionado) {
      case 'PLATO':
        console.log('Cargando platos:', this.platos);
        // Cargar todos los platos
        this.itemsDisponibles = this.platos.map(plato => ({
          id: plato.idPlato,
          nombre: plato.nombre,
          tipo: 'PLATO' as const,
          tipoEspecifico: plato.tipoPlato
        }));
        break;

      case 'BEBIDA':
        console.log('Cargando bebidas - productos:', this.productos.filter(p => p.tipo === 'BEBIDA'));
        console.log('Cargando bebidas - platos:', this.platos.filter(p => p.tipoPlato === 'BEBIDA'));
        // Cargar productos tipo BEBIDA + platos tipo BEBIDA
        const productosBebida = this.productos
          .filter(p => p.tipo === 'BEBIDA' && p.id)
          .map(producto => ({
            id: producto.id!,
            nombre: producto.nombre,
            tipo: 'PRODUCTO' as const,
            tipoEspecifico: producto.tipo
          }));

        const platosBebida = this.platos
          .filter(p => p.tipoPlato === 'BEBIDA')
          .map(plato => ({
            id: plato.idPlato,
            nombre: plato.nombre,
            tipo: 'PLATO' as const,
            tipoEspecifico: plato.tipoPlato
          }));

        this.itemsDisponibles = [...productosBebida, ...platosBebida];
        break;

      case 'ACOMPAÑANTE':
        console.log('Cargando acompañantes:', this.productos.filter(p => p.tipo === 'ACOMPAÑANTE'));
        // Cargar productos tipo ACOMPAÑANTE
        this.itemsDisponibles = this.productos
          .filter(p => p.tipo === 'ACOMPAÑANTE' && p.id)
          .map(producto => ({
            id: producto.id!,
            nombre: producto.nombre,
            tipo: 'PRODUCTO' as const,
            tipoEspecifico: producto.tipo
          }));
        break;
    }
    
    console.log('Items disponibles después del switch:', this.itemsDisponibles);
  }

  // ✅ Agregar item al menú
  agregarItem(): void {
    console.log('agregarItem llamado', {
      itemSeleccionado: this.itemSeleccionado,
      tipoSeleccionado: this.tipoSeleccionado,
      itemsDisponibles: this.itemsDisponibles
    });
    
    if (!this.itemSeleccionado || !this.tipoSeleccionado) {
      console.log('Cancelando - faltan datos');
      return;
    }

    const item = this.itemsDisponibles.find(i => i.id === Number(this.itemSeleccionado));
    if (!item) {
      console.log('Item no encontrado');
      return;
    }

    console.log('Item encontrado:', item);

    // Verificar que no esté ya agregado
    const yaExiste = this.itemsAgregados.some(i => 
      i.id === item.id && i.tipo === item.tipo
    );
    
    if (yaExiste) {
      alert('Este item ya está agregado al menú');
      return;
    }

    // Agregar a la lista visual
    this.itemsAgregados.push(item);

    // Agregar al formulario
    if (item.tipo === 'PLATO') {
      this.menuForm.productos.push({
        idPlato: item.id,
        idProducto: 0 // Se asignará en el backend
      });
    } else {
      this.menuForm.productos.push({
        idProducto: item.id
      });
    }

    // Resetear selección
    this.tipoSeleccionado = '';
    this.itemSeleccionado = null;
    this.itemsDisponibles = [];
  }

  // ✅ Quitar item del menú
  quitarItem(index: number): void {
    this.itemsAgregados.splice(index, 1);
    this.menuForm.productos.splice(index, 1);
  }

  // ✅ Validar formulario
  esFormularioValido(): boolean {
    return !!(
      this.menuForm.nombre.trim() &&
      (this.menuForm.descripcion || '').trim() &&
      this.menuForm.precio > 0 &&
      this.menuForm.disponibleDesde &&
      this.menuForm.disponibleHasta &&
      this.menuForm.productos.length > 0
    );
  }

  // ✅ Guardar menú
  onGuardar(): void {
    if (!this.esFormularioValido()) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    this.guardando = true;

    // Crear el objeto completo para enviar
    const menuCompleto = {
      ...this.menuForm,
      activo: this.activo
    };

    // Simular guardado (aquí conectarás con el backend)
    setTimeout(() => {
      console.log('Guardando menú:', menuCompleto);
      this.guardando = false;
      this.activeModal.close({
        action: this.esEdicion ? 'updated' : 'created',
        menu: menuCompleto
      });
    }, 1000);
  }

  // ✅ Cancelar
  onCancelar(): void {
    this.activeModal.dismiss('cancel');
  }
}