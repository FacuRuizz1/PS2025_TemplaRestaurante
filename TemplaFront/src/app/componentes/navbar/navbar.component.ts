import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from '../models/menu-model';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  username = 'ChefAna';
  notificationCount = 3;
  isExpanded = false;
  menuItems: MenuItem[] = [];
  expandedSubmenu: string | null = null;

  @Output() navbarToggled = new EventEmitter<boolean>();

  constructor(
    private router: Router,
    private menuService: MenuService
  ) { }

  // ✅ CORREGIR: Getter para módulos principales (CON y SIN submenu)
  get modulosPrincipales(): MenuItem[] {
    return this.menuItems.filter(item => item.isPrincipal); // ← QUITAR && !item.hasSubmenu
  }

  // ✅ CORREGIR: Getter para módulos principales CON submenu
  get modulosPrincipalesConSubmenu(): MenuItem[] {
    return this.menuItems.filter(item => item.isPrincipal && item.hasSubmenu);
  }

  // ✅ MANTENER: Getter para módulos secundarios  
  get modulosSecundarios(): MenuItem[] {
    return this.menuItems.filter(item => !item.isPrincipal);
  }

  ngOnInit() {
    this.loadMenu();
    this.resetNavbarState();
  }

  private resetNavbarState() {
    this.isExpanded = false;
    this.expandedSubmenu = null;
    this.navbarToggled.emit(false);
  }

  private loadMenu() {
    this.menuService.getMenuItems().subscribe(items => {
      this.menuItems = items;
      console.log('Menú generado automáticamente:', this.menuItems);
    });
  }

  toggleNavbar() {
    this.isExpanded = !this.isExpanded;
    this.navbarToggled.emit(this.isExpanded); // ✅ Esto emite un boolean
    if (!this.isExpanded) {
      this.expandedSubmenu = null;
    }
  }

  getSubmenuIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      'Empleados': '📋',
      'Usuarios': '👤',
      'Listado': '📋', 
      'Usuarios Sistema': '🔧',
      'Reportes': '📊',
      'Configuración': '⚙️'
    };
    
    return iconMap[label] || '📄';
  }

  toggleSubmenu(itemId: string) {
    if (this.expandedSubmenu === itemId) {
      this.expandedSubmenu = null;
    } else {
      this.expandedSubmenu = itemId;
    }
  }

  logout() {
    console.log('Logout clicked');
    this.router.navigate(['/login']);
  }

  showNotifications() {
    console.log('Mostrar notificaciones');
  }
}
