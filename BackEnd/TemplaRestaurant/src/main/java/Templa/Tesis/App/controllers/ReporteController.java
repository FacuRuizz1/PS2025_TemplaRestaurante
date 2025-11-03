package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.ReporteReservasDTO;
import Templa.Tesis.App.servicies.IReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final IReservaService reservaService;

    @GetMapping("/fechas-concurridas")
    public ResponseEntity<List<ReporteReservasDTO>> getFechasConcurridas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        List<ReporteReservasDTO> reporte = reservaService.getReporteFechasConcurridas(fechaInicio, fechaFin);
        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/horarios-concurridos")
    public ResponseEntity<List<ReporteReservasDTO>> getHorariosConcurridos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        List<ReporteReservasDTO> reporte = reservaService.getReporteHorariosConcurridos(fechaInicio, fechaFin);
        return ResponseEntity.ok(reporte);
    }
}
