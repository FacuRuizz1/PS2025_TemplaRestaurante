package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.servicies.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    // Solo administradores pueden crear usuarios
    @PostMapping("/admin/create-user")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioDTO> registrarUsuario(@RequestBody UsuarioCreateDTO usuarioCreateDTO){
        return ResponseEntity.ok(usuarioService.crearUsuario(usuarioCreateDTO));
    }

    @GetMapping("/admin/listar-usuarios")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UsuarioDTO>> listarUsuarios(){
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @DeleteMapping("/admin/eliminar-usuario/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Integer id){
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.ok().build();
    }
}
