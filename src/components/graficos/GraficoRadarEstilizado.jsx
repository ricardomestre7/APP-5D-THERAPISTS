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
      },
      zoom: {
        enabled: false
      },
      // Aumentar padding para evitar que labels sejam cortados
      offsetX: 10,
      offsetY: 20
    },
    title: {
      text: titulo || 'Análise Multidimensional',
      align: 'center',
      style: { 
        fontSize: '20px', // Aumentado de 18px para 20px
        fontWeight: 'bold',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      },
      offsetY: 10 // Espaçamento do topo
    },
    xaxis: {
      categories: labels, // Os "raios" do radar
      labels: {
        style: {
          colors: ['#4b5563', '#4b5563', '#4b5563', '#4b5563', '#4b5563', '#4b5563'],
          fontSize: '14px', // Aumentado de 12px para 14px
          fontWeight: 600 // Aumentado de 500 para 600 para melhor legibilidade
        },
        // Rotacionar labels se forem muito longos
        rotate: labels.some(l => l.length > 15) ? -45 : 0,
        maxHeight: 60
      }
    },
    yaxis: {
      min: 0,
      max: 10, // Nossa escala é sempre 1-10
      tickAmount: 5, // Mostra 5 níveis (0, 2, 4, 6, 8, 10)
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '13px' // Aumentado de 11px para 13px
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

  // Aumentar altura para gráficos com muitos labels ou labels longos
  const numLabels = labels.length;
  const temLabelsLongos = labels.some(l => l.length > 20);
  const alturaFinal = temLabelsLongos || numLabels > 6 ? 500 : 450; // Aumentado de 400 para 450-500px
  
  return <Chart options={options} series={series} type="radar" height={alturaFinal} />;
};

export default GraficoRadarEstilizado;

