package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.entities.UsuarioEntity;
import Templa.Tesis.App.repositories.UsuarioRepository;
import Templa.Tesis.App.servicies.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UsuarioDTO crearUsuario(UsuarioEntity usuarioEntity) {
        return null;
    }

    @Override
    public UsuarioDTO actualizarUsuario(UsuarioEntity usuarioEntity) {
        return null;
    }

    @Override
    public UsuarioDTO listarUsuarios() {
        return null;
    }

    @Override
    public void eliminarUsuario() {

    }
}
