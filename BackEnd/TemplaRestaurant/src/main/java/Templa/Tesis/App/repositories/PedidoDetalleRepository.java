package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PedidoDetalleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PedidoDetalleRepository extends JpaRepository<PedidoDetalleEntity,Integer> {
    void deleteByPedidoId(Integer id);
}
