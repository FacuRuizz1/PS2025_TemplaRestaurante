import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  username = 'ChefAna';
  notificationCount = 3;

  constructor(private router: Router) { }

  logout() {
    console.log('Logout clicked');
    this.router.navigate(['/login']);
  }

  showNotifications() {
    console.log('Mostrar notificaciones');
  }
}
