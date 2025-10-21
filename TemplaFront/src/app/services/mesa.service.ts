import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { EstadoMesa, GetMesaDto, PostMesaDto } from '../componentes/models/MesasModel';
import { Observable } from 'rxjs';
import { Page } from '../componentes/models/CommonModels';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/mesas`;


  // ✅ Método helper para crear headers con token
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

  getMesas(page: number = 0, size: number = 10): Observable<Page<GetMesaDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<GetMesaDto>>(`${this.apiUrl}/mesas`, this.getHttpOptions(params));
  }

  getMesasFiltradas(
    page: number = 0,
    size: number = 10,
    buscarFiltro?: string,
    estadoMesa?: string  
  ): Observable<Page<GetMesaDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (buscarFiltro && buscarFiltro.trim()) {
      params = params.set('buscarFiltro', buscarFiltro);
    }

    if (estadoMesa === 'TODOS') {
      params = params.set('estado', '');
    }
    else if (estadoMesa && estadoMesa !== 'TODOS') {
      params = params.set('estado', estadoMesa);
    }

    console.log('Parámetros de consulta mesas:', params.toString());

    return this.http.get<Page<GetMesaDto>>(`${this.apiUrl}/mesasFiltradas`, this.getHttpOptions(params));
  }

  createMesa(mesa: PostMesaDto): Observable<GetMesaDto> {
    return this.http.post<GetMesaDto>(`${this.apiUrl}/crear`, mesa, this.getHttpOptions());
  }

  updateMesa(mesa:GetMesaDto): Observable<GetMesaDto> {
    return this.http.put<GetMesaDto>(`${this.apiUrl}/actualizar`, mesa, this.getHttpOptions());
  }

  cambiarEstadoMesa(mesa: GetMesaDto): Observable<GetMesaDto> {
    return this.http.put<GetMesaDto>(`${this.apiUrl}/cambiarEstado`, {id: mesa.idMesa, nuevoEstado: mesa.estadoMesa}, this.getHttpOptions());
  }

}
