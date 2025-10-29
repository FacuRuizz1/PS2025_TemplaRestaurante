package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PostPedidoDetalleDto {
    private Integer idPlato;
    private Integer idMenu;
    private Integer idProducto;
    private double cantidad;
}
