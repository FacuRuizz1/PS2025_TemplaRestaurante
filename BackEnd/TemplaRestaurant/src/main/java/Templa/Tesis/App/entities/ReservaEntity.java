package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.EventoReserva;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reservas")
public class ReservaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_persona",nullable = false)
    private PersonaEntity persona;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_disponibilidad", nullable = false)
    private DisponibilidadEntity disponibilidad;

    private int nroReserva;

    private int cantidadComensales;

    private LocalDate fechaReserva;

    @Enumerated(EnumType.STRING)
    private EventoReserva evento;

    private LocalTime horario;
}
