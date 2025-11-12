package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PedidoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<PedidoEntity,Integer>, JpaSpecificationExecutor<PedidoEntity> {
    @Query("SELECT p FROM PedidoEntity p WHERE p.mesa.idMesa = :idMesa AND p.estado IN ('EN_PROCESO','ORDENADO')")
    Optional<PedidoEntity> findPedidoActivoByMesa(@Param("idMesa") Integer idMesa);
}
