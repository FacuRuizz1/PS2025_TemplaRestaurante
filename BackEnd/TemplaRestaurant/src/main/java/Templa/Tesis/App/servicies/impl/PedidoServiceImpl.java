package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.PedidoDTO;
import Templa.Tesis.App.dtos.PostPedidoDTO;
import Templa.Tesis.App.dtos.PostPedidoDetalleDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import Templa.Tesis.App.entities.*;
import Templa.Tesis.App.repositories.*;
import Templa.Tesis.App.servicies.IPedidoService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements IPedidoService {

    private final PedidoRepository pedidoRepository;
    private final PedidoDetalleRepository pedidoDetalleRepository;
    private final MesaRepository mesaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final MenuRepository menuRepository;
    private final PlatoRepository platoRepository;
    private final NotificationService notificationService;


    @Override
    public PedidoDTO crearPedido(PostPedidoDTO postPedidoDTO) {

        //  Validaciones básicas
        if (postPedidoDTO.getFechaPedido() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar la fecha del pedido");
        }
        if (postPedidoDTO.getIdMesa() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El pedido debe tener una mesa asignada");
        }
        if (postPedidoDTO.getIdUsuario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El pedido debe tener un usuario asignado");
        }
        if (postPedidoDTO.getEstado() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el estado del pedido");
        }

        //  Buscar entidades relacionadas
        MesaEntity mesa = mesaRepository.findById(postPedidoDTO.getIdMesa())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mesa no encontrada"));

        UsuarioEntity usuario = usuarioRepository.findById(postPedidoDTO.getIdUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        //  Crear el pedido base
        PedidoEntity pedido = new PedidoEntity();
        pedido.setFechaPedido(postPedidoDTO.getFechaPedido());
        pedido.setMesa(mesa);
        pedido.setUsuario(usuario);
        pedido.setEstado(postPedidoDTO.getEstado());

        // Guardar para obtener el ID
        pedido = pedidoRepository.save(pedido);

        //  Procesar los detalles
        if (postPedidoDTO.getDetalles() == null || postPedidoDTO.getDetalles().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El pedido debe contener al menos un detalle");
        }

        List<PedidoDetalleEntity> detalles = new ArrayList<>();

        for (PostPedidoDetalleDTO detDTO : postPedidoDTO.getDetalles()) {

            if (detDTO.getIdMenu() == null && detDTO.getIdPlato() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cada detalle debe tener un menú o un plato asignado");
            }

            PedidoDetalleEntity detalle = new PedidoDetalleEntity();
            detalle.setPedido(pedido);
            detalle.setCantidad(detDTO.getCantidad());
            detalle.setPrecioUnitario(detDTO.getPrecioUnitario());
            detalle.setEntregado(detDTO.isEntregado());

            //  Si tiene menú
            if (detDTO.getIdMenu() != null) {
                MenuEntity menu = menuRepository.findById(detDTO.getIdMenu())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menú no encontrado"));
                detalle.setMenu(menu);

                // Validar y descontar stock de productos del menú
//                List<ProductoEntity> productosMenu = productoRepository.findByMenu_Id(detDTO.getIdMenu());
//                for (ProductoEntity producto : productosMenu) {
//                    validarYDescontarStock(producto, detDTO.getCantidad());
//                }
            }

            //  Si tiene plato
            if (detDTO.getIdPlato() != null) {
                PlatoEntity plato = platoRepository.findById(detDTO.getIdPlato())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));
                detalle.setPlato(plato);

                // Validar y descontar stock de productos del plato
//                List<ProductoEntity> productosPlato = productoRepository.findByPlato_Id(detDTO.getIdPlato());
//                for (ProductoEntity producto : productosPlato) {
//                    validarYDescontarStock(producto, detDTO.getCantidad());
//                }
            }

            // Guardar cada detalle
            PedidoDetalleEntity detalleGuardado = pedidoDetalleRepository.save(detalle);
            detalles.add(detalleGuardado);
        }

        // Asociar detalles al pedido (si la relación es bidireccional)
        pedido.setDetalles(detalles);
        pedidoRepository.save(pedido);

        // Retornar DTO del pedido creado
        return PedidoDTO.builder()
                .id(pedido.getId())
                .fechaPedido(pedido.getFechaPedido())
                .idMesa(pedido.getMesa().getIdMesa())
                .idUsuario(pedido.getUsuario().getId())
                .estado(pedido.getEstado())
                .build();
    }

    // ----------------------------------------------------------
    //  Validación y descuento de stock
    // ----------------------------------------------------------
    private void validarYDescontarStock(ProductoEntity producto, Integer cantidadSolicitada) {
        // Validar stock suficiente
        if (producto.getStockActual() < cantidadSolicitada) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stock insuficiente para el producto: " + producto.getNombre());
        }

        // Descontar stock
        producto.setStockActual(producto.getStockActual() - cantidadSolicitada);
        productoRepository.save(producto);

        // Si llega al mínimo, enviar alerta
        if (producto.getStockActual() <= producto.getStockMinimo()) {
            ProductoDTO productoDTO = convertirAProductoDTO(producto);
            notificationService.enviarAlertaStockBajo(productoDTO);
        }
    }

    // ----------------------------------------------------------
    //  Conversión a DTO
    // ----------------------------------------------------------
    private ProductoDTO convertirAProductoDTO(ProductoEntity producto) {
        return ProductoDTO.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .stockActual(producto.getStockActual())
                .stockMinimo(producto.getStockMinimo())
                .build();
    }


    @Override
    public PedidoDTO obtenerPedido(Integer id) {
        PedidoEntity pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,"Pedido no encontrado"));

        return PedidoDTO.builder()
                .id(pedido.getId())
                .fechaPedido(pedido.getFechaPedido())
                .idMesa(pedido.getMesa().getIdMesa())
                .idUsuario(pedido.getUsuario().getId())
                .estado(pedido.getEstado())
                .build();
    }

    @Override
    public Page<PedidoRepository> listarPedidos(int page, int size, String buscarFiltro, String estado, LocalDate fechaDesde, LocalDate fechaHasta) {
        return null;
    }

    @Override
    public PedidoDTO actualizarPedido(Integer id, PostPedidoDTO postPedidoDTO) {
        // Buscar el pedido existente
        PedidoEntity pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        // Buscar entidades relacionadas
        MesaEntity mesa = mesaRepository.findById(postPedidoDTO.getIdMesa())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mesa no encontrada"));

        UsuarioEntity usuario = usuarioRepository.findById(postPedidoDTO.getIdUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        // Actualizar datos básicos del pedido
        pedido.setFechaPedido(postPedidoDTO.getFechaPedido());
        pedido.setMesa(mesa);
        pedido.setUsuario(usuario);
        pedido.setEstado(postPedidoDTO.getEstado());

        // Eliminar detalles existentes
        pedidoDetalleRepository.deleteByPedidoId(id);

        // Procesar nuevos detalles
        if (postPedidoDTO.getDetalles() == null || postPedidoDTO.getDetalles().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El pedido debe contener al menos un detalle");
        }

        List<PedidoDetalleEntity> detalles = new ArrayList<>();

        for (PostPedidoDetalleDTO detDTO : postPedidoDTO.getDetalles()) {
            if (detDTO.getIdMenu() == null && detDTO.getIdPlato() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cada detalle debe tener un menú o un plato asignado");
            }

            PedidoDetalleEntity detalle = new PedidoDetalleEntity();
            detalle.setPedido(pedido);
            detalle.setCantidad(detDTO.getCantidad());
            detalle.setPrecioUnitario(detDTO.getPrecioUnitario());
            detalle.setEntregado(detDTO.isEntregado());

            // Si tiene menú
            if (detDTO.getIdMenu() != null) {
                MenuEntity menu = menuRepository.findById(detDTO.getIdMenu())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menú no encontrado"));
                detalle.setMenu(menu);
            }

            // Si tiene plato
            if (detDTO.getIdPlato() != null) {
                PlatoEntity plato = platoRepository.findById(detDTO.getIdPlato())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));
                detalle.setPlato(plato);
            }

            PedidoDetalleEntity detalleGuardado = pedidoDetalleRepository.save(detalle);
            detalles.add(detalleGuardado);
        }

        // Actualizar detalles del pedido
        pedido.setDetalles(detalles);
        pedido = pedidoRepository.save(pedido);

        // Retornar DTO actualizado
        return PedidoDTO.builder()
                .id(pedido.getId())
                .fechaPedido(pedido.getFechaPedido())
                .idMesa(pedido.getMesa().getIdMesa())
                .idUsuario(pedido.getUsuario().getId())
                .estado(pedido.getEstado())
                .build();
    }

    @Override
    public void eliminarPedido(Integer id) {
        // Verificar que el pedido existe
        PedidoEntity pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        // Eliminar primero los detalles del pedido
        pedidoDetalleRepository.deleteByPedidoId(id);

        // Eliminar el pedido
        pedidoRepository.delete(pedido);
    }

    @Override
    public void cancelarDetalle(Integer idPedidoDetalle) {
        // Verificar que el detalle existe
        PedidoDetalleEntity detalle = pedidoDetalleRepository.findById(idPedidoDetalle)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Detalle del pedido no encontrado"));

        // Verificar que el detalle no haya sido entregado
        if (detalle.isEntregado()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede cancelar un detalle que ya fue entregado");
        }

        // Eliminar el detalle
        pedidoDetalleRepository.delete(detalle);
    }

    @Override
    public void marcarDetalleEntregado(Integer idPedidoDetalle) {
        // Verificar que el detalle existe
        PedidoDetalleEntity detalle = pedidoDetalleRepository.findById(idPedidoDetalle)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Detalle del pedido no encontrado"));

        // Verificar que el detalle no esté ya entregado
        if (detalle.isEntregado()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El detalle ya ha sido marcado como entregado");
        }

        // Marcar como entregado
        detalle.setEntregado(true);
        pedidoDetalleRepository.save(detalle);
    }





}
