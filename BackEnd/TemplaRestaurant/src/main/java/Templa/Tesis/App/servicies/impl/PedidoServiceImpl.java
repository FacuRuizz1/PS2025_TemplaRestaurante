package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.EstadoPedido;
import Templa.Tesis.App.Enums.RolUsuario;
import Templa.Tesis.App.Enums.TipoPersona;
import Templa.Tesis.App.dtos.GetPedidoDetalleDto;
import Templa.Tesis.App.dtos.GetPedidoDto;
import Templa.Tesis.App.dtos.PostPedidoDetalleDto;
import Templa.Tesis.App.dtos.PostPedidoDto;
import Templa.Tesis.App.entities.*;
import Templa.Tesis.App.repositories.*;
import Templa.Tesis.App.servicies.IMenuService;
import Templa.Tesis.App.servicies.IPedidoService;
import Templa.Tesis.App.servicies.IPlatoService;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;


import static Templa.Tesis.App.Enums.RolUsuario.MOZO;
import static java.awt.SystemColor.menu;

@Service
public class PedidoServiceImpl implements IPedidoService {
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private PedidoDetalleRepository pedidoDetalleRepository;
    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private MenuDetalleRepository menuDetalleRepository;
    @Autowired
    private PlatoRepository platoRepository;
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private EmailService emailService;

    @Override
    @Transactional
    public GetPedidoDto crearPedido(PostPedidoDto dto) {
        if (dto.getDetalles().isEmpty()) {
            throw new RuntimeException("El pedido debe tener al menos un detalle");
        }
        if (dto.getIdMesa() == null) {
            throw new RuntimeException("El pedido debe tener una mesa asignada");
        }
        if (dto.getIdMozo() == null) {
            throw new RuntimeException("El pedido debe tener un mozo asignado");
        }

        List<GetPedidoDetalleDto> detallesDto = new ArrayList<>();
        double totalPedido = 0.0;

        PedidoEntity nuevoPedidoE = new PedidoEntity();
        nuevoPedidoE.setIdMesa(dto.getIdMesa());
        nuevoPedidoE.setMozo(dto.getIdMozo());
        nuevoPedidoE.setFechaPedido(LocalDateTime.now());
        nuevoPedidoE.setEstadoPedido(EstadoPedido.ORDENADO);

        pedidoRepository.save(nuevoPedidoE);

        for (PostPedidoDetalleDto detalleDto : dto.getDetalles()) {
            if (detalleDto.getIdProducto() != null) {
                detallesDto.add(handleProductoDetalle(detalleDto, nuevoPedidoE));
            } else if (detalleDto.getIdPlato() != null) {
                detallesDto.addAll(handlePlatoDetalle(detalleDto, nuevoPedidoE));
            } else if (detalleDto.getIdMenu() != null) {
                List<MenuDetalleEntity> menus = menuDetalleRepository.findByMenuId(detalleDto.getIdMenu());

                for (MenuDetalleEntity m : menus) {
                    if (m.getProducto() != null) {
                        PostPedidoDetalleDto productoDetalleDto = new PostPedidoDetalleDto();
                        productoDetalleDto.setIdProducto(m.getProducto().getId());
                        productoDetalleDto.setCantidad(detalleDto.getCantidad());
                        detallesDto.add(handleProductoDetalle(productoDetalleDto, nuevoPedidoE));
                    } else if (m.getPlato() != null) {
                        PostPedidoDetalleDto platoDetalleDto = new PostPedidoDetalleDto();
                        platoDetalleDto.setIdPlato(m.getPlato().getIdPlato());
                        platoDetalleDto.setCantidad(detalleDto.getCantidad());
                        detallesDto.addAll(handlePlatoDetalle(platoDetalleDto, nuevoPedidoE));
                    }
                }
            }

        }

        nuevoPedidoE.setTotal(totalPedido);
        pedidoRepository.save(nuevoPedidoE);
        GetPedidoDto pedidoCreado = modelMapper.map(nuevoPedidoE, GetPedidoDto.class);
        pedidoCreado.setDetalles(detallesDto);
        return pedidoCreado;
    }

    @Override
    public GetPedidoDto obtenerPedido(Integer id) {
        return null;
    }

    @Override
    public Page<GetPedidoDto> listarPedidos(int page, int size, String buscarFiltro, String estadoPedido,
                                            LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde == null) fechaDesde = LocalDate.now().withDayOfMonth(1);
        if (fechaHasta == null) fechaHasta = LocalDate.now();

        final LocalDateTime fd = fechaDesde.atStartOfDay();
        final LocalDateTime fh = fechaHasta.atTime(23, 59, 59, 999_999_999);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fechaPedido"));

        Specification<PedidoEntity> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (buscarFiltro != null && !buscarFiltro.isEmpty()) {
                String pattern = "%" + buscarFiltro.toLowerCase() + "%";

                // join mozo -> persona to search by nombre / apellido
                Join<PedidoEntity, UsuarioEntity> mozoJoin = root.join("mozo", JoinType.LEFT);
                Join<UsuarioEntity, PersonaEntity> personaJoin = mozoJoin.join("persona", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numeroComprobante").as(String.class)), pattern),
                        cb.like(cb.lower(personaJoin.get("nombre").as(String.class)), pattern),
                        cb.like(cb.lower(personaJoin.get("apellido").as(String.class)), pattern)
                ));
            }

            if (idMesa != null) {
                predicates.add(cb.equal(root.get("idMesa").as(Integer.class), idMesa));
            }

            if (estadoPedido != null && !estadoPedido.isEmpty()) {
                try {
                    predicates.add(cb.equal(root.get("estadoPedido"),
                            EstadoPedido.valueOf(estadoPedido.toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    // invalid estado -> ignore filter
                }
            }

            predicates.add(cb.between(root.get("fechaPedido"), fd, fh));

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<PedidoEntity> pedidos = pedidoRepository.findAll(spec, pageable);
        return pedidos.map(pedido -> modelMapper.map(pedido, GetPedidoDto.class));
    }

    @Override
    public void cancelarDetalle(Integer idDetalle) {

    }

    @Override
    public void marcarDetalleEntregado(Integer idDetalle) {

    }

    private GetPedidoDetalleDto handleProductoDetalle(PostPedidoDetalleDto detalleDto, PedidoEntity pedido) {
        if (detalleDto.getCantidad() <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a 0");
        }

        ProductoEntity producto = productoRepository.findByIdWithLock(detalleDto.getIdProducto())
                .orElseThrow(() -> new RuntimeException("El producto con id " + detalleDto.getIdProducto() + " no existe"));

        if (producto.getStockActual() < detalleDto.getCantidad()) {
            throw new RuntimeException("No hay stock suficiente del producto " + producto.getNombre());
        }

        producto.setStockActual(producto.getStockActual() - detalleDto.getCantidad());

        if (producto.getStockActual() <= producto.getStockMinimo()) {
            //TODO: EMITIR ALERTA DE STOCK BAJO MEDIANTE NOTIFICACION E EMAIL
        }

        if (producto.getStockActual() <= 0) {
            producto.setActivo(false);
        }
        productoRepository.save(producto);

        PedidosDetalleEntity nuevoDetalle = new PedidosDetalleEntity();
        nuevoDetalle.setPedido(pedido);
        nuevoDetalle.setCantidad(detalleDto.getCantidad());
        nuevoDetalle.setPrecioUnitario(producto.getPrecio());
        nuevoDetalle.setProducto(producto);
        nuevoDetalle.setEntregado(false);
        pedidoDetalleRepository.save(nuevoDetalle);

        return modelMapper.map(nuevoDetalle, GetPedidoDetalleDto.class);
    }

    private List<GetPedidoDetalleDto> handlePlatoDetalle(PostPedidoDetalleDto platoDetalleDto, PedidoEntity pedido) {
        PlatoEntity plato = platoRepository.findById(platoDetalleDto.getIdPlato())
                .orElseThrow(() -> new RuntimeException("El plato con id " + platoDetalleDto.getIdPlato() + " no existe"));

        if (!plato.getDisponible()) {
            throw new RuntimeException("El plato " + plato.getNombre() + " no está disponible");
        }

        List<GetPedidoDetalleDto> results = new ArrayList<>();
        for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
            PostPedidoDetalleDto productoDetalleDto = new PostPedidoDetalleDto();
            productoDetalleDto.setIdProducto(ingrediente.getProducto().getId());
            double cantidadNecesaria = ingrediente.getCantidad() * platoDetalleDto.getCantidad();
            productoDetalleDto.setCantidad(Math.ceil(cantidadNecesaria));

            results.add(handleProductoDetalle(productoDetalleDto, pedido));
        }
        return results;
    }
}
