import { CommonModule,  } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonaModalComponent } from '../../modales/persona-modal/persona-modal.component';
import { PersonaService } from '../../../services/persona.service';
import { Page } from '../../models/CommonModels';
import { Persona, TipoPersona, FiltroPersona, PostPersonaDto } from '../../models/PersonaModel';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personas.component.html',
  styleUrl: './personas.component.css'
})
export class PersonasComponent implements OnInit {
  
  // ✅ Datos
  personas: Persona[] = [];
  pageInfo: Page<Persona> | null = null;
  
  // ✅ Filtros
  busqueda: string = '';
  tipoSeleccionado: TipoPersona | '' = TipoPersona.PERSONAL;
  activoSeleccionado: boolean = true;
  estadoSeleccionado: string = 'ACTIVOS';
  
  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 10;

  // ✅ Loading
  cargando: boolean = false;

  TipoPersona = TipoPersona;

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private personaService: PersonaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarEmpleadosIniciales();
  }

  // ✅ Carga inicial - solo empleados
  cargarEmpleadosIniciales() {
    this.cargando = true;
    this.personaService.obtenerPersonas(0, 10).subscribe({
      next: (page) => {
        this.pageInfo = page;
        this.personas = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.cargando = false;
      }
    });
  }

  // ✅ Aplicar filtros
  aplicarFiltros() {
    this.cargando = true;
    
    const filtros: FiltroPersona = {
      busqueda: this.busqueda,
      tipo: this.tipoSeleccionado,
      activo: this.activoSeleccionado,
      page: 0,
      size: this.tamanoPagina
    };

    this.personaService.obtenerPersonasConFiltros(filtros).subscribe({
      next: (page) => {
        this.pageInfo = page;
        this.personas = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al filtrar personas:', error);
        this.cargando = false;
      }
    });
  }

  // ✅ Métodos de filtros
  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onTipoChange(tipo: TipoPersona | '') {
    this.tipoSeleccionado = tipo;
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string) {
    this.estadoSeleccionado = estado;
    if (estado === 'todos') {
      // Manejar lógica para "todos"
      this.aplicarFiltros();
    } else {
      this.activoSeleccionado = estado === 'ACTIVOS';
      this.aplicarFiltros();
    }
  }  

  onActivoChange(activo: boolean) {
    this.activoSeleccionado = activo;
    this.aplicarFiltros();
  }

  obtenerPaginasVisibles(): number[] {
    if (!this.pageInfo) return [];
    
    const totalPaginas = this.pageInfo.totalPages;
    const paginaActual = this.pageInfo.number;
    const paginas: number[] = [];
    
    let inicio = Math.max(0, paginaActual - 2);
    let fin = Math.min(totalPaginas - 1, inicio + 4);
    
    if (fin - inicio < 4) {
      inicio = Math.max(0, fin - 4);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

 openNewPersonModal(persona?: Persona) {
  const modalRef = this.modalService.open(PersonaModalComponent, {
    size: 'lg',
    backdrop: 'static'
  });

  if (persona) {
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.personaData = { ...persona }; // ✅ Copia del objeto
  } else {
    modalRef.componentInstance.isEditMode = false;
  }

  modalRef.result.then((result: Persona) => {
    console.log('Persona guardada:', result);
    
    // ✅ IMPLEMENTAR LAS LLAMADAS REALES
    if (persona) {
      // Es edición
      this.actualizarPersona(result);
    } else {
      // Es creación
      this.crearPersona(result);
    }
  }).catch((error) => {
    console.log('Modal cerrado sin guardar');
  });
}

// ✅ MÉTODO para convertir Persona a PostPersonaDto
private convertirAPostDto(persona: Persona): PostPersonaDto {
  // Obtener ID del usuario actual
  //const usuario = this.authService.getUser();
  const userAlta = 1 //usuario?.id || 1;

  return {
    nombre: persona.nombre,
    apellido: persona.apellido,
    email: persona.email,
    telefono: persona.telefono,
    dni: parseInt(persona.documento) || 0, // ✅ Convertir string a number
    tipoPersona: persona.tipo, // ✅ El enum ya es correcto
    userAlta: userAlta // ✅ ID del usuario que crea
  };
}

// ✅ ACTUALIZAR crearPersona
crearPersona(persona: Persona) {
  this.cargando = true;
  
  // ✅ Convertir a DTO antes de enviar
  const personaDto = this.convertirAPostDto(persona);
  
  this.personaService.crearPersona(personaDto).subscribe({
    next: (personaCreada) => {
      console.log('✅ Persona creada exitosamente:', personaCreada);
      this.cargarEmpleadosIniciales();
      alert('Persona creada exitosamente');
    },
    error: (error) => {
      console.error('❌ Error al crear persona:', error);
      this.cargando = false;
      alert('Error al crear la persona');
    }
  });
}

  actualizarPersona(persona: Persona) {
    this.cargando = true;
    this.personaService.actualizarPersona(persona).subscribe({
      next: (personaActualizada) => {
        console.log('✅ Persona actualizada exitosamente:', personaActualizada);
        this.aplicarFiltros(); // Recargar con filtros actuales
        alert('Persona actualizada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error al actualizar persona:', error);
        this.cargando = false;
        alert('Error al actualizar la persona');
      }
    });
  }

  // ✅ COMPLETAR EL MÉTODO DE ELIMINAR
  eliminarPersona(persona: Persona) {
    if (confirm(`¿Está seguro de eliminar a ${persona.nombre} ${persona.apellido}?`)) {
      this.cargando = true;
      this.personaService.eliminarPersona(persona.id!).subscribe({
        next: () => {
          console.log('✅ Persona eliminada exitosamente');
          this.aplicarFiltros(); // Recargar lista
          alert('Persona eliminada exitosamente');
        },
        error: (error) => {
          console.error('❌ Error al eliminar persona:', error);
          this.cargando = false;
          alert('Error al eliminar la persona');
        }
      });
    }
  }

  // ✅ COMPLETAR EL MÉTODO DE PAGINACIÓN
  irAPagina(pagina: number) {
    if (pagina >= 0 && this.pageInfo && pagina < this.pageInfo.totalPages) {
      this.paginaActual = pagina;
      
      const filtros: FiltroPersona = {
        busqueda: this.busqueda,
        tipo: this.tipoSeleccionado,
        activo: this.activoSeleccionado,
        page: pagina,
        size: this.tamanoPagina
      };

      this.cargando = true;
      this.personaService.obtenerPersonasConFiltros(filtros).subscribe({
        next: (page) => {
          this.pageInfo = page;
          this.personas = page.content;
          this.paginaActual = page.number;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cambiar página:', error);
          this.cargando = false;
        }
      });
    }
  }
}
