import React from 'react';
import GraficoRadarEstilizado from './GraficoRadarEstilizado';
import { GraficoChakraBar } from './index';
import GraficoBarEstilizado from './GraficoBarEstilizado';
import GraficoLineEstilizado from './GraficoLineEstilizado';
import GraficoAreaEstilizado from './GraficoAreaEstilizado';
import GraficoMandala from './GraficoMandala';

// TAMANHO PADRÃO para todos os gráficos (garante consistência visual)
const ALTURA_GRAFICO_PADRAO = 450; // Aumentado de 400 para 450px
const LARGURA_GRAFICO_PADRAO = '100%';

// Props:
// terapia = O objeto Terapia completo (com o campo "tipo_visualizacao_sugerido")
// dadosDaSessao = Os dados puros da sessão (ex: { 'Nível de Energia Vital': 7, ... })
const GraficoSnapshotSessao = ({ terapia, dadosDaSessao }) => {
  
  if (!terapia || !dadosDaSessao) {
    return null;
  }

  // 1. Prepara os dados
  // Pega os labels da estrutura da terapia (apenas campos numéricos)
  const camposNumericos = terapia.campos_formulario?.filter(campo => campo.tipo === 'escala_1_10') || [];
  const labels = camposNumericos.map(campo => campo.label);
  
  // Pega os valores dos dados da sessão NA MESMA ORDEM dos labels
  // (IMPORTANTE: Apenas campos do tipo 'escala_1_10')
  const data = camposNumericos.map(campo => {
      // Encontra o valor correspondente nos dados da sessão
      const valorOriginal = parseFloat(dadosDaSessao[campo.label]) || 0;
      
      // Se a chave indicar algo negativo que queremos inverter
      // (ex: "Tensão" alta = ruim, mas no gráfico queremos mostrar "Relaxamento" alto = bom)
      const labelLower = campo.label.toLowerCase();
      const camposNegativos = ['tensão', 'dor', 'ansiedade', 'estresse', 'medo', 'preocupação'];
      
      if (camposNegativos.some(termo => labelLower.includes(termo))) {
          // Inverte: se marcou 8 de tensão (ruim), mostramos 2 de relaxamento (bom)
          return Math.max(0, Math.min(10, 10 - valorOriginal));
      }
      
      return Math.max(0, Math.min(10, valorOriginal)); // Garante que está entre 0-10
  });

  // Se não houver dados numéricos, não mostra gráfico
  if (data.length === 0 || data.every(v => v === 0)) {
      return null;
  }

  const tituloDoGrafico = `Avaliação - ${terapia.nome}`;

  // 2. A LÓGICA "INTELIGENTE"
  const tipoVisualizacao = terapia.tipo_visualizacao_sugerido || 'radar'; // Padrão é radar

  // Wrapper para garantir tamanho consistente em todos os gráficos
  // Para gráficos radar com muitos campos ou labels longos, aumentar altura
  const temLabelsLongos = labels.some(l => l.length > 20);
  const numCampos = labels.length;
  const alturaWrapper = (tipoVisualizacao === 'radar' && (temLabelsLongos || numCampos > 6)) 
    ? 550 // Mais alto para radares complexos
    : ALTURA_GRAFICO_PADRAO;
  
  const WrapperGrafico = ({ children }) => (
    <div style={{ 
      width: LARGURA_GRAFICO_PADRAO, 
      height: `${alturaWrapper}px`,
      minHeight: `${alturaWrapper}px`,
      position: 'relative'
    }}>
      {children}
    </div>
  );

  switch (tipoVisualizacao) {
    
    case 'chakra_bar':
      return (
        <WrapperGrafico>
          <GraficoChakraBar 
            labels={labels} 
            data={data} 
            titulo={tituloDoGrafico} 
          />
        </WrapperGrafico>
      );
      
    case 'bar':
    case 'barras':
      return (
        <WrapperGrafico>
          <GraficoBarEstilizado
            titulo={tituloDoGrafico}
            labels={labels}
            data={data}
            cores={data.map(valor => {
              if (valor >= 7) return '#10b981'; // Verde
              if (valor >= 5) return '#f59e0b'; // Amarelo/Laranja
              return '#ef4444'; // Vermelho
            })}
          />
        </WrapperGrafico>
      );

    case 'line':
    case 'linha':
      return (
        <WrapperGrafico>
          <GraficoLineEstilizado
            labels={labels}
            data={data}
            titulo={tituloDoGrafico}
          />
        </WrapperGrafico>
      );

    case 'area':
      return (
        <WrapperGrafico>
          <GraficoAreaEstilizado
            labels={labels}
            data={data}
            titulo={tituloDoGrafico}
          />
        </WrapperGrafico>
      );

    case 'mandala':
      return (
        <WrapperGrafico>
          <GraficoMandala
            labels={labels}
            data={data}
            titulo={tituloDoGrafico}
          />
        </WrapperGrafico>
      );
      
    case 'radar':
    default:
      return (
        <WrapperGrafico>
          <GraficoRadarEstilizado 
            labels={labels} 
            data={data} 
            titulo={tituloDoGrafico} 
          />
        </WrapperGrafico>
      );
  }
};

export default GraficoSnapshotSessao;
