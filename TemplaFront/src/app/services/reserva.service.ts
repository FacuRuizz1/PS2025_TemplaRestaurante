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

    if (filtros.evento && filtros.evento !== '') {
      params = params.set('evento', filtros.evento);
    }

    if (filtros.fecha && filtros.fecha !== '') {
      params = params.set('fecha', filtros.fecha);
    }

    return this.http.get<any>(`${this.baseUrl}/filtrar`, this.getHttpOptions(params));
  }

  actualizarReserva(id: number, reserva: PostReservaModel): Observable<ReservaModel> {
    return this.http.put<ReservaModel>(`${this.baseUrl}/editar/${id}`, reserva, this.getHttpOptions());
  }

  eliminarReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/eliminar/${id}`, this.getHttpOptions());
  }
}