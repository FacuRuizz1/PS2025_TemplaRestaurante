package Templa.Tesis.App.controllers;

import Templa.Tesis.App.Auth.AuthResponse;
import Templa.Tesis.App.Auth.LoginRequest;
import Templa.Tesis.App.Auth.RegisterRequest;
import Templa.Tesis.App.Enums.RolUsuario;
import Templa.Tesis.App.servicies.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest){
        return ResponseEntity.ok(authService.login(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String,String>> register(@RequestBody RegisterRequest registerRequest){
        //Si no se esfecifica el Rol, usar ADMINISTRADOR por defecto
        if (registerRequest.getRol() == null) {
            registerRequest.setRol(RolUsuario.ADMINISTRADOR);
        }

        authService.register(registerRequest);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Usuario registrado exitosamente como " + registerRequest.getRol());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
