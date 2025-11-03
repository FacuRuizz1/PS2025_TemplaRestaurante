import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReservaService } from '../../../services/reserva.service';
import { DisponibilidadService } from '../../../services/disponibilidad.service';
import { PersonaService } from '../../../services/persona.service';
import { MesaService } from '../../../services/mesa.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { EventoReserva } from '../../models/EventoReserva';
import { DisponibilidadModel } from '../../models/DisponibilidadModel';
import { Persona } from '../../models/PersonaModel';
import { GetMesaDto } from '../../models/MesasModel';
import { PostReservaModel, ReservaModel } from '../../models/ReservaModel';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

interface ReservaData {
  cantidadComensales: number;
  fechaReserva: string;
  evento: EventoReserva | null;
  horario: string;
  idPersona: number;
  idMesa: number;
  idDisponibilidad: number;
  nroReserva?: number;
}

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  
  reservaData: ReservaData = {
    cantidadComensales: 1,
    fechaReserva: '',
    evento: null,
    horario: '',
    idPersona: 0,
    idMesa: 0,
    idDisponibilidad: 0
  };

  // Datos para los formularios
  disponibilidades: DisponibilidadModel[] = [];
  personas: Persona[] = [];
  mesas: GetMesaDto[] = [];
  
  // Enums y opciones
  EventoReserva = EventoReserva;
  eventosReserva = Object.values(EventoReserva);
  
  // Horarios disponibles
  horariosDisponibles = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  // Calendario
  mesActual = new Date();
  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  diasCalendario: any[] = [];
  fechasConDisponibilidad: string[] = [];

  // Forms para cada paso
  comensalesForm!: FormGroup;
  fechaForm!: FormGroup;
  eventoForm!: FormGroup;
  horarioForm!: FormGroup;
  personaMesaForm!: FormGroup;

  // Propiedades para la lista de reservas
  currentView: 'nueva' | 'lista' = 'lista';
  reservas: ReservaModel[] = [];
  pageInfo: any = null;
  loading = false;
  
  // Modo edición
  isEditMode = false;
  editingReservaId: number | null = null;
  
  // ✅ Filtros - siguiendo el patrón estándar
  busqueda: string = '';
  eventoSeleccionado: string = 'TODOS';
  fechaSeleccionada: string = '';
  
  // ✅ Paginación - siguiendo el patrón estándar
  paginaActual: number = 0;
  tamanoPagina: number = 10;

  // Getter para usar Math en el template
  get Math() {
    return Math;
  }

  constructor(
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private disponibilidadService: DisponibilidadService,
    private personaService: PersonaService,
    private mesaService: MesaService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.cargarDatos();
    this.generarCalendario();
    this.aplicarFiltros(); // Usar filtros desde el inicio como mesas
    
    // Inicializar filtros por defecto
    this.eventoSeleccionado = 'TODOS';
    this.fechaSeleccionada = '';
    this.busqueda = '';
    
    console.log('🚀 Componente inicializado, filtros:', {
      evento: this.eventoSeleccionado,
      fecha: this.fechaSeleccionada,
      busqueda: this.busqueda
    });
  }

  initializeForms() {
    this.comensalesForm = this.fb.group({
      cantidadComensales: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
    });

    this.fechaForm = this.fb.group({
      fechaReserva: ['', Validators.required]
    });

    this.eventoForm = this.fb.group({
      evento: [null, Validators.required]
    });

    this.horarioForm = this.fb.group({
      horario: ['', Validators.required]
    });

    this.personaMesaForm = this.fb.group({
      idPersona: [0, [Validators.required, Validators.min(1)]],
      idMesa: [0, [Validators.required, Validators.min(1)]]
    });
  }

  cargarDatos() {
    // Cargar disponibilidades
    this.disponibilidadService.obtenerTodasLasDisponibilidades().subscribe({
      next: (data) => {
        this.disponibilidades = data.filter(d => d.activo);
        
        // Si no hay disponibilidades, crear algunas de ejemplo para los próximos 30 días
        if (this.disponibilidades.length === 0) {
          this.crearDisponibilidadesEjemplo();
        } else {
          this.actualizarFechasConDisponibilidad();
          this.generarCalendario();
        }
      },
      error: (error: any) => {
        console.error('Error al cargar disponibilidades:', error);
        // Crear disponibilidades de ejemplo si hay error
        this.crearDisponibilidadesEjemplo();
        // No mostrar notificación de error, solo usar datos de ejemplo silenciosamente
      }
    });

    // Cargar personas
    this.personaService.obtenerPersonas(0, 100).subscribe({
      next: (data: any) => {
        this.personas = data.content || data;
      },
      error: (error: any) => {
        console.error('Error al cargar personas:', error);
        // Solo log del error, sin notificación
      }
    });

    // Cargar mesas
    this.mesaService.getMesas(0, 100).subscribe({
      next: (data: any) => {
        this.mesas = data.content || data;
      },
      error: (error: any) => {
        console.error('Error al cargar mesas:', error);
        // Solo log del error, sin notificación
      }
    });
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      this.updateReservaData();
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.comensalesForm.valid;
      case 2:
        return this.fechaForm.valid;
      case 3:
        return this.eventoForm.valid;
      case 4:
        return this.horarioForm.valid;
      case 5:
        return this.personaMesaForm.valid;
      default:
        return false;
    }
  }

  updateReservaData() {
    switch (this.currentStep) {
      case 1:
        this.reservaData.cantidadComensales = this.comensalesForm.get('cantidadComensales')?.value;
        // Actualizar fechas disponibles cuando cambien los comensales
        this.actualizarFechasConDisponibilidad();
        this.generarCalendario();
        break;
      case 2:
        this.reservaData.fechaReserva = this.fechaForm.get('fechaReserva')?.value;
        this.buscarDisponibilidad();
        break;
      case 3:
        this.reservaData.evento = this.eventoForm.get('evento')?.value;
        break;
      case 4:
        this.reservaData.horario = this.horarioForm.get('horario')?.value;
        break;
      case 5:
        this.reservaData.idPersona = Number(this.personaMesaForm.get('idPersona')?.value);
        this.reservaData.idMesa = Number(this.personaMesaForm.get('idMesa')?.value);
        console.log('Datos actualizados - Persona ID:', this.reservaData.idPersona, 'Mesa ID:', this.reservaData.idMesa);
        break;
    }
  }

  buscarDisponibilidad() {
    const fechaSeleccionada = this.reservaData.fechaReserva;
    console.log('🔍 Buscando disponibilidad para fecha:', fechaSeleccionada);
    console.log('📋 Disponibilidades disponibles:', this.disponibilidades);
    console.log('🎯 Evento seleccionado:', this.reservaData.evento);
    console.log('👥 Comensales:', this.reservaData.cantidadComensales);
    
    const disponibilidad = this.disponibilidades.find(d => d.fecha === fechaSeleccionada);
    console.log('💡 Disponibilidad encontrada para la fecha:', disponibilidad);
    
    if (disponibilidad && disponibilidad.id) {
      this.reservaData.idDisponibilidad = disponibilidad.id;
      console.log('✅ ID de disponibilidad asignado:', disponibilidad.id);
    } else {
      console.error('❌ No se encontró disponibilidad para la fecha:', fechaSeleccionada);
      console.log('📅 Fechas disponibles:', this.disponibilidades.map(d => d.fecha));
      this.reservaData.idDisponibilidad = 0;
    }
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Cantidad de Comensales';
      case 2: return 'Seleccionar Fecha';
      case 3: return 'Tipo de Evento';
      case 4: return 'Horario';
      case 5: return 'Cliente y Mesa';
      default: return '';
    }
  }

  confirmarReserva() {
    if (!this.validateCurrentStep()) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete todos los campos requeridos',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    this.updateReservaData();

    // Validaciones adicionales
    if (!this.reservaData.idPersona || this.reservaData.idPersona === 0) {
      Swal.fire({
        title: 'Cliente requerido',
        text: 'Debe seleccionar un cliente',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!this.reservaData.idMesa || this.reservaData.idMesa === 0) {
      Swal.fire({
        title: 'Mesa requerida',
        text: 'Debe seleccionar una mesa',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!this.reservaData.idDisponibilidad || this.reservaData.idDisponibilidad === 0) {
      console.error('❌ Validación de disponibilidad falló:');
      console.error('📊 Estado actual de reservaData:', this.reservaData);
      console.error('📅 Fecha seleccionada:', this.reservaData.fechaReserva);
      console.error('🆔 ID disponibilidad:', this.reservaData.idDisponibilidad);
      console.error('📋 Todas las disponibilidades:', this.disponibilidades);
      
      Swal.fire({
        title: 'Error de disponibilidad',
        text: `No se pudo obtener la disponibilidad para la fecha ${this.reservaData.fechaReserva}. Evento: ${this.reservaData.evento}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (this.isEditMode && this.editingReservaId) {
      // Modo edición
      this.actualizarReservaExistente();
    } else {
      // Modo creación
      this.crearNuevaReserva();
    }
  }

  private crearNuevaReserva() {
    const nroReserva = this.generarNumeroReserva();
    
    const nuevaReserva: PostReservaModel = {
      idPersona: Number(this.reservaData.idPersona),
      idMesa: Number(this.reservaData.idMesa),
      idDisponibilidad: Number(this.reservaData.idDisponibilidad),
      nroReserva: nroReserva,
      cantidadComensales: Number(this.reservaData.cantidadComensales),
      fechaReserva: this.reservaData.fechaReserva,
      evento: this.reservaData.evento!,
      horario: this.reservaData.horario
    };

    console.log('Datos de la nueva reserva a enviar:', nuevaReserva);
    console.log('URL del endpoint:', `${environment.apiUrl}/reserva/crear`);
    console.log('Token presente:', this.authService.getToken() ? 'Sí' : 'No');

    this.reservaService.crearReserva(nuevaReserva).subscribe({
      next: (response) => {
        console.log('Respuesta exitosa:', response);
        Swal.fire({
          title: '¡Reserva Confirmada!',
          text: `Su reserva #${nroReserva} ha sido creada exitosamente`,
          icon: 'success',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#27ae60'
        }).then(() => {
          this.resetForm();
          this.cambiarVista('lista');
        });
      },
      error: (error: any) => {
        console.error('Error completo:', error);
        console.error('URL llamada:', error.url);
        console.error('Status:', error.status);
        console.error('Status text:', error.statusText);
        console.error('Error details:', error.error);
        console.error('Headers:', error.headers);
        Swal.fire({
          title: 'Error al crear reserva',
          text: error.error?.message || `Error ${error.status}: ${error.statusText}`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  private actualizarReservaExistente() {
    const reservaActualizada: PostReservaModel = {
      idPersona: Number(this.reservaData.idPersona),
      idMesa: Number(this.reservaData.idMesa),
      idDisponibilidad: Number(this.reservaData.idDisponibilidad),
      nroReserva: Number(this.reservaData.nroReserva || this.generarNumeroReserva()),
      cantidadComensales: Number(this.reservaData.cantidadComensales),
      fechaReserva: this.reservaData.fechaReserva,
      evento: this.reservaData.evento!,
      horario: this.reservaData.horario
    };

    console.log('Datos de la reserva a actualizar:', reservaActualizada);

    this.reservaService.actualizarReserva(this.editingReservaId!, reservaActualizada).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Reserva Actualizada!',
          text: 'La reserva ha sido actualizada exitosamente',
          icon: 'success',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#27ae60'
        }).then(() => {
          this.resetForm();
          this.cambiarVista('lista');
        });
      },
      error: (error: any) => {
        console.error('Error al actualizar reserva:', error);
        Swal.fire({
          title: 'Error al actualizar reserva',
          text: error.error?.message || 'Ha ocurrido un error inesperado',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  generarNumeroReserva(): number {
    return Math.floor(Math.random() * 900000) + 100000; // Genera un número de 6 dígitos
  }

  resetForm() {
    this.prepararNuevaReserva();
  }

  getDisponibilidadesFiltradas(): DisponibilidadModel[] {
    const hoy = new Date().toISOString().split('T')[0];
    return this.disponibilidades.filter(d => 
      d.fecha >= hoy && 
      d.activo && 
      (d.cuposMaximos - d.cuposOcupados) >= this.reservaData.cantidadComensales
    );
  }

  getMesasDisponibles(): GetMesaDto[] {
    return this.mesas.filter(mesa => 
      mesa.estadoMesa === 'DISPONIBLE'
    );
  }

  // Métodos del calendario
  crearDisponibilidadesEjemplo() {
    console.log('Creando disponibilidades de ejemplo...');
    this.disponibilidades = [];
    
    // Crear disponibilidades para los próximos 30 días
    const hoy = new Date();
    for (let i = 1; i <= 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const disponibilidad: DisponibilidadModel = {
        id: i,
        fecha: fecha.toISOString().split('T')[0],
        cuposOcupados: Math.floor(Math.random() * 5), // Entre 0 y 4 ocupados
        cuposMaximos: 20, // 20 cupos máximos por día
        activo: true
      };
      
      this.disponibilidades.push(disponibilidad);
    }
    
    console.log('Disponibilidades de ejemplo creadas:', this.disponibilidades);
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }

  actualizarFechasConDisponibilidad() {
    const hoy = new Date().toISOString().split('T')[0];
    console.log('Actualizando fechas con disponibilidad...');
    console.log('Disponibilidades totales:', this.disponibilidades.length);
    console.log('Cantidad comensales requeridos:', this.reservaData.cantidadComensales);
    
    this.fechasConDisponibilidad = this.disponibilidades
      .filter(d => {
        const cumpleCondiciones = d.fecha >= hoy && 
          d.activo && 
          (d.cuposMaximos - d.cuposOcupados) >= this.reservaData.cantidadComensales;
        
        if (cumpleCondiciones) {
          console.log(`Fecha disponible: ${d.fecha}, Cupos libres: ${d.cuposMaximos - d.cuposOcupados}`);
        }
        
        return cumpleCondiciones;
      })
      .map(d => d.fecha);
    
    console.log('Fechas con disponibilidad filtradas:', this.fechasConDisponibilidad);
  }

  generarCalendario() {
    this.diasCalendario = [];
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    
    console.log('Generando calendario para:', year, month + 1);
    console.log('Fechas con disponibilidad:', this.fechasConDisponibilidad);
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Días del mes anterior para completar la primera semana
    const diasMesAnterior = primerDia.getDay();
    for (let i = diasMesAnterior - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      this.diasCalendario.push({
        dia: fecha.getDate(),
        fecha: this.formatearFecha(fecha),
        esDelMesActual: false,
        tieneDisponibilidad: false,
        esHoy: false
      });
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const fechaString = this.formatearFecha(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fecha.setHours(0, 0, 0, 0);
      
      const tieneDisponibilidad = this.fechasConDisponibilidad.includes(fechaString);
      
      if (tieneDisponibilidad) {
        console.log(`Día ${dia} marcado como disponible:`, fechaString);
      }
      
      this.diasCalendario.push({
        dia: dia,
        fecha: fechaString,
        esDelMesActual: true,
        tieneDisponibilidad: tieneDisponibilidad,
        esHoy: fecha.getTime() === hoy.getTime(),
        esPasado: fecha < hoy
      });
    }
    
    // Días del siguiente mes para completar la última semana
    const diasRestantes = 42 - this.diasCalendario.length; // 6 semanas * 7 días
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(year, month + 1, dia);
      this.diasCalendario.push({
        dia: dia,
        fecha: this.formatearFecha(fecha),
        esDelMesActual: false,
        tieneDisponibilidad: false,
        esHoy: false
      });
    }
  }

  formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  mesAnterior() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
  }

  seleccionarFecha(dia: any) {
    if (dia.esDelMesActual && dia.tieneDisponibilidad && !dia.esPasado) {
      this.reservaData.fechaReserva = dia.fecha;
      this.fechaForm.patchValue({ fechaReserva: dia.fecha });
      this.buscarDisponibilidad();
    }
  }

  esFechaSeleccionada(dia: any): boolean {
    return dia.fecha === this.reservaData.fechaReserva;
  }

  getEventoIcon(evento: EventoReserva): string {
    switch (evento) {
      case EventoReserva.ALMUERZO:
        return 'fas fa-utensils';
      case EventoReserva.CENA:
        return 'fas fa-moon';
      case EventoReserva.CUMPLEAÑOS:
        return 'fas fa-birthday-cake';
      case EventoReserva.VIP:
        return 'fas fa-crown';
      default:
        return 'fas fa-calendar';
    }
  }

  getEventoDisplayName(evento: EventoReserva | null): string {
    if (!evento) return '';
    switch (evento) {
      case EventoReserva.ALMUERZO:
        return 'Almuerzo';
      case EventoReserva.CENA:
        return 'Cena';
      case EventoReserva.CUMPLEAÑOS:
        return 'Cumpleaños';
      case EventoReserva.VIP:
        return 'VIP';
      default:
        return evento;
    }
  }

  decrementarComensales() {
    const currentValue = this.comensalesForm.get('cantidadComensales')?.value || 1;
    const newValue = Math.max(1, currentValue - 1);
    this.comensalesForm.patchValue({ cantidadComensales: newValue });
  }

  incrementarComensales() {
    const currentValue = this.comensalesForm.get('cantidadComensales')?.value || 1;
    const newValue = Math.min(20, currentValue + 1);
    this.comensalesForm.patchValue({ cantidadComensales: newValue });
  }

  // Métodos para la navegación entre vistas
  cambiarVista(vista: 'nueva' | 'lista') {
    this.currentView = vista;
    if (vista === 'lista') {
      this.cargarReservasIniciales();
    } else if (vista === 'nueva') {
      // Si no estamos en modo edición, resetear el formulario
      if (!this.isEditMode) {
        this.prepararNuevaReserva();
      }
    }
  }

  // Método para preparar una nueva reserva (formulario limpio)
  prepararNuevaReserva() {
    this.isEditMode = false;
    this.editingReservaId = null;
    this.currentStep = 1;
    
    // Limpiar datos del formulario
    this.reservaData = {
      cantidadComensales: 1,
      fechaReserva: '',
      evento: null,
      horario: '',
      idPersona: 0,
      idMesa: 0,
      idDisponibilidad: 0
    };
    
    // Resetear formularios
    this.initializeForms();
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }

  // ✅ Carga inicial - siguiendo el patrón estándar
  cargarReservasIniciales() {
    this.loading = true;
    console.log('🚀 Iniciando carga de reservas...');

    this.reservaService.obtenerReservas(0, 10).subscribe({
      next: (page) => {
        console.log('✅ Respuesta del backend:', page);
        this.pageInfo = page;
        this.reservas = page.content;
        this.paginaActual = page.number;
        this.loading = false;
        console.log('✅ Reservas cargadas:', page.content.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar reservas:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: `No se pudieron cargar las reservas. Error ${error.status}: ${error.statusText}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // Método para limpiar filtros y recargar
  limpiarFiltrosYRecargar() {
    console.log('🧹 Limpiando filtros y recargando...');
    this.eventoSeleccionado = 'TODOS';
    this.fechaSeleccionada = '';
    this.busqueda = '';
    this.cargarReservasIniciales();
  }

  // Método para limpiar todos los filtros pero manteniendo el endpoint de filtros
  limpiarTodosFiltros() {
    console.log('🧹 Limpiando todos los filtros pero usando endpoint de filtros...');
    this.eventoSeleccionado = 'TODOS';
    this.fechaSeleccionada = '';
    this.busqueda = '';
    this.aplicarFiltros();
  }

  // Método para limpiar solo el filtro de fecha
  limpiarFiltroFecha() {
    console.log('🧹 Limpiando filtro de fecha...');
    this.fechaSeleccionada = '';
    // Mantener los demás filtros y aplicar cambios
    this.aplicarFiltros();
  }

  private construirFiltros(pagina: number = 0): any {
    const filtros = {
      page: pagina,
      size: this.tamanoPagina,
      evento: this.eventoSeleccionado,
      fecha: this.fechaSeleccionada === '' ? undefined : this.fechaSeleccionada
      // Nota: El backend actual no soporta búsqueda por texto
    };
    
    console.log('🔧 Filtros construidos:', filtros);
    console.log('🔧 Estado de variables de filtros:', {
      eventoSeleccionado: this.eventoSeleccionado,
      fechaSeleccionada: this.fechaSeleccionada,
      busqueda: this.busqueda
    });
    console.log('🔧 ¿Filtrando por evento?', this.eventoSeleccionado === 'TODOS' ? 'No - mostrará todos los eventos' : `Sí: ${this.eventoSeleccionado}`);
    console.log('🔧 ¿Filtrando por fecha?', filtros.fecha ? `Sí: ${filtros.fecha}` : 'No - mostrará todas las fechas');
    return filtros;
  }

  // ✅ Aplicar filtros - siguiendo el patrón estándar de mesas
  aplicarFiltros() {
    this.loading = true;
    this.paginaActual = 0;
    const filtros = this.construirFiltros(0); // Siempre empezar en página 0
    
    console.log('🚀 Aplicando filtros con URL:', `${environment.apiUrl}/reserva/filtrar`);
    console.log('📋 Filtros enviados:', filtros);

    this.reservaService.obtenerReservasConFiltros(filtros).subscribe({
      next: (page) => {
        console.log('✅ Respuesta del servidor:', page);
        this.pageInfo = page;
        this.reservas = page.content;
        this.paginaActual = page.number;
        this.loading = false;
        console.log('✅ Filtros aplicados, reservas cargadas:', page.content.length);
      },
      error: (error) => {
        console.error('❌ Error al filtrar reservas:', error);
        console.error('❌ URL llamada:', error.url);
        console.error('❌ Status:', error.status);
        console.error('❌ Error completo:', error);
        this.loading = false;
        
        let mensaje = 'Error al filtrar reservas';
        if (error.status === 500) {
          mensaje = 'Error en el servidor. Verifique los filtros aplicados.';
          if (this.fechaSeleccionada) {
            mensaje += ` Fecha seleccionada: ${this.fechaSeleccionada}`;
          }
        }
        
        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // ✅ Métodos de filtros - siguiendo el patrón estándar
  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onEventoChange(evento: string) {
    console.log('🔍 Evento seleccionado:', evento);
    this.eventoSeleccionado = evento;
    this.aplicarFiltros();
  }

  onFechaChange(fecha: string) {
    console.log('📅 Fecha cambiada:', fecha);
    this.fechaSeleccionada = fecha;
    this.aplicarFiltros();
  }

  getNombreCliente(idPersona: number): string {
    const persona = this.personas.find(p => p.id === idPersona);
    return persona ? `${persona.nombre} ${persona.apellido}` : 'Cliente no encontrado';
  }

  getNumeroMesa(idMesa: number): string {
    const mesa = this.mesas.find(m => m.idMesa === idMesa);
    return mesa ? mesa.numeroMesa : 'Mesa no encontrada';
  }

  editarReserva(reserva: ReservaModel) {
    // Activar modo edición
    this.isEditMode = true;
    this.editingReservaId = reserva.id!;
    
    // Llenar el formulario con los datos de la reserva
    this.reservaData = {
      cantidadComensales: reserva.cantidadComensales,
      fechaReserva: reserva.fechaReserva,
      evento: reserva.evento,
      horario: reserva.horario,
      idPersona: reserva.idPersona,
      idMesa: reserva.idMesa,
      idDisponibilidad: reserva.idDisponibilidad,
      nroReserva: reserva.nroReserva
    };

    // Actualizar todos los formularios
    this.comensalesForm.patchValue({ cantidadComensales: reserva.cantidadComensales });
    this.fechaForm.patchValue({ fechaReserva: reserva.fechaReserva });
    this.eventoForm.patchValue({ evento: reserva.evento });
    this.horarioForm.patchValue({ horario: reserva.horario });
    this.personaMesaForm.patchValue({ 
      idPersona: reserva.idPersona,
      idMesa: reserva.idMesa 
    });

    // Ir al paso 1 y cambiar a vista nueva
    this.currentStep = 1;
    this.currentView = 'nueva';
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }

  eliminarReserva(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reservaService.eliminarReserva(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado',
              text: 'La reserva ha sido eliminada exitosamente',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarReservasIniciales(); // Recargar la lista
          },
          error: (error) => {
            console.error('Error al eliminar reserva:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la reserva',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }

  // ✅ Paginación - siguiendo el patrón estándar
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

  irAPagina(pagina: number) {
    if (pagina >= 0 && this.pageInfo && pagina < this.pageInfo.totalPages) {
      this.paginaActual = pagina;
      const filtros = this.construirFiltros(pagina); // Mantener filtros actuales

      this.loading = true;
      this.reservaService.obtenerReservasConFiltros(filtros).subscribe({
        next: (page) => {
          this.pageInfo = page;
          this.reservas = page.content;
          this.paginaActual = page.number;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cambiar página:', error);
          this.loading = false;
        }
      });
    }
  }
}