package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.MesaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MesaRepository extends JpaRepository<MesaEntity, Integer>, JpaSpecificationExecutor<MesaEntity> {
    Optional<MesaEntity> findByNumeroMesa(String numeroMesa);
}
