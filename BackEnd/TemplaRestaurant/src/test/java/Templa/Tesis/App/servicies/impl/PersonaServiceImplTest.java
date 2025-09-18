package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.TipoPersona;
import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostPersonaDto;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.modelmapper.ModelMapper;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
class PersonaServiceImplTest {
    @Spy
    private PersonaRepository personaRepository;
    @Spy
    private ModelMapper modelMapper;
    @InjectMocks
    private PersonaServiceImpl personaService;

    @DisplayName("Test para traer personas General Exitoso")
    @Test
    void traerPersonas() {
        Pageable pageable = PageRequest.of(0, 5, Sort.by("nombre", "fechaAlta").ascending());
        List<PersonaEntity> personaEntities = List.of(
                new PersonaEntity(Integer.valueOf(1), "John", "Doe", "john.doe@example.com", 123123,35461,  TipoPersona.CLIENTE,null, null,null,null),
                new PersonaEntity(Integer.valueOf(2), "Jane", "Smith", "jane.smith@example.com",123123,  35461, TipoPersona.EMPLEADO,null, null,null,null)
        );
        Page<PersonaEntity> personaPage = new PageImpl<>(personaEntities, pageable, personaEntities.size());

        when(personaRepository.findAll(pageable)).thenReturn(personaPage);

        Page<PersonaDto> result = personaService.traerPersonas(0, 5);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("John", result.getContent().get(0).getNombre());
        assertEquals("Jane", result.getContent().get(1).getNombre());
    }

    @Test
    void testTraerPersonasOrdenadasPorNombreYFechaAlta() {

        Page<PersonaEntity> emptyPage = Page.empty();
        when(personaRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

        personaService.traerPersonas(0, 10);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(personaRepository).findAll(captor.capture());

        Pageable pageableUsado = captor.getValue();
        Sort sort = pageableUsado.getSort();

        assertTrue(sort.stream().anyMatch(o -> o.getProperty().equals("nombre") && o.isAscending()));
        assertTrue(sort.stream().anyMatch(o -> o.getProperty().equals("fechaAlta") && o.isAscending()));
    }

    @Test
    void testTraerPersonas() {
    }

    @Test
    void insertarPersona() {
        PostPersonaDto nuevaP = new PostPersonaDto("Mateo","Moszoro","mateomosz@gmail.com",12313,43998130, TipoPersona.JEFE,1);
        PersonaEntity saved = new PersonaEntity(Integer.valueOf(1),"Mateo","Moszoro","mateomosz@gmail.com",12313,43998130, TipoPersona.JEFE,null,null,null,null);

        when(personaRepository.findByDni(nuevaP.getDni())).thenReturn(null);
        when(personaRepository.save(any(PersonaEntity.class))).thenReturn(saved);
        ArgumentCaptor<PersonaEntity> captor = ArgumentCaptor.forClass(PersonaEntity.class);


        PersonaDto resultado = personaService.insertarPersona(nuevaP);
        verify(personaRepository).save(captor.capture());

        verify(personaRepository).save(any(PersonaEntity.class));
        assertEquals(nuevaP.getDni(), resultado.getDni());
        assertEquals(nuevaP.getNombre(), resultado.getNombre());
        assertEquals(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES), captor.getValue().getFechaAlta().truncatedTo(ChronoUnit.MINUTES));
    }

    @Test
    void actualizarPersona() {
    }

    @Test
    void bajaPersona() {
        Integer id = 1;



    }
}