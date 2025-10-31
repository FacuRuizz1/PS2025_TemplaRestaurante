package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.ReservaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<ReservaEntity,Integer>, JpaSpecificationExecutor<ReservaEntity>{
    ReservaEntity findByNroReserva(int nroReserva);


}
