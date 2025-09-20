import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { PersonasComponent } from './componentes/modulos/personas/personas.component';

export const routes: Routes = [
     { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'personas', component: PersonasComponent },
  { path: '**', redirectTo: '/login' }
];
