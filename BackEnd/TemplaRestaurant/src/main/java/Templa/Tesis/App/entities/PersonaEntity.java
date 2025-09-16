package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "T_Persona")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PersonaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;
    @Column
    private String nombre;
    @Column
    private String apellido;
    @Column
    private String email;
    @Column
    private String telefono;
    @Column
    private String dni;
    @Column
    private Date fechaAlta;
    @Column
    private Integer userAltaId;
    @Column
    private Date fechaBaja;
    @Column
    private Integer userBajaId;
    @Column
    @Enumerated(EnumType.STRING)
    private Enum<TipoPersona> tipoPersona;


}
