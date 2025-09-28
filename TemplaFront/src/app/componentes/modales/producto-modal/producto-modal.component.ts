import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductoDTO, TipoProducto, UnidadMedida } from '../../models/ProductoModel';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-modal.component.html',
  styleUrl: './producto-modal.component.css'
})
export class ProductoModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() productoData: ProductoDTO | null = null;

  producto: ProductoDTO = {
    nombre: '',
    tipo: '' as any, // Para que muestre "Seleccionar Tipo"
    unidadMedida: '' as any, // Para que muestre "Seleccionar Unidad"
    stockActual: 0,
    stockMinimo: 0,
    stockMaximo: 0,
    activo: true
  };

  // Enums disponibles para los selects
  TipoProducto = TipoProducto;
  UnidadMedida = UnidadMedida;

  // Arrays para los selects
  tiposProducto = [
    { value: TipoProducto.INSUMO, label: 'Insumo' },
    { value: TipoProducto.ACOMPAÑANTE, label: 'Acompañante' },
    { value: TipoProducto.BEBIDA, label: 'Bebida' }
  ];

  unidadesMedida = [
    { value: UnidadMedida.KILOGRAMO, label: 'Kilogramo (kg)' },
    { value: UnidadMedida.LITRO, label: 'Litro (lt)' },
    { value: UnidadMedida.GRAMO, label: 'Gramo (g)' }
  ];

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (this.isEditMode && this.productoData) {
      this.producto = { 
        ...this.productoData
      };
    }
  }

  // ✅ Validaciones
  get isFormValid(): boolean {
    return !!(
      this.producto.nombre &&
      this.producto.nombre.trim() &&
      this.producto.tipo &&
      this.producto.unidadMedida &&
      this.producto.stockActual >= 0 &&
      this.producto.stockMinimo >= 0 &&
      this.producto.stockMaximo >= 0
    );
  }

  // ✅ Validación simple para nombre
  get nombreValido(): boolean {
    return !!(this.producto.nombre && this.producto.nombre.trim());
  }

  // ✅ Método para limpiar espacios en nombre
  onNombreChange() {
    if (this.producto.nombre) {
      this.producto.nombre = this.producto.nombre.trim();
    }
  }



  save() {
    if (this.isFormValid) {
      console.log('Producto a guardar:', this.producto);
      this.activeModal.close(this.producto);
    } else {
      console.log('Formulario no válido');
    }
  }

  // ✅ Método para cancelar y cerrar modal
  cancel() {
    this.activeModal.dismiss();
  }
}
