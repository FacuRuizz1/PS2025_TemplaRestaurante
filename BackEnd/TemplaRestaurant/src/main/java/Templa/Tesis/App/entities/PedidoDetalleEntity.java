package Templa.Tesis.App.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pedidoDetalle")
public class PedidoDetalleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPedidoDetalle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_pedido",nullable = false)
    private PedidoEntity pedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_menu",nullable = false)
    private MenuEntity menu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_plato",nullable = false)
    private PlatoEntity plato;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto",nullable = false)
    private ProductoEntity producto;

    private int cantidad;

    private Double precioUnitario;

    private boolean entregado;

}
