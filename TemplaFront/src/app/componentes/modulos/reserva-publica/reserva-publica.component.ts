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
  
  // Formularios por paso
  formularioPaso1!: FormGroup;
  formularioPaso2!: FormGroup;
  formularioPaso3!: FormGroup;
  formularioPaso4!: FormGroup;
  
  // Datos
  horariosDisponibles: string[] = [];
  horarioSeleccionado: string = '';
  eventosDisponibles = Object.values(EventoReserva);
  eventoSeleccionado: EventoReserva | null = null;
  
  // Horarios por evento
  private horariosPorEvento: { [key: string]: string[] } = {
    [EventoReserva.ALMUERZO]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
    [EventoReserva.CENA]: ['20:00', '20:30', '21:00', '21:30', '22:00'],
    [EventoReserva.CUMPLEAÑOS]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
    [EventoReserva.VIP]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
  };
  
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
    this.setupEventoListener();
  }

  inicializarFormularios() {
    // Paso 1: Selección de evento
    this.formularioPaso1 = this.fb.group({
      evento: [null, Validators.required]
    });

    // Paso 2: Fecha y comensales
    this.formularioPaso2 = this.fb.group({
      fechaReserva: ['', Validators.required],
      cantidadComensales: [2, [Validators.required, Validators.min(1), Validators.max(20)]]
    });

    // Paso 3: Horario
    this.formularioPaso3 = this.fb.group({
      horario: ['', Validators.required]
    });

    // Paso 4: Datos del cliente
    this.formularioPaso4 = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  setupEventoListener() {
    // Escuchar cambios en la selección de evento para actualizar horarios
    this.formularioPaso1.get('evento')?.valueChanges.subscribe((evento: EventoReserva) => {
      if (evento) {
        this.eventoSeleccionado = evento;
        this.actualizarHorariosDisponibles();
      }
    });
  }

  private actualizarHorariosDisponibles() {
    if (this.eventoSeleccionado && this.horariosPorEvento[this.eventoSeleccionado]) {
      this.horariosDisponibles = this.horariosPorEvento[this.eventoSeleccionado];
    } else {
      // Fallback: todos los horarios disponibles
      this.horariosDisponibles = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    }
    
    // Limpiar selección de horario si el horario actual no está disponible
    const horarioActual = this.formularioPaso3.get('horario')?.value;
    if (horarioActual && !this.horariosDisponibles.includes(horarioActual)) {
      this.formularioPaso3.patchValue({ horario: '' });
      this.horarioSeleccionado = '';
    }
  }

  // Navegación entre pasos
  nextStep() {
    if (this.currentStep === 1 && this.formularioPaso1.valid) {
      this.eventoSeleccionado = this.formularioPaso1.get('evento')?.value;
      this.currentStep++;
    } else if (this.currentStep === 2 && this.formularioPaso2.valid) {
      this.cargarHorarios();
    } else if (this.currentStep === 3 && this.formularioPaso3.valid) {
      this.currentStep++;
    } else if (this.currentStep === 4 && this.formularioPaso4.valid) {
      this.currentStep++;
    } else {
      this.marcarErrores();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep || this.puedeNavegar(step)) {
      this.currentStep = step;
    }
  }

  puedeNavegar(step: number): boolean {
    if (step === 1) return true;
    if (step === 2) return this.formularioPaso1.valid;
    if (step === 3) return this.formularioPaso1.valid && this.formularioPaso2.valid && this.horariosDisponibles.length > 0;
    if (step === 4) return this.formularioPaso1.valid && this.formularioPaso2.valid && this.formularioPaso3.valid;
    if (step === 5) return this.formularioPaso1.valid && this.formularioPaso2.valid && this.formularioPaso3.valid && this.formularioPaso4.valid;
    return false;
  }

  marcarErrores() {
    if (this.currentStep === 1) {
      this.formularioPaso1.markAllAsTouched();
    } else if (this.currentStep === 2) {
      this.formularioPaso2.markAllAsTouched();
    } else if (this.currentStep === 3) {
      this.formularioPaso3.markAllAsTouched();
    } else if (this.currentStep === 4) {
      this.formularioPaso4.markAllAsTouched();
    }
  }

  // Cargar horarios según evento
  cargarHorarios() {
    if (!this.eventoSeleccionado) {
      Swal.fire('Error', 'Por favor seleccione un evento', 'error');
      return;
    }

    if (this.horariosDisponibles.length === 0) {
      this.actualizarHorariosDisponibles();
    }
    
    this.currentStep++;
  }

  seleccionarHorario(horario: string) {
    this.horarioSeleccionado = horario;
    this.formularioPaso3.patchValue({ horario: horario });
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
        cantidadComensales: this.formularioPaso2.get('cantidadComensales')?.value,
        fechaReserva: fechaReserva,
        evento: this.eventoSeleccionado,
        horario: this.horarioSeleccionado,
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

  reiniciarFormulario() {
    this.currentStep = 1;
    this.eventoSeleccionado = null;
    this.horarioSeleccionado = '';
    this.horariosDisponibles = [];
    this.inicializarFormularios();
  }

  // Helper para fechas
  get fechaMinima(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  get fechaMaxima(): string {
    const tresMesesAdelante = new Date();
    tresMesesAdelante.setMonth(tresMesesAdelante.getMonth() + 3);
    return tresMesesAdelante.toISOString().split('T')[0];
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

      // 2. Generar número de reserva
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
        nombreCliente: `${personaCreada.nombre} ${personaCreada.apellido}`
      };

      console.log('💰 Creando reserva VIP con pago:', reservaVipRequest);

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
