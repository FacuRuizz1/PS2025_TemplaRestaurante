package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.GetPedidoDto;
import Templa.Tesis.App.dtos.PostPedidoDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface IPedidoService {
    GetPedidoDto crearPedido(PostPedidoDto dto);
    GetPedidoDto obtenerPedido(Integer id);
    Page<GetPedidoDto> listarPedidos(int page, int size, String buscarFiltro, String estadoPedido,
                                     LocalDate fechaDesde, LocalDate fechaHasta);
    void cancelarDetalle(Integer idDetalle);
    void marcarDetalleEntregado(Integer idDetalle);
}
