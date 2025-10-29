import React from 'react';
import Chart from 'react-apexcharts';

// Gráfico de linha para evolução temporal
const GraficoLineEstilizado = ({ labels, data, titulo, cores }) => {
  const options = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: {
        enabled: true,
        type: 'x'
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    title: {
      text: titulo || 'Evolução Temporal',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1f2937'
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: labels || [],
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px'
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
    colors: cores || ['#8B5CF6', '#3B82F6', '#10B981'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: undefined,
        inverseColors: false,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    markers: {
      size: 6,
      hover: { size: 8 }
    },
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
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    }
  };

  const series = Array.isArray(data[0]) 
    ? data.map((serie, index) => ({
        name: labels ? `Série ${index + 1}` : 'Valores',
        data: serie
      }))
    : [{
        name: 'Evolução',
        data: data || []
      }];

  return <Chart options={options} series={series} type="line" height={400} />;
};

export default GraficoLineEstilizado;

