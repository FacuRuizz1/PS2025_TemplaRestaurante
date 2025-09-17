package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.annotation.Nullable;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonaDto {
    @Nullable
    private Integer id;
    private String nombre;
    private String apellido;
    private String email;
    private int telefono;
    private Integer dni;
    private TipoPersona tipoPersona;
    private LocalDateTime fechaBaja;


    public PersonaDto(String nombre, String apellido, String email, int telefono, Integer dni, TipoPersona tipoPersona) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.telefono = telefono;
        this.dni = dni;
        this.tipoPersona = tipoPersona;
    }
}
