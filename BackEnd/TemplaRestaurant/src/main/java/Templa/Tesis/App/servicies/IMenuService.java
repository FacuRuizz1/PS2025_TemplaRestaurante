package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.GetMenuDTO;
import Templa.Tesis.App.dtos.PostMenuDTO;
import org.springframework.data.domain.Page;

public interface IMenuService {
    Page<GetMenuDTO> getMenus(int page, int size);
    Page<GetMenuDTO> getMenus(String buscarFiltro,String estado, int page, int size);
    GetMenuDTO createMenu(PostMenuDTO postMenuDTO);
    GetMenuDTO actualizarMenu(GetMenuDTO menuActualizar);
    void activarDesactivarMenu(Integer id);
    void bajaMenu(Integer id);
}
