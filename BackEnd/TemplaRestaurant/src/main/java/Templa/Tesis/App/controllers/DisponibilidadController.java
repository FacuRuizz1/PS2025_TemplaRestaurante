package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.DisponibilidadDTO;
import Templa.Tesis.App.dtos.PostDisponibilidadDTO;
import Templa.Tesis.App.servicies.IDisponibilidadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disponibilidad")
@RequiredArgsConstructor
public class DisponibilidadController {

    private final IDisponibilidadService disponibilidadService;

    @PostMapping("/crear")
    public ResponseEntity<DisponibilidadDTO> crearDisponibilidad(@RequestBody PostDisponibilidadDTO postDisponibilidadDTO) {
        DisponibilidadDTO disponibilidadCreada = disponibilidadService.createDisponibilidad(postDisponibilidadDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(disponibilidadCreada);
    }

    @GetMapping("/listar")
    public ResponseEntity<List<DisponibilidadDTO>> listarDisponibilidades() {
        return ResponseEntity.ok(disponibilidadService.getAllDisponibilidades());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisponibilidadDTO> obtenerDisponibilidadPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(disponibilidadService.getDisponibilidadById(id));
    }

    @PutMapping("/editar/{id}")
    public ResponseEntity<DisponibilidadDTO> actualizarDisponibilidad(
            @PathVariable Integer id,
            @RequestBody PostDisponibilidadDTO postDisponibilidadDTO) {
        return ResponseEntity.ok(disponibilidadService.putDisponibilidad(id, postDisponibilidadDTO));
    }
}
