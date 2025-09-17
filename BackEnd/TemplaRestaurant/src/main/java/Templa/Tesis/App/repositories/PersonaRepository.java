package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PersonaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonaRepository extends JpaRepository<PersonaEntity, Integer> {
    @Query("""
        SELECT p FROM PersonaEntity p 
        WHERE p.fechaBaja IS NULL 
        AND (
            :busqueda IS NULL OR :busqueda = '' OR
            LOWER(p.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR
            LOWER(p.apellido) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR
            LOWER(p.email) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR
            CAST(:busqueda AS int) IS NOT NULL AND p.dni = CAST(:busqueda AS int)
        )
        AND (:tipoPersona IS NULL OR p.tipoPersona = :tipoPersona)""")
    Page<PersonaEntity> findByFiltros(@Param("busqueda") String busqueda, @Param("tipoPersona") String tipoPersona,
                                        Pageable pageable);

    @Query("SELECT p FROM PersonaEntity p WHERE p.fechaBaja IS NULL")
    Page<PersonaEntity> findAllActive(Pageable pageable);

    @Query("SELECT p FROM PersonaEntity p WHERE p.dni = :dni AND p.fechaBaja IS NULL")
    PersonaEntity findByDni(@Param("dni") int dni);
}
