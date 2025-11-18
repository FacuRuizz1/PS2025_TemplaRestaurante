package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.ReservaVipRequestDto;
import Templa.Tesis.App.dtos.ReservaVipResponseDto;
import Templa.Tesis.App.entities.DisponibilidadEntity;
import Templa.Tesis.App.entities.ReservaEntity;
import Templa.Tesis.App.Enums.EstadoReserva;
import Templa.Tesis.App.repositories.DisponibilidadRepository;
import Templa.Tesis.App.repositories.ReservaRepository;
import Templa.Tesis.App.servicies.IMercadoPagoService;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.preference.Preference;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.exceptions.MPApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoServiceImpl implements IMercadoPagoService {

    private final ReservaRepository reservaRepository;
    private final DisponibilidadRepository disponibilidadRepository;

    @Value("${mercadopago.access.token}")
    private String accessToken;

    @Value("${mercadopago.public.key}")
    private String publicKey;

    @Value("${reserva.vip.precio}")
    private BigDecimal precioReservaVip;

    @Override
    public ReservaVipResponseDto crearPreferenciaReservaVip(ReservaVipRequestDto request, Integer reservaId) {
        try {
            MercadoPagoConfig.setAccessToken(accessToken);

            PreferenceItemRequest itemRequest = PreferenceItemRequest.builder()
                    .title("Reserva VIP #" + request.getReservaData().getNroReserva())
                    .description("Reserva VIP para " + request.getReservaData().getCantidadComensales() + " comensales")
                    .quantity(1)
                    .currencyId("ARS")
                    .unitPrice(precioReservaVip)
                    .build();

            List<PreferenceItemRequest> items = new ArrayList<>();
            items.add(itemRequest);

            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success("http://localhost:4200/reservas?payment=success&reservaId=" + reservaId)
                    .failure("http://localhost:4200/reservas?payment=failure&reservaId=" + reservaId)
                    .pending("http://localhost:4200/reservas?payment=pending&reservaId=" + reservaId)
                    .build();

            PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                    .items(items)
                    .backUrls(backUrls)
                    .externalReference("reserva-vip-" + request.getReservaData().getNroReserva())
                    .notificationUrl("http://localhost:8081/api/mercadopago/webhook")
                    // Payer comentado para evitar conflictos con test users
                    // .payer(com.mercadopago.client.preference.PreferencePayerRequest.builder()
                    //         .email("TESTUSER6727133566695233081@testuser.com")
                    //         .build())
                    .binaryMode(true)
                    .build();

            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(preferenceRequest);

            log.info("Preferencia creada exitosamente: {}", preference.getId());

            ReservaVipResponseDto response = new ReservaVipResponseDto();
            response.setPreferenceId(preference.getId());
            response.setInitPoint(preference.getInitPoint());
            response.setSandboxInitPoint(preference.getSandboxInitPoint());
            response.setRequierePago(true);
            response.setMonto(precioReservaVip.doubleValue());

            return response;

        } catch (MPApiException e) {
            log.error("Error al crear preferencia de Mercado Pago para reserva VIP: ", e);
            log.error("Status code: {}", e.getStatusCode());
            log.error("API response content: {}", e.getApiResponse().getContent());
            log.error("API response headers: {}", e.getApiResponse().getHeaders());
            throw new RuntimeException("Error al procesar el pago de la reserva VIP", e);
        } catch (MPException e) {
            log.error("Error de configuración de Mercado Pago: ", e);
            throw new RuntimeException("Error de configuración del sistema de pagos", e);
        }
    }

    @Override
    @Transactional
    public void procesarPagoReserva(String paymentId) {
        try {
            MercadoPagoConfig.setAccessToken(accessToken);
            PaymentClient paymentClient = new PaymentClient();
            Payment payment = paymentClient.get(Long.parseLong(paymentId));

            log.info("Procesando pago {} con estado: {}", paymentId, payment.getStatus());

            String externalReference = payment.getExternalReference();
            if (externalReference != null && externalReference.startsWith("reserva-vip-")) {
                String nroReservaStr = externalReference.replace("reserva-vip-", "");
                int nroReserva = Integer.parseInt(nroReservaStr);

                ReservaEntity reserva = reservaRepository.findByNroReserva(nroReserva);
                if (reserva == null) {
                    throw new RuntimeException("Reserva no encontrada: " + nroReserva);
                }

                if ("approved".equals(payment.getStatus())) {
                    reserva.setPagoCompletado(true);
                    reserva.setEstadoReserva(EstadoReserva.CONFIRMADA);
                    reserva.setMercadoPagoPaymentId(paymentId);

                    // Actualizar cupos de disponibilidad
                    DisponibilidadEntity disponibilidad = reserva.getDisponibilidad();
                    int cuposOcupadosActuales = disponibilidad.getCuposOcupados();
                    disponibilidad.setCuposOcupados(cuposOcupadosActuales + reserva.getCantidadComensales());
                    disponibilidadRepository.save(disponibilidad);

                    reservaRepository.save(reserva);
                    log.info("Pago aprobado y reserva confirmada: {}", nroReserva);

                } else if ("rejected".equals(payment.getStatus()) || "cancelled".equals(payment.getStatus())) {
                    reserva.setEstadoReserva(EstadoReserva.CANCELADA);
                    reservaRepository.save(reserva);
                    log.info("Pago rechazado/cancelado - Reserva cancelada: {}", nroReserva);

                } else if ("pending".equals(payment.getStatus())) {
                    log.info("Pago pendiente para reserva: {}", nroReserva);
                }
            }

        } catch (MPException | MPApiException e) {
            log.error("Error al procesar pago de Mercado Pago: ", e);
            throw new RuntimeException("Error al verificar el estado del pago", e);
        }
    }

    @Override
    public String obtenerEstadoPago(String paymentId) {
        try {
            MercadoPagoConfig.setAccessToken(accessToken);
            PaymentClient paymentClient = new PaymentClient();
            Payment payment = paymentClient.get(Long.parseLong(paymentId));
            return payment.getStatus();
        } catch (MPException | MPApiException e) {
            log.error("Error al obtener estado del pago: ", e);
            throw new RuntimeException("Error al consultar el estado del pago", e);
        }
    }

    @Override
    @Transactional
    public void simularPagoAprobadoPorReserva(Integer reservaId, String fakePaymentId) {
        log.info("🧪 Simulando pago aprobado para reserva ID: {}", reservaId);

        ReservaEntity reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada: " + reservaId));

        if (reserva.getPagoCompletado() ) {
            log.warn("La reserva {} ya tiene el pago completado", reservaId);
            throw new RuntimeException("Esta reserva ya tiene el pago completado");
        }

        // Simular que el pago fue aprobado
        reserva.setPagoCompletado(true);
        reserva.setEstadoReserva(EstadoReserva.CONFIRMADA);
        reserva.setMercadoPagoPaymentId(fakePaymentId);

        // Actualizar cupos de disponibilidad
        DisponibilidadEntity disponibilidad = reserva.getDisponibilidad();
        int cuposOcupadosActuales = disponibilidad.getCuposOcupados();
        disponibilidad.setCuposOcupados(cuposOcupadosActuales + reserva.getCantidadComensales());
        disponibilidadRepository.save(disponibilidad);

        reservaRepository.save(reserva);
        log.info("✅ Pago simulado exitosamente - Reserva {} confirmada", reservaId);
    }
}
