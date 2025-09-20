import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuService } from '../servicies/MenuService';
import { MenuItem } from '../models/menu-model';

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

  ngOnInit() {
    this.loadMenu();
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
