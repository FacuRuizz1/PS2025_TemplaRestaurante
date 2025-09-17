package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Auth.AuthResponse;
import Templa.Tesis.App.Auth.LoginRequest;
import Templa.Tesis.App.Auth.RegisterRequest;
import Templa.Tesis.App.Jwt.JwtService;
import Templa.Tesis.App.entities.UsuarioEntity;
import Templa.Tesis.App.repositories.UsuarioRepository;
import Templa.Tesis.App.servicies.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;


    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),loginRequest.getPassword()));
        UserDetails user = usuarioRepository.findByUsername(loginRequest.getUsername()).orElseThrow();
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .build();
    }

    @Override
    public void register(RegisterRequest registerRequest) {
        UsuarioEntity usuario = UsuarioEntity.builder()
                .username(registerRequest.getUsername())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .rolUsuario(registerRequest.getRol())
                .build();

        usuarioRepository.save(usuario);
    }
}
