import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { PersonasComponent } from './componentes/modulos/personas/personas.component';
import { UsuariosComponent } from './componentes/modulos/usuarios/usuarios.component';
import { ProductosComponent } from './componentes/modulos/productos/productos.component';
import { AuthGuard as authGuard } from './guards/auth-guard.guard';
import { PlatosComponent } from './componentes/modulos/platos/platos.component';
import { MenusComponent } from './componentes/modulos/menus/menus.component';
import { MesasComponent } from './componentes/modulos/mesas/mesas.component';
import { ReservasComponent } from './componentes/modulos/reservas/reservas.component';
import { PedidosComponent } from './componentes/modulos/pedidos/pedidos.component';
import { CocinaComponent } from './componentes/modulos/cocina/cocina.component';
import { MapaMesasComponent } from './componentes/modulos/mapa-mesas/mapa-mesas.component';
import { MpResultadoComponent } from './componentes/modulos/mp-resultado/mp-resultado.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Ruta de resultado de Mercado Pago (SIN PROTECCIÓN, SIN NAVBAR)
  { path: 'mp-resultado', component: MpResultadoComponent },

  // Rutas principales del menú (PROTEGIDAS)
  {
    path: 'personas',
    component: PersonasComponent,
    canActivate: [authGuard], // ← Agregar guard aquí
    data: {
      showInMenu: true,
      menuLabel: 'Personas',
      icon: '👥',
      order: 1,
      isPrincipal: true,
      hasSubmenu: true
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
      order: 2,
      isPrincipal: true
    }
  },

  // Rutas de Platos (PROTEGIDAS)
  {
    path: 'platos',
    component: PlatosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Platos',
      icon: '🍽️',
      order: 3,
      isPrincipal: true
    }
  },

  // Rutas de Menú (PROTEGIDAS)
  {
    path: 'menu',
    component: MenusComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Menú',
      icon: '📜',
      order: 4,
      isPrincipal: true
    }
  },

  // Rutas de Mesas (PROTEGIDAS)
  {
    path: 'mesas',
    component: MesasComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Mesas',
      icon: '🪑',
      order: 5,
      isPrincipal: true
    }
  },

    // Rutas de pedidos (PROTEGIDAS)
  {
    path: 'pedidos',
    component: PedidosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Pedidos',
      icon: '🧾',
      order: 6,
      isPrincipal: true,
      hasSubmenu: true
    }
  },

  // Subrutas de pedidos (PROTEGIDAS)
  {
    path: 'pedidos/listado',
    component: PedidosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      parentMenu: 'pedidos',
      menuLabel: 'Gestión de Pedidos'
    }
  },
  {
    path: 'pedidos/cocina',
    component: CocinaComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      parentMenu: 'pedidos',
      menuLabel: 'Cocina'
    }
  },
  {
    path: 'pedidos/mapa',
    component: MapaMesasComponent,
    canActivate: [authGuard], 
    data: {
      showInMenu: true,
      parentMenu: 'pedidos',
      menuLabel: 'Tomar Pedido'
    }
  },

  // Rutas de Reservas (PROTEGIDAS)
  {
    path: 'reservas',
    component: ReservasComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Reservas',
      icon: '📅',
      order: 6,
      isPrincipal: true
    }
  },

  // Ruta comodín para redireccionar a login si no existe la ruta
  { path: '**', redirectTo: '/login' }
];