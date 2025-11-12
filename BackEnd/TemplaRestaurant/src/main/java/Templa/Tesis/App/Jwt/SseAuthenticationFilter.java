package Templa.Tesis.App.Jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro personalizado para autenticar conexiones SSE (Server-Sent Events)
 * que envían el token JWT como query parameter en lugar del header Authorization.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SseAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Solo aplicar este filtro a endpoints SSE
        if (!request.getRequestURI().startsWith("/api/sse/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Intentar obtener el token del query parameter
        final String token = request.getParameter("token");

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // Extraer el username del token
                String username = jwtService.getUsernameFromToken(token);

                if (username != null) {
                    // Cargar detalles del usuario
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                    // Validar el token
                    if (jwtService.isTokenValid(token, userDetails)) {
                        log.info("Token SSE válido para usuario: {}", username);

                        // Crear token de autenticación
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                        // Establecer detalles adicionales
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // Establecer en el contexto de seguridad
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    } else {
                        log.warn("Token SSE inválido");
                    }
                }
            } catch (Exception e) {
                log.error("Error procesando token SSE: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}

