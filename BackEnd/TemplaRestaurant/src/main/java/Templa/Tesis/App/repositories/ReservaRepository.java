package Templa.Tesis.App.repositories;

import Templa.Tesis.App.dtos.ReporteReservasDTO;
import Templa.Tesis.App.entities.ReservaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<ReservaEntity,Integer>, JpaSpecificationExecutor<ReservaEntity>{
    ReservaEntity findByNroReserva(int nroReserva);

    //Reportes
    @Query("SELECT new Templa.Tesis.App.dtos.ReporteReservasDTO(CAST(r.fechaReserva AS string), COUNT(r), SUM(r.cantidadComensales)) " +
            "FROM ReservaEntity r " +
            "WHERE r.fechaReserva BETWEEN :fechaInicio AND :fechaFin " +
            "GROUP BY r.fechaReserva " +
            "ORDER BY COUNT(r) DESC")
    List<ReporteReservasDTO> findReservasPorFecha(@Param("fechaInicio") LocalDate fechaInicio, @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT new Templa.Tesis.App.dtos.ReporteReservasDTO(CAST(r.horario AS string), COUNT(r), SUM(r.cantidadComensales)) " +
            "FROM ReservaEntity r " +
            "WHERE r.fechaReserva BETWEEN :fechaInicio AND :fechaFin " +
            "GROUP BY r.horario " +
            "ORDER BY COUNT(r) DESC")
    List<ReporteReservasDTO> findReservasPorHorario(@Param("fechaInicio") LocalDate fechaInicio, @Param("fechaFin") LocalDate fechaFin);


}
