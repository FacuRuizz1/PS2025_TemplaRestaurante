package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PedidosDetalleEntity;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PedidoDetalleRepository extends JpaRepository<PedidosDetalleEntity, Integer> {
    Optional<PedidosDetalleEntity> findByPedidoId(Integer id);

}
