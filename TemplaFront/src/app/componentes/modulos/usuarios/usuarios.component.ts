import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioDTO } from '../../models/UsuarioDTO';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  usuarios: UsuarioDTO[] = [];
  usuariosFiltrados: UsuarioDTO[] = [];
  filtro: string = '';
  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalItems: number = 0;
  cargando: boolean = false;
  error: string = '';

  // Filtros
  filtroEstado: string = 'ACTIVOS';
  filtroRol: string = 'TODOS';
Math: any;

  constructor(
    private usuarioService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';

    this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.totalItems = usuarios.length;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los usuarios';
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  aplicarFiltros(): void {
    let usuariosFiltrados = this.usuarios;

    // Filtro por texto
    if (this.filtro) {
      const filtroLower = this.filtro.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.username.toLowerCase().includes(filtroLower) ||
        usuario.rolUsuario.toLowerCase().includes(filtroLower)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'TODOS') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        this.filtroEstado === 'ACTIVOS' ? usuario.activo : !usuario.activo
      );
    }

    // Filtro por rol
    if (this.filtroRol !== 'TODOS') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.rolUsuario === this.filtroRol
      );
    }

    this.usuariosFiltrados = usuariosFiltrados;
    this.totalItems = usuariosFiltrados.length;
    this.paginaActual = 1; // Resetear a primera página
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  get usuariosPaginados(): UsuarioDTO[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.usuariosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalItems / this.itemsPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarFiltroEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  cambiarFiltroRol(rol: string): void {
    this.filtroRol = rol;
    this.aplicarFiltros();
  }

  editarUsuario(usuario: UsuarioDTO): void {
    this.router.navigate(['/usuarios/editar', usuario.id]);
  }

  eliminarUsuario(usuario: UsuarioDTO): void {
    if (confirm(`¿Estás seguro de eliminar al usuario ${usuario.username}?`)) {
      this.usuarioService.eliminarUsuario(usuario.id!).subscribe({
        next: () => {
          this.cargarUsuarios(); // Recargar la lista
        },
        error: (error) => {
          this.error = 'Error al eliminar el usuario';
          console.error('Error:', error);
        }
      });
    }
  }

  nuevoUsuario(): void {
    this.router.navigate(['/usuarios/crear']);
  }

  getBadgeClassRol(rol: string): string {
  switch (rol) {
    case 'ADMINISTRADOR': return 'badge badge-administrador'; 
    case 'MOZO': return 'badge badge-mozo'; 
    case 'COCINA': return 'badge badge-cocina'; 
    default: return 'badge badge-baja'; // fallback si el rol no coincide
  }
}


}
