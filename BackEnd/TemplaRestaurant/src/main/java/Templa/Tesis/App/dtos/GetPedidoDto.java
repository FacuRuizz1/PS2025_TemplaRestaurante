package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetPedidoDto {
    private Integer idPedido;
    private Integer numeroMesa;
    private String nombreUsuario;
    private LocalDateTime fechaHora;
    private String observaciones;
    private double total;
    private String estado;
    private List<GetPedidoDetalleDto> detalles;
}
