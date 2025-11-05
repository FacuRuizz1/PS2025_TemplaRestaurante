package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PedidoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PedidoRepository extends JpaRepository<PedidoEntity,Integer>, JpaSpecificationExecutor<PedidoEntity> {
}
