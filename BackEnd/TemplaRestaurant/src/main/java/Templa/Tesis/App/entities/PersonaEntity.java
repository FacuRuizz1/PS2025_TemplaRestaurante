package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "personas")
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
    private int telefono;
    @Column
    private int dni;
    @Column
    @Enumerated(EnumType.STRING)
    private TipoPersona tipoPersona;
    @Column
    private LocalDateTime fechaAlta;
    @Column
    private Integer userAltaId;
    @Column
    private LocalDateTime fechaBaja;
    @Column
    private Integer userBajaId;

    @OneToOne(mappedBy = "persona", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private UsuarioEntity usuario;

}
