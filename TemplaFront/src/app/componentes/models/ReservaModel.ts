import { EventoReserva } from './EventoReserva';

export interface ReservaModel {
  id?: number;
  idPersona: number;
  idMesa: number;
  idDisponibilidad: number;
  nroReserva: number;
  cantidadComensales: number;
  fechaReserva: string; // formato "yyyy-MM-dd"
  evento: EventoReserva;
  horario: string; // formato "HH:mm"
}

export interface PostReservaModel {
  idPersona: number;
  idMesa: number;
  idDisponibilidad: number;
  nroReserva: number;
  cantidadComensales: number;
  fechaReserva: string; // formato "yyyy-MM-dd"
  evento: EventoReserva;
  horario: string; // formato "HH:mm"
}