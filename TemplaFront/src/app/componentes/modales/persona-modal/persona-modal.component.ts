import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-persona-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './persona-modal.component.html',
  styleUrl: './persona-modal.component.css'
})
export class PersonaModalComponent {
  @Input() isEditMode: boolean = false;
  @Input() personaData: any = null;

  persona = {
    nombre: '',
    apellido: '',
    tipo: '',
    dni: '',
    estado: 'activo',
    email: '',
    telefono: '',
    documento: '',
    activo: true
  };

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (this.isEditMode && this.personaData) {
      this.persona = { ...this.personaData };
    }
  }

  save() {
    console.log('Persona a guardar:', this.persona);
    this.activeModal.close(this.persona);
  }
}
