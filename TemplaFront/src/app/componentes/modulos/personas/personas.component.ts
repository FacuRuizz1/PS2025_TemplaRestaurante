import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonaModalComponent } from '../../modales/persona-modal/persona-modal.component';


@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personas.component.html',
  styleUrl: './personas.component.css'
})
export class PersonasComponent {
filtro = '';

  constructor(private modalService: NgbModal) {}

  openNewPersonModal() {
    const modalRef = this.modalService.open(PersonaModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.result.then((result) => {
      console.log('Persona guardada:', result);
      // Aquí agregarías la persona a tu lista
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }
  
}
