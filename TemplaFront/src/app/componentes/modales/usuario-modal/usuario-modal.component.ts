// usuario-modal.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RolUsuario } from '../../models/UsuarioModel';

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-modal.component.html',
  styleUrl: './usuario-modal.component.css'
})
export class UsuarioModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() usuarioData: any = null;

  usuario = {
    username: '',
    password: '',
    rolUsuario: '' as RolUsuario,
    activo: true,
    personaId: undefined as number | undefined
  };

  RolUsuario = RolUsuario;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (this.isEditMode && this.usuarioData) {
      this.usuario = { 
        ...this.usuarioData,
        password: '' // No mostramos la password en edición por seguridad
      };
    }
  }

  save() {
    console.log('Usuario a guardar:', this.usuario);
    this.activeModal.close(this.usuario);
  }
}