import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificacionDTO {
  tipo: string;
  mensaje: string;
  datos?: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private connected = false;
  
  // Subject para las notificaciones
  private notificationsSubject = new BehaviorSubject<NotificacionDTO[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  // Subject para el contador de notificaciones no leídas
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Por ahora, simularemos las notificaciones hasta que instalemos las dependencias WebSocket
    this.initializeMockNotifications();
  }

  private initializeMockNotifications(): void {
    // Simular algunas notificaciones para probar la UI
    setTimeout(() => {
      this.addNotification({
        tipo: 'NUEVO_PRODUCTO',
        mensaje: 'Sistema de notificaciones inicializado correctamente',
        timestamp: new Date().toISOString()
      });
    }, 2000);
  }

  // Método para simular la llegada de una notificación (útil para testing)
  public simulateNotification(notification: NotificacionDTO): void {
    this.addNotification(notification);
  }

  // Método para agregar notificación desde el exterior (cuando se crea un producto)
  public addProductNotification(tipo: 'NUEVO_PRODUCTO' | 'PRODUCTO_ACTUALIZADO' | 'PRODUCTO_ELIMINADO', mensaje: string, datos?: any): void {
    this.addNotification({
      tipo,
      mensaje,
      datos,
      timestamp: new Date().toISOString()
    });
  }

  private addNotification(notification: NotificacionDTO): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    
    // Mantener solo las últimas 10 notificaciones
    if (updatedNotifications.length > 10) {
      updatedNotifications.splice(10);
    }
    
    this.notificationsSubject.next(updatedNotifications);
    
    // Incrementar contador de no leídas
    const currentCount = this.unreadCountSubject.value;
    this.unreadCountSubject.next(currentCount + 1);
  }

  // Método para marcar notificaciones como leídas
  markAsRead(): void {
    this.unreadCountSubject.next(0);
  }

  // Método para limpiar todas las notificaciones
  clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  // Método para enviar una notificación de prueba
  sendTestNotification(): void {
    this.addNotification({
      tipo: 'TEST',
      mensaje: 'Esta es una notificación de prueba',
      timestamp: new Date().toISOString()
    });
  }

  // Limpiar recursos al destruir el servicio
  disconnect(): void {
    console.log('Desconectando servicio de notificaciones...');
  }

  // Getter para saber si está conectado
  isConnected(): boolean {
    return this.connected;
  }
}