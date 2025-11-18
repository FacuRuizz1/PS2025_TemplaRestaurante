package Templa.Tesis.App.controllers;

import Templa.Tesis.App.servicies.IMercadoPagoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mercadopago")
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoController {
    private final IMercadoPagoService mercadoPagoService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhookReserva(@RequestBody Map<String, Object> payload) {
        try {
            log.info("Webhook recibido: {}", payload);

            String type = (String) payload.get("type");

            if ("payment".equals(type)) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                String paymentId = data.get("id").toString();

                mercadoPagoService.procesarPagoReserva(paymentId);
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error en webhook: ", e);
            return ResponseEntity.ok().build(); // Siempre 200 OK
        }
    }

    @GetMapping("/estado-pago/{paymentId}")
    public ResponseEntity<Map<String, String>> obtenerEstadoPago(
            @PathVariable String paymentId) {
        String estado = mercadoPagoService.obtenerEstadoPago(paymentId);
        return ResponseEntity.ok(Map.of("estado", estado));
    }
}
