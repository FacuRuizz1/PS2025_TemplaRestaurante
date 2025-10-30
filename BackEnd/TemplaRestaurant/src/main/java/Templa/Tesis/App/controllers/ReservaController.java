package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.PostReservaDTO;
import Templa.Tesis.App.dtos.ReservaDTO;
import Templa.Tesis.App.servicies.IReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reserva")
@RequiredArgsConstructor
public class ReservaController {

   private final IReservaService reservaService;

   @PostMapping("/crear")
    public ResponseEntity<ReservaDTO> registrarReserva(@RequestBody PostReservaDTO postReservaDTO){
       return ResponseEntity.ok(reservaService.createReserva(postReservaDTO));
   }

   @GetMapping("/listar")
   public ResponseEntity<Page<ReservaDTO>> listarReservas(
           @RequestParam(defaultValue = "0") int page,
           @RequestParam(defaultValue = "10") int size) {
      return ResponseEntity.ok(reservaService.traerReservas(page, size));
   }

   @PutMapping("/editar/{id}")
   public ResponseEntity<ReservaDTO> actualizarReserva(@PathVariable Integer id,
                                                       @RequestBody PostReservaDTO postReservaDTO){
      return ResponseEntity.ok(reservaService.actualizarReserva(id, postReservaDTO));
   }

   @DeleteMapping("/eliminar/{id}")
   public ResponseEntity<Void> eliminarReserva(@PathVariable Integer id){
      reservaService.eliminarReserva(id);
      return ResponseEntity.ok().build();
   }

}
