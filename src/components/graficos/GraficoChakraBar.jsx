import React from 'react';
import Chart from 'react-apexcharts';

// Gráfico de barras especializado para chakras (7 chakras principais)
const GraficoChakraBar = ({ labels, data, titulo }) => {
  // Cores específicas para cada chakra
  const coresChakras = [
    '#DC2626', // Vermelho - Raiz
    '#EA580C', // Laranja - Sacral
    '#FBBF24', // Amarelo - Plexo Solar
    '#10B981', // Verde - Cardíaco
    '#3B82F6', // Azul - Laríngeo
    '#8B5CF6', // Índigo - Frontal
    '#EC4899'  // Violeta - Coronário
  ];

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    title: {
      text: titulo || 'Equilíbrio dos Chakras',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1f2937'
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}/10`,
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#1f2937']
      }
    },
    xaxis: {
      categories: labels || ['Raiz', 'Sacral', 'Plexo Solar', 'Cardíaco', 'Laríngeo', 'Frontal', 'Coronário'],
      labels: {
        style: {
          colors: coresChakras,
          fontSize: '12px',
          fontWeight: 600
        }
      }
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
    colors: coresChakras,
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val}/10`
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4
    }
  };

  const series = [{
    name: 'Nível de Ativação',
    data: data || []
  }];

  return <Chart options={options} series={series} type="bar" height={400} />;
};

export default GraficoChakraBar;

