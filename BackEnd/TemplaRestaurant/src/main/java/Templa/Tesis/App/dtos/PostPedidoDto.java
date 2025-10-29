package Templa.Tesis.App.dtos;

import Templa.Tesis.App.entities.PedidosDetalleEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostPedidoDto {
    private Integer idMesa;
    private Integer idMozo;
    private List<PostPedidoDetalleDto> detalles;
}
