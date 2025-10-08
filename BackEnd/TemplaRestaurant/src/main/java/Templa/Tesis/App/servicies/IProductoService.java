package Templa.Tesis.App.servicies;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostProductoDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IProductoService {
    ProductoDTO registrarProducto(PostProductoDTO nuevoProducto);
    ProductoDTO actualizarProducto(Integer id, ProductoDTO productoDTO);
    Page<ProductoDTO> traerProductos(int page, int size);
    Page<ProductoDTO> traerProductos(int page, int size, String buscar, TipoProducto tipo, Boolean activo);
    Page<ProductoDTO> traerInsumos(int page, int size);
    void eliminarProducto(Integer id);
}
