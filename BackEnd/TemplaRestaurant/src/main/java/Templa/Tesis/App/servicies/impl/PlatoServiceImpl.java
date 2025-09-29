package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.TipoPlato;
import Templa.Tesis.App.dtos.GetIngredientesDto;
import Templa.Tesis.App.dtos.GetPlatoDto;
import Templa.Tesis.App.dtos.PostIngredientesDto;
import Templa.Tesis.App.dtos.PostPlatoDto;
import Templa.Tesis.App.entities.PlatoDetalleEntity;
import Templa.Tesis.App.entities.PlatoEntity;
import Templa.Tesis.App.entities.ProductoEntity;
import Templa.Tesis.App.repositories.PlatoDetalleRepository;
import Templa.Tesis.App.repositories.PlatoRepository;
import Templa.Tesis.App.repositories.ProductoRepository;
import Templa.Tesis.App.servicies.IPlatoService;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Sort;
import jakarta.persistence.criteria.Predicate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlatoServiceImpl implements IPlatoService {
    @Autowired
    private PlatoRepository platoRepository;
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private PlatoDetalleRepository platoDetalleRepository;
    @Autowired
    private ProductoRepository productoRepository;

    @Override
    public Page<GetPlatoDto> getPlatos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PlatoEntity> platos = platoRepository.findAllWithIngredientes(pageable);
        return platos.map(this::convertToDto);
    }

    private GetPlatoDto convertToDto(PlatoEntity plato) {
        GetPlatoDto dto = modelMapper.map(plato, GetPlatoDto.class);

        List<PlatoDetalleEntity> ingredientes = platoDetalleRepository.findByPlatoIdPlato(plato.getIdPlato());

        List<GetIngredientesDto> ingredientesDtos = ingredientes.stream()
                .map(detalle -> new GetIngredientesDto(
                        detalle.getProducto().getId(),
                        detalle.getCantidad()
                ))
                .collect(Collectors.toList());

        dto.setIngredientes(ingredientesDtos);
        return dto;
    }

    @Override
    public Page<GetPlatoDto> getPlatos(String buscarFiltro, String tipoPlato, String estado, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());

        Specification<PlatoEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // ✅ Filtro por estado (igual que personas)
            if (estado != null && !estado.isEmpty()) {
                if ("DISPONIBLES".equals(estado)) {
                    predicates.add(cb.equal(root.get("disponible"), true));
                    predicates.add(cb.isNull(root.get("fechaBaja")));
                } else if ("NO_DISPONIBLES".equals(estado)) {
                    predicates.add(cb.equal(root.get("disponible"), false));
                } else if ("BAJA".equals(estado)) {
                    predicates.add(cb.isNotNull(root.get("fechaBaja")));
                } // 'TODOS' no agrega predicate
            }

            // ✅ Filtro por buscarFiltro (nombre y precio)
            if (buscarFiltro != null && !buscarFiltro.isEmpty()) {
                String pattern = "%" + buscarFiltro.toLowerCase() + "%";

                // Buscar por nombre y descripción
                Predicate nombrePred = cb.like(cb.lower(root.get("nombre")), pattern);
                Predicate descripcionPred = cb.like(cb.lower(root.get("descripcion")), pattern);

                // Buscar por precio
                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(nombrePred);
                searchPredicates.add(descripcionPred);

                try {
                    Double precioFiltro = Double.parseDouble(buscarFiltro);
                    searchPredicates.add(cb.equal(root.get("precio"), precioFiltro));
                    // También buscar en precio con descuento si existe
                    searchPredicates.add(cb.equal(root.get("descuento"), precioFiltro));
                } catch (NumberFormatException e) {
                    // Si no es numérico, solo buscar por texto
                }

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            // ✅ Filtro por tipoPlato
            if (tipoPlato != null && !tipoPlato.isEmpty()) {
                predicates.add(cb.equal(root.get("tipoPlato"), TipoPlato.valueOf(tipoPlato)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PlatoEntity> filtrados = platoRepository.findAll(spec, pageable);
        return filtrados.map(this::convertToDto);
    }

    @Override
    @Transactional
    public GetPlatoDto createPlato(PostPlatoDto platoNuevo) {
        if(platoNuevo.getNombre().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if(platoNuevo.getPrecio() == null || platoNuevo.getPrecio() <= 0){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        if(platoNuevo.getIngredientes() == null || platoNuevo.getIngredientes().isEmpty()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar al menos un ingrediente");
        }

        PlatoEntity existe = platoRepository.findByNombre(platoNuevo.getNombre());

        if (existe != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El plato ya existe.");
        }

        try{
            PlatoEntity nuevoPlato = modelMapper.map(platoNuevo, PlatoEntity.class);
            nuevoPlato.setDisponible(true);
            nuevoPlato.setFechaAlta(LocalDateTime.now());
            nuevoPlato.setUserAlta(2);
            PlatoEntity guardado = platoRepository.save(nuevoPlato);

            List<PlatoDetalleEntity> detalles = new ArrayList<>();
            for (PostIngredientesDto ing : platoNuevo.getIngredientes()) {
                ProductoEntity ingrediente = productoRepository.findById(Integer.valueOf(ing.getId()))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto no existe"));

                PlatoDetalleEntity detalle = new PlatoDetalleEntity();
                detalle.setPlato(guardado);
                detalle.setProducto(ingrediente);
                detalle.setCantidad(ing.getCantidad());
                detalles.add(detalle);
            }
            platoDetalleRepository.saveAll(detalles);

            return convertToDto(guardado);

        }
        catch (Exception e){
            throw e;
        }
    }

    @Override
    public GetPlatoDto updatePlato(GetPlatoDto platoActualizado) {

        if(platoActualizado.getNombre().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if(platoActualizado.getPrecio() == null || platoActualizado.getPrecio() <= 0){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        PlatoEntity platoExistente = platoRepository.findById(platoActualizado.getIdPlato())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));


        PlatoEntity platoConMismoNombre = platoRepository.findByNombre(platoActualizado.getNombre());
        if (platoConMismoNombre != null && !platoConMismoNombre.getIdPlato().equals(platoActualizado.getIdPlato())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro plato con ese nombre");
        }

        try {
            modelMapper.map(platoActualizado, platoExistente);
            PlatoEntity platoGuardado = platoRepository.save(platoExistente);


            updateIngredientes(platoGuardado, platoActualizado.getIngredientes());

            return convertToDto(platoGuardado);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al actualizar el plato: " + e.getMessage());
        }
    }

    private void updateIngredientes(PlatoEntity plato, List<GetIngredientesDto> nuevosIngredientes) {
        List<PlatoDetalleEntity> detallesActuales = platoDetalleRepository.findByPlatoIdPlato(Integer.valueOf(plato.getIdPlato()));
        if (!detallesActuales.isEmpty()) {
            platoDetalleRepository.deleteAll(detallesActuales);
        }

        if (nuevosIngredientes != null && !nuevosIngredientes.isEmpty()) {
            List<PlatoDetalleEntity> nuevosDetalles = new ArrayList<>();

            for (GetIngredientesDto ing : nuevosIngredientes) {

                ProductoEntity producto = productoRepository.findById(ing.getIdProducto())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Producto con ID " + ing.getIdProducto() + " no existe"));

                PlatoDetalleEntity detalle = new PlatoDetalleEntity();
                detalle.setPlato(plato);
                detalle.setProducto(producto);
                detalle.setCantidad(ing.getCantidad());
                nuevosDetalles.add(detalle);
            }

            platoDetalleRepository.saveAll(nuevosDetalles);
        }
    }

    @Override
    public void activarDesactivarPlato(Integer id) {
        PlatoEntity plato = platoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));

        plato.setDisponible(!plato.getDisponible());
        platoRepository.save(plato);
    }

    @Override
    public void bajaPlato(Integer id) {
        PlatoEntity plato = platoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));

        if (plato.getFechaBaja() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El plato ya está dado de baja");
        }

        plato.setFechaBaja(LocalDateTime.now());
        plato.setUserBaja(2);
        plato.setDisponible(false);
        platoRepository.save(plato);
    }
}
