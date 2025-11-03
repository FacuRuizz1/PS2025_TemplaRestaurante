package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.NotificacionDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void enviarNotificacionNuevoProducto(ProductoDTO productoDTO) {
        try {
            NotificacionDTO notificacion = NotificacionDTO.builder()
                    .tipo("NUEVO_PRODUCTO")
                    .mensaje("Se ha registrado un nuevo producto: " + productoDTO.getNombre())
                    .datos(productoDTO)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Envía la notificación a todos los clientes suscritos al topic
            messagingTemplate.convertAndSend("/topic/productos", notificacion);

            log.info("Notificación enviada para el nuevo producto: {}", productoDTO.getNombre());
        } catch (Exception e) {
            log.error("Error al enviar notificación para producto: {}", productoDTO.getNombre(), e);
        }
    }

    public void enviarNotificacionProductoActualizado(ProductoDTO productoDTO) {
        try {
            NotificacionDTO notificacion = NotificacionDTO.builder()
                    .tipo("PRODUCTO_ACTUALIZADO")
                    .mensaje("Se ha actualizado el producto: " + productoDTO.getNombre())
                    .datos(productoDTO)
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/productos", notificacion);

            log.info("Notificación enviada para producto actualizado: {}", productoDTO.getNombre());
        } catch (Exception e) {
            log.error("Error al enviar notificación para producto actualizado: {}", productoDTO.getNombre(), e);
        }
    }

    public void enviarNotificacionProductoEliminado(String nombreProducto) {
        try {
            NotificacionDTO notificacion = NotificacionDTO.builder()
                    .tipo("PRODUCTO_ELIMINADO")
                    .mensaje("Se ha eliminado el producto: " + nombreProducto)
                    .datos(null)
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/productos", notificacion);

            log.info("Notificación enviada para producto eliminado: {}", nombreProducto);
        } catch (Exception e) {
            log.error("Error al enviar notificación para producto eliminado: {}", nombreProducto, e);
        }
    }

    public void enviarAlertaStockBajo(ProductoDTO productoDTO) {
        try {
            NotificacionDTO notificacion = NotificacionDTO.builder()
                    .tipo("STOCK_BAJO")
                    .mensaje(String.format("ALERTA: Stock bajo para el producto '%s'. Stock actual: %d, Stock mínimo: %d",
                            productoDTO.getNombre(),
                            productoDTO.getStockActual(),
                            productoDTO.getStockMinimo()))
                    .datos(productoDTO)
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/alertas-stock", notificacion);

            log.warn("Alerta de stock bajo enviada para producto: {}", productoDTO.getNombre());
        } catch (Exception e) {
            log.error("Error al enviar alerta de stock bajo para producto: {}", productoDTO.getNombre(), e);
        }
    }

}
