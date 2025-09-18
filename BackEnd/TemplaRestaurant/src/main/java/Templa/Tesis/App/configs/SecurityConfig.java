package Templa.Tesis.App.configs;

import Templa.Tesis.App.Jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authRequest ->
                        authRequest
                                /// URLs públicas
                                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**",
                                        "/swagger-ui.html", "/webjars/**",
                                        "/swagger-resources/**").permitAll()

                                // Autenticación pública
                                .requestMatchers("/api/auth/**").permitAll()

                                .requestMatchers("/api/persona/**").permitAll()

                                // Endpoints de admin
                                .requestMatchers("/api/usuario/admin/**").hasRole("ADMINISTRADOR")

                                // Endpoints de persona protegidos (excepto crear)
                                .requestMatchers(HttpMethod.GET, "/api/persona/**").hasAnyRole("ADMINISTRADOR", "ENCARGADO", "MOZO")
                                .requestMatchers(HttpMethod.PUT, "/api/persona/**").hasAnyRole("ADMINISTRADOR", "ENCARGADO")
                                .requestMatchers(HttpMethod.DELETE, "/api/persona/**").hasRole("ADMINISTRADOR")

                                .anyRequest().authenticated()
                ) .sessionManagement(sessionManager ->
                        sessionManager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
