package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.entities.UsuarioEntity;

import java.util.List;

public interface UsuarioService {
    UsuarioDTO crearUsuario (UsuarioCreateDTO usuarioCreateDTO);
    UsuarioDTO actualizarUsuario(Integer id,UsuarioEntity usuarioEntity);
    List<UsuarioDTO> listarUsuarios();
    void eliminarUsuario(Integer id);
}
