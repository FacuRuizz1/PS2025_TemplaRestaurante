package Templa.Tesis.App.models;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Persona {
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String dni;
    @Enumerated(EnumType.STRING)
    private Enum<TipoPersona> tipoPersona;
}
