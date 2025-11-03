package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.PedidoDTO;
import Templa.Tesis.App.dtos.PostPedidoDTO;
import Templa.Tesis.App.repositories.PedidoRepository;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface IPedidoService {
    PedidoDTO crearPedido(PostPedidoDTO postPedidoDTO);
    PedidoDTO obtenerPedido(Integer id);
    Page<PedidoRepository> listarPedidos(int page, int size, String buscarFiltro, String estado,
                                         LocalDate fechaDesde, LocalDate fechaHasta);
    PedidoDTO actualizarPedido(Integer id,PostPedidoDTO postPedidoDTO);
    void eliminarPedido(Integer id);
    void cancelarDetalle(Integer idPedidoDetalle);
    void marcarDetalleEntregado(Integer idPedidoDetalle);

}
