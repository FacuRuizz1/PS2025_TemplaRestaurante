package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.EstadoMesa;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "mesas")
public class MesaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idMesa;

    @Column
    private String numeroMesa;

    @Column
    private EstadoMesa estadoMesa;

}
