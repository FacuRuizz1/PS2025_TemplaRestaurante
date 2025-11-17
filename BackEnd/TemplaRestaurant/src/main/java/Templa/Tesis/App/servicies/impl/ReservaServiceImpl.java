package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.PostReservaDTO;
import Templa.Tesis.App.dtos.ReporteReservasDTO;
import Templa.Tesis.App.dtos.ReservaDTO;
import Templa.Tesis.App.entities.DisponibilidadEntity;
import Templa.Tesis.App.entities.MesaEntity;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.entities.ReservaEntity;
import Templa.Tesis.App.repositories.DisponibilidadRepository;
import Templa.Tesis.App.repositories.MesaRepository;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.repositories.ReservaRepository;
import Templa.Tesis.App.servicies.IReservaService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaServiceImpl implements IReservaService {

    private final ReservaRepository reservaRepository;
    private final ModelMapper modelMapper;
    private final MesaRepository mesaRepository;
    private final PersonaRepository personaRepository;
    private final DisponibilidadRepository disponibilidadRepository;

    @Override
    public ReservaDTO createReserva(PostReservaDTO postReservaDTO) {
        if (postReservaDTO.getNroReserva() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el numero de reserva");
        }
        if (postReservaDTO.getCantidadComensales() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar la cantidad de comensales");
        }
        if (postReservaDTO.getFechaReserva() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar la fecha de reserva");
        }
        if (postReservaDTO.getEvento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el tipo de evento");
        }
        if (postReservaDTO.getHorario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el horario de la reserva");
        }

        ReservaEntity reservaExiste = reservaRepository.findByNroReserva(postReservaDTO.getNroReserva());

        if (reservaExiste != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La Resera ya existe");
        }

        // BUSCAR LAS ENTIDADES RELACIONADAS
        PersonaEntity persona = personaRepository.findById(postReservaDTO.getIdPersona())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada"));


        DisponibilidadEntity disponibilidad = disponibilidadRepository.findById(postReservaDTO.getIdDisponibilidad())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Disponibilidad no encontrada"));

        // VERIFICAR CUPOS DISPONIBLES
        int cuposOcupados = disponibilidad.getCuposOcupados();
        int cuposMaximos = disponibilidad.getCuposMaximos();

        if (cuposOcupados + postReservaDTO.getCantidadComensales() > cuposMaximos) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay cupos disponibles para esta fecha");
        }

        // ACTUALIZAR CUPOS
        disponibilidad.setCuposOcupados(cuposOcupados + postReservaDTO.getCantidadComensales());
        disponibilidadRepository.save(disponibilidad);

        try {
            // Crear la entidad reserva manualmente
            ReservaEntity reserva = new ReservaEntity();
            reserva.setPersona(persona);  // Asignar entidad
            reserva.setDisponibilidad(disponibilidad); //Asignar entidad
            reserva.setNroReserva(postReservaDTO.getNroReserva());
            reserva.setCantidadComensales(postReservaDTO.getCantidadComensales());
            reserva.setFechaReserva(postReservaDTO.getFechaReserva());
            reserva.setEvento(postReservaDTO.getEvento());
            reserva.setHorario(postReservaDTO.getHorario());

            ReservaEntity reservaGuardada = reservaRepository.save(reserva);
            return ReservaDTO.builder()
                    .id(reservaGuardada.getId())
                    .idPersona(reservaGuardada.getPersona().getId())
                    .nombrePersona(reservaGuardada.getPersona().getNombre() + " " + reservaGuardada.getPersona().getApellido())
                    .idDisponibilidad(reservaGuardada.getDisponibilidad().getId())
                    .nroReserva(reservaGuardada.getNroReserva())
                    .cantidadComensales(reservaGuardada.getCantidadComensales())
                    .fechaReserva(reservaGuardada.getFechaReserva())
                    .evento(reservaGuardada.getEvento())
                    .horario(reservaGuardada.getHorario())
                    .build();

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la reserva");
        }

    }

    @Override
    public ReservaDTO actualizarReserva(Integer id, PostReservaDTO postReservaDTO) {
        ReservaEntity reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reserva no encontada con el ID: " + id));

        reserva.setNroReserva(postReservaDTO.getNroReserva());
        reserva.setCantidadComensales(postReservaDTO.getCantidadComensales());
        reserva.setHorario(postReservaDTO.getHorario());
        reserva.setEvento(postReservaDTO.getEvento());
        reserva.setFechaReserva(postReservaDTO.getFechaReserva());

        ReservaEntity reservaActualizada = reservaRepository.save(reserva);
        return modelMapper.map(reservaActualizada, ReservaDTO.class);
    }

    @Override
    public Page<ReservaDTO> traerReservas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id"));
        Page<ReservaEntity> reservas = reservaRepository.findAll(pageable);
        return reservas.map(reserva -> ReservaDTO.builder()
                .id(reserva.getId())
                .idPersona(reserva.getPersona().getId())
                .nombrePersona(reserva.getPersona().getNombre() + " " + reserva.getPersona().getApellido())
                .idDisponibilidad(reserva.getDisponibilidad().getId())
                .nroReserva(reserva.getNroReserva())
                .cantidadComensales(reserva.getCantidadComensales())
                .fechaReserva(reserva.getFechaReserva())
                .evento(reserva.getEvento())
                .horario(reserva.getHorario())
                .build());

    }

    @Override
    public Page<ReservaDTO> traerReservas(int page, int size, String evento, LocalDate fecha) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaReserva").descending());

        Specification<ReservaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (evento != null && !evento.isEmpty()) {
                predicates.add(cb.equal(root.get("evento"), evento));
            }

            if (fecha != null) {
                Class<?> fechaType = root.get("fechaReserva").getJavaType();
                if (fechaType.equals(java.time.LocalDate.class)) {
                    predicates.add(cb.equal(root.get("fechaReserva"), fecha));
                } else if (fechaType.equals(java.time.LocalDateTime.class)) {
                    java.time.LocalDateTime start = fecha.atStartOfDay();
                    java.time.LocalDateTime end = fecha.plusDays(1).atStartOfDay().minusNanos(1);
                    predicates.add(cb.between(root.get("fechaReserva"), start, end));
                } else {
                    // fallback: intentar comparar como texto (por si acaso)
                    predicates.add(cb.equal(cb.function("TO_CHAR", String.class, root.get("fechaReserva"), cb.literal("YYYY-MM-DD")), fecha.toString()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ReservaEntity> reservas = reservaRepository.findAll(spec, pageable);
        return reservas.map(entity -> modelMapper.map(entity, ReservaDTO.class));
    }


    @Override
    @Transactional
    public void eliminarReserva(Integer id) {
        // Buscar la reserva
        ReservaEntity reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reserva no encontrada"));

        // Obtener la disponibilidad asociada
        DisponibilidadEntity disponibilidad = reserva.getDisponibilidad();

        // Restar los cupos ocupados por esa reserva
        int nuevosCuposOcupados = disponibilidad.getCuposOcupados() - reserva.getCantidadComensales();

        // Evitar que queden valores negativos
        disponibilidad.setCuposOcupados(Math.max(nuevosCuposOcupados, 0));

        // Guardar la disponibilidad actualizada
        disponibilidadRepository.save(disponibilidad);

        // Eliminar la reserva
        reservaRepository.delete(reserva);
    }

    @Override
    public List<ReporteReservasDTO> getReporteFechasConcurridas(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null) fechaInicio = LocalDate.now().minusMonths(1);
        if (fechaFin == null) fechaFin = LocalDate.now();

        return reservaRepository.findReservasPorFecha(fechaInicio, fechaFin);
    }

    @Override
    public List<ReporteReservasDTO> getReporteHorariosConcurridos(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null) fechaInicio = LocalDate.now().minusMonths(1);
        if (fechaFin == null) fechaFin = LocalDate.now();

        return reservaRepository.findReservasPorHorario(fechaInicio, fechaFin);
    }
}

