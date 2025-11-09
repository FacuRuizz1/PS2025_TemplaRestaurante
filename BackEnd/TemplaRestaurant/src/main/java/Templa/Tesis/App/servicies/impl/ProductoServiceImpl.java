package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.dtos.PostProductoDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import Templa.Tesis.App.entities.ProductoEntity;
import Templa.Tesis.App.repositories.ProductoRepository;
import Templa.Tesis.App.servicies.IProductoService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements IProductoService {

    private final ModelMapper modelMapper;
    private final ProductoRepository productoRepository;
    private final PlatoServiceImpl platoService;
    private final MenuServiceImpl menuService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Override
    public ProductoDTO registrarProducto(PostProductoDTO nuevoProducto) {
        if(nuevoProducto.getNombre() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar el nombre");
        }
        if(nuevoProducto.getTipo() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar el tipo de producto");
        }
        if(nuevoProducto.getUnidadMedida() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar la unidad de medida");
        }
        if(nuevoProducto.getPrecio() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar el precio");
        }

        ProductoEntity existe = productoRepository.findByNombre(nuevoProducto.getNombre());

        if(existe !=null){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"El producto ya existe");
        }

        try{
            ProductoEntity producto = modelMapper.map(nuevoProducto,ProductoEntity.class);
            ProductoEntity productoGuardado = productoRepository.save(producto);
            ProductoDTO productoDTO = modelMapper.map(productoGuardado,ProductoDTO.class);
            
            return productoDTO;
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Error al guardar el producto");
        }
    }

    @Override
    public ProductoDTO actualizarProducto(Integer id, ProductoDTO productoDTO) {
        ProductoEntity productoExistente = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con ID: " + id));

        productoExistente.setNombre(productoDTO.getNombre());
        productoExistente.setTipo(productoDTO.getTipo());
        productoExistente.setStockActual(productoDTO.getStockActual());
        productoExistente.setStockMinimo(productoDTO.getStockMinimo());
        productoExistente.setStockMaximo(productoDTO.getStockMaximo());
        productoExistente.setActivo(productoDTO.isActivo());
        productoExistente.setPrecio(productoDTO.getPrecio());

        if (productoExistente.getStockActual()<= productoExistente.getStockMinimo()) {
            platoService.desactivarPlatosQueUsan(id);
            menuService.desactivarMenusQueUsan(id);
        } else {
            platoService.reactivarPlatosQueUsan(id);
            menuService.reactivarMenusQueUsan(id);
        }

        ProductoEntity productoActualizado = productoRepository.save(productoExistente);
        ProductoDTO productoActualizadoDTO = modelMapper.map(productoActualizado,ProductoDTO.class);


        return productoActualizadoDTO;
    }

    @Override
    public Page<ProductoDTO> traerProductos(int page, int size) {
        Pageable pageable = PageRequest.of(page,size, Sort.by("nombre").ascending());
        Page<ProductoEntity> productoEntities = productoRepository.findAll(pageable);
        return productoEntities.map(productoEntity -> modelMapper.map(productoEntity, ProductoDTO.class));
    }

    @Override
    public Page<ProductoDTO> traerProductos(int page, int size, String buscar, TipoProducto tipo, Boolean activo) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());

        Specification<ProductoEntity> spec = Specification.where(null);

        if (buscar != null && !buscar.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("nombre")), "%" + buscar.toLowerCase() + "%"));
        }

        if (tipo != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("tipo"), tipo));
        }

        if (activo != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("activo"), activo));
        }

        Page<ProductoEntity> entities = productoRepository.findAll(spec, pageable);
        return entities.map(entity -> modelMapper.map(entity, ProductoDTO.class));
    }

    @Override
    public void eliminarProducto(Integer id) {
        ProductoEntity producto = productoRepository.findById(id)
                .orElseThrow(()-> new EntityNotFoundException("Producto no encontrado con el ID: " + id));

        String nombreProducto = producto.getNombre();
        productoRepository.delete(producto);

    }

    @Override
    public Page<ProductoDTO> traerInsumos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());

        Specification<ProductoEntity> spec = Specification.where(
                (root, query, cb) -> cb.equal(root.get("tipo"), TipoProducto.INSUMO)
        );

        Page<ProductoEntity> entities = productoRepository.findAll(spec, pageable);
        return entities.map(entity -> modelMapper.map(entity, ProductoDTO.class));
    }
    @Override
    @Transactional
    public ProductoEntity reducirStock(Integer idProducto, double cantidad) {
        ProductoEntity producto = productoRepository.findByIdWithLock(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no existe"));

        if (producto.getStockActual() < cantidad) {
            throw new RuntimeException("Stock insuficiente");
        }

        producto.setStockActual(producto.getStockActual() - cantidad);

        if (producto.getStockActual() <= producto.getStockMinimo()) {
            //TODO: Emitir alerta
            ProductoDTO productoDTO = modelMapper.map(producto,ProductoDTO.class);
            notificationService.enviarAlertaStockBajo(productoDTO);

            //Enviar email de alerta
            emailService.enviarMailStockBajo(
                    "templarestaurante@gmail.com",
                    producto.getNombre(),
                    producto.getStockActual(),
                    producto.getStockMinimo()
            );
        }

        if (producto.getStockActual() <= producto.getStockMinimo()) {
            producto.setActivo(false);
            platoService.desactivarPlatosQueUsan(idProducto);
            menuService.desactivarMenusQueUsan(idProducto);
        }

        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public void aumentarStock(Integer idProducto, double cantidad) {
        ProductoEntity producto = productoRepository.findByIdWithLock(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no existe"));

        producto.setStockActual(producto.getStockActual() + cantidad);

        if (producto.getStockActual() > producto.getStockMinimo()) {
            producto.setActivo(true);
            platoService.reactivarPlatosQueUsan(idProducto);
            menuService.reactivarMenusQueUsan(idProducto);
        }
        productoRepository.save(producto);
    }
}
