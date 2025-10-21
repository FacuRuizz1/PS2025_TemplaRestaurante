import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // ✅ Colores de la paleta Templa
  private readonly colors = {
    primary: '#8B654C',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  // ✅ Mensaje de éxito genérico
  showSuccess(title: string, message?: string): Promise<any> {
    return Swal.fire({
      title: `🎉 ${title}`,
      text: message || 'Operación completada exitosamente',
      icon: 'success',
      confirmButtonText: '👍 OK',
      confirmButtonColor: this.colors.success,
      timer: 3000,
      timerProgressBar: true
    });
  }

  // ✅ Mensaje de error genérico
  showError(title: string, message?: string): Promise<any> {
    return Swal.fire({
      title: `❌ ${title}`,
      text: message || 'Ha ocurrido un error inesperado',
      icon: 'error',
      confirmButtonText: '😞 OK',
      confirmButtonColor: this.colors.error
    });
  }

  // ✅ Mensaje de confirmación
  showConfirmation(title: string, message: string, confirmText: string = 'Sí, continuar'): Promise<any> {
    return Swal.fire({
      title: `⚠️ ${title}`,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: this.colors.primary,
      cancelButtonColor: this.colors.error
    });
  }

  // ✅ Mensaje de información
  showInfo(title: string, message: string): Promise<any> {
    return Swal.fire({
      title: `ℹ️ ${title}`,
      text: message,
      icon: 'info',
      confirmButtonText: '👍 Entendido',
      confirmButtonColor: this.colors.info
    });
  }

  // ✅ Loading personalizado
  showLoading(title: string = 'Procesando...', message?: string): void {
    Swal.fire({
      title: `⏳ ${title}`,
      text: message || 'Por favor espere...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // ✅ Cerrar loading
  closeLoading(): void {
    Swal.close();
  }

  // ✅ Mensajes específicos para CRUD
  crud = {
    // Éxito
    created: (entity: string) => this.showSuccess('Creado', `${entity} creado exitosamente`),
    updated: (entity: string) => this.showSuccess('Actualizado', `${entity} actualizado exitosamente`),
    deleted: (entity: string) => this.showSuccess('Eliminado', `${entity} eliminado exitosamente`),
    statusChanged: (entity: string, newStatus: string) => 
      this.showSuccess('Estado Actualizado', `${entity} cambiado a: ${newStatus}`),

    // Errores
    createError: (entity: string) => this.showError('Error al Crear', `No se pudo crear ${entity}`),
    updateError: (entity: string) => this.showError('Error al Actualizar', `No se pudo actualizar ${entity}`),
    deleteError: (entity: string) => this.showError('Error al Eliminar', `No se pudo eliminar ${entity}`),
    loadError: (entity: string) => this.showError('Error de Carga', `No se pudieron cargar ${entity}`),

    // Confirmaciones
    confirmDelete: (entity: string, name?: string) => 
      this.showConfirmation(
        'Confirmar Eliminación', 
        `¿Está seguro que desea eliminar ${entity}${name ? ` "${name}"` : ''}?`,
        'Sí, eliminar'
      ),
    confirmStatusChange: (entity: string, newStatus: string) =>
      this.showConfirmation(
        'Confirmar Cambio de Estado',
        `¿Está seguro que desea cambiar el estado de ${entity} a "${newStatus}"?`,
        'Sí, cambiar'
      )
  };

  // ✅ Mensajes específicos para mesas
  mesa = {
    created: () => this.crud.created('la mesa'),
    updated: () => this.crud.updated('la mesa'),
    statusChanged: (newStatus: string) => this.crud.statusChanged('la mesa', newStatus),
    createError: () => this.crud.createError('la mesa'),
    updateError: () => this.crud.updateError('la mesa'),
    statusChangeError: () => this.showError('Error de Estado', 'No se pudo cambiar el estado de la mesa'),
    loadError: () => this.crud.loadError('las mesas')
  };

  // ✅ Mensajes específicos para platos
  plato = {
    created: () => this.crud.created('el plato'),
    updated: () => this.crud.updated('el plato'),
    statusChanged: (newStatus: string) => this.crud.statusChanged('el plato', newStatus),
    createError: () => this.crud.createError('el plato'),
    updateError: () => this.crud.updateError('el plato'),
    statusChangeError: () => this.showError('Error de Estado', 'No se pudo cambiar el estado del plato'),
    loadError: () => this.crud.loadError('los platos')
  };

  // ✅ Mensajes específicos para personas
  persona = {
    created: () => this.crud.created('la persona'),
    updated: () => this.crud.updated('la persona'),
    deleted: () => this.crud.deleted('la persona'),
    createError: () => this.crud.createError('la persona'),
    updateError: () => this.crud.updateError('la persona'),
    deleteError: () => this.crud.deleteError('la persona'),
    loadError: () => this.crud.loadError('las personas'),
    confirmDelete: (name: string) => this.crud.confirmDelete('la persona', name)
  };
}