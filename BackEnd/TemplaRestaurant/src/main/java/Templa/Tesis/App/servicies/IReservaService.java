package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.PostReservaDTO;
import Templa.Tesis.App.dtos.ReservaDTO;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface IReservaService {
    ReservaDTO createReserva(PostReservaDTO postReservaDTO);
    ReservaDTO actualizarReserva(Integer id, PostReservaDTO postReservaDTO);
    Page<ReservaDTO> traerReservas(int page, int size);
    Page<ReservaDTO> traerReservas(int page, int size, String evento, LocalDate fecha);
    void eliminarReserva(Integer id);
}
