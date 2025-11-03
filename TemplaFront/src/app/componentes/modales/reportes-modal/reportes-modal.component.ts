import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../../services/reporte.service';
import { ReporteReservasDTO } from '../../models/ReporteReservasDTO';
import { AlertService } from '../../../services/alert.service';

declare var google: any;

@Component({
  selector: 'app-reportes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-modal.component.html',
  styleUrls: ['./reportes-modal.component.css']
})
export class ReportesModalComponent implements OnInit {
  
  isVisible = false;
  fechaInicio = '';
  fechaFin = '';
  tipoReporte = 'fechas'; // 'fechas' o 'horarios'
  private currentChart: any = null;
  
  constructor(
    private reporteService: ReporteService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Configurar fechas por defecto (último mes)
    const hoy = new Date();
    const mesAnterior = new Date();
    mesAnterior.setMonth(hoy.getMonth() - 1);
    
    this.fechaFin = hoy.toISOString().split('T')[0];
    this.fechaInicio = mesAnterior.toISOString().split('T')[0];
    
    this.loadGoogleCharts();
  }

  private loadGoogleCharts() {
    google.charts.load('current', { packages: ['corechart'] });
  }

  show() {
    this.isVisible = true;
    // Esperar a que el modal esté visible antes de generar el gráfico
    setTimeout(() => {
      this.generarReporte();
    }, 100);
  }

  hide() {
    this.isVisible = false;
  }

  generarReporte() {
    if (this.tipoReporte === 'fechas') {
      this.generarReporteFechas();
    } else {
      this.generarReporteHorarios();
    }
  }

  private generarReporteFechas() {
    this.reporteService.getFechasConcurridas(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (data: ReporteReservasDTO[]) => {
          this.crearGraficoBarras(data, 'Reservas por Fecha', 'chart-fechas');
        },
        error: (error) => {
          this.alertService.showError('Error al cargar el reporte de fechas', 'No se pudieron obtener los datos del servidor');
          console.error('Error:', error);
        }
      });
  }

  private generarReporteHorarios() {
    this.reporteService.getHorariosConcurridos(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (data: ReporteReservasDTO[]) => {
          this.crearGraficoBarras(data, 'Reservas por Horario', 'chart-horarios');
        },
        error: (error) => {
          this.alertService.showError('Error al cargar el reporte de horarios', 'No se pudieron obtener los datos del servidor');
          console.error('Error:', error);
        }
      });
  }

  private crearGraficoBarras(data: ReporteReservasDTO[], titulo: string, elementId: string) {
    google.charts.setOnLoadCallback(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento ${elementId} no encontrado`);
        return;
      }

      const chartData = google.visualization.arrayToDataTable([
        ['Período', 'Total Reservas', 'Total Comensales'],
        ...data.map(item => [
          item.periodo,
          Number(item.totalReservas),
          Number(item.totalComensales)
        ])
      ]);

      const options = {
        title: titulo,
        titleTextStyle: {
          fontSize: 18,
          bold: true,
          color: '#696848'
        },
        hAxis: {
          title: this.tipoReporte === 'fechas' ? 'Fechas' : 'Horarios',
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { fontSize: 11, color: '#755143' },
          slantedText: true,
          slantedTextAngle: 45
        },
        vAxis: {
          title: 'Cantidad',
          minValue: 0,
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { color: '#755143', fontSize: 11 }
        },
        legend: {
          position: 'top',
          alignment: 'center',
          textStyle: { color: '#755143', fontSize: 12, bold: true }
        },
        colors: ['#84C473', '#d2a46d'],
        backgroundColor: {
          fill: '#F4EADD',
          stroke: '#d2a46d',
          strokeWidth: 2
        },
        chartArea: {
          left: 70,
          top: 60,
          right: 30,
          bottom: 100,
          width: '85%',
          height: '60%',
          backgroundColor: '#ffffff'
        },
        bar: { groupWidth: '65%' },
        animation: {
          duration: 1000,
          easing: 'out',
          startup: true
        },
        height: 500,
        width: '100%'
      };

      // Limpiar gráfico anterior si existe
      if (this.currentChart) {
        this.currentChart.clearChart();
      }

      this.currentChart = new google.visualization.ColumnChart(element);
      this.currentChart.draw(chartData, options);
    });
  }

  onTipoReporteChange() {
    this.generarReporte();
  }
}