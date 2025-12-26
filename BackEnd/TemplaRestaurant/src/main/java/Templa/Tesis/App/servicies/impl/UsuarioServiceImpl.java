package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.dtos.UsuarioUpdateDTO;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.entities.UsuarioEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.repositories.UsuarioRepository;
import Templa.Tesis.App.servicies.UsuarioService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;


    @Override
    public UsuarioDTO crearUsuario(UsuarioCreateDTO usuarioCreateDTO) {
        if (usuarioRepository.existsByUsername(usuarioCreateDTO.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }

        // Buscar persona por DNI (más confiable que por nombre)
        PersonaEntity persona = personaRepository.findByDni(usuarioCreateDTO.getPersonaDni());
        if(persona == null){
            throw new EntityNotFoundException("Persona no encontrada con el DNI: " + usuarioCreateDTO.getPersonaDni());
        }

        UsuarioEntity usuario = UsuarioEntity.builder()
                .username(usuarioCreateDTO.getUsername())
                .password(passwordEncoder.encode(usuarioCreateDTO.getPassword()))
                .rolUsuario(usuarioCreateDTO.getRolUsuario())
                .activo(true)
                .persona(persona) // ahora sí asignamos la persona
                .build();

        UsuarioEntity usuarioGuardado = usuarioRepository.save(usuario);

        String nombreCompleto = persona.getNombre() + " " + persona.getApellido();
        emailService.enviarMailNuevoUsuario(persona.getEmail(), nombreCompleto, usuarioCreateDTO.getUsername(), usuarioCreateDTO.getPassword());

        // Convertir a DTO
        UsuarioDTO dto = modelMapper.map(usuarioGuardado, UsuarioDTO.class);
        dto.setPersonaNombre(nombreCompleto);
        return dto;
    }


    @Override
    public UsuarioDTO actualizarUsuario(Integer id, UsuarioUpdateDTO usuarioUpdateDTO) {
        UsuarioEntity usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + id));

        // Validar si el nuevo username ya existe en OTRO usuario
        if (usuarioUpdateDTO.getUsername() != null &&
                !usuarioExistente.getUsername().equals(usuarioUpdateDTO.getUsername())) {

            if (usuarioRepository.existsByUsername(usuarioUpdateDTO.getUsername())) {
                throw new IllegalArgumentException("El nombre de usuario ya existe");
            }
            usuarioExistente.setUsername(usuarioUpdateDTO.getUsername());
        }

        // Encriptar la nueva contraseña si se proporciona
        if (usuarioUpdateDTO.getPassword() != null && !usuarioUpdateDTO.getPassword().isEmpty()) {
            usuarioExistente.setPassword(passwordEncoder.encode(usuarioUpdateDTO.getPassword()));
        }

        // Actualizar los demás campos
        if (usuarioUpdateDTO.getRolUsuario() != null) {
            usuarioExistente.setRolUsuario(usuarioUpdateDTO.getRolUsuario());
        }

        if (usuarioUpdateDTO.getActivo() != null) {
            usuarioExistente.setActivo(usuarioUpdateDTO.getActivo());
        }

        usuarioRepository.save(usuarioExistente);
        return modelMapper.map(usuarioExistente, UsuarioDTO.class);

    }

    @Override
    public List<UsuarioDTO> listarUsuarios() {
        List<UsuarioEntity> usuarios = usuarioRepository.findAll();
        return usuarios.stream()
                .map(usuario -> modelMapper.map(usuario, UsuarioDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Busca un usuario por su identificador único y lo devuelve como DTO.
     *
     * @param id el identificador único del usuario a buscar
     * @return el usuario encontrado convertido a UsuarioDTO
     * @throws RuntimeException si no existe un usuario con el ID proporcionado
     */
    @Override
    public UsuarioDTO buscarUsuarioPorId(Integer id) {
        UsuarioEntity usuario = usuarioRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Usuario no encontrado con el ID:" + id));

        return modelMapper.map(usuario,UsuarioDTO.class);
    }


    /**
     * Elimina un usuario del sistema por su identificador único.
     *
     * @param id el identificador único del usuario a eliminar
     * @throws EntityNotFoundException si no existe un usuario con el ID proporcionado
     */
    @Override
    public void eliminarUsuario(Integer id) {
        if (!usuarioRepository.existsById(id)) {
            throw new EntityNotFoundException("Usuario no encontrado con ID: " + id);
        }

        usuarioRepository.deleteById(id);
    }
}
