package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EstadoPedido;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoDTO {
    private Integer id;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaPedido;
    private Integer idMesa;
    private Integer idUsuario;
    private EstadoPedido estado;


}
