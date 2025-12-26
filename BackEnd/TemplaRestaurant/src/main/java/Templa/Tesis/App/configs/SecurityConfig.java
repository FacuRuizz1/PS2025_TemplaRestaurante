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
                                "/api/sse/**",
                                "/api/mercadopago/webhook",
                                "/api/mercadopago/callback",
                                "/h2-console/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-resources/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // Endpoints que requieren rol ADMINISTRADOR y ENCARGADO
                        .requestMatchers("/api/usuario/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO")

                        // Endpoints de persona solo ADMINISTRADOR, Y ENCARGADO
                        .requestMatchers("/api/persona/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO")

                        // Endpoints de producto - MOZO necesita para ver productos en pedidos
                        .requestMatchers("/api/producto/**").hasAnyAuthority("ADMINISTRADOR", "COCINA","ENCARGADO","MOZO")

                        // Endpoints de plato - MOZO necesita para ver platos en pedidos
                        .requestMatchers("/api/platos/**").hasAnyAuthority("ADMINISTRADOR","ENCARGADO","COCINA","MOZO")

                        //Endpoint de Menu - MOZO necesita para ver menus en pedidos
                        .requestMatchers("/api/menu/**").hasAnyAuthority("ADMINISTRADOR","CLIENTE","ENCARGADO","MOZO")

                        //Endpoint de Mesa solo para ADMINISTRADOR y MOZO
                        .requestMatchers("/api/mesas/**").hasAnyAuthority("ADMINISTRADOR","MOZO","ENCARGADO")

                        //Endpoint de Reserva solo para ADMINISTRADOR y CLIENTE
                        .requestMatchers("/api/reserva/**").hasAnyAuthority("ADMINISTRADOR","CLIENTE","ENCARGADO")

                        //Endpoint de Disponibilidad solo para ADMINISTRADOR, MOZO y ENCARGADO
                        .requestMatchers("/api/disponibilidad/**").hasAnyAuthority("ADMINISTRADOR", "MOZO","ENCARGADO")

                        //Enpoint de Pedido solo para ADMINISTRADOR ,MOZO y COCINA
                        .requestMatchers("/api/pedido/**").hasAnyAuthority("ADMINISTRADOR","MOZO","COCINA","ENCARGADO")

                        //Enpoint de Reportes solo para ADMINISTRADOR
                        .requestMatchers("/api/reportes/**").hasAuthority("ADMINISTRADOR")

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
