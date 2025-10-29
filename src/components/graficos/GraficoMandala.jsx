import React from 'react';
import Chart from 'react-apexcharts';

// Gráfico tipo mandala/roseta circular para geometrias sagradas
const GraficoMandala = ({ labels, data, titulo }) => {
  const options = {
    chart: {
      type: 'polarArea',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    title: {
      text: titulo || 'Geometria Sagrada',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1f2937'
      }
    },
    labels: labels || [],
    fill: {
      opacity: 0.7,
      colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#FBBF24', '#EA580C', '#DC2626']
    },
    colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#FBBF24', '#EA580C', '#DC2626'],
    stroke: {
      width: 2,
      colors: ['#fff']
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: {
        formatter: (val) => `${val}`,
        style: {
          colors: '#6b7280',
          fontSize: '11px'
        }
      }
    },
    plotOptions: {
      polarArea: {
        rings: {
          strokeWidth: 1,
          strokeColor: '#e5e7eb'
        },
        spokes: {
          strokeWidth: 1,
          connectorColors: '#e5e7eb'
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val}/10`
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    }
  };

  const series = data || [];

  return <Chart options={options} series={series} type="polarArea" height={400} />;
};

export default GraficoMandala;

