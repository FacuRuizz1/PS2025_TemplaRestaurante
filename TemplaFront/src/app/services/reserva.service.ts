import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReservaModel, PostReservaModel } from '../componentes/models/ReservaModel';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  // El backend define el controller con @RequestMapping("/api/reserva")
  // por eso la ruta base debe ser singular: '/reserva'
  private baseUrl = `${environment.apiUrl}/reserva`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Método helper para crear headers con token
  private getHttpOptions(params?: HttpParams): { headers: HttpHeaders; params?: HttpParams } {
    const token = this.authService.getToken();
    const options: any = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };

    if (params) {
      options.params = params;
    }

    return options;
  }

  crearReserva(reserva: PostReservaModel): Observable<ReservaModel> {
    return this.http.post<ReservaModel>(`${this.baseUrl}/crear`, reserva, this.getHttpOptions());
  }

  obtenerReservas(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.baseUrl}/listar`, this.getHttpOptions(params));
  }

  // Método para obtener reservas con filtros
  obtenerReservasConFiltros(filtros: { page: number; size: number; evento?: string; fecha?: string }): Observable<any> {
    let params = new HttpParams()
      .set('page', filtros.page.toString())
      .set('size', filtros.size.toString());

    console.log('🔧 ReservaService - Filtros recibidos:', filtros);

    // Manejar filtro de evento igual que en MesaService
    if (filtros.evento === 'TODOS') {
      params = params.set('evento', '');
      console.log('🎭 ReservaService - Filtro TODOS: enviando evento vacío');
    } else if (filtros.evento && filtros.evento !== 'TODOS') {
      params = params.set('evento', filtros.evento);
      console.log('🎭 ReservaService - Agregando filtro evento:', filtros.evento);
    }

    if (filtros.fecha && filtros.fecha !== '') {
      // Validar y formatear la fecha
      const fechaFormateada = this.formatearFechaParaBackend(filtros.fecha);
      if (fechaFormateada) {
        params = params.set('fecha', fechaFormateada);
        console.log('📅 ReservaService - Agregando filtro fecha formateada:', fechaFormateada);
      } else {
        console.warn('📅 ReservaService - Fecha inválida, no se incluye en filtros:', filtros.fecha);
      }
    }

    const url = `${this.baseUrl}/filtrar`;
    console.log('🚀 ReservaService - URL final:', url);
    console.log('📋 ReservaService - Parámetros finales:', params.toString());

    return this.http.get<any>(url, this.getHttpOptions(params));
  }

  private formatearFechaParaBackend(fecha: string): string | null {
    try {
      // Verificar si la fecha ya está en formato YYYY-MM-DD
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (fechaRegex.test(fecha)) {
        console.log('📅 Fecha ya está en formato correcto:', fecha);
        return fecha;
      }
      
      // Si no está en el formato correcto, intentar parsear y formatear
      const fechaParsed = new Date(fecha);
      if (isNaN(fechaParsed.getTime())) {
        console.error('📅 Fecha inválida:', fecha);
        return null;
      }
      
      // Formatear como YYYY-MM-DD
      const year = fechaParsed.getFullYear();
      const month = String(fechaParsed.getMonth() + 1).padStart(2, '0');
      const day = String(fechaParsed.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;
      
      console.log('📅 Fecha formateada de', fecha, 'a', fechaFormateada);
      return fechaFormateada;
    } catch (error) {
      console.error('📅 Error al formatear fecha:', error);
      return null;
    }
  }

  actualizarReserva(id: number, reserva: PostReservaModel): Observable<ReservaModel> {
    return this.http.put<ReservaModel>(`${this.baseUrl}/editar/${id}`, reserva, this.getHttpOptions());
  }

  eliminarReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/eliminar/${id}`, this.getHttpOptions());
  }
}