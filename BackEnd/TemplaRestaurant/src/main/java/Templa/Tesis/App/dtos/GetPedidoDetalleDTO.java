package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetPedidoDetalleDTO {
    private Integer idDetalle;
    private Integer idMenu;
    private Integer idPlato;
    private int cantidad;
    private Double precioUnitario;
    private boolean entregado;
}
