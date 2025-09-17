package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.servicies.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    //Endpoint solo para admin
    @PostMapping("/admin/create-user")
    public ResponseEntity<UsuarioDTO> registrarUsuario(@RequestBody UsuarioCreateDTO usuarioCreateDTO){
        return ResponseEntity.ok(usuarioService.crearUsuario(usuarioCreateDTO));
    }

    @GetMapping("/admin/listar-usuarios")
    public ResponseEntity<List<UsuarioDTO>> listarUsuarios(){
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @DeleteMapping("/admin/eliminar-usuario/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Integer id){
       usuarioService.eliminarUsuario(id);
       return ResponseEntity.ok().build();
    }
}
