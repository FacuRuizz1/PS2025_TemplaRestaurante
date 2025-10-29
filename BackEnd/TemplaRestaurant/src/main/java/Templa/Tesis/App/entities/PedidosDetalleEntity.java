package Templa.Tesis.App.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pedidosDetalles")
public class PedidosDetalleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPedidoDetalle;
    @ManyToOne
    @JoinColumn(name = "id_pedido", nullable = false)
    private PedidoEntity pedido;
    @ManyToOne
    @JoinColumn(name = "id_plato", nullable = true)
    private PlatoEntity plato;
    @ManyToOne
    @JoinColumn(name = "id_menu", nullable = true)
    private MenuEntity menu;
    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = true)
    private ProductoEntity producto;
    @Column
    private double cantidad;
    @Column
    private double precioUnitario;
    @Column
    private boolean entregado;





}
