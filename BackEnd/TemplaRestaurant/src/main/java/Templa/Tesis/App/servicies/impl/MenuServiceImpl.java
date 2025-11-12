package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.GetMenuDTO;
import Templa.Tesis.App.dtos.GetProductosMenuDto;
import Templa.Tesis.App.dtos.PostMenuDTO;
import Templa.Tesis.App.dtos.PostProductosMenuDto;
import Templa.Tesis.App.entities.MenuDetalleEntity;
import Templa.Tesis.App.entities.MenuEntity;
import Templa.Tesis.App.entities.PlatoEntity;
import Templa.Tesis.App.entities.ProductoEntity;
import Templa.Tesis.App.repositories.MenuDetalleRepository;
import Templa.Tesis.App.repositories.MenuRepository;
import Templa.Tesis.App.repositories.PlatoRepository;
import Templa.Tesis.App.repositories.ProductoRepository;
import Templa.Tesis.App.servicies.IMenuService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements IMenuService {

    private final MenuRepository menuRepository;
    private final MenuDetalleRepository menuDetalleRepository;
    private final PlatoRepository platoRepository;
    private final ProductoRepository productoRepository;
    private final ModelMapper modelMapper;

    @Override
    public Page<GetMenuDTO> getMenus(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MenuEntity> menuEntities = menuRepository.findAll(pageable);
        return menuEntities.map(this::convertToDto);
    }

    @Override
    public Page<GetMenuDTO> getMenus(String buscarFiltro, String estado, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MenuEntity> menuEntities = menuRepository.findMenusWithFilters(buscarFiltro, estado, pageable);
        return menuEntities.map(menu -> convertToDto(menu));
    }

    private GetMenuDTO convertToDto(MenuEntity menu) {
        GetMenuDTO dto = modelMapper.map(menu, GetMenuDTO.class);

        // Obtener los productos del menú
        List<MenuDetalleEntity> detalles = menuDetalleRepository.findByMenuId(menu.getId());

        List<GetProductosMenuDto> productosDtos = detalles.stream()
                .map(detalle -> {
                    GetProductosMenuDto productoDto = new GetProductosMenuDto();

                    // ✅ CORRECCIÓN: Solo asignar IDs si no son null
                    if (detalle.getPlato() != null) {
                        productoDto.setIdPlato(detalle.getPlato().getIdPlato());
                    }
                    if (detalle.getProducto() != null) {
                        productoDto.setIdProducto(detalle.getProducto().getId());
                    }

                    return productoDto;
                })
                .collect(Collectors.toList());

        dto.setProductos(productosDtos);
        return dto;
    }

    @Override
    @Transactional
    public GetMenuDTO createMenu(PostMenuDTO postMenuDTO) {
        // Validaciones
        if (postMenuDTO.getNombre() == null || postMenuDTO.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if (postMenuDTO.getPrecio() == null || postMenuDTO.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        if (postMenuDTO.getProductos() == null || postMenuDTO.getProductos().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe agregar al menos un producto al menú");
        }

        try {
            MenuEntity menuEntity = modelMapper.map(postMenuDTO, MenuEntity.class);
            menuEntity.setActivo(true);
            MenuEntity savedMenu = menuRepository.save(menuEntity);

            // Crear los detalles del menú - VERSIÓN CORREGIDA
            List<MenuDetalleEntity> detalles = new ArrayList<>();
            for (PostProductosMenuDto producto : postMenuDTO.getProductos()) {
                MenuDetalleEntity detalle = new MenuDetalleEntity();
                detalle.setMenu(savedMenu);

                // ✅ CORRECCIÓN: Validar que al menos uno de los dos IDs esté presente
                if (producto.getIdPlato() == null && producto.getIdProducto() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Cada item del menú debe tener al menos un plato o un producto");
                }

                // ✅ CORRECCIÓN: Agregar plato solo si viene el ID
                if (producto.getIdPlato() != null) {
                    PlatoEntity plato = platoRepository.findById(producto.getIdPlato())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "El plato con ID " + producto.getIdPlato() + " no existe"));
                    detalle.setPlato(plato);
                }

                // ✅ CORRECCIÓN: Agregar producto solo si viene el ID
                if (producto.getIdProducto() != null) {
                    ProductoEntity productoEntity = productoRepository.findById(producto.getIdProducto())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "El producto con ID " + producto.getIdProducto() + " no existe"));
                    detalle.setProducto(productoEntity);
                }

                detalles.add(detalle);
            }
            menuDetalleRepository.saveAll(detalles);

            return convertToDto(savedMenu);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al crear el menú: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public GetMenuDTO actualizarMenu(GetMenuDTO menuActualizar) {
        // Validaciones
        if (menuActualizar.getNombre() == null || menuActualizar.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if (menuActualizar.getPrecio() == null || menuActualizar.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        Optional<MenuEntity> menuOptional = menuRepository.findById(menuActualizar.getId());
        if (menuOptional.isPresent()) {
            try {
                MenuEntity menuExistente = menuOptional.get();
                menuExistente.setNombre(menuActualizar.getNombre());
                menuExistente.setDescripcion(menuActualizar.getDescripcion());
                menuExistente.setPrecio(menuActualizar.getPrecio());
                menuExistente.setDisponibleDesde(menuActualizar.getDisponibleDesde());
                menuExistente.setDisponibleHasta(menuActualizar.getDisponibleHasta());
                menuExistente.setActivo(menuActualizar.isActivo());

                MenuEntity menuActualizado = menuRepository.save(menuExistente);

                // Actualizar productos del menú
                updateProductosMenu(menuActualizado, menuActualizar.getProductos());

                return convertToDto(menuActualizado);

            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Error al actualizar el menú: " + e.getMessage());
            }
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + menuActualizar.getId());
    }

    private void updateProductosMenu(MenuEntity menu, List<GetProductosMenuDto> nuevosProductos) {
        // Eliminar detalles actuales
        List<MenuDetalleEntity> detallesActuales = menuDetalleRepository.findByMenuId(menu.getId());
        if (!detallesActuales.isEmpty()) {
            menuDetalleRepository.deleteAll(detallesActuales);
        }

        // Crear nuevos detalles - VERSIÓN CORREGIDA
        if (nuevosProductos != null && !nuevosProductos.isEmpty()) {
            List<MenuDetalleEntity> nuevosDetalles = new ArrayList<>();

            for (GetProductosMenuDto producto : nuevosProductos) {
                MenuDetalleEntity detalle = new MenuDetalleEntity();
                detalle.setMenu(menu);

                // ✅ CORRECCIÓN: Validar que al menos uno de los dos IDs esté presente
                if (producto.getIdPlato() == null && producto.getIdProducto() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Cada item del menú debe tener al menos un plato o un producto");
                }

                // ✅ CORRECCIÓN: Agregar plato solo si viene el ID
                if (producto.getIdPlato() != null) {
                    PlatoEntity plato = platoRepository.findById(producto.getIdPlato())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Plato con ID " + producto.getIdPlato() + " no existe"));
                    detalle.setPlato(plato);
                }

                // ✅ CORRECCIÓN: Agregar producto solo si viene el ID
                if (producto.getIdProducto() != null) {
                    ProductoEntity productoEntity = productoRepository.findById(producto.getIdProducto())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Producto con ID " + producto.getIdProducto() + " no existe"));
                    detalle.setProducto(productoEntity);
                }

                nuevosDetalles.add(detalle);
            }

            menuDetalleRepository.saveAll(nuevosDetalles);
        }
    }

    @Override
    public void activarDesactivarMenu(Integer id) {
        Optional<MenuEntity> menuOptional = menuRepository.findById(id);
        if (menuOptional.isPresent()) {
            MenuEntity menu = menuOptional.get();
            menu.setActivo(!menu.getActivo());
            menuRepository.save(menu);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + id);
        }
    }

    @Override
    public void bajaMenu(Integer id) {
        Optional<MenuEntity> menuOptional = menuRepository.findById(id);
        if (menuOptional.isPresent()) {
            MenuEntity menu = menuOptional.get();
            menu.setActivo(false);
            menuRepository.save(menu);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + id);
        }
    }

    public List<MenuDetalleEntity> obtenerDetallesMenu(Integer idMenu) {
        List<MenuDetalleEntity> detalles = menuDetalleRepository.findByMenuId(idMenu);

        if (detalles.isEmpty()) {
            throw new RuntimeException("El menú con id " + idMenu + " no existe o no tiene detalles");
        }

        return detalles;
    }

    @Override
    public GetMenuDTO obtenerMenuPorId(Integer id) {
        Optional<MenuEntity> menuOptional = menuRepository.findById(id);
        if (menuOptional.isPresent()) {
            return convertToDto(menuOptional.get());
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + id);
        }
    }

    @Override
    public void desactivarMenusQueUsan(Integer idProducto) {
        List<MenuEntity> menusConProducto = menuRepository.findByDetallesProductoId(idProducto);

        for (MenuEntity menu : menusConProducto) {
            if (menu.getActivo()) {
                menu.setActivo(false);
                menuRepository.save(menu);

                System.out.println("Menú desactivado: " + menu.getNombre() +
                        " (falta producto: " + idProducto + ")");
            }
        }

        // Menús que contengan platos que usan este producto
        List<PlatoEntity> platosAfectados = platoRepository.findByIngredienteProductoId(idProducto);

        for (PlatoEntity plato : platosAfectados) {
            List<MenuEntity> menusConPlato = menuRepository.findByDetallesPlatoId(plato.getIdPlato());

            for (MenuEntity menu : menusConPlato) {
                if (menu.getActivo()) {
                    menu.setActivo(false);
                    menuRepository.save(menu);

                    System.out.println("Menú desactivado: " + menu.getNombre() +
                            " (falta producto en plato: " + plato.getNombre() + ")");
                }
            }
        }
    }

    @Override
    public void reactivarMenusQueUsan(Integer idProducto) {
        List<MenuEntity> menus = menuRepository.findByDetallesProductoId(idProducto);

        for (MenuEntity menu : menus) {
            if (todosLosItemsDelMenuDisponibles(menu) && !menu.getActivo()) {
                menu.setActivo(true);
                menuRepository.save(menu);

                System.out.println("Menú reactivado: " + menu.getNombre());
            }
        }

        // Reactivar menús que contienen platos con este producto
        List<PlatoEntity> platos = platoRepository.findByIngredienteProductoId(idProducto);

        for (PlatoEntity plato : platos) {
            if (plato.getDisponible()) {
                List<MenuEntity> menusConPlato = menuRepository.findByDetallesPlatoId(plato.getIdPlato());

                for (MenuEntity menu : menusConPlato) {
                    if (todosLosItemsDelMenuDisponibles(menu) && !menu.getActivo()) {
                        menu.setActivo(true);
                        menuRepository.save(menu);

                        System.out.println("Menú reactivado: " + menu.getNombre());
                    }
                }
            }
        }
    }

private boolean todosLosItemsDelMenuDisponibles(MenuEntity menu) {
    List<MenuDetalleEntity> detalles = menuDetalleRepository.findByMenuId(menu.getId());
    return detalles.stream().allMatch(detalle -> {
        ProductoEntity producto = detalle.getProducto();
        if (producto != null) {
            return producto.getActivo() && producto.getStockActual() > 0;
        }
        PlatoEntity plato = detalle.getPlato();
        if (plato != null) {
            return plato.getDisponible();
        }
        return false;
    });
}
}
