import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { PersonasComponent } from './componentes/modulos/personas/personas.component';
import { UsuariosComponent } from './componentes/modulos/usuarios/usuarios.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Rutas principales del menú
  { 
    path: 'personas', 
    component: PersonasComponent,
    data: { 
      showInMenu: true, 
      menuLabel: 'Personas', 
      icon: '👥',
      order: 1
    }
  },
  
  // Subrutas de personas
  { 
    path: 'personas/listado', 
    component: PersonasComponent, // Cambiar por EmpleadosComponent cuando lo tengas
    data: { 
      showInMenu: true, 
      parentMenu: 'personas',
      menuLabel: 'Empleados'
    }
  },
  { 
    path: 'personas/usuarios', 
    component: UsuariosComponent, // Cambiar por UsuariosComponent cuando lo tengas
    data: { 
      showInMenu: true, 
      parentMenu: 'personas',
      menuLabel: 'Usuarios'
    }
  }
];
