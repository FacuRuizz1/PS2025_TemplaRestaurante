import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { PersonasComponent } from './componentes/modulos/personas/personas.component';
import { UsuariosComponent } from './componentes/modulos/usuarios/usuarios.component';
import { ProductosComponent } from './componentes/modulos/productos/productos.component';
import { AuthGuard as authGuard } from './guards/auth-guard.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Rutas principales del menú (PROTEGIDAS)
  { 
    path: 'personas', 
    component: PersonasComponent,
    canActivate: [authGuard], // ← Agregar guard aquí
    data: { 
      showInMenu: true, 
      menuLabel: 'Personas', 
      icon: '👥',
      order: 1
    }
  },
  
  // Subrutas de personas (PROTEGIDAS)
  { 
    path: 'personas/listado', 
    component: PersonasComponent,
    canActivate: [authGuard], // ← Agregar guard aquí
    data: { 
      showInMenu: true, 
      parentMenu: 'personas',
      menuLabel: 'Empleados'
    }
  },
  { 
    path: 'personas/usuarios', 
    component: UsuariosComponent,
    canActivate: [authGuard], // ← Agregar guard aquí
    data: { 
      showInMenu: true, 
      parentMenu: 'personas',
      menuLabel: 'Usuarios'
    }
  },

  // Rutas de productos (PROTEGIDAS)
  { 
    path: 'productos', 
    component: ProductosComponent,
    canActivate: [authGuard],
    data: { 
      showInMenu: true, 
      menuLabel: 'Productos', 
      icon: '📦',
      order: 2
    }
  },

  // Ruta comodín para redireccionar a login si no existe la ruta
  { path: '**', redirectTo: '/login' }
];