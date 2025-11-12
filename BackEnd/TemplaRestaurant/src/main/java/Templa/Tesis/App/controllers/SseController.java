package Templa.Tesis.App.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Controlador para gestionar conexiones SSE (Server-Sent Events)
 * Permite notificaciones en tiempo real a clientes conectados
 */
@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
@Slf4j
public class SseController {

    // Almacenar emitters por tipo de notificación
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    // Timeout de 30 minutos para conexiones SSE
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L;

    /**
     * Endpoint para que los clientes se conecten y reciban notificaciones de cocina
     * Requiere token JWT como query parameter: ?token=xxx
     */
    @GetMapping(value = "/cocina", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeCocina() {
        return subscribe("cocina");
    }

    /**
     * Endpoint para que los clientes se conecten y reciban notificaciones de pedidos
     */
    @GetMapping(value = "/pedidos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribePedidos() {
        return subscribe("pedidos");
    }

    /**
     * Endpoint para que los clientes se conecten y reciban notificaciones de reservas
     */
    @GetMapping(value = "/reservas", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeReservas() {
        return subscribe("reservas");
    }

    /**
     * Endpoint de prueba sin autenticación para verificar que SSE funciona
     */
    @GetMapping(value = "/test", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter test() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        try {
            emitter.send(SseEmitter.event()
                    .name("test")
                    .data("Conexión SSE funcionando correctamente"));

            emitter.complete();
        } catch (IOException e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    /**
     * Método genérico para suscribirse a un tipo de notificación
     */
    private SseEmitter subscribe(String type) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        // Inicializar lista si no existe
        emitters.putIfAbsent(type, new CopyOnWriteArrayList<>());
        CopyOnWriteArrayList<SseEmitter> typeEmitters = emitters.get(type);

        // Agregar emitter a la lista
        typeEmitters.add(emitter);
        log.info("Cliente conectado a SSE tipo: {}. Total conexiones: {}", type, typeEmitters.size());

        // Enviar mensaje inicial de conexión exitosa
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Conectado a notificaciones de " + type));
        } catch (IOException e) {
            log.error("Error enviando mensaje inicial: {}", e.getMessage());
        }

        // Configurar callbacks
        emitter.onCompletion(() -> {
            typeEmitters.remove(emitter);
            log.info("Cliente desconectado de SSE tipo: {}. Total conexiones: {}", type, typeEmitters.size());
        });

        emitter.onTimeout(() -> {
            typeEmitters.remove(emitter);
            log.warn("Timeout de conexión SSE tipo: {}", type);
            emitter.complete();
        });

        emitter.onError((ex) -> {
            typeEmitters.remove(emitter);
            log.error("Error en conexión SSE tipo: {} - {}", type, ex.getMessage());
        });

        return emitter;
    }

    /**
     * Método público para enviar notificaciones a todos los clientes conectados de un tipo
     * Puede ser llamado desde servicios para notificar eventos
     */
    public void sendNotification(String type, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> typeEmitters = emitters.get(type);

        if (typeEmitters == null || typeEmitters.isEmpty()) {
            log.debug("No hay clientes conectados para tipo: {}", type);
            return;
        }

        log.info("Enviando notificación tipo: {} a {} clientes", type, typeEmitters.size());

        typeEmitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                log.error("Error enviando notificación: {}", e.getMessage());
                typeEmitters.remove(emitter);
                emitter.completeWithError(e);
            }
        });
    }

    /**
     * Endpoint para probar envío de notificaciones (solo para desarrollo/testing)
     */
    @PostMapping("/test/send/{type}")
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public void testSendNotification(@PathVariable String type, @RequestBody Map<String, Object> data) {
        sendNotification(type, "test", data);
    }
}

