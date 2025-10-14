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
        List<MenuDetalleEntity> productos = menuDetalleRepository.findByMenuId(menu.getId());

        List<GetProductosMenuDto> productosDtos = productos.stream()
                .map(detalle -> new GetProductosMenuDto(
                        detalle.getPlato() != null ? detalle.getPlato().getIdPlato() : null,
                        detalle.getProducto().getId()
                ))
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

            // Crear los detalles del menú
            List<MenuDetalleEntity> detalles = new ArrayList<>();
            for (PostProductosMenuDto producto : postMenuDTO.getProductos()) {
                MenuDetalleEntity detalle = new MenuDetalleEntity();
                detalle.setMenu(savedMenu);

                // Si tiene plato, lo agregamos
                if (producto.getIdPlato() != null) {
                    PlatoEntity plato = platoRepository.findById(producto.getIdPlato())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "El plato con ID " + producto.getIdPlato() + " no existe"));
                    detalle.setPlato(plato);
                }

                // Agregar producto
                ProductoEntity productoEntity = productoRepository.findById(producto.getIdProducto())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "El producto con ID " + producto.getIdProducto() + " no existe"));
                detalle.setProducto(productoEntity);

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

        // Crear nuevos detalles
        if (nuevosProductos != null && !nuevosProductos.isEmpty()) {
            List<MenuDetalleEntity> nuevosDetalles = new ArrayList<>();

            for (GetProductosMenuDto producto : nuevosProductos) {
                MenuDetalleEntity detalle = new MenuDetalleEntity();
                detalle.setMenu(menu);

                // Si tiene plato, lo agregamos
                if (producto.getIdPlato() != null) {
                    PlatoEntity plato = platoRepository.findById(producto.getIdPlato())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Plato con ID " + producto.getIdPlato() + " no existe"));
                    detalle.setPlato(plato);
                }

                // Agregar producto
                ProductoEntity productoEntity = productoRepository.findById(producto.getIdProducto())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Producto con ID " + producto.getIdProducto() + " no existe"));
                detalle.setProducto(productoEntity);

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
            menu.setActivo(!menu.isActivo());
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
}
