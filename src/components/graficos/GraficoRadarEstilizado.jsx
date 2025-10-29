import React from 'react';
import Chart from 'react-apexcharts';

// Recebe os "labels" (ex: 'Energia Vital') e os "dados" (ex: [7, 6, 8])
const GraficoRadarEstilizado = ({ labels, data, titulo }) => {
  const options = {
    chart: {
      type: 'radar',
      toolbar: { show: false }, // Esconde o menu de download
      dropShadow: {
        enabled: true,
        blur: 1,
        opacity: 0.2
      }
    },
    title: {
      text: titulo || 'Análise Multidimensional',
      align: 'center',
      style: { 
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1f2937'
      }
    },
    xaxis: {
      categories: labels, // Os "raios" do radar
      labels: {
        style: {
          colors: ['#4b5563', '#4b5563', '#4b5563', '#4b5563', '#4b5563', '#4b5563'],
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    yaxis: {
      min: 0,
      max: 10, // Nossa escala é sempre 1-10
      tickAmount: 5, // Mostra 5 níveis (0, 2, 4, 6, 8, 10)
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '11px'
        }
      }
    },
    stroke: {
      curve: 'smooth', // Linhas curvas (orgânicas)
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.25,
        gradientToColors: ['#3498DB'],
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    markers: {
      size: 5,
      hover: { size: 7 },
      colors: ['#8E44AD']
    },
    colors: ['#8E44AD'],
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `${value}/10`
      }
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#e5e7eb',
          fill: {
            colors: ['#f9fafb', '#ffffff']
          }
        }
      }
    }
  };

  const series = [
    {
      name: 'Pontuação da Sessão',
      data: data, // Os valores [7, 6, 8, 5, 7, 9]
    }
  ];

  return <Chart options={options} series={series} type="radar" height={400} />;
};

export default GraficoRadarEstilizado;

