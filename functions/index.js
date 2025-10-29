/**
 * Firebase Cloud Functions para APP 5D
 * Geração de PDFs com Puppeteer
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const puppeteer = require('puppeteer');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Gerar PDF de relatório quântico usando Puppeteer
 * 
 * @param {Object} data - Dados do relatório
 * @param {string} data.pacienteNome - Nome do paciente
 * @param {Object} data.analise - Análise quântica completa
 * @param {string} data.terapeutaNome - Nome do terapeuta
 * @param {Array} data.sessoes - Array de sessões
 * @param {Object} data.graficos - Dados dos gráficos (opcional)
 * 
 * @returns {Promise<Buffer>} PDF em formato buffer
 */
exports.gerarPDFRelatorio = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário deve estar autenticado para gerar PDFs'
    );
  }

  try {
    console.log('🔄 Iniciando geração de PDF para:', data.pacienteNome);
    
    // Validar dados obrigatórios
    if (!data.pacienteNome || !data.analise) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dados incompletos: pacienteNome e analise são obrigatórios'
      );
    }

    // Iniciar browser Puppeteer com configurações otimizadas
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=none' // Melhor renderização de texto
      ]
    });

    const page = await browser.newPage();
    
    // Configurar viewport maior para melhor qualidade
    await page.setViewport({ 
      width: 1920, 
      height: 2400,
      deviceScaleFactor: 2 // Aumentar DPI para melhor qualidade
    });

    // Gerar HTML do relatório
    const htmlContent = generateHTMLReport(data);

    // Carregar HTML na página
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Aguardar ApexCharts carregar completamente
    await page.waitForFunction(() => {
      return typeof window.ApexCharts !== 'undefined';
    }, { timeout: 15000 });
    
    // Aguardar renderização de todos os gráficos
    await page.evaluate(() => {
      return new Promise((resolve) => {
        // Aguardar todos os scripts de gráficos executarem
        const chartElements = document.querySelectorAll('[id^="chart-"]');
        if (chartElements.length === 0) {
          resolve();
          return;
        }
        
        let rendered = 0;
        chartElements.forEach((el) => {
          // Verificar se o gráfico foi renderizado (tem SVG)
          const checkRender = setInterval(() => {
            if (el.querySelector('svg') || el.querySelector('canvas')) {
              rendered++;
              clearInterval(checkRender);
              if (rendered === chartElements.length) {
                resolve();
              }
            }
          }, 100);
          
          // Timeout após 5 segundos
          setTimeout(() => {
            clearInterval(checkRender);
            rendered++;
            if (rendered === chartElements.length) {
              resolve();
            }
          }, 5000);
        });
      });
    });
    
    // Aguardar um pouco mais para garantir que tudo está estável
    await page.waitForTimeout(1000);

    // Gerar PDF com configurações de alta qualidade
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1.0, // Escala padrão
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; color: #6b7280; width: 100%; text-align: center; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">APP 5D Therapists - Relatório Confidencial</div>',
      footerTemplate: '<div style="font-size: 9px; color: #6b7280; width: 100%; text-align: center; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Página <span class="pageNumber"></span> de <span class="totalPages"></span> - ' + dataAtual + '</div>'
    });

    await browser.close();

    console.log('✅ PDF gerado com sucesso, tamanho:', pdfBuffer.length, 'bytes');

    // Converter buffer para base64 para enviar via Firebase Functions
    const pdfBase64 = pdfBuffer.toString('base64');

    return {
      success: true,
      pdf: pdfBase64,
      filename: `relatorio_quantico_${data.pacienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    };

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Erro ao gerar PDF: ${error.message}`
    );
  }
});

/**
 * Gera HTML completo do relatório com gráficos renderizados
 */
function generateHTMLReport(data) {
  const { pacienteNome, analise, terapeutaNome, sessoes = [], terapias = {} } = data;
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Preparar dados das sessões com gráficos
  const sessoesComGraficos = sessoes.map(sessao => {
    const terapia = terapias[sessao.terapia_id] || {};
    return {
      ...sessao,
      terapiaNome: terapia.nome || 'N/A',
      tipoGrafico: terapia.tipo_visualizacao_sugerido || 'radar',
      resultadosNumericos: Object.entries(sessao.resultados || {})
        .filter(([key, value]) => {
          const num = parseFloat(value);
          return !isNaN(num) && num > 0;
        })
        .map(([key, value]) => ({
          label: key.length > 30 ? key.substring(0, 30) + '...' : key,
          valor: parseFloat(value)
        }))
    };
  }).filter(s => s.resultadosNumericos.length > 0);

  // Sanitizar nomes para evitar problemas de encoding
  const sanitizeText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const pacienteNomeSafe = sanitizeText(pacienteNome);
  const terapeutaNomeSafe = sanitizeText(terapeutaNome);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Relatório Quântico - ${pacienteNomeSafe}</title>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.47.0"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
            padding: 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* CAPA */
        .capa {
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
            margin-bottom: 40px;
            border-radius: 12px;
            page-break-after: always;
        }
        
        .capa h1 {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .capa h2 {
            font-size: 20px;
            font-weight: normal;
            opacity: 0.9;
        }
        
        .capa .info {
            margin-top: 40px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            font-size: 14px;
        }
        
        /* SEÇÕES */
        .secao {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .secao-titulo {
            font-size: 24px;
            font-weight: bold;
            color: #8B5CF6;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #8B5CF6;
            page-break-after: avoid;
        }
        
        .score-geral {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .score-numero {
            font-size: 72px;
            font-weight: bold;
            margin: 20px 0;
        }
        
        .score-label {
            font-size: 18px;
            opacity: 0.9;
        }
        
        /* SESSÕES */
        .sessao-card {
            margin-bottom: 40px;
            padding: 25px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-inside: avoid;
        }
        
        .sessao-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .sessao-titulo {
            font-size: 20px;
            font-weight: bold;
            color: #8B5CF6;
        }
        
        .sessao-data {
            font-size: 14px;
            color: #6b7280;
        }
        
        /* GRÁFICOS */
        .grafico-container {
            margin: 30px 0;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            page-break-inside: avoid;
            min-height: 400px;
            width: 100%;
        }
        
        .grafico-titulo {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
        }
        
        /* CAMPOS ENERGÉTICOS */
        .campos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .campo-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            page-break-inside: avoid;
        }
        
        .campo-nome {
            font-weight: bold;
            font-size: 16px;
            color: #8B5CF6;
            margin-bottom: 10px;
        }
        
        .campo-valor {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .campo-status {
            font-size: 12px;
            color: #6b7280;
        }
        
        .barra-progresso {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            margin-top: 10px;
            overflow: hidden;
        }
        
        .barra-progresso-fill {
            height: 100%;
            background: linear-gradient(90deg, #8B5CF6, #EC4899);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        /* TABELAS */
        .tabela {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .tabela th {
            background: #8B5CF6;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        
        .tabela td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .tabela tr:last-child td {
            border-bottom: none;
        }
        
        /* OBSERVAÇÕES */
        .observacoes {
            background: #fef3c7;
            border-left: 4px solid #fbbf24;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        .observacoes h3 {
            color: #92400e;
            margin-bottom: 10px;
        }
        
        /* FOOTER */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            page-break-inside: avoid;
        }
        
        /* CSS PARA IMPRESSÃO - CONTROLE DE QUEBRAS DE PÁGINA */
        @media print {
            body {
                padding: 0;
            }
            
            .capa {
                page-break-after: always;
                margin-bottom: 0;
            }
            
            .secao {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .sessao-card {
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 30px;
            }
            
            .grafico-container {
                page-break-inside: avoid;
                break-inside: avoid;
                min-height: 400px;
            }
            
            .secao-titulo {
                page-break-after: avoid;
                page-break-inside: avoid;
            }
            
            .tabela {
                page-break-inside: avoid;
            }
            
            .tabela thead {
                display: table-header-group;
            }
            
            .tabela tbody {
                display: table-row-group;
            }
            
            .tabela tr {
                page-break-inside: avoid;
            }
        }
        
        @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- CAPA -->
        <div class="capa">
            <h1>✨ RELATÓRIO QUÂNTICO</h1>
            <h2>Análise Profunda de Evolução Terapêutica</h2>
            <div class="info">
                <div><strong>Paciente:</strong> ${pacienteNomeSafe}</div>
                <div><strong>Terapeuta:</strong> ${terapeutaNomeSafe || 'Terapeuta'}</div>
                <div><strong>Data:</strong> ${dataAtual}</div>
            </div>
        </div>
        
        <!-- SCORE GERAL -->
        ${analise && analise.scoreGeral ? `
        <div class="secao">
            <div class="score-geral">
                <div class="score-label">Score Geral de Evolução</div>
                <div class="score-numero">${analise.scoreGeral}/100</div>
                <div class="score-label">${getScoreLabelFromScore(analise.scoreGeral)}</div>
            </div>
        </div>
        ` : ''}
        
        <!-- RESUMO EXECUTIVO -->
        ${analise ? `
        <div class="secao">
            <div class="secao-titulo">📊 Resumo Executivo</div>
            <div class="campos-grid">
                <div class="campo-card">
                    <div class="campo-nome">Total de Sessões</div>
                    <div class="campo-valor">${analise.totalSessoes || sessoes.length}</div>
                    <div class="campo-status">Sessões realizadas</div>
                </div>
                <div class="campo-card">
                    <div class="campo-nome">Velocidade de Melhoria</div>
                    <div class="campo-valor" style="font-size: 24px;">${analise.velocidadeMelhoria || 'Moderada'}</div>
                    <div class="campo-status">Progressão identificada</div>
                </div>
                ${analise.camposCriticos && analise.camposCriticos.length > 0 ? `
                <div class="campo-card" style="border-color: #ef4444; background: #fef2f2;">
                    <div class="campo-nome" style="color: #dc2626;">Campos Críticos</div>
                    <div class="campo-valor" style="color: #dc2626;">${analise.camposCriticos.length}</div>
                    <div class="campo-status">Requerem atenção</div>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <!-- ANÁLISE POR CAMPO -->
        ${analise && analise.indicesPorCampo ? `
        <div class="secao">
            <div class="secao-titulo">📊 Análise Detalhada por Campo Energético</div>
            <div class="campos-grid">
                ${Object.entries(analise.indicesPorCampo).slice(0, 9).map(([campo, dados]) => {
                  const valor = parseFloat(dados.atual) || 0;
                  const percentual = (valor / 10) * 100;
                  let statusColor = '#ef4444';
                  let statusText = 'Atenção';
                  if (valor >= 7) { statusColor = '#10b981'; statusText = 'Excelente'; }
                  else if (valor >= 5) { statusColor = '#f59e0b'; statusText = 'Bom'; }
                  
                  return `
                    <div class="campo-card">
                        <div class="campo-nome">${campo.length > 25 ? campo.substring(0, 25) + '...' : campo}</div>
                        <div class="campo-valor" style="color: ${statusColor};">${valor.toFixed(1)}/10</div>
                        <div class="campo-status">${statusText}</div>
                        <div class="barra-progresso">
                            <div class="barra-progresso-fill" style="width: ${percentual}%; background: ${statusColor};"></div>
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- SESSÕES COM GRÁFICOS -->
        ${sessoesComGraficos.length > 0 ? `
        <div class="secao">
            <div class="secao-titulo">📈 Histórico de Sessões com Análises Visuais</div>
            ${sessoesComGraficos.map((sessao, index) => {
              const dataFormatada = new Date(sessao.data_sessao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });
              
              const labelsArray = sessao.resultadosNumericos.map(r => r.label);
              const valoresArray = sessao.resultadosNumericos.map(r => r.valor);
              const coresArray = valoresArray.map(v => {
                if (v >= 7) return '#10b981';
                if (v >= 5) return '#f59e0b';
                return '#ef4444';
              });
              
              const chartId = `chart-${index}`;
              const tipoGrafico = sessao.tipoGrafico || 'bar';
              
              let chartConfig = '';
              if (tipoGrafico === 'radar') {
                chartConfig = JSON.stringify({
                  chart: { 
                    type: 'radar', 
                    height: 400, 
                    toolbar: { show: false },
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  },
                  series: [{ 
                    name: 'Avaliação', 
                    data: valoresArray 
                  }],
                  xaxis: { 
                    categories: labelsArray,
                    labels: { style: { fontSize: '12px', fontFamily: 'inherit' } }
                  },
                  yaxis: { 
                    min: 0, 
                    max: 10,
                    labels: { style: { fontSize: '12px', fontFamily: 'inherit' } }
                  },
                  fill: { type: 'gradient', opacity: 0.7 },
                  colors: ['#8B5CF6'],
                  stroke: { width: 3, curve: 'smooth' },
                  markers: { size: 5 },
                  plotOptions: { radar: { polygons: { strokeColors: '#e5e7eb' } } }
                });
              } else if (tipoGrafico === 'mandala' || tipoGrafico === 'polarArea') {
                chartConfig = JSON.stringify({
                  chart: { 
                    type: 'polarArea', 
                    height: 400, 
                    toolbar: { show: false },
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  },
                  labels: labelsArray,
                  series: valoresArray,
                  fill: { opacity: 0.7 },
                  colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#FBBF24', '#EA580C', '#DC2626'],
                  stroke: { width: 2, colors: ['#fff'] },
                  legend: { show: true, position: 'bottom', fontSize: '12px' },
                  plotOptions: { polarArea: { rings: { strokeWidth: 1, strokeColor: '#e5e7eb' } } }
                });
              } else {
                chartConfig = JSON.stringify({
                  chart: { 
                    type: 'bar', 
                    height: 400, 
                    toolbar: { show: false },
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  },
                  plotOptions: { 
                    bar: { 
                      borderRadius: 8, 
                      columnWidth: '60%', 
                      distributed: true,
                      dataLabels: { position: 'top' }
                    } 
                  },
                  xaxis: { 
                    categories: labelsArray,
                    labels: { 
                      style: { fontSize: '11px', fontFamily: 'inherit' },
                      rotate: -45,
                      rotateAlways: false
                    }
                  },
                  yaxis: { 
                    min: 0, 
                    max: 10,
                    labels: { style: { fontSize: '12px', fontFamily: 'inherit' } },
                    title: { text: 'Escala 0-10', style: { fontSize: '12px', fontFamily: 'inherit' } }
                  },
                  series: [{ name: 'Valores', data: valoresArray }],
                  colors: coresArray,
                  dataLabels: { 
                    enabled: true, 
                    style: { fontSize: '11px', fontFamily: 'inherit' },
                    formatter: function(val) { return val.toFixed(1) + '/10'; }
                  },
                  tooltip: { 
                    y: { formatter: function(val) { return val.toFixed(1) + '/10'; } }
                  }
                });
              }
              
              return `
                <div class="sessao-card">
                    <div class="sessao-header">
                        <div class="sessao-titulo">${sessao.terapiaNome}</div>
                        <div class="sessao-data">${dataFormatada}</div>
                    </div>
                    
                    <div class="grafico-container">
                        <div class="grafico-titulo">Avaliação - ${sessao.terapiaNome}</div>
                        <div id="${chartId}"></div>
                    </div>
                    
                    ${sessao.observacoes_gerais ? `
                    <div class="observacoes">
                        <h3>Observações Gerais:</h3>
                        <p>${sessao.observacoes_gerais}</p>
                    </div>
                    ` : ''}
                    
                    <script>
                        (function() {
                            try {
                                const element = document.querySelector('#${chartId}');
                                if (element) {
                                    const options = ${chartConfig};
                                    const chart = new ApexCharts(element, options);
                                    chart.render().then(() => {
                                        console.log('Gráfico ${chartId} renderizado');
                                    });
                                }
                            } catch (error) {
                                console.error('Erro ao renderizar gráfico ${chartId}:', error);
                            }
                        })();
                    </script>
                </div>
              `;
            }).join('')}
        </div>
        ` : ''}
        
        <!-- TABELA RESUMO DE SESSÕES -->
        ${sessoes.length > 0 ? `
        <div class="secao">
            <div class="secao-titulo">📋 Resumo das Sessões</div>
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Terapia</th>
                        <th>Média</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessoes.slice(0, 15).map(sessao => {
                      let soma = 0, count = 0;
                      if (sessao.resultados) {
                        Object.values(sessao.resultados).forEach(v => {
                          const num = parseFloat(v);
                          if (!isNaN(num) && num > 0) { soma += num; count++; }
                        });
                      }
                      const media = count > 0 ? (soma / count).toFixed(1) : '0';
                      const numMedia = parseFloat(media);
                      const status = numMedia >= 7 ? '✓' : numMedia >= 5 ? '~' : '!';
                      const dataSessao = sessao.data_sessao ? new Date(sessao.data_sessao).toLocaleDateString('pt-BR') : '-';
                      const terapiaNome = terapias[sessao.terapia_id]?.nome || 'N/A';
                      
                      return `
                        <tr>
                            <td>${dataSessao}</td>
                            <td>${terapiaNome}</td>
                            <td style="font-weight: bold;">${media}/10</td>
                            <td style="font-size: 18px;">${status}</td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        
        <!-- RECOMENDAÇÕES -->
        ${analise ? `
        <div class="secao">
            <div class="secao-titulo">💡 Recomendações Terapêuticas</div>
            <div class="observacoes">
                ${getRecommendations(analise)}
            </div>
        </div>
        ` : ''}
        
        <!-- FOOTER -->
        <div class="footer">
            <p><strong>Gerado automaticamente pelo APP 5D Therapists</strong></p>
            <p>Relatório confidencial - Uso exclusivo do terapeuta</p>
            <p style="margin-top: 10px; font-size: 10px;">Documento protegido por sigilo profissional</p>
        </div>
    </div>
    
    <script>
        // Aguardar ApexCharts carregar e renderizar todos os gráficos
        window.addEventListener('load', function() {
            setTimeout(function() {
                console.log('Todos os gráficos renderizados');
            }, 3000);
        });
    </script>
</body>
</html>
  `;
}

/**
 * Funções auxiliares para o template
 */
function getScoreLabelFromScore(score) {
  if (score >= 70) return 'Excelente Evolução ✨';
  if (score >= 50) return 'Boa Evolução 📈';
  if (score >= 30) return 'Evolução Moderada 📊';
  return 'Atenção Necessária ⚠️';
}

function getStatusText(valor) {
  if (valor >= 8) return 'Excelente';
  if (valor >= 6) return 'Bom';
  if (valor >= 4) return 'Moderado';
  return 'Atenção';
}

function getRecommendations(analise) {
  if (!analise || !analise.scoreGeral) {
    return '<p>Realize mais sessões para obter recomendações personalizadas.</p>';
  }
  
  const score = analise.scoreGeral;
  let recommendations = '';
  
  if (score >= 70) {
    recommendations = `
      <h3 style="color: #059669; margin-bottom: 10px;">✨ Status: Excelente Evolução</h3>
      <ul style="margin-left: 20px; line-height: 2;">
        <li>Manter o ritmo atual de sessões</li>
        <li>Consolidar resultados obtidos</li>
        <li>Focar em manutenção preventiva</li>
        <li>Celebrar conquistas com o paciente</li>
      </ul>
    `;
  } else if (score >= 50) {
    recommendations = `
      <h3 style="color: #f59e0b; margin-bottom: 10px;">📊 Status: Boa Progressão</h3>
      <ul style="margin-left: 20px; line-height: 2;">
        <li>Intensificar trabalho nos campos críticos</li>
        <li>Considerar terapias complementares</li>
        <li>Avaliar frequência das sessões</li>
        <li>Monitorar evolução nos próximos 30 dias</li>
      </ul>
    `;
  } else {
    recommendations = `
      <h3 style="color: #dc2626; margin-bottom: 10px;">⚠️ Status: Atenção Necessária</h3>
      <ul style="margin-left: 20px; line-height: 2;">
        <li><strong>URGENTE:</strong> Revisar protocolo terapêutico completo</li>
        <li>Considerar abordagens complementares</li>
        <li>Aumentar frequência das sessões</li>
        <li>Investigar fatores externos impactantes</li>
        <li>Avaliar necessidade de apoio multidisciplinar</li>
      </ul>
    `;
  }
  
  return recommendations;
}

