import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DisponibilidadModel, PostDisponibilidadModel } from '../componentes/models/DisponibilidadModel';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  private baseUrl = `${environment.apiUrl}/disponibilidad`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Método helper para crear headers con token
  private getHttpOptions(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  crearDisponibilidad(disponibilidad: PostDisponibilidadModel): Observable<DisponibilidadModel> {
    return this.http.post<DisponibilidadModel>(this.baseUrl, disponibilidad, this.getHttpOptions());
  }

  obtenerTodasLasDisponibilidades(): Observable<DisponibilidadModel[]> {
    return this.http.get<DisponibilidadModel[]>(this.baseUrl, this.getHttpOptions());
  }

  obtenerDisponibilidadPorId(id: number): Observable<DisponibilidadModel> {
    return this.http.get<DisponibilidadModel>(`${this.baseUrl}/${id}`, this.getHttpOptions());
  }

  actualizarDisponibilidad(id: number, disponibilidad: PostDisponibilidadModel): Observable<DisponibilidadModel> {
    return this.http.put<DisponibilidadModel>(`${this.baseUrl}/${id}`, disponibilidad, this.getHttpOptions());
  }
}