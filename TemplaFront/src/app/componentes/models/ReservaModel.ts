import { EventoReserva } from './EventoReserva';

export interface ReservaModel {
  id?: number;
  idPersona: number;
  idDisponibilidad: number;
  nroReserva: number;
  cantidadComensales: number;
  fechaReserva: string; // formato "yyyy-MM-dd"
  evento: EventoReserva;
  horario: string; // formato "HH:mm"
  // Campo que viene del backend con el nombre completo de la persona
  nombrePersona?: string;
  // Datos opcionales del cliente (cuando estén disponibles)
  nombreCliente?: string;
  apellidoCliente?: string;
}

export interface PostReservaModel {
  idPersona: number;
  idDisponibilidad: number;
  nroReserva: number;
  cantidadComensales: number;
  fechaReserva: string; // formato "yyyy-MM-dd"
  evento: EventoReserva;
  horario: string; // formato "HH:mm"
}