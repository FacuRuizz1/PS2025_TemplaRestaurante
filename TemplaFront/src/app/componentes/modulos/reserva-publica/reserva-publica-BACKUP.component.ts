import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservaService } from '../../../services/reserva.service';
import { DisponibilidadService } from '../../../services/disponibilidad.service';
import { PersonaService } from '../../../services/persona.service';
import { AuthService } from '../../../services/auth.service';
import { EventoReserva } from '../../models/EventoReserva';
import { DisponibilidadModel } from '../../models/DisponibilidadModel';
import { Persona, PostPersonaDto, TipoPersona } from '../../models/PersonaModel';
import { PostReservaModel } from '../../models/ReservaModel';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reserva-publica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reserva-publica.component.html',
  styleUrls: ['./reserva-publica.component.css']
})
export class ReservaPublicaComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  
  reservaData: any = {
    cantidadComensales: 1,
    fechaReserva: '',
    evento: null,
    horario: '',
    idPersona: 0,
    idDisponibilidad: 0
  };
  
  // Formularios por paso
  comensalesForm!: FormGroup;
  fechaForm!: FormGroup;
  eventoForm!: FormGroup;
  horarioForm!: FormGroup;
  personaMesaForm!: FormGroup;
  
  // Datos
  horariosDisponibles: string[] = [];
  eventosReserva = Object.values(EventoReserva);
  disponibilidades: DisponibilidadModel[] = [];
  
  // Horarios por evento
  private horariosPorEvento = {
    [EventoReserva.ALMUERZO]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
    [EventoReserva.CENA]: ['20:00', '20:30', '21:00', '21:30', '22:00'],
    [EventoReserva.CUMPLEAÑOS]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
    [EventoReserva.VIP]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
  };
  
  // Calendario
  mesActual = new Date();
  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  diasCalendario: any[] = [];
  fechasConDisponibilidad: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private reservaService: ReservaService,
    private disponibilidadService: DisponibilidadService,
    private personaService: PersonaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.inicializarFormularios();
    this.cargarDisponibilidades();
    this.generarCalendario();
  }

  inicializarFormularios() {
    // Paso 1: Comensales
    this.comensalesForm = this.fb.group({
      cantidadComensales: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
    });

    // Paso 2: Fecha
    this.fechaForm = this.fb.group({
      fechaReserva: ['', Validators.required]
    });

    // Paso 3: Evento
    this.eventoForm = this.fb.group({
      evento: [null, Validators.required]
    });

    // Paso 4: Horario
    this.horarioForm = this.fb.group({
      horario: ['', Validators.required]
    });

    // Paso 5: Datos del cliente
    this.personaMesaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  cargarDisponibilidades() {
    this.disponibilidadService.obtenerTodasLasDisponibilidades().subscribe({
      next: (data) => {
        this.disponibilidades = data.filter(d => d.activo);
        
        if (this.disponibilidades.length === 0) {
          this.crearDisponibilidadesEjemplo();
        } else {
          this.actualizarFechasConDisponibilidad();
          this.generarCalendario();
        }
      },
      error: (error: any) => {
        console.error('Error al cargar disponibilidades:', error);
        this.crearDisponibilidadesEjemplo();
      }
    });
  }

  crearDisponibilidadesEjemplo() {
    this.disponibilidades = [];
    const hoy = new Date();
    for (let i = 1; i <= 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const disponibilidad: DisponibilidadModel = {
        id: i,
        fecha: fecha.toISOString().split('T')[0],
        cuposOcupados: Math.floor(Math.random() * 5),
        cuposMaximos: 20,
        activo: true
      };
      
      this.disponibilidades.push(disponibilidad);
    }
    
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }

  actualizarFechasConDisponibilidad() {
    const hoy = new Date().toISOString().split('T')[0];
    this.fechasConDisponibilidad = this.disponibilidades
      .filter(d => {
        return d.fecha >= hoy && 
          d.activo && 
          (d.cuposMaximos - d.cuposOcupados) >= this.reservaData.cantidadComensales;
      })
      .map(d => d.fecha);
  }

  private actualizarHorariosDisponibles() {
    const eventoSeleccionado = this.eventoForm.get('evento')?.value as EventoReserva;
    if (eventoSeleccionado && this.horariosPorEvento[eventoSeleccionado]) {
      this.horariosDisponibles = this.horariosPorEvento[eventoSeleccionado];
    } else {
      // Fallback: todos los horarios disponibles
      this.horariosDisponibles = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    }
    
    const horarioActual = this.horarioForm.get('horario')?.value;
    if (horarioActual && !this.horariosDisponibles.includes(horarioActual)) {
      this.horarioForm.patchValue({ horario: '' });
    }
  }

  // Navegación entre pasos
  nextStep() {
    if (this.validateCurrentStep()) {
      this.updateReservaData();
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        
        if (this.currentStep === 4) {
          this.actualizarHorariosDisponibles();
        }
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
    if (this.currentStep === 1) {
      this.reservaData.cantidadComensales = this.comensalesForm.get('cantidadComensales')?.value;
      this.actualizarFechasConDisponibilidad();
      this.generarCalendario();
    } else if (this.currentStep === 2) {
      this.reservaData.fechaReserva = this.fechaForm.get('fechaReserva')?.value;
    } else if (this.currentStep === 3) {
      this.reservaData.evento = this.eventoForm.get('evento')?.value;
    } else if (this.currentStep === 4) {
      this.reservaData.horario = this.horarioForm.get('horario')?.value;
    }
  }

  // Métodos del calendario
  generarCalendario() {
    this.diasCalendario = [];
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
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
    
    for (let dpersonaMesaForm.valid || !this.reservaData.horario || !this.reservaData.evento) {
      Swal.fire('Error', 'Por favor complete todos los datos', 'error');
      return;
    }

    // Verificar si es evento VIP para mostrar modal de pago
    if (this.reservaData.evento === EventoReserva.VIP) {
      this.mostrarModalPagoVIP();
      return;
    }

    const datosCliente = this.personaMesaForm.value;
    const fechaReserva = this.reservaData.fechaReserva
        tieneDisponibilidad: tieneDisponibilidad,
        esHoy: fecha.getTime() === hoy.getTime(),
        esPasado: fecha < hoy
      });
    }
    
    const diasRestantes = 42 - this.diasCalendario.length;
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

  mesAnterior() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
  }

  seleccionarFecha(dia: any) {
    if (dia.tieneDisponibilidad && dia.esDelMesActual && !dia.esPasado) {
      this.reservaData.fechaReserva = dia.fecha;
      this.fechaForm.patchValue({ fechaReserva: dia.fecha });
      
      const disponibilidad = this.disponibilidades.find(d => d.fecha === dia.fecha);
      if (disponibilidad) {
        this.reservaData.idDisponibilidad = disponibilidad.id!;
      }
    }
  }

  esFechaSeleccionada(dia: any): boolean {
    return dia.fecha === this.reservaData.fechaReserva;
  }

  formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  incrementarComensales() {
    const valor = this.comensalesForm.get('cantidadComensales')?.value;
    if (valor < 20) {
      this.comensalesForm.patchValue({ cantidadComensales: valor + 1 });
    }
  }

  decrementarComensales() {
    const valor = this.comensalesForm.get('cantidadComensales')?.value;
    if (valor > 1) {
      this.comensalesForm.patchValue({ cantidadComensales: valor - 1 });
    }
  }

  // Confirmar reserva
  async confirmarReserva() {
    if (!this.formularioPaso4.valid || !this.horarioSeleccionado || !this.eventoSeleccionado) {
      Swal.fire('Error', 'Por favor complete todos los datos', 'error');
      return;
    }

    // Verificar si es evento VIP para mostrar modal de pago
    if (this.eventoSeleccionado === EventoReserva.VIP) {
      this.mostrarModalPagoVIP();
      return;
    }

    const datosCliente = this.formularioPaso4.value;
    const fechaReserva = this.formularioPaso2.get('fechaReserva')?.value;

    try {
      // 1. Buscar o crear disponibilidad para la fecha
      const disponibilidad = await this.obtenerOCrearDisponibilidad(fechaReserva);

      if (!disponibilidad || !disponibilidad.id) {
        throw new Error('No se pudo obtener la disponibilidad');
      }

      // 2. Crear o buscar cliente
      const userId = this.authService.getUserId() || 1; // Usuario por defecto si no está autenticado
      
      const clienteData: PostPersonaDto = {
        nombre: datosCliente.nombre,
        apellido: datosCliente.apellido,
        dni: parseInt(datosCliente.dni),
        telefono: datosCliente.telefono,
        email: datosCliente.email,
        tipoPersona: TipoPersona.CLIENTE,
        userAlta: userId
      };

      const cliente = await this.personaService.crearPersona(clienteData).toPromise();

      if (!cliente || !cliente.id) {
        throw new Error('No se pudo crear el cliente');
      }

      // 3. Generar número de reserva
      const nroReserva = Math.floor(100000 + Math.random() * 900000);

      // 4. Crear la reserva
      const reservaData: PostReservaModel = {
        cantidadComensales: this.reservaData.cantidadComensales,
        fechaReserva: fechaReserva,
        evento: this.reservaData.evento,
        horario: this.reservaData.horario,
        idPersona: cliente.id,
        idDisponibilidad: disponibilidad.id,
        nroReserva: nroReserva,
        nombreCliente: `${datosCliente.nombre} ${datosCliente.apellido}`,
        telefonoCliente: datosCliente.telefono
      };

      const reserva = await this.reservaService.crearReserva(reservaData).toPromise();

      Swal.fire({
        icon: 'success',
        title: '¡Reserva Confirmada!',
        html: `
          <p>Su reserva ha sido creada exitosamente.</p>
          <p><strong>Número de reserva:</strong> ${reserva?.nroReserva || nroReserva}</p>
          <p><strong>Fecha:</strong> ${this.formatearFecha(fechaReserva)}</p>
          <p><strong>Horario:</strong> ${this.horarioSeleccionado}</p>
          <p><strong>Comensales:</strong> ${reservaData.cantidadComensales}</p>
        `,
        confirmButtonText: 'Volver al inicio'
      }).then(() => {
        this.volverAlInicio();
      });

    } catch (error: any) {
      console.error('Error al crear reserva:', error);
      Swal.fire('Error', error.error?.message || 'No se pudo crear la reserva', 'error');
    }
  }

  // Obtener o crear disponibilidad
  private async obtenerOCrearDisponibilidad(fecha: string): Promise<DisponibilidadModel | null> {
    try {
      // Intentar obtener todas las disponibilidades
      const disponibilidades = await this.disponibilidadService.obtenerTodasLasDisponibilidades().toPromise();
      
      // Buscar si ya existe una para esta fecha
      const existente = disponibilidades?.find(d => d.fecha === fecha && d.activo);
      
      if (existente) {
        return existente;
      }

      // Si no existe, crear una nueva
      const nuevaDisponibilidad: any = {
        fecha: fecha,
        cuposOcupados: 1,
        cuposMaximos: 100,
        activo: true
      };

      const resultado = await this.disponibilidadService.crearDisponibilidad(nuevaDisponibilidad).toPromise();
      return resultado || null;
    } catch (error) {
      console.error('Error al obtener/crear disponibilidad:', error);
      return null;
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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

  volverAlInicio() {
    this.router.navigate(['/']);
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return '¿Para cuántas personas?';
      case 2: return '¿Qué día querés reservar?';
      case 3: return '¿Cuál es el motivo de tu reserva?';
      case 4: return 'Seleccioná tu horario';
      case 5: return 'Completá tus datos';
      default: return '';
    }
  }

  // Modal de pago VIP
  private mostrarModalPagoVIP() {
    const precioVIP = 5000; // Precio configurado en el backend
    
    Swal.fire({
      title: '👑 Reserva VIP',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 1.2em; margin-bottom: 20px; color: #2c3e50;">
            Para confirmar su <strong>reserva VIP</strong>, debe abonar una seña de:
          </div>
          <div style="font-size: 2.5em; font-weight: bold; color: #f39c12; margin: 20px 0;">
            $${precioVIP.toLocaleString('es-AR')}
          </div>
          <div style="font-size: 1em; color: #7f8c8d; margin-bottom: 20px;">
            Serás redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura.
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <i class="fas fa-crown" style="color: #f39c12; margin-right: 8px;"></i>
            <strong>Beneficios VIP incluidos</strong>
            <ul style="text-align: left; margin-top: 10px; color: #555;">
              <li>Mesa preferencial</li>
              <li>Atención prioritaria</li>
              <li>Cortesía de bienvenida</li>
            </ul>
          </div>
          <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; margin-top: 15px;">
            <small style="color: #2e7d32;">
              <i class="fas fa-shield-alt"></i> Pago 100% seguro con Mercado Pago
            </small>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-credit-card"></i> Continuar al Pago',
      cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
      confirmButtonColor: '#27ae60',
      cancelButtonColor: '#e74c3c',
      customClass: {
        popup: 'vip-payment-modal',
        confirmButton: 'btn-pago-vip',
        cancelButton: 'btn-cancelar-vip'
      },
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      preConfirm: () => {
        return this.procesarPagoVIP();
      }
    }).then((result) => {
      if (result.isDismissed) {
        // Usuario canceló - no hacer nada, mantener en el formulario
        Swal.fire({
          title: 'Reserva cancelada',
          text: 'Puedes modificar los datos o elegir otro tipo de evento',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  private async procesarPagoVIP(): Promise<void> {
    try {
      console.log('💳 Iniciando proceso de pago VIP...');

      const datosCliente = this.formularioPaso4.value;
      const fechaReserva = this.formularioPaso2.get('fechaReserva')?.value;

      // 1. Obtener o crear disponibilidad
      const disponibilidad = await this.obtenerOCrearDisponibilidad(fechaReserva);

      if (!disponibilidad || !disponibilidad.id) {
        throw new Error('No se pudo obtener la disponibilidad');
      }
personaMesaForm.value;
      const fechaReserva = this.reservaData.fechaReserva
      const nroReserva = Math.floor(100000 + Math.random() * 900000);

      // 3. Crear persona
      const userId = this.authService.getUserId() || 1;
      
      const clienteData: PostPersonaDto = {
        nombre: datosCliente.nombre,
        apellido: datosCliente.apellido,
        dni: parseInt(datosCliente.dni),
        telefono: datosCliente.telefono,
        email: datosCliente.email,
        tipoPersona: TipoPersona.CLIENTE,
        userAlta: userId
      };

      console.log('📝 Creando persona:', clienteData);
      const personaCreada = await this.personaService.crearPersona(clienteData).toPromise();
      
      if (!personaCreada || !personaCreada.id) {
        throw new Error('Error al crear la persona');
      }

      console.log('✅ Persona creada:', personaCreada);

      // 4. Preparar request para reserva VIP con Mercado Pago
      const reservaVipRequest = {
        reservaData: {
          idPersona: personaCreada.id,
          idDisponibilidad: disponibilidad.id,
          nroReserva: nroReserva,
          cantidadComensales: this.formularioPaso2.get('cantidadComensales')?.value,
          fechaReserva: fechaReserva,
          evento: EventoReserva.VIP as EventoReserva.VIP,
          horario: this.horarioSeleccionado,
          nombreCliente: `${personaCreada.nombre} ${personaCreada.apellido}`,
          telefonoCliente: personaCreada.telefono,
          ocasionEspecial: 'Reserva VIP'
        },
        emailCliente: personaCreada.email,
        nombreCliente: `${personaCrreservaData.cantidadComensales,
          fechaReserva: fechaReserva,
          evento: EventoReserva.VIP as EventoReserva.VIP,
          horario: this.reservaData.horaricon pago:', reservaVipRequest);

      // 5. Llamar al backend para crear la reserva VIP
      const response = await this.reservaService.crearReservaVip(reservaVipRequest).toPromise();
      
      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('✅ Respuesta de Mercado Pago:', response);

      // 6. Validar que se recibió el preference ID y public key
      if (!response.preferenceId || !response.publicKey) {
        throw new Error('No se recibió preference ID o public key del servidor');
      }

      // 7. Mostrar mensaje informativo antes de abrir el checkout
      await Swal.fire({
        title: '🎉 ¡Reserva Iniciada!',
        html: `
          <p>Tu reserva <strong>#${nroReserva}</strong> ha sido iniciada.</p>
          <p>Serás redirigido a <strong>Mercado Pago</strong> para completar el pago.</p>
          <p class="text-muted mt-2">
            <small>Una vez completado el pago, recibirás la confirmación de tu reserva VIP.</small>
          </p>
        `,
        icon: 'success',
        confirmButtonText: 'Ir a pagar',
        confirmButtonColor: '#27ae60',
        timer: 3000,
        timerProgressBar: true
      });

      // 8. Abrir Mercado Pago con SDK usando preference ID y public key
      this.reservaService.abrirCheckoutMercadoPago(
        response.preferenceId,
        response.publicKey,
        response.reservaId
      );

      // No hacer nada más - el callback se encargará de mostrar el resultado
      
    } catch (error: any) {
      console.error('❌ Error al procesar pago VIP:', error);
      
      let errorMessage = 'No se pudo procesar la reserva VIP. Por favor, intente nuevamente.';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: 'Error al procesar pago',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e74c3c'
      });
      
      throw error; // Re-lanzar para que SweetAlert maneje el error
    }
  }
}
