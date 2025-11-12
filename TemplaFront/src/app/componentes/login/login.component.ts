import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {FormsModule,ReactiveFormsModule} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../models/LoginRequest';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(public authService: AuthService,private router: Router) { }
  
  // ✅ TEST: Función para verificar getUserId después del login
  public testUserIdAfterLogin() {
    console.log('=== TEST getUserId() después del login ===');
    
    const token = this.authService.getToken();
    console.log('🔍 Token existe:', !!token);
    
    const userInfo = this.authService.getUserInfo();
    console.log('🔍 UserInfo:', userInfo);
    
    const userId = this.authService.getUserId();
    console.log('🔍 getUserId() resultado:', userId, `(${typeof userId})`);
    
    const username = this.authService.getUsername();
    console.log('🔍 getUsername() resultado:', username);
    
    if (userId === null) {
      console.error('❌ PROBLEMA: getUserId() retorna null');
      console.log('💡 SOLUCIÓN: El backend debe incluir un campo de ID numérico en el JWT');
      console.log('💡 Campos sugeridos: "userId", "id", "idUsuario"');
    } else {
      console.log('✅ SUCCESS: getUserId() funciona correctamente');
    }
    
    console.log('=== FIN TEST ===');
  }

  login() {
    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = {
      username: this.username,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        // ✅ TEST: Verificar getUserId después del login exitoso
        this.testUserIdAfterLogin();
        this.router.navigate(['/personas']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidas. Por favor, intente nuevamente.';
        console.error('Login error:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }}
