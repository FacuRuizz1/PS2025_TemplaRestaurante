package Templa.Tesis.App.configs;

import Templa.Tesis.App.Jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

import java.util.Arrays;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true); // ✅ true para JWT

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Endpoints públicos (sin autenticación)
                        .requestMatchers(
                                "/api/auth/**",
                                "/h2-console/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-resources/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // Endpoints que requieren rol ADMINISTRADOR
                        .requestMatchers("/api/usuario/crear").hasAuthority("ADMINISTRADOR")
                        .requestMatchers("/api/usuario/editar/**").hasAuthority("ADMINISTRADOR")
                        .requestMatchers("/api/usuario/eliminar/**").hasAuthority("ADMINISTRADOR")
                        .requestMatchers("/api/usuario/listar").hasAuthority("ADMINISTRADOR")
                        .requestMatchers("/api/usuario/buscar/**").hasAuthority("ADMINISTRADOR")

                        // Endpoints de persona solo ADMINISTRADOR
                        .requestMatchers("/api/persona/**").hasAuthority("ADMINISTRADOR")

                        // Endpoints de producto solo para ADMINISTRADOR
                        .requestMatchers("/api/producto/**").hasAuthority("ADMINISTRADOR")

                        // Endpoints de plato solo para ADMINISTRADOR
                        .requestMatchers("/api/platos/**").hasAuthority("ADMINISTRADOR")

                        //Endpoint de Menu solo para ADMINISTRADOR
                        .requestMatchers("/api/menu/**").hasAuthority("ADMINISTRADOR")

                        //Endpoint de Reserva solo para ADMINISTRADOR
                        .requestMatchers("/api/reserva/**").hasAuthority("ADMINISTRADOR")

                        //Endpoint de Disponibilidad solo para ADMINISTRADOR
                        .requestMatchers("/api/disponibilidad/**").hasAuthority("ADMINISTRADOR")

                        // Cualquier otro endpoint requiere autenticación
                        .anyRequest().authenticated()
                )
                // Configuración especial para H2 Console
                .headers(AbstractHttpConfigurer::disable) // ← ¡IMPORTANTE!
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
