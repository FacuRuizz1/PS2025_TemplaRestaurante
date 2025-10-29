package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.EstadoPedido;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pedidos")
public class PedidoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPedido;
    @Column
    private LocalDateTime fechaPedido;
    @Column
    private Integer idMesa;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_mozo", referencedColumnName = "idUsuario")
    private UsuarioEntity mozo;
    @Column
    @Enumerated(EnumType.STRING)
    private EstadoPedido estadoPedido;
    @Column
    private double total;

}
