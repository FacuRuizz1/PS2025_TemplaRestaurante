package Templa.Tesis.App.servicies;

import Templa.Tesis.App.Enums.EstadoMesa;
import Templa.Tesis.App.dtos.GetMesaDto;
import Templa.Tesis.App.dtos.PostMesaDto;
import org.springframework.data.domain.Page;

public interface IMesasService {
    GetMesaDto createMesa(PostMesaDto postMesaDto);
    GetMesaDto updateMesa(GetMesaDto mesaDto);
    Page<GetMesaDto> getMesas(int page, int size);
    Page<GetMesaDto> getMesas(String buscarFiltro, String estadoMesa,int page, int size);
    GetMesaDto cambiarEstadoMesa(Integer id, EstadoMesa nuevoEstado);
    GetMesaDto getMesaById(Integer id);
}
