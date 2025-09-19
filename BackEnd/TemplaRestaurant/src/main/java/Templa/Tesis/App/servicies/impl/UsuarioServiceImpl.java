package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.entities.UsuarioEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.repositories.UsuarioRepository;
import Templa.Tesis.App.servicies.UsuarioService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final ModelMapper modelMapper;


    @Override
    public UsuarioDTO crearUsuario(UsuarioCreateDTO usuarioCreateDTO) {
        // Verificar si el username ya existe
        if (usuarioRepository.existsByUsername(usuarioCreateDTO.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }

        // Buscar la persona asociada
        PersonaEntity persona = personaRepository.findById(usuarioCreateDTO.getPersonaId())
                .orElseThrow(() -> new EntityNotFoundException("Persona no encontrada con ID: " + usuarioCreateDTO.getPersonaId()));

        // Crear la entidad usuario
        UsuarioEntity usuario = UsuarioEntity.builder()
                .username(usuarioCreateDTO.getUsername())
                .password(usuarioCreateDTO.getPassword())
                .rolUsuario(usuarioCreateDTO.getRolUsuario())
                .activo(true) // Por defecto activo
                .persona(persona) // Asigno la entidad completa, no el ID
                .build();

        // Guardar en la base de datos
        UsuarioEntity usuarioGuardado = usuarioRepository.save(usuario);

        // Convertir a DTO y retornar
        return modelMapper.map(usuarioGuardado, UsuarioDTO.class);
    }

    @Override
    public UsuarioDTO actualizarUsuario(Integer id,UsuarioEntity usuarioEntity) {
        // Buscar el usuario existente
        UsuarioEntity usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + id));

        return null;
    }

    @Override
    public List<UsuarioDTO> listarUsuarios() {
        List<UsuarioEntity> usuarios = usuarioRepository.findAll();
        return usuarios.stream()
                .map(usuario -> modelMapper.map(usuario, UsuarioDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public void eliminarUsuario(Integer id) {
        if (!usuarioRepository.existsById(id)) {
            throw new EntityNotFoundException("Usuario no encontrado con ID: " + id);
        }

        usuarioRepository.deleteById(id);
    }


}
