package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.EstadoMesa;
import Templa.Tesis.App.Enums.EstadoPedido;

import Templa.Tesis.App.Enums.EstadoPedidoDetalle;
import Templa.Tesis.App.dtos.*;
import Templa.Tesis.App.entities.*;
import Templa.Tesis.App.repositories.*;
import Templa.Tesis.App.servicies.*;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
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


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class PedidoServiceImpl implements IPedidoService {
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private PedidoDetalleRepository pedidoDetalleRepository;
    @Autowired
    private IProductoService productoService;
    @Autowired
    private IMesasService mesasService;
    @Autowired
    private IPlatoService platoService;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private IMenuService menuService;
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private EmailService emailService;

    @Override
    @Transactional
    public PedidoDTO crearPedido(PostPedidoDTO dto) {
        if (dto.getDetalles().isEmpty()) {
            throw new RuntimeException("El pedido debe tener al menos un detalle");
        }
        if (dto.getIdMesa() == null) {
            throw new RuntimeException("El pedido debe tener una mesa asignada");
        }
        if (dto.getIdMozo() == null) {
            throw new RuntimeException("El pedido debe tener un mozo asignado");
        }

        List<GetPedidoDetalleDTO> detallesDto = new ArrayList<>();
        PedidoEntity nuevoPedidoE = new PedidoEntity();

        GetMesaDto mesaDto = mesasService.getMesaById(dto.getIdMesa());
        if(mesaDto.getEstadoMesa()!= EstadoMesa.DISPONIBLE){
            throw new RuntimeException("La mesa seleccionada no está disponible");
        }
        nuevoPedidoE.setMesa(modelMapper.map(mesaDto, MesaEntity.class));

        UsuarioDTO mozo = usuarioService.buscarUsuarioPorId(dto.getIdMozo());
        nuevoPedidoE.setMozo(modelMapper.map(mozo, UsuarioEntity.class));

        nuevoPedidoE.setFechaPedido(LocalDateTime.now());
        nuevoPedidoE.setEstado(EstadoPedido.ORDENADO);

        pedidoRepository.save(nuevoPedidoE);

        for (PostPedidoDetalleDTO detalleDto : dto.getDetalles()) {
            if (detalleDto.getIdProducto() != null && detalleDto.getIdProducto() != 0) {
                detallesDto.add(handleProductoDetalle(detalleDto, nuevoPedidoE));
            } else if (detalleDto.getIdPlato() != null && detalleDto.getIdPlato() != 0) {
                detallesDto.addAll(handlePlatoDetalle(detalleDto, nuevoPedidoE));
            } else if (detalleDto.getIdMenu() != null && detalleDto.getIdMenu() != 0) {
                detallesDto.addAll(handleMenuDetalle(detalleDto, nuevoPedidoE));
            }
        }

        mesasService.cambiarEstadoMesa(mesaDto.getIdMesa(), EstadoMesa.OCUPADA);
        pedidoRepository.save(nuevoPedidoE);
        PedidoDTO pedidoCreado = modelMapper.map(nuevoPedidoE, PedidoDTO.class);
        pedidoCreado.setDetalles(detallesDto);
        return pedidoCreado;
    }

    @Override
    public PedidoDTO obtenerPedido(Integer id) {
        PedidoEntity existe = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + id + " no existe"));

        return modelMapper.map(existe, PedidoDTO.class);
    }

    @Override
    public Page<PedidoDTO> listarPedidos(int page, int size, String buscarFiltro, String estadoPedido,
                                            LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde == null) {
            fechaDesde = LocalDate.now().withDayOfMonth(1);
        }
        if (fechaHasta == null) {
            fechaHasta = LocalDate.now();
        }

        LocalDateTime fechaDesdeTime = fechaDesde.atStartOfDay();
        LocalDateTime fechaHastaTime = fechaHasta.atTime(23, 59, 59);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fechaPedido"));

        Specification<PedidoEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (buscarFiltro != null && !buscarFiltro.trim().isEmpty()) {
                String pattern = "%" + buscarFiltro.toLowerCase().trim() + "%";

                Join<PedidoEntity, UsuarioEntity> mozoJoin = root.join("mozo", JoinType.LEFT);
                Join<UsuarioEntity, PersonaEntity> personaJoin = mozoJoin.join("persona", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numeroComprobante").as(String.class)), pattern),
                        cb.like(cb.lower(personaJoin.get("nombre")), pattern),
                        cb.like(cb.lower(personaJoin.get("apellido")), pattern)
                ));
            }

            if (estadoPedido != null && !estadoPedido.trim().isEmpty()) {
                try {
                    EstadoPedido estado = EstadoPedido.valueOf(estadoPedido.toUpperCase());
                    predicates.add(cb.equal(root.get("estado"), estado));
                } catch (IllegalArgumentException e) {
                    throw new RuntimeException("Estado de pedido inválido: " + estadoPedido);
                }
            }

            predicates.add(cb.between(root.get("fechaPedido"), fechaDesdeTime, fechaHastaTime));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<PedidoEntity> pedidosPage = pedidoRepository.findAll(spec, pageable);
        return pedidosPage.map(pedido -> modelMapper.map(pedido, PedidoDTO.class));

    }

    @Override
    @Transactional
    public PedidoDTO cancelarPedido(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + idPedido + " no existe"));

        if(existe.getEstado() == EstadoPedido.FINALIZADO) {
            throw new RuntimeException("No se puede cancelar un pedido finalizado");
        }

        for(PedidoDetalleEntity detalle : existe.getDetalles()) {
            if(detalle.getEstado() != EstadoPedidoDetalle.ENTREGADO) {
                detalle.setEstado(EstadoPedidoDetalle.CANCELADO);
                devolverStockPorDetalle(detalle);
                pedidoDetalleRepository.save(detalle);
            }
        }

        existe.setEstado(EstadoPedido.CANCELADO);
        pedidoRepository.save(existe);

        // Liberar mesa
        mesasService.cambiarEstadoMesa(existe.getMesa().getIdMesa(), EstadoMesa.DISPONIBLE);

        return modelMapper.map(existe, PedidoDTO.class);
    }

    @Override
    @Transactional
    public PedidoDTO cancelarDetalle(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + idPedido + " no existe"));

        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.PENDIENTE) continue;

            devolverStockPorDetalle(detalle);

            detalle.setEstado(EstadoPedidoDetalle.CANCELADO);
            pedidoDetalleRepository.save(detalle);
        }

        pedidoRepository.save(existe);
        return modelMapper.map(existe, PedidoDTO.class);
    }

    @Override
    @Transactional
    public PedidoDTO marcarDetalleEntregado(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + idPedido + " no existe"));

        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.LISTO_PARA_ENTREGAR) continue;
            detalle.setEstado(EstadoPedidoDetalle.ENTREGADO);
            pedidoDetalleRepository.save(detalle);
        }
        pedidoRepository.save(existe);
        return modelMapper.map(existe, PedidoDTO.class);
    }

    @Override
    @Transactional
    public PedidoDTO iniciarPedido(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + idPedido + " no existe"));

        existe.setEstado(EstadoPedido.EN_PROCESO);
        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.PENDIENTE) continue;
            detalle.setEstado(EstadoPedidoDetalle.EN_PREPARACION);
            pedidoDetalleRepository.save(detalle);
        }
        pedidoRepository.save(existe);
        return modelMapper.map(existe, PedidoDTO.class);
    }

    @Override
    @Transactional
    public PedidoDTO marcarDetalleParaEntregar(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + idPedido + " no existe"));

        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.EN_PREPARACION) continue;
            detalle.setEstado(EstadoPedidoDetalle.LISTO_PARA_ENTREGAR);
            pedidoDetalleRepository.save(detalle);
        }

        pedidoRepository.save(existe);
        return modelMapper.map(existe, PedidoDTO.class);
    }

    @Override
    @Transactional
    public PedidoDTO finalizarPedido(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + idPedido + " no existe"));

        if(existe.getEstado() == EstadoPedido.CANCELADO || existe.getEstado() == EstadoPedido.FINALIZADO || existe.getEstado() == EstadoPedido.ORDENADO) {
            throw new RuntimeException("No se puede finalizar un pedido en estado " + existe.getEstado());
        }

        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.ENTREGADO) {
                throw new RuntimeException("No se puede finalizar el pedido porque tiene detalles en estado " + detalle.getEstado());
            }
        }

        existe.setEstado(EstadoPedido.FINALIZADO);
        mesasService.cambiarEstadoMesa(existe.getMesa().getIdMesa(),EstadoMesa.DISPONIBLE);
        pedidoRepository.save(existe);
        return modelMapper.map(existe, PedidoDTO.class);
    }

    @Override
    @Transactional
    public PedidoDTO insertarDetalles(Integer idPedido, PostPedidoDTO dto) {
        if(dto.getDetalles().isEmpty()) {
            throw new RuntimeException("El pedido debe tener al menos un detalle");
        }

        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("El pedido con id " + idPedido + " no existe"));

        if(existe.getEstado() == EstadoPedido.FINALIZADO || existe.getEstado() == EstadoPedido.CANCELADO) {
            throw new RuntimeException("No se pueden agregar detalles a un pedido: "+ existe.getEstado());
        }


        List<GetPedidoDetalleDTO> detallesDto = new ArrayList<>();

        for (PostPedidoDetalleDTO detalleDto : dto.getDetalles()) {
            if (detalleDto.getIdProducto() != null && detalleDto.getIdProducto() != 0) {
                detallesDto.add(handleProductoDetalle(detalleDto, existe));
            } else if (detalleDto.getIdPlato() != null && detalleDto.getIdPlato() != 0) {
                detallesDto.addAll(handlePlatoDetalle(detalleDto, existe));
            } else if (detalleDto.getIdMenu() != null && detalleDto.getIdMenu() != 0) {
                detallesDto.addAll(handleMenuDetalle(detalleDto, existe));
            }
        }

        pedidoRepository.save(existe);
        PedidoDTO pedidoActualizado = modelMapper.map(existe, PedidoDTO.class);
        pedidoActualizado.setDetalles(detallesDto);
        return pedidoActualizado;
    }

    private GetPedidoDetalleDTO handleProductoDetalle(PostPedidoDetalleDTO detalleDto, PedidoEntity pedido) {
        if (detalleDto.getCantidad() <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a 0");
        }

        ProductoEntity producto = productoService.reducirStock(
                detalleDto.getIdProducto(),
                detalleDto.getCantidad()
        );

        PedidoDetalleEntity nuevoDetalle = new PedidoDetalleEntity();
        nuevoDetalle.setPedido(pedido);
        nuevoDetalle.setProducto(producto);
        nuevoDetalle.setPlato(null);
        nuevoDetalle.setMenu(null);
        nuevoDetalle.setCantidad(detalleDto.getCantidad());
        nuevoDetalle.setPrecioUnitario(producto.getPrecio());
        nuevoDetalle.setEstado(EstadoPedidoDetalle.PENDIENTE);
        pedidoDetalleRepository.save(nuevoDetalle);

        return modelMapper.map(nuevoDetalle, GetPedidoDetalleDTO.class);
    }

    private List<GetPedidoDetalleDTO> handlePlatoDetalle(PostPedidoDetalleDTO platoDetalleDto, PedidoEntity pedido) {
        PlatoEntity plato = platoService.obtenerPlatoConIngredientes(platoDetalleDto.getIdPlato());

        PedidoDetalleEntity detallePlato = new PedidoDetalleEntity();
        detallePlato.setPedido(pedido);
        detallePlato.setPlato(plato);
        detallePlato.setProducto(null);
        detallePlato.setMenu(null);
        detallePlato.setCantidad(platoDetalleDto.getCantidad());
        detallePlato.setPrecioUnitario(plato.getPrecio());
        detallePlato.setEstado(EstadoPedidoDetalle.PENDIENTE);
        pedidoDetalleRepository.save(detallePlato);

        for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
            double cantidadNecesaria = ingrediente.getCantidad() * platoDetalleDto.getCantidad();
            productoService.reducirStock(ingrediente.getProducto().getId(), cantidadNecesaria);
        }

        return List.of(modelMapper.map(detallePlato, GetPedidoDetalleDTO.class));
    }

    private List<GetPedidoDetalleDTO> handleMenuDetalle(PostPedidoDetalleDTO detalleDto, PedidoEntity pedido) {
        GetMenuDTO menu = menuService.obtenerMenuPorId(detalleDto.getIdMenu());
        List<MenuDetalleEntity> itemsDelMenu = menuService.obtenerDetallesMenu(detalleDto.getIdMenu());

        PedidoDetalleEntity detalleMenu = new PedidoDetalleEntity();
        detalleMenu.setPedido(pedido);
        detalleMenu.setMenu(modelMapper.map(menu, MenuEntity.class));
        detalleMenu.setProducto(null);
        detalleMenu.setPlato(null);
        detalleMenu.setCantidad(detalleDto.getCantidad());
        detalleMenu.setPrecioUnitario(menu.getPrecio());
        detalleMenu.setEstado(EstadoPedidoDetalle.PENDIENTE);
        pedidoDetalleRepository.save(detalleMenu);

        for (MenuDetalleEntity item : itemsDelMenu) {
            if (item.getProducto() != null) {
                productoService.reducirStock(
                        item.getProducto().getId(),
                        detalleDto.getCantidad()
                );
            } else if (item.getPlato() != null) {
                PlatoEntity plato = platoService.obtenerPlatoConIngredientes(item.getPlato().getIdPlato());
                for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
                    double cantidadNecesaria = ingrediente.getCantidad() * detalleDto.getCantidad();
                    productoService.reducirStock(ingrediente.getProducto().getId(), cantidadNecesaria);
                }
            }
        }

        return List.of(modelMapper.map(detalleMenu, GetPedidoDetalleDTO.class));
    }

    private void devolverStockPorDetalle(PedidoDetalleEntity detalle) {
        if (detalle.getProducto() != null) {
            productoService.aumentarStock(detalle.getProducto().getId(), detalle.getCantidad());
        } else if (detalle.getPlato() != null) {
            PlatoEntity plato = platoService.obtenerPlatoConIngredientes(detalle.getPlato().getIdPlato());
            for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
                int qtyToReturn = (int) Math.ceil(ingrediente.getCantidad() * detalle.getCantidad());
                productoService.aumentarStock(ingrediente.getProducto().getId(), qtyToReturn);
            }
        } else if (detalle.getMenu() != null) {
            List<MenuDetalleEntity> itemsDelMenu = menuService.obtenerDetallesMenu(detalle.getMenu().getId());
            for (MenuDetalleEntity item : itemsDelMenu) {
                if (item.getProducto() != null) {
                    productoService.aumentarStock(item.getProducto().getId(), detalle.getCantidad());
                } else if (item.getPlato() != null) {
                    PlatoEntity plato = platoService.obtenerPlatoConIngredientes(item.getPlato().getIdPlato());
                    for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
                        int qtyToReturn = (int) Math.ceil(ingrediente.getCantidad() * detalle.getCantidad());
                        productoService.aumentarStock(ingrediente.getProducto().getId(), qtyToReturn);
                    }
                }
            }
        }
    }

    @PostConstruct
    private void configureModelMapper() {
        modelMapper.createTypeMap(PedidoEntity.class, PedidoDTO.class)
                .setPostConverter(ctx -> {
                    PedidoEntity src = ctx.getSource();
                    PedidoDTO dst = ctx.getDestination();

                    if (src.getMozo() != null && src.getMozo().getPersona() != null) {
                        String nombre = src.getMozo().getPersona().getNombre();
                        String apellido = src.getMozo().getPersona().getApellido();
                        dst.setNombreUsuario((nombre != null ? nombre : "") + (apellido != null && !apellido.isBlank() ? " " + apellido : ""));
                    }

                    if (src.getMesa() != null) {
                        dst.setNumeroMesa(src.getMesa().getNumeroMesa());
                    }

                    if (src.getFechaPedido() != null) {
                        dst.setFechaHora(src.getFechaPedido());
                    }

                    // compute total if DTO doesn't get it automatically
                    double total = src.getDetalles() == null ? 0.0 :
                            src.getDetalles().stream()
                                    .mapToDouble(d -> (d.getPrecioUnitario() == null ? 0.0 : d.getPrecioUnitario()) * (d.getCantidad() == null ? 0 : d.getCantidad()))
                                    .sum();
                    dst.setTotal(total);

                    return dst;
                });

        // map detalle item identity and type
        modelMapper.createTypeMap(PedidoDetalleEntity.class, GetPedidoDetalleDTO.class)
                .setPostConverter(ctx -> {
                    PedidoDetalleEntity s = ctx.getSource();
                    GetPedidoDetalleDTO d = ctx.getDestination();

                    if (s.getProducto() != null) {
                        d.setIdItem(s.getProducto().getId());
                        d.setNombreItem(s.getProducto().getNombre());
                        d.setTipo("PRODUCTO");
                    } else if (s.getPlato() != null) {
                        d.setIdItem(s.getPlato().getIdPlato());
                        d.setNombreItem(s.getPlato().getNombre());
                        d.setTipo("PLATO");
                    } else if (s.getMenu() != null) {
                        d.setIdItem(s.getMenu().getId());
                        d.setNombreItem(s.getMenu().getNombre());
                        d.setTipo("MENU");
                    }

                    d.setCantidad(s.getCantidad());
                    d.setPrecioUnitario(s.getPrecioUnitario());
                    d.setEstado(s.getEstado());

                    return d;
                });
    }
}
