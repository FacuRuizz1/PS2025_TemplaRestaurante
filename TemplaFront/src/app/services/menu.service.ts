import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MenuItem, RouteMenuData } from '../componentes/models/menu-model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private router: Router) { }

  getMenuItems(): Observable<MenuItem[]> {
    const menuItems = this.generateMenuFromRoutes();
    return of(menuItems);
  }

  private generateMenuFromRoutes(): MenuItem[] {
    const routes = this.router.config;
    const menuMap = new Map<string, MenuItem>();
    
    // Filtrar rutas que deben aparecer en el menú
    const menuRoutes = routes.filter(route => {
      const data = route.data as RouteMenuData;
      return data?.showInMenu && route.path && route.path !== '';
    });

    // Procesar rutas principales (sin parentMenu)
    menuRoutes
      .filter(route => !(route.data as RouteMenuData)?.parentMenu)
      .forEach(route => {
        const data = route.data as RouteMenuData;
        const menuItem: MenuItem = {
          id: route.path!,
          icon: data.icon || '📄',
          label: data.menuLabel || route.path!,
          route: `/${route.path}`,
          hasSubmenu: false,
          submenu: []
        };
        menuMap.set(route.path!, menuItem);
      });

    // Procesar subrutas (con parentMenu)
    menuRoutes
      .filter(route => (route.data as RouteMenuData)?.parentMenu)
      .forEach(route => {
        const data = route.data as RouteMenuData;
        const parentPath = data.parentMenu!;
        const parentItem = menuMap.get(parentPath);
        
        if (parentItem) {
          parentItem.hasSubmenu = true;
          parentItem.submenu!.push({
            label: data.menuLabel || route.path!.split('/').pop() || '',
            route: `/${route.path}`
          });
        }
      });

    // Convertir map a array y ordenar
    const menuArray = Array.from(menuMap.values());
    return menuArray.sort((a, b) => {
      const orderA = this.getRouteOrder(a.id);
      const orderB = this.getRouteOrder(b.id);
      return orderA - orderB;
    });
  }

  private getRouteOrder(path: string): number {
    const route = this.router.config.find(r => r.path === path);
    const data = route?.data as RouteMenuData;
    return data?.order || 999;
  }
}
