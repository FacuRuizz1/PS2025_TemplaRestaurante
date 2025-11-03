package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.PostReservaDTO;
import Templa.Tesis.App.dtos.ReporteReservasDTO;
import Templa.Tesis.App.dtos.ReservaDTO;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

public interface IReservaService {
    ReservaDTO createReserva(PostReservaDTO postReservaDTO);
    ReservaDTO actualizarReserva(Integer id, PostReservaDTO postReservaDTO);
    Page<ReservaDTO> traerReservas(int page, int size);
    Page<ReservaDTO> traerReservas(int page, int size, String evento, LocalDate fecha);
    void eliminarReserva(Integer id);

    List<ReporteReservasDTO> getReporteFechasConcurridas(LocalDate fechaInicio, LocalDate fechaFin);
    List<ReporteReservasDTO> getReporteHorariosConcurridos(LocalDate fechaInicio, LocalDate fechaFin);
}
