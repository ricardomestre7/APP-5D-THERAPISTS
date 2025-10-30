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
        '--font-render-hinting=none', // Melhor renderização de texto
        '--lang=pt-BR', // Definir locale para pt-BR
        '--disable-features=TranslateUI' // Desabilitar tradução
      ]
    });

    const page = await browser.newPage();
    
    // Configurar encoding e locale explicitamente
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Content-Language': 'pt-BR'
    });
    
    // Configurar viewport maior para melhor qualidade
    await page.setViewport({ 
      width: 1920, 
      height: 2400,
      deviceScaleFactor: 2 // Aumentar DPI para melhor qualidade
    });
    
    // Configurar contexto de navegação para UTF-8
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'pt-BR'
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en']
      });
    });

    // Sanitizar dados ANTES de gerar HTML (função auxiliar)
    const sanitizeText = (text) => {
      if (!text) return '';
      try {
        let str = String(text).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        str = str.normalize('NFC');
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      } catch (error) {
        return String(text).replace(/[^\w\s\.\,\!\?\-\:]/gi, '');
      }
    };

    // Gerar HTML do relatório
    const htmlContent = generateHTMLReport(data);

    // Definir encoding UTF-8 explicitamente na página ANTES de carregar conteúdo
    await page.setExtraHTTPHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    });
    
    // Carregar HTML na página com encoding UTF-8
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0'
    });

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
    
    // Injetar data atualizada no footer ANTES de gerar PDF
    const dataAtualFooter = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    await page.evaluate((data) => {
      const footerData = document.getElementById('data-footer');
      if (footerData) {
        footerData.textContent = data;
      }
    }, dataAtualFooter);

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
      headerTemplate: '<div style="font-size: 10px; color: #6b7280; width: 100%; text-align: center; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-rendering: optimizeLegibility;">APP 5D Therapists - Relatório Confidencial</div>',
      footerTemplate: '<div style="font-size: 9px; color: #6b7280; width: 100%; text-align: center; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-rendering: optimizeLegibility;">Página <span class="pageNumber"></span> de <span class="totalPages"></span> - <span id="data-footer"></span></div>'
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
  // Deserializar e validar dados recebidos
  let pacienteNome = data.pacienteNome || '';
  let terapeutaNome = data.terapeutaNome || 'Terapeuta';
  let analise = data.analise || {};
  let sessoes = Array.isArray(data.sessoes) ? data.sessoes : [];
  let terapias = data.terapias || {};
  
  // Garantir que strings sejam UTF-8 válidas ANTES de qualquer processamento
  if (typeof pacienteNome !== 'string') pacienteNome = String(pacienteNome || '');
  if (typeof terapeutaNome !== 'string') terapeutaNome = String(terapeutaNome || 'Terapeuta');
  
  // Log para debug (apenas em desenvolvimento)
  console.log('📝 Dados recebidos:', {
    pacienteNome: pacienteNome.substring(0, 50),
    terapeutaNome: terapeutaNome.substring(0, 50),
    hasAnalise: !!analise,
    sessoesCount: sessoes.length
  });
  
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

  // Sanitizar e normalizar texto para evitar problemas de encoding
  // IMPORTANTE: Preservar acentos e caracteres especiais corretamente
  const sanitizeText = (text) => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'number') return String(text);
    
    try {
      // Converter para string
      let str = String(text);
      
      // Remover caracteres de controle inválidos (exceto quebras de linha \n e tabs \t)
      str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      // Normalizar para NFC (Canonical Decomposition, followed by Canonical Composition)
      // Isso garante que acentos e caracteres especiais sejam representados corretamente
      // NFC é o formato mais comum e compatível
      if (str.normalize) {
        str = str.normalize('NFC');
      }
      
      // NÃO remover caracteres UTF-8 válidos (acentos, emojis, etc)
      // Apenas escapar caracteres HTML perigosos
      str = str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      return str;
    } catch (error) {
      console.error('❌ Erro ao sanitizar texto:', error);
      console.error('📋 Texto original:', text, 'Tipo:', typeof text);
      // Fallback: tentar converter de forma segura
      try {
        return Buffer.from(String(text), 'utf8').toString('utf8').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      } catch (e) {
        return '[Texto inválido]';
      }
    }
  };
  
  // Normalizar nomes ANTES de qualquer processamento
  pacienteNome = sanitizeText(pacienteNome);
  terapeutaNome = sanitizeText(terapeutaNome || 'Terapeuta');
  
  // Função adicional para sanitizar campos de análise que podem ter texto mais complexo
  const sanitizeAnalysisField = (field) => {
    if (!field) return '';
    if (typeof field === 'number') return field.toString();
    return sanitizeText(String(field));
  };

  // Os nomes já foram sanitizados acima
  const pacienteNomeSafe = pacienteNome;
  const terapeutaNomeSafe = terapeutaNome;

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
            text-rendering: optimizeLegibility;
            font-feature-settings: "kern" 1;
            font-kerning: normal;
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
                <div style="font-size: 16px; margin: 10px 0;"><strong>Paciente:</strong> <span style="font-weight: 500;">${pacienteNomeSafe}</span></div>
                <div style="font-size: 16px; margin: 10px 0;"><strong>Terapeuta:</strong> <span style="font-weight: 500;">${terapeutaNomeSafe}</span></div>
                <div style="font-size: 16px; margin: 10px 0;"><strong>Data:</strong> <span style="font-weight: 500;">${dataAtual}</span></div>
            </div>
        </div>
        
        <!-- SCORE GERAL -->
        ${analise && analise.scoreGeral ? `
        <div class="secao">
            <div class="score-geral">
                <div class="score-label">Score Geral de Evolução</div>
                <div class="score-numero">${analise.scoreGeral}/100</div>
                <div class="score-label">${sanitizeText(getScoreLabelFromScore(analise.scoreGeral))}</div>
            </div>
        </div>
        ` : ''}
        
        <!-- RESUMO EXECUTIVO -->
        ${analise ? `
        <div class="secao">
            <div class="secao-titulo">📊 Resumo Executivo</div>
            <div style="background: #f9fafb; border-left: 4px solid #8B5CF6; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0;">
                    Este resumo apresenta os principais indicadores da evolução terapêutica do paciente, 
                    oferecendo uma visão consolidada do progresso geral e aspectos que requerem atenção. 
                    Utilize estas informações para orientar o planejamento das próximas sessões e ajustar o protocolo terapêutico conforme necessário.
                </p>
            </div>
            <div class="campos-grid">
                    <div class="campo-card">
                    <div class="campo-nome">Total de Sessões</div>
                    <div class="campo-valor">${analise.totalSessoes || sessoes.length}</div>
                    <div class="campo-status">Sessões realizadas</div>
                </div>
                <div class="campo-card">
                    <div class="campo-nome">Velocidade de Melhoria</div>
                    <div class="campo-valor" style="font-size: 24px;">${sanitizeText(analise.velocidadeMelhoria || 'Moderada')}</div>
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
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #1e40af; font-size: 14px; line-height: 1.8; margin: 0;">
                    <strong>Como interpretar esta análise:</strong> Cada campo energético representa uma dimensão específica do bem-estar holístico do paciente. 
                    Os valores são calculados com base nas avaliações realizadas durante as sessões terapêuticas, considerando uma escala de 0 a 10. 
                    Campos com valores acima de 7/10 indicam excelente estado, entre 5-7 sugerem bom estado com espaço para melhoria, entre 3-5 apontam necessidade de atenção, 
                    e abaixo de 3 requerem intervenção urgente. Esta análise detalhada permite identificar precisamente quais áreas precisam de trabalho prioritário nas próximas sessões.
                </p>
            </div>
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
                        <div class="campo-nome">${sanitizeText(campo.length > 25 ? campo.substring(0, 25) + '...' : campo)}</div>
                        <div class="campo-valor" style="color: ${statusColor};">${valor.toFixed(1)}/10</div>
                        <div class="campo-status">${sanitizeText(statusText)}</div>
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
              
              // Sanitizar labels e garantir que todos os textos estejam corretos
              const labelsArray = sessao.resultadosNumericos.map(r => sanitizeText(r.label));
              const valoresArray = sessao.resultadosNumericos.map(r => parseFloat(r.valor) || 0);
              
              // Sanitizar nome da terapia e data
              const terapiaNomeSafe = sanitizeText(sessao.terapiaNome || 'Terapia');
              const dataFormatadaSafe = sanitizeText(dataFormatada);
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
                  title: {
                    text: 'Avaliação da Sessão',
                    style: { fontSize: '16px', fontWeight: 'bold', fontFamily: 'inherit' }
                  },
                  series: [{ 
                    name: 'Avaliação', 
                    data: valoresArray 
                  }],
                  xaxis: { 
                    categories: labelsArray,
                    labels: { 
                      style: { 
                        fontSize: '12px', 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 500
                      } 
                    }
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
                        <div class="sessao-titulo">${terapiaNomeSafe}</div>
                        <div class="sessao-data">${dataFormatadaSafe}</div>
                    </div>
                    
                    <div class="grafico-container">
                        <div class="grafico-titulo">Avaliação - ${terapiaNomeSafe}</div>
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
            <div class="secao-titulo">📋 Histórico de Sessões</div>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #78350f; font-size: 14px; line-height: 1.8; margin: 0;">
                    <strong>Análise do Histórico:</strong> Esta tabela apresenta um resumo das sessões realizadas, permitindo identificar padrões de evolução ao longo do tempo. 
                    A coluna "Média" indica a pontuação média de todos os campos avaliados em cada sessão, enquanto os símbolos representam: ✓ (excelente, ≥7), 
                    ~ (bom, 5-6.9) e ! (atenção necessária, &lt;5). Use esta informação para identificar tendências de melhoria ou estabilização, 
                    e para ajustar estratégias terapêuticas conforme a resposta do paciente ao trabalho realizado.
                </p>
            </div>
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
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #1e40af; font-size: 14px; line-height: 1.8; margin: 0;">
                    <strong>Sobre as Recomendações:</strong> As orientações abaixo foram geradas com base na análise quantitativa dos dados coletados durante as sessões. 
                    Elas são sugestões práticas e específicas, fundamentadas nos padrões identificados. Cada recomendação inclui explicações detalhadas sobre o que fazer, 
                    como fazer e por que fazer, para que você possa aplicá-las de forma efetiva no seu trabalho terapêutico. 
                    Adapte estas orientações ao seu conhecimento clínico e às particularidades de cada paciente.
                </p>
            </div>
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
    return `
      <div style="padding: 20px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 15px 0;">
        <p style="color: #1e40af; font-size: 15px; line-height: 1.8; margin: 0;">
          <strong>Orientação Inicial:</strong> Para gerar recomendações personalizadas e detalhadas, é necessário realizar pelo menos 3 sessões terapêuticas com este paciente. 
          Conforme as sessões forem registradas, o sistema poderá identificar padrões, tendências e áreas específicas que necessitam de atenção, proporcionando orientações cada vez mais precisas e acionáveis.
        </p>
      </div>
    `;
  }
  
  const score = analise.scoreGeral;
  const camposCriticos = analise.camposCriticos || [];
  const indicesPorCampo = analise.indicesPorCampo || {};
  let recommendations = '';
  
  // Determinar status geral
  let statusInfo = {
    cor: '#059669',
    titulo: 'Excelente Evolução',
    emoji: '✨',
    descricao: 'O paciente apresenta uma evolução significativa em seus campos energéticos, indicando que o protocolo terapêutico está funcionando de forma muito efetiva.'
  };
  
  if (score < 30) {
    statusInfo = {
      cor: '#dc2626',
      titulo: 'Atenção Necessária Urgente',
      emoji: '⚠️',
      descricao: 'A análise indica que há áreas críticas que requerem intervenção imediata. É fundamental revisar completamente a abordagem terapêutica e considerar ajustes significativos no protocolo.'
    };
  } else if (score < 50) {
    statusInfo = {
      cor: '#ea580c',
      titulo: 'Atenção Necessária',
      emoji: '⚠️',
      descricao: 'Existem diversos campos que necessitam de atenção prioritária. Recomenda-se intensificar o trabalho terapêutico e avaliar a necessidade de abordagens complementares.'
    };
  } else if (score < 70) {
    statusInfo = {
      cor: '#f59e0b',
      titulo: 'Boa Progressão',
      emoji: '📈',
      descricao: 'O paciente está em uma trajetória positiva, mas ainda existem oportunidades de melhoria. Focar nos campos específicos identificados pode acelerar significativamente o progresso.'
    };
  }
  
  // Construir seções detalhadas
  recommendations += `
    <div style="background: ${statusInfo.cor}15; border-left: 5px solid ${statusInfo.cor}; padding: 20px; margin-bottom: 25px; border-radius: 6px;">
      <h3 style="color: ${statusInfo.cor}; margin-top: 0; margin-bottom: 12px; font-size: 20px;">
        ${statusInfo.emoji} Status Geral: ${statusInfo.titulo}
      </h3>
      <p style="color: #374151; font-size: 15px; line-height: 1.8; margin-bottom: 15px;">
        ${statusInfo.descricao} O score geral de <strong>${score}/100</strong> indica que há ${score >= 70 ? 'excelentes' : score >= 50 ? 'boas' : 'importantes'} oportunidades de trabalho terapêutico.
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0;">
        <strong>Interpretação do Score:</strong> Valores acima de 70 indicam excelente progresso, entre 50-69 sugerem boa evolução com espaço para melhorias, entre 30-49 apontam necessidade de atenção, e abaixo de 30 requerem intervenção urgente.
      </p>
    </div>
  `;
  
  // Seção de Campos Críticos com orientações detalhadas
  if (camposCriticos.length > 0) {
    recommendations += `
      <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin-bottom: 25px; border-radius: 6px;">
        <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
          🚨 Campos que Necessitam Atenção Urgente
        </h3>
        <p style="color: #7f1d1d; font-size: 14px; line-height: 1.8; margin-bottom: 15px;">
          Os seguintes campos energéticos apresentam valores críticos (abaixo de 5/10) e requerem atenção prioritária nas próximas sessões:
        </p>
        ${camposCriticos.map(campo => {
          const dadosCampo = indicesPorCampo[campo] || {};
          const valor = parseFloat(dadosCampo.atual) || 0;
          const explicacao = getExplicacaoCampo(campo);
          const orientacoesCampo = getOrientacoesEspecificasCampo(campo, valor);
          
          return `
            <div style="background: white; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
              <h4 style="color: #dc2626; margin-top: 0; margin-bottom: 8px; font-size: 16px; font-weight: bold;">
                ${sanitizeText(campo)} - Valor: ${valor.toFixed(1)}/10
              </h4>
              <p style="color: #374151; font-size: 14px; line-height: 1.7; margin-bottom: 10px;">
                <strong>O que significa:</strong> ${explicacao}
              </p>
              <div style="background: #fffbeb; padding: 12px; border-radius: 4px; margin-top: 10px;">
                <p style="color: #78350f; font-size: 14px; line-height: 1.8; margin: 0;">
                  <strong>Orientações Práticas para Elevar este Campo:</strong><br>
                  ${orientacoesCampo}
                </p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Recomendações Gerais Baseadas no Score
  let recomendacoesGerais = '';
  
  if (score >= 70) {
    recomendacoesGerais = `
      <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
        <h4 style="color: #059669; margin-top: 0; margin-bottom: 12px; font-size: 16px;">Estratégias de Consolidação</h4>
        <ul style="color: #065f46; font-size: 14px; line-height: 2; margin: 0; padding-left: 25px;">
          <li><strong>Manter Ritmo:</strong> Continue com a frequência atual de sessões, pois está gerando resultados positivos. Recomenda-se manter pelo menos 1-2 sessões semanais.</li>
          <li><strong>Consolidar Conquistas:</strong> Dedique tempo nas sessões para reforçar os ganhos obtidos. Peça ao paciente que reflita sobre as melhorias percebidas em sua vida diária.</li>
          <li><strong>Prevenção:</strong> Trabalhe preventivamente nos campos que estão acima de 7/10 mas ainda podem melhorar. Isso cria uma base sólida para sustentar os resultados a longo prazo.</li>
          <li><strong>Celebrar e Validar:</strong> Reconheça os avanços do paciente explicitamente. Isso reforça o sistema de crenças positivas e aumenta a motivação para continuar o processo.</li>
          <li><strong>Documentação:</strong> Registre as técnicas e abordagens que estão funcionando bem para replicar em futuros casos similares.</li>
        </ul>
      </div>
    `;
  } else if (score >= 50) {
    recomendacoesGerais = `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
        <h4 style="color: #92400e; margin-top: 0; margin-bottom: 12px; font-size: 16px;">Estratégias para Acelerar o Progresso</h4>
        <ul style="color: #78350f; font-size: 14px; line-height: 2; margin: 0; padding-left: 25px;">
          <li><strong>Foco Intensivo:</strong> Priorize os campos críticos identificados acima. Dedique 60-70% do tempo de cada sessão especificamente para elevar esses campos.</li>
          <li><strong>Terapias Complementares:</strong> Considere combinar diferentes abordagens terapêuticas. Por exemplo, se o campo Emocional está baixo, pode combinar Reiki com Cristaloterapia e Aromaterapia na mesma sessão.</li>
          <li><strong>Aumentar Frequência:</strong> Se o paciente vem 1 vez por semana, considere temporariamente aumentar para 2 vezes. Isso pode acelerar significativamente a melhoria nos campos críticos.</li>
          <li><strong>Trabalho Domiciliar:</strong> Forneça exercícios simples, meditações ou práticas energéticas que o paciente possa fazer entre as sessões. Isso multiplica o efeito do trabalho terapêutico.</li>
          <li><strong>Avaliar Ambiente:</strong> Converse com o paciente sobre fatores externos que possam estar impactando negativamente os campos energéticos (estresse no trabalho, relacionamentos, alimentação, etc.).</li>
        </ul>
      </div>
    `;
  } else {
    recomendacoesGerais = `
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
        <h4 style="color: #991b1b; margin-top: 0; margin-bottom: 12px; font-size: 16px;">Plano de Ação Urgente</h4>
        <ul style="color: #7f1d1d; font-size: 14px; line-height: 2; margin: 0; padding-left: 25px;">
          <li><strong>Revisar Protocolo Completo:</strong> É necessário repensar a abordagem atual. Analise quais técnicas estão sendo usadas e considere mudanças significativas. Talvez a terapia escolhida não seja a mais adequada para este caso específico.</li>
          <li><strong>Anamnese Aprofundada:</strong> Realize uma anamnese mais detalhada para identificar bloqueios profundos, traumas não resolvidos, ou padrões comportamentais que estejam impedindo o progresso.</li>
          <li><strong>Frequência Urgente:</strong> Recomenda-se aumentar a frequência das sessões para pelo menos 2-3 vezes por semana durante as próximas 4 semanas, ou até que haja melhoria significativa nos campos críticos.</li>
          <li><strong>Abordagem Multidisciplinar:</strong> Considere encaminhar o paciente para outros profissionais (psicólogo, nutricionista, médico) se identificar questões que estejam fora do escopo da terapia energética.</li>
          <li><strong>Fatores Externos:</strong> Investigue profundamente fatores da vida do paciente que possam estar causando bloqueios energéticos persistentes: relacionamentos tóxicos, ambiente de trabalho estressante, questões familiares não resolvidas, etc.</li>
          <li><strong>Técnicas de Limpeza:</strong> Priorize técnicas de limpeza energética profunda nas próximas sessões, antes de trabalhar qualquer outro aspecto. Bloqueios podem estar impedindo que o trabalho terapêutico seja absorvido.</li>
          <li><strong>Comunicação Direta:</strong> Tenha uma conversa franca com o paciente sobre o progresso e ajuste as expectativas. Às vezes, é necessário mais tempo ou uma abordagem diferente para casos mais complexos.</li>
        </ul>
      </div>
    `;
  }
  
  recommendations += recomendacoesGerais;
  
  // Seção de Próximos Passos Específicos
  recommendations += `
    <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; margin-bottom: 25px; border-radius: 6px;">
      <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
        📋 Próximos Passos Recomendados
      </h3>
      <ol style="color: #1e3a8a; font-size: 14px; line-height: 2.2; margin: 0; padding-left: 25px;">
        <li><strong>Revisar este relatório:</strong> Dedique tempo para analisar todos os dados apresentados e identificar padrões específicos para este paciente.</li>
        <li><strong>Planejar próxima sessão:</strong> Baseado nos campos críticos identificados, prepare técnicas e abordagens específicas para a próxima sessão.</li>
        <li><strong>Estabelecer metas:</strong> Em conjunto com o paciente, defina metas realistas e mensuráveis para os próximos 30 dias, focando especialmente nos campos que precisam de atenção.</li>
        <li><strong>Documentar mudanças:</strong> Nas próximas sessões, registre detalhadamente as respostas do paciente a diferentes técnicas, para identificar o que funciona melhor para ele.</li>
        <li><strong>Avaliar em 30 dias:</strong> Após aproximadamente 30 dias ou 4-6 sessões, gere um novo relatório para comparar a evolução e ajustar a estratégia conforme necessário.</li>
        <li><strong>Manter comunicação:</strong> Mantenha diálogo aberto com o paciente sobre seu progresso, sintomas, e como ele está se sentindo entre as sessões. Isso fornece informações valiosas para ajustar o protocolo.</li>
      </ol>
    </div>
  `;
  
  // Nota Final
  recommendations += `
    <div style="background: #f9fafb; border-left: 4px solid #6b7280; padding: 15px; margin-top: 20px; border-radius: 4px;">
      <p style="color: #374151; font-size: 13px; line-height: 1.7; margin: 0; font-style: italic;">
        <strong>Nota Importante:</strong> Este relatório foi gerado com base nos dados das sessões registradas. As recomendações são sugestões baseadas em análises quantitativas, mas devem ser consideradas dentro do contexto único de cada paciente. 
        Use seu conhecimento clínico e intuição terapêutica para adaptar estas orientações à realidade específica de cada caso. O progresso em terapias energéticas pode ser não-linear, então mantenha paciência e persistência.
      </p>
    </div>
  `;
  
  return recommendations;
}

// Função auxiliar para explicações de campos
function getExplicacaoCampo(campo) {
  const explicacoes = {
    'Mental': 'Refere-se ao bem-estar cognitivo, clareza mental, capacidade de concentração e qualidade dos pensamentos. Baixos valores podem indicar sobrecarga mental, confusão ou dificuldades de raciocínio.',
    'Emocional': 'Relacionado ao equilíbrio das emoções, capacidade de gerenciar sentimentos e estabilidade emocional. Valores baixos sugerem desequilíbrios emocionais, instabilidade ou dificuldade em processar emoções.',
    'Físico': 'Representa o estado do corpo físico, níveis de energia corporal, vitalidade e bem-estar físico geral. Indicador importante de saúde e disposição física.',
    'Energético': 'Campo sutil que representa o fluxo de energia vital, chakras e sistema energético como um todo. Crucial para a manutenção da saúde holística.',
    'Espiritual': 'Conectado ao senso de propósito, conexão com algo maior, sentido de vida e bem-estar espiritual. Importante para qualidade de vida e resiliência.',
    'Vibracional': 'Indica a qualidade vibracional geral, ressonância e frequência energética. Baixos valores podem indicar necessidade de elevação vibracional.',
    'Relacional': 'Reflete a qualidade dos relacionamentos e interações sociais. Essencial para bem-estar social e emocional.',
    'Existencial': 'Relacionado ao sentido de existência, propósito de vida e satisfação existencial. Fundamental para motivação e felicidade.',
    'Criativo': 'Representa a expressão criativa, capacidade de inovação e manifestação de ideias. Importante para realização pessoal.',
  };
  
  return explicacoes[campo] || `Este campo energético representa um aspecto importante da saúde holística do paciente. Valores baixos (abaixo de 5/10) indicam que esta área necessita atenção prioritária nas próximas sessões terapêuticas.`;
}

// Função auxiliar para orientações específicas por campo
function getOrientacoesEspecificasCampo(campo, valor) {
  const orientacoes = {
    'Mental': `
      • Utilize técnicas de limpeza mental como Reiki nos chakras superiores (6º e 7º)<br>
      • Trabalhe com cristais como Ametista ou Quartzo Branco na testa<br>
      • Pratique visualizações guiadas para clareza mental<br>
      • Considere Aromaterapia com óleos essenciais de Alecrim ou Hortelã-pimenta<br>
      • Oriente o paciente sobre técnicas de respiração para oxigenar o cérebro<br>
      • Sugira atividades que estimulem a mente de forma positiva (leitura, jogos cognitivos)`
    ,
    'Emocional': `
      • Foque em equilibrar o chakra do Coração (4º chakra) com Reiki ou Cristais<br>
      • Trabalhe com Essências Florais como Rescue Remedy ou outras específicas ao desequilíbrio<br>
      • Utilize Aromaterapia com óleos como Lavanda, Camomila ou Rosa<br>
      • Pratique liberação emocional através de técnicas como ThetaHealing<br>
      • Oriente sobre técnicas de acolhimento e processamento emocional<br>
      • Considere investigar bloqueios emocionais mais profundos`
    ,
    'Físico': `
      • Priorize trabalho corporal completo, não apenas pontos específicos<br>
      • Utilize Cromoterapia com cores que estimulem vitalidade (Vermelho, Laranja)<br>
      • Trabalhe com cristais de geração como Quartzo Rosa ou Citrino<br>
      • Oriente sobre hábitos de vida: alimentação, exercício físico, sono<br>
      • Considere suporte nutricional ou encaminhamento médico se necessário<br>
      • Pratique Reiki em todo o corpo físico para restaurar energia vital`
    ,
    'Energético': `
      • Realize limpeza energética profunda completa em todos os chakras<br>
      • Utilize técnicas de alinhamento energético e balanceamento<br>
      • Trabalhe com geometrias sagradas para estruturar o campo energético<br>
      • Pratique Radiestesia para identificar desequilíbrios específicos<br>
      • Oriente sobre proteção energética e manutenção do campo entre sessões<br>
      • Considere trabalho mais frequente e intensivo para este campo`
    ,
    'Espiritual': `
      • Trabalhe conexão com o propósito e sentido de vida<br>
      • Utilize práticas meditativas e contemplativas na sessão<br>
      • Trabalhe com cristais como Ametista, Selenita ou Quartzo Transparente<br>
      • Explore questões existenciais que possam estar bloqueando<br>
      • Oriente sobre práticas espirituais pessoais (meditação, oração, etc.)<br>
      • Considere técnicas de conexão com o divino ou propósito maior`
    ,
    'Vibracional': `
      • Trabalhe elevação vibracional através de frequências sonoras (taças, mantras)<br>
      • Utilize Cristaloterapia com cristais de alta vibração<br>
      • Pratique meditação para elevar consciência<br>
      • Oriente sobre alimentação mais vibracional (menos processados)<br>
      • Trabalhe com emoções elevadas (gratidão, amor, compaixão)<br>
      • Considere ambientes e pessoas que elevem a vibração do paciente`
  };
  
  return orientacoes[campo] || `
    • Dedique tempo extra nas próximas sessões especificamente para este campo<br>
    • Combine diferentes técnicas terapêuticas que impactem este aspecto<br>
    • Investigue bloqueios específicos relacionados a este campo<br>
    • Oriente o paciente sobre práticas que pode fazer em casa para melhorar este campo<br>
    • Monitore o progresso deste campo especificamente nas próximas sessões<br>
    • Considere aumentar a frequência das sessões se o campo não melhorar rapidamente
  `;
}

