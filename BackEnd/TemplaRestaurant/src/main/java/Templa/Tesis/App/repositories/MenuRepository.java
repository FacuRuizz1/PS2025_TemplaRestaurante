package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.MenuEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuRepository extends JpaRepository<MenuEntity,Integer> {

    @Query("SELECT m FROM MenuEntity m WHERE " +
           "(:buscarFiltro IS NULL OR LOWER(m.nombre) LIKE LOWER(CONCAT('%', :buscarFiltro, '%')) OR " +
           "LOWER(m.descripcion) LIKE LOWER(CONCAT('%', :buscarFiltro, '%'))) AND " +
           "(:estado IS NULL OR " +
           "(:estado = 'ACTIVO' AND m.activo = true) OR " +
           "(:estado = 'INACTIVO' AND m.activo = false))")
    Page<MenuEntity> findMenusWithFilters(@Param("buscarFiltro") String buscarFiltro,
                                         @Param("estado") String estado,
                                         Pageable pageable);
}

