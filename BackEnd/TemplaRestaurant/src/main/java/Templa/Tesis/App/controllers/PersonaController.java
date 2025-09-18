package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostPersonaDto;
import Templa.Tesis.App.servicies.IPersonaService;
import Templa.Tesis.App.servicies.impl.PersonaServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/persona")
@RequiredArgsConstructor
public class PersonaController {

    private final IPersonaService personaService;

    @GetMapping
    public ResponseEntity<Page<PersonaDto>> listarPersonas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(personaService.traerPersonas(page, size));
    }

    @GetMapping("/buscar")
    public ResponseEntity<Page<PersonaDto>> listarPersonasConFiltros(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) String tipoPersona) {
        return ResponseEntity.ok(personaService.traerPersonas(page, size, busqueda, tipoPersona));
    }

    @PostMapping("/crear")
    public ResponseEntity<PersonaDto> crearPersona(@RequestBody PostPersonaDto nuevaPersona) {
        return ResponseEntity.ok(personaService.insertarPersona(nuevaPersona));
    }

    @PutMapping("/actualizar")
    public ResponseEntity<PersonaDto> actualizarPersona(@RequestBody PersonaDto nuevaPersona) {
        return ResponseEntity.ok(personaService.actualizarPersona(nuevaPersona));
    }

    @DeleteMapping("/baja/{id}")
    public ResponseEntity<Void> bajaPersona(@PathVariable Integer id) {
        try{
            personaService.bajaPersona(id);
            return ResponseEntity.ok().build();
        } catch (Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al dar de baja la Persona");
        }
    }
}
