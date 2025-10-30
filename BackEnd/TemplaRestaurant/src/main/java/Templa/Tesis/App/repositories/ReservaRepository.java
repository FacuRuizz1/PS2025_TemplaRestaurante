package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.ReservaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<ReservaEntity,Integer> {
    ReservaEntity findByNroReserva(int nroReserva);

}
