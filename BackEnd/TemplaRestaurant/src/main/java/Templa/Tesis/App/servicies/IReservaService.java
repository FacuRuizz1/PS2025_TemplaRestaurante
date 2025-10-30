package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.PostReservaDTO;
import Templa.Tesis.App.dtos.ReservaDTO;
import org.springframework.data.domain.Page;

public interface IReservaService {
    ReservaDTO createReserva(PostReservaDTO postReservaDTO);
    ReservaDTO actualizarReserva(Integer id, PostReservaDTO postReservaDTO);
    Page<ReservaDTO> traerReservas(int page, int size);
    void eliminarReserva(Integer id);
}
