package Templa.Tesis.App.servicies;

import Templa.Tesis.App.Auth.AuthResponse;
import Templa.Tesis.App.Auth.LoginRequest;
import Templa.Tesis.App.Auth.RegisterRequest;

public interface AuthService {
    AuthResponse login (LoginRequest loginRequest);
    void register (RegisterRequest registerRequest);
}
