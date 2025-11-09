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
