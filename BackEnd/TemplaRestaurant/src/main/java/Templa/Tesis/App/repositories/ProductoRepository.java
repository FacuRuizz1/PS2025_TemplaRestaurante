package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.ProductoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<ProductoEntity,Integer>, JpaSpecificationExecutor<ProductoEntity> {

    ProductoEntity findByNombre(String nombre);

}
