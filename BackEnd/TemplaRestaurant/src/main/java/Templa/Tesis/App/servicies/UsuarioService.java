package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.entities.UsuarioEntity;

public interface UsuarioService {
    UsuarioDTO crearUsuario (UsuarioEntity usuarioEntity);
    UsuarioDTO actualizarUsuario(UsuarioEntity usuarioEntity);
    UsuarioDTO listarUsuarios();
    void eliminarUsuario();
}
