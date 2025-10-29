package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetPedidoDetalleDto {
    private Integer idPedidoDetalle;
    private Integer idItem; // Puede ser idPlato, idMenu o idProducto
    private String nombreItem; // Nombre del plato/menú/producto
    private String tipo; // "PLATO", "MENU", "PRODUCTO"
    private int cantidad;
    private double precioUnitario;
    private boolean entregado;
}
