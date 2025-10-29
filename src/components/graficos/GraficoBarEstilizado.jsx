import React from 'react';
import Chart from 'react-apexcharts';

// Gráfico de barras simples estilizado
const GraficoBarEstilizado = ({ labels, data, titulo, cores }) => {
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
      text: titulo || 'Análise Comparativa',
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
        distributed: false,
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
      categories: labels || [],
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '11px'
        },
        rotate: -45,
        rotateAlways: false
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
    colors: cores || ['#3B82F6'],
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val}/10`
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: undefined,
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.4,
        stops: [0, 100]
      }
    }
  };

  const series = [{
    name: 'Valores',
    data: data || []
  }];

  return <Chart options={options} series={series} type="bar" height={400} />;
};

export default GraficoBarEstilizado;

