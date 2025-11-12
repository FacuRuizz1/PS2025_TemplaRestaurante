import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoginRequest } from '../componentes/models/LoginRequest';
import {LoginResponse} from '../componentes/models/LoginResponse'
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8081/api/auth';
  private tokenKey = 'authToken';

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
        })
      );
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ✅ NUEVO: Decodificar el payload del JWT (sin validar la firma)
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  // ✅ NUEVO: Obtener información del usuario desde el token
  getUserInfo(): any {
    const token = this.getToken();
    if (!token) return null;
    
    const decoded = this.decodeToken(token);
    return decoded;
  }

  // ✅ NUEVO: Obtener el nombre de usuario desde el token
  getUsername(): string {
    const userInfo = this.getUserInfo();
    return userInfo?.sub || userInfo?.username || userInfo?.name || 'Usuario';
  }

  // Obtener el ID del usuario desde el token
  getUserId(): number | null {
    const userInfo = this.getUserInfo();
    return userInfo?.userId || userInfo?.id || userInfo?.sub || null;
  }

}
