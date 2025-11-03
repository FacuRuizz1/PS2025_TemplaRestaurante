import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReporteReservasDTO } from '../componentes/models/ReporteReservasDTO';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = `${environment.apiUrl}/reportes`;

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

  getFechasConcurridas(fechaInicio?: string, fechaFin?: string): Observable<ReporteReservasDTO[]> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return this.http.get<ReporteReservasDTO[]>(`${this.apiUrl}/fechas-concurridas`, this.getHttpOptions(params));
  }

  getHorariosConcurridos(fechaInicio?: string, fechaFin?: string): Observable<ReporteReservasDTO[]> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return this.http.get<ReporteReservasDTO[]>(`${this.apiUrl}/horarios-concurridos`, this.getHttpOptions(params));
  }
}