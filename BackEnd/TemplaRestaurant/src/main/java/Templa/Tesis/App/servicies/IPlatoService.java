package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.GetPlatoDto;
import Templa.Tesis.App.dtos.PostPlatoDto;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface IPlatoService {
    Page<GetPlatoDto> getPlatos(int page, int size);
    Page<GetPlatoDto> getPlatos(String buscarFiltro,String tipoPlato ,String estado ,int page, int size);
    GetPlatoDto createPlato(PostPlatoDto platoNuevo, MultipartFile imagen);
    GetPlatoDto updatePlato(GetPlatoDto platoActualizar, MultipartFile imagen);
    void activarDesactivarPlato(Integer id);
    void bajaPlato(Integer id);
}
