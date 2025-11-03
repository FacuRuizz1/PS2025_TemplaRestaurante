package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EstadoPedido;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostPedidoDTO {
    private LocalDate fechaPedido;
    private Integer idMesa;
    private Integer idUsuario;
    private EstadoPedido estado;
    private List<PostPedidoDetalleDTO> detalles;
}
