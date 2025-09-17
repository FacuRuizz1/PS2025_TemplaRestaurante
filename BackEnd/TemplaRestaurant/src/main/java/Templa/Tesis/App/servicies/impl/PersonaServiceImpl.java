package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostPersonaDto;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.servicies.IPersonaService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;


@Service
public class PersonaServiceImpl implements IPersonaService {
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private PersonaRepository personaRepository;

    @Override
    public Page<PersonaDto> traerPersonas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre","fechaAlta").ascending());
        Page<PersonaEntity> personas = personaRepository.findAll(pageable);

        return personas.map(entity -> modelMapper.map(entity, PersonaDto.class));
    }

    @Override
    public Page<PersonaDto> traerPersonas(int page, int size, String buscarFiltro, String tipoPersonaFiltro) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        Page<PersonaEntity> filtrados =personaRepository.findByFiltros(buscarFiltro,tipoPersonaFiltro,pageable);
        return filtrados.map(entity -> modelMapper.map(entity, PersonaDto.class));
    }

    @Override
    public PersonaDto insertarPersona(PostPersonaDto nuevaPersona) {
        if(nuevaPersona.getDni()==null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe Ingresar un DNI");
        }
        if(nuevaPersona.getEmail()==null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un EMAIL");

        }
        if(nuevaPersona.getNombre() == null || nuevaPersona.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        PersonaEntity existe = personaRepository.findByDni(nuevaPersona.getDni());

        if(existe!=null){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La Persona ya existe.");
        }

        try {

            PersonaEntity nuevo = modelMapper.map(nuevaPersona, PersonaEntity.class);
            nuevo.setFechaAlta(LocalDateTime.now());
            nuevo.setUserAltaId(nuevaPersona.getUserIngId()); //TODO: ver como obtener el usuario que realiza la baja
            PersonaEntity guardado = personaRepository.save(nuevo);
            return modelMapper.map(guardado, PersonaDto.class);

        }catch(Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la Persona");
        }

    }

    @Override
    public PersonaDto actualizarPersona(PersonaDto personaActualizada) {
        PersonaEntity existe = personaRepository.findByDni(personaActualizada.getDni());
        if(existe==null){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La Persona que desea modificar no existe.");
        }
        try {
            existe = modelMapper.map(personaActualizada, PersonaEntity.class);
            PersonaEntity guardado = personaRepository.save(existe);
            return modelMapper.map(guardado, PersonaDto.class);
        }catch(Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la Persona");
        }
    }

    @Override
    public void bajaPersona(Integer id) {
        PersonaEntity existe = personaRepository.findById(id).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,"No existe la Persona"));
        if(existe.getFechaBaja()!=null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La Persona ya se encuentra dada de baja");
        }
        try {
            existe.setFechaBaja(LocalDateTime.now());
            existe.setUserBajaId(1); //TODO: ver como obtener el usuario que realiza la baja
            personaRepository.save(existe);
        }
        catch(Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al dar de baja la Persona");
        }
    }
}
