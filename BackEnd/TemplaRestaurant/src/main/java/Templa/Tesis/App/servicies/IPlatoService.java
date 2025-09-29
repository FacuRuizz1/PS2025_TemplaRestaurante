package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.GetPlatoDto;
import Templa.Tesis.App.dtos.PostPlatoDto;
import org.springframework.data.domain.Page;

public interface IPlatoService {
    Page<GetPlatoDto> getPlatos(int page, int size);
    Page<GetPlatoDto> getPlatos(String buscarFiltro,String tipoPlato ,String estado ,int page, int size);
    GetPlatoDto createPlato(PostPlatoDto platoNuevo);
    GetPlatoDto updatePlato(GetPlatoDto platoActualizar);
    void activarDesactivarPlato(Integer id);
    void bajaPlato(Integer id);
}
