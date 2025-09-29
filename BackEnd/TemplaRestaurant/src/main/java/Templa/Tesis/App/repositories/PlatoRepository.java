package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PlatoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatoRepository extends JpaRepository<PlatoEntity, Integer>, JpaSpecificationExecutor<PlatoEntity> {
    @Query("SELECT DISTINCT p FROM PlatoEntity p " +
            "LEFT JOIN FETCH p.ingredientes pp " +
            "LEFT JOIN FETCH pp.producto " +
            "WHERE p.fechaBaja IS NULL " +
            "ORDER BY p.nombre ASC, p.fechaAlta ASC")
    Page<PlatoEntity> findAllWithIngredientes(Pageable pageable);

    @Query("SELECT p FROM PlatoEntity p WHERE LOWER(p.nombre) like LOWER(:nombre) AND p.fechaBaja IS NULL")
    PlatoEntity findByNombre(String nombre);

    @Query("SELECT DISTINCT p FROM PlatoEntity p " +
            "LEFT JOIN FETCH p.ingredientes d " +
            "LEFT JOIN FETCH d.producto " +
            "WHERE p.idPlato = :id")
    Optional<PlatoEntity> findByIdWithIngredientes(@Param("id") Integer id);
}
