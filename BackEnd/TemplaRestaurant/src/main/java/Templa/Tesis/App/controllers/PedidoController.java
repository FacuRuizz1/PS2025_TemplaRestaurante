package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.PedidoDTO;
import Templa.Tesis.App.dtos.PostPedidoDTO;
import Templa.Tesis.App.servicies.IPedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pedido")
@RequiredArgsConstructor
public class PedidoController {

    private final IPedidoService pedidoService;

    @PostMapping("/crear")
    public ResponseEntity<PedidoDTO> registrarPedido(@RequestBody PostPedidoDTO postPedidoDTO){
        return ResponseEntity.ok(pedidoService.crearPedido(postPedidoDTO));
    }

    @GetMapping("/obtener/{id}")
    public ResponseEntity<PedidoDTO> obtenerPedido(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.obtenerPedido(id));
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<PedidoDTO> actualizarPedido(@PathVariable Integer id,
                                                      @RequestBody PostPedidoDTO postPedidoDTO){
        return ResponseEntity.ok(pedidoService.actualizarPedido(id, postPedidoDTO));
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<String> eliminarPedido(@PathVariable Integer id){
        pedidoService.eliminarPedido(id);
        return ResponseEntity.ok("Pedido eliminado correctamente");
    }
}
