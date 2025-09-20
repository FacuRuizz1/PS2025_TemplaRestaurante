import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './componentes/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'TemplaFront';
  showNavbar = false;

  constructor(private router: Router) {
    // Inicializar showNavbar basado en la ruta actual
    this.checkCurrentRoute();
  }

  ngOnInit() {
    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateNavbarVisibility(event.url);
      });
  }

  private checkCurrentRoute() {
    // Verificar la ruta actual al inicializar
    const currentUrl = this.router.url;
    this.updateNavbarVisibility(currentUrl);
  }

  private updateNavbarVisibility(url: string) {
    // Rutas donde NO debe aparecer el navbar
    const hiddenNavbarRoutes = ['/login', '/'];
    this.showNavbar = !hiddenNavbarRoutes.some(route => 
      url === route || url.startsWith(route + '?') || url.startsWith(route + '#')
    );
  }
}
