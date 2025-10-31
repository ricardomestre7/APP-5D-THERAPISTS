import { jsPDF } from 'jspdf';
import { gerarRelatorioPDF as gerarPDFBackend } from '@/api/functions';

/**
 * Gera um PDF profissional do relatório quântico
 * Tenta usar Puppeteer (backend) primeiro, fallback para jsPDF (frontend)
 */
export async function gerarPDFRelatorio({ pacienteNome, analise, terapeutaNome, sessoes = [], terapias = {}, canvasGraficos = [], imagensGraficos = [] }) {
    // Tentar primeiro com Puppeteer no backend (alta qualidade)
    try {
        console.log('🔄 Tentando gerar PDF via Puppeteer (backend)...');
        console.log('📋 Dados enviados:', { 
            pacienteNome: pacienteNome?.substring(0, 30), 
            hasAnalise: !!analise,
            sessoesCount: sessoes.length,
            terapiasCount: Object.keys(terapias).length
        });
        
        await gerarPDFBackend({
            pacienteNome,
            analise,
            terapeutaNome,
            sessoes,
            terapias
        });
        
        console.log('✅ PDF gerado com sucesso via Puppeteer!');
        return; // Sucesso, sair da função
    } catch (error) {
        console.error('❌ ERRO CRÍTICO na Cloud Function:', error);
        console.error('📋 Detalhes do erro:', {
            message: error.message,
            code: error.code,
            details: error.details,
            stack: error.stack
        });
        
        // Ativar fallback local automaticamente para não bloquear o usuário
        const mensagemErro = `
ERRO ao gerar PDF via Cloud Function.

Vou gerar uma versão local automaticamente (qualidade levemente reduzida).
Se o problema persistir, verifique sua conexão e autenticação.

Detalhes: ${error.message || 'Desconhecido'}
        `.trim();
        
        alert(mensagemErro);
        try {
            gerarPDFLocal({ pacienteNome, analise, terapeutaNome, sessoes, canvasGraficos, imagensGraficos });
            return;
        } catch (e) {
            console.error('❌ Falha também no fallback local jsPDF:', e);
            throw e;
        }
    }
}

/**
 * Geração local com jsPDF (fallback quando Puppeteer não disponível)
 */
function gerarPDFLocal({ pacienteNome, analise, terapeutaNome, sessoes = [], canvasGraficos = [], imagensGraficos = [] }) {
    // Orientação paisagem para melhor visualização e impressão
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();
    const margemEsquerda = 20;
    const margemTopo = 20;
    const margemRodape = 20;
    const larguraUtil = larguraPagina - (margemEsquerda * 2);
    const limiteY = alturaPagina - margemRodape;
    const centroX = larguraPagina / 2;
    let y = margemTopo;

    // ========== CORES HARMONIOSAS ==========
    const corPrincipal = [139, 92, 246]; // Roxo
    const corTexto = [60, 60, 60]; // Cinza escuro
    const corTituloSecao = [100, 100, 100]; // Cinza médio
    const corSucesso = [34, 197, 94]; // Verde
    const corAtencao = [251, 191, 36]; // Amarelo
    const corCritico = [239, 68, 68]; // Vermelho
    const corFundoClaro = [248, 250, 252]; // Cinza clarinho
    const corAzul = [59, 130, 246];

    // ========== FUNÇÕES AUXILIARES ==========
    const calcularDimensoesProporcionais = (srcLargura, srcAltura, maxLargura, maxAltura, minLargura = 120, minAltura = 60) => {
        if (!srcLargura || !srcAltura) {
            // fallback 16:9
            srcLargura = 16; srcAltura = 9;
        }
        const ratio = srcLargura / srcAltura;
        let w = Math.min(maxLargura, Math.max(minLargura, maxAltura * ratio));
        let h = w / ratio;
        if (h > maxAltura) {
            h = maxAltura;
            w = h * ratio;
        }
        if (h < minAltura) {
            h = minAltura;
            w = h * ratio;
        }
        return { w, h };
    };

    const adicionarGraficoCanvas = (canvas) => {
        if (!canvas) return;
        const maxLargura = larguraUtil;
        const maxAltura = Math.max(80, (alturaPagina - 2 * margemTopo) * 0.6);
        const { w, h } = calcularDimensoesProporcionais(canvas.width, canvas.height, maxLargura, maxAltura);
        if (y + h > limiteY) {
            doc.addPage();
            y = margemTopo;
        }
        const dataUrl = canvas.toDataURL('image/png');
        const x = centroX - (w / 2);
        doc.addImage(dataUrl, 'PNG', x, y, w, h);
        y += h + 10;
    };

    const adicionarGraficoImagem = async (dataUrl) => {
        if (!dataUrl) return;
        // Não conseguimos dimensões naturais de forma síncrona sem carregar Image.
        // Assumir 16:9 como padrão razoável quando forem dataURL prontos.
        const maxLargura = larguraUtil;
        const maxAltura = Math.max(80, (alturaPagina - 2 * margemTopo) * 0.6);
        const { w, h } = calcularDimensoesProporcionais(16, 9, maxLargura, maxAltura);
        if (y + h > limiteY) {
            doc.addPage();
            y = margemTopo;
        }
        const x = centroX - (w / 2);
        doc.addImage(dataUrl, 'PNG', x, y, w, h);
        y += h + 10;
    };
    const adicionarTexto = (texto, tamanho = 10, negrito = false, cor = corTexto, alinhamento = 'left') => {
        doc.setFontSize(tamanho);
        doc.setTextColor(cor[0], cor[1], cor[2]);
        doc.setFont('helvetica', negrito ? 'bold' : 'normal');
        
        const linhas = doc.splitTextToSize(texto, larguraUtil);
        linhas.forEach(linha => {
            if (y > (limiteY - 10)) {
                doc.addPage();
                y = margemTopo;
            }
            const xBase = alinhamento === 'center' ? centroX : alinhamento === 'right' ? (margemEsquerda + larguraUtil) : margemEsquerda;
            doc.text(linha, xBase, y, { align: alinhamento });
            y += Math.max(5, tamanho * 0.6);
        });
        y += 3;
    };

    const adicionarTituloSecao = (titulo) => {
        if (y > (limiteY - 20)) {
            doc.addPage();
            y = margemTopo;
        }
        y += 10;
        
        // Linha superior roxa
        doc.setDrawColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
        doc.setLineWidth(2);
        doc.line(margemEsquerda, y - 3, margemEsquerda + larguraUtil, y - 3);
        
        doc.setFontSize(14);
        doc.setTextColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(titulo, margemEsquerda, y + 5);
        
        y += 15;
    };

    const adicionarCaixaInfo = (label, valor, cor) => {
        if (y > (limiteY - 10)) {
            doc.addPage();
            y = margemTopo;
        }
        
        // Borda colorida à esquerda
        doc.setFillColor(cor[0], cor[1], cor[2]);
        doc.rect(margemEsquerda, y - 5, 3, 15, 'F');
        
        // Fundo suave
        doc.setFillColor(corFundoClaro[0], corFundoClaro[1], corFundoClaro[2]);
        doc.rect(margemEsquerda + 5, y - 5, larguraUtil - 5, 15, 'F');
        
        // Label
        doc.setFontSize(9);
        doc.setTextColor(corTituloSecao[0], corTituloSecao[1], corTituloSecao[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(label, margemEsquerda + 8, y);
        
        // Valor
        doc.setFontSize(11);
        doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(valor, margemEsquerda + 8, y + 7);
        
        y += 20;
    };

    const adicionarBarraProgresso = (campo, valor, maxValor = 10) => {
        if (y > (limiteY - 10)) {
            doc.addPage();
            y = margemTopo;
        }
        
        const percentual = (valor / maxValor) * 100;
        let corBarra = corCritico;
        if (percentual >= 70) corBarra = corSucesso;
        else if (percentual >= 50) corBarra = corAtencao;
        
        // Nome do campo
        doc.setFontSize(10);
        doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(campo, margemEsquerda, y);
        
        // Valor numérico
        doc.setFont('helvetica', 'bold');
        doc.text(`${valor.toFixed(1)}/${maxValor}`, margemEsquerda + 130, y);
        
        y += 5;
        
        // Fundo da barra (cinza claro)
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(margemEsquerda, y, 100, 6, 3, 3, 'F');
        
        // Barra preenchida
        const larguraBarra = (valor / maxValor) * 100;
        doc.setFillColor(corBarra[0], corBarra[1], corBarra[2]);
        doc.roundedRect(margemEsquerda, y, larguraBarra, 6, 3, 3, 'F');
        
        y += 12;
    };

    const adicionarTabelaDeSessoes = () => {
        if (sessoes.length === 0) return;
        
        adicionarTituloSecao('📅 HISTÓRICO DE SESSÕES');
        
        // Cabeçalho da tabela
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
        doc.roundedRect(margemEsquerda, y, larguraUtil, 8, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.text('Data', margemEsquerda + 3, y + 5);
        doc.text('Terapia', margemEsquerda + 40, y + 5);
        doc.text('Média', margemEsquerda + 110, y + 5);
        doc.text('Status', margemEsquerda + 140, y + 5);
        
        y += 10;
        
        // Dados das sessões (últimas 8)
        const ultimasSessoes = sessoes.slice(0, 8);
        ultimasSessoes.forEach((sessao, index) => {
            if (y > (limiteY - 20)) {
                doc.addPage();
                y = margemTopo;
                // Recabeçalho
                doc.setFillColor(corPrincipal[0], corPrincipal[1], corPrincipal[2]);
                doc.roundedRect(margemEsquerda, y, larguraUtil, 8, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Data', margemEsquerda + 3, y + 5);
                doc.text('Terapia', margemEsquerda + 40, y + 5);
                doc.text('Média', margemEsquerda + 110, y + 5);
                doc.text('Status', margemEsquerda + 140, y + 5);
                y += 10;
            }
            
            // Calcula média da sessão
            let soma = 0, count = 0;
            if (sessao.resultados) {
                Object.values(sessao.resultados).forEach(v => {
                    const num = parseFloat(v);
                    if (!isNaN(num)) { soma += num; count++; }
                });
            }
            const media = count > 0 ? (soma / count).toFixed(1) : '0';
            
            // Alternar cor de fundo
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(margemEsquerda, y - 7, larguraUtil, 9, 'F');
            }
            
            doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
            doc.setFont('helvetica', 'normal');
            
            // Data
            const dataSessao = sessao.data_sessao ? new Date(sessao.data_sessao).toLocaleDateString('pt-BR') : '-';
            doc.setFontSize(8);
            doc.text(dataSessao, margemEsquerda + 3, y);
            
            // Terapia (truncada)
            const terapia = sessao.terapia_id || '-';
            doc.text(terapia.substring(0, 15), margemEsquerda + 40, y);
            
            // Média
            doc.setFont('helvetica', 'bold');
            const numMedia = parseFloat(media);
            let statusColor = corCritico;
            if (numMedia >= 7) statusColor = corSucesso;
            else if (numMedia >= 5) statusColor = corAtencao;
            
            doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
            doc.text(media, margemEsquerda + 110, y);
            
            // Status
            doc.setFontSize(7);
            const status = numMedia >= 7 ? '✓' : numMedia >= 5 ? '~' : '!';
            doc.text(status, margemEsquerda + 145, y);
            
            y += 10;
        });
        
        y += 5;
    };

    const adicionarTabelaCampos = () => {
        if (!analise.indicesPorCampo) return;
        
        adicionarTituloSecao('📊 ANÁLISE DETALHADA POR CAMPO');
        
        // Tabela com header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(corAzul[0], corAzul[1], corAzul[2]);
        doc.roundedRect(margemEsquerda, y, larguraUtil, 8, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.text('Campo Energético', margemEsquerda + 3, y + 5);
        doc.text('Nível Atual', margemEsquerda + 120, y + 5);
        doc.text('Status', margemEsquerda + 160, y + 5);
        
        y += 10;
        
        // Dados dos campos
        Object.entries(analise.indicesPorCampo).forEach(([campo, dados], index) => {
            if (y > (limiteY - 20)) {
                doc.addPage();
                y = margemTopo;
                // Recabeçalho
                doc.setFillColor(corAzul[0], corAzul[1], corAzul[2]);
                doc.roundedRect(margemEsquerda, y, larguraUtil, 8, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Campo Energético', margemEsquerda + 3, y + 5);
                doc.text('Nível Atual', margemEsquerda + 120, y + 5);
                doc.text('Status', margemEsquerda + 160, y + 5);
                y += 10;
            }
            
            const valor = parseFloat(dados.atual);
            let statusColor = corCritico;
            let status = 'Crítico';
            if (valor >= 7) { statusColor = corSucesso; status = 'Excelente'; }
            else if (valor >= 5) { statusColor = corAtencao; status = 'Bom'; }
            else if (valor >= 3) { statusColor = corAtencao; status = 'Atenção'; }
            
            // Alternar cor
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(margemEsquerda, y - 7, larguraUtil, 9, 'F');
            }
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
            doc.text(campo, margemEsquerda + 3, y);
            
            doc.setFont('helvetica', 'bold');
            doc.text(valor.toFixed(1) + '/10', margemEsquerda + 120, y);
            
            doc.setFontSize(8);
            doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
            doc.text(status, margemEsquerda + 160, y);
            
            y += 10;
        });
        
        y += 5;
    };

    // ========== CAPA ==========
    // Fundo roxo gradiente (simulado)
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, larguraPagina, 60, 'F');
    
    doc.setFillColor(120, 80, 220);
    doc.rect(0, 45, larguraPagina, 15, 'F');
    
    // Título
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO QUÂNTICO', centroX, 28, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Evolução Terapêutica', centroX, 40, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Análise Profunda de Progresso Energético', centroX, 52, { align: 'center' });
    
    // Info do paciente
    y = 80;
    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('👤 PACIENTE:', margemEsquerda, y);
    doc.setFont('helvetica', 'normal');
    doc.text(pacienteNome, margemEsquerda + 35, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('📅 DATA:', margemEsquerda, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('pt-BR'), margemEsquerda + 35, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('👨‍⚕️ TERAPEUTA:', margemEsquerda, y);
    doc.setFont('helvetica', 'normal');
    doc.text(terapeutaNome || 'Terapeuta', margemEsquerda + 35, y);
    
    // Logo ou decoração
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(3);
    doc.circle(centroX, alturaPagina - 40, 20, 'D'); // Círculo decorativo
    
    // ========== PÁGINA 2: RESUMO EXECUTIVO ==========
    doc.addPage();
    y = margemTopo + 10;
    
    adicionarTituloSecao('📋 RESUMO EXECUTIVO');
    
    // Score Geral - DESTAQUE VISUAL
    doc.setFontSize(11);
    doc.setTextColor(corTituloSecao[0], corTituloSecao[1], corTituloSecao[2]);
    doc.text('Score Geral de Evolução:', margemEsquerda, y);
    y += 12;
    
    // Círculo grande com score
    const scoreColor = analise.scoreGeral >= 70 ? corSucesso : analise.scoreGeral >= 50 ? corAtencao : corCritico;
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(margemEsquerda + 40, y + 15, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(String(analise.scoreGeral), margemEsquerda + 40, y + 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text('/100', margemEsquerda + 40, y + 27, { align: 'center' });
    
    // Interpretação
    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    let interpretacao = '';
    if (analise.scoreGeral >= 70) {
        interpretacao = '✨ EXCELENTE - Paciente em ótima evolução!';
        doc.setTextColor(corSucesso[0], corSucesso[1], corSucesso[2]);
    } else if (analise.scoreGeral >= 50) {
        interpretacao = '✓ BOM - Progressão positiva identificada.';
        doc.setTextColor(corAtencao[0], corAtencao[1], corAtencao[2]);
    } else {
        interpretacao = '⚠ ATENÇÃO - Necessita revisão do protocolo.';
        doc.setTextColor(corCritico[0], corCritico[1], corCritico[2]);
    }
    doc.text(interpretacao, margemEsquerda + 90, y + 20);
    
    y += 50;
    
    // Cards de métricas
    adicionarCaixaInfo('📊 Total de Sessões Realizadas', String(analise.totalSessoes || sessoes.length), corPrincipal);
    adicionarCaixaInfo('⚡ Velocidade de Melhoria', analise.velocidadeMelhoria || 'Moderada', corAzul);
    adicionarCaixaInfo('⚠️ Campos Críticos Identificados', String((analise.camposCriticos || []).length), corCritico);
    adicionarCaixaInfo('📈 Índice de Progressão', String(Math.round(analise.scoreGeral / 10)) + '/10', corSucesso);
    
    // ========== PÁGINA 3: TABELA DE CAMPOS ==========
    adicionarTabelaCampos();
    
    // ========== PÁGINA 4: HISTÓRICO DE SESSÕES ==========
    adicionarTabelaDeSessoes();
    
    // ========== PÁGINA 5: GRÁFICOS DE BARRAS ==========
    if (analise.indicesPorCampo) {
        adicionarTituloSecao('📊 VISUALIZAÇÃO POR CAMPO');
        
        y += 5;
        Object.entries(analise.indicesPorCampo).forEach(([campo, dados]) => {
            const valor = parseFloat(dados.atual);
            adicionarBarraProgresso(campo, valor);
        });
    }

    // ========== PÁGINA 6: VISUALIZAÇÕES GRÁFICAS (TERAPIAS) ==========
    if ((canvasGraficos && canvasGraficos.length) || (imagensGraficos && imagensGraficos.length)) {
        doc.addPage();
        y = margemTopo + 10;
        adicionarTituloSecao('📈 VISUALIZAÇÕES GRÁFICAS (TERAPIAS)');

        // Canvas tem prioridade por preservar proporção exata
        if (Array.isArray(canvasGraficos)) {
            canvasGraficos.forEach((cv) => adicionarGraficoCanvas(cv));
        }
        if (Array.isArray(imagensGraficos)) {
            imagensGraficos.forEach((img) => { /* síncrono suficiente p/ jsPDF */ adicionarGraficoImagem(img); });
        }
    }
    
    // ========== PÁGINA 7: CAMPOS CRÍTICOS ==========
    if (analise.camposCriticos && analise.camposCriticos.length > 0) {
        doc.addPage();
        y = margemTopo + 10;
        
        adicionarTituloSecao('⚠️ CAMPOS QUE NECESSITAM ATENÇÃO URGENTE');
        
        y += 5;
        analise.camposCriticos.forEach((critico) => {
            if (y > (limiteY - 40)) {
                doc.addPage();
                y = margemTopo + 10;
            }
            
            // Caixa de alerta vermelha
            doc.setDrawColor(corCritico[0], corCritico[1], corCritico[2]);
            doc.setLineWidth(1);
            doc.setFillColor(255, 245, 245);
            doc.roundedRect(margemEsquerda, y, larguraUtil, 30, 3, 3, 'FD');
            
            // Nome do campo
            doc.setFontSize(12);
            doc.setTextColor(corCritico[0], corCritico[1], corCritico[2]);
            doc.setFont('helvetica', 'bold');
            doc.text('🔴 ' + critico.campo, margemEsquerda + 5, y + 8);
            
            // Valor
            doc.setFontSize(14);
            doc.text(`Valor: ${critico.valor}/10`, margemEsquerda + 5, y + 16);
            
            // Recomendação
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
            const recomendacaoLinhas = doc.splitTextToSize(critico.recomendacao || 'Focar nas próximas sessões', larguraUtil - 10);
            doc.text(recomendacaoLinhas, margemEsquerda + 5, y + 24);
            
            y += 35;
        });
    }
    
    // ========== PÁGINA FINAL: RECOMENDAÇÕES ==========
    doc.addPage();
    y = margemTopo + 10;
    
    adicionarTituloSecao('💡 RECOMENDAÇÕES TERAPÊUTICAS');
    
    y += 5;
    let recomendacoes = [];
    if (analise.scoreGeral >= 70) {
        adicionarTexto('STATUS: EXCELENTE EVOLUÇÃO', 13, true, corSucesso);
        recomendacoes = [
            '• Manter o ritmo atual de sessões',
            '• Consolidar resultados obtidos',
            '• Focar em manutenção preventiva',
            '• Celebrar conquistas com o paciente',
            '• Documentar técnicas mais eficazes',
            '• Considerar intensificação gradual se necessário'
        ];
    } else if (analise.scoreGeral >= 50) {
        adicionarTexto('STATUS: BOA PROGRESSÃO', 13, true, corAtencao);
        recomendacoes = [
            '• Intensificar trabalho nos campos críticos',
            '• Considerar terapias complementares',
            '• Avaliar frequência das sessões',
            '• Ajustar protocolo conforme necessário',
            '• Monitorar evolções nos próximos 30 dias',
            '• Focar em técnicas mais eficazes'
        ];
    } else {
        adicionarTexto('STATUS: ATENÇÃO NECESSÁRIA', 13, true, corCritico);
        recomendacoes = [
            '• URGENTE: Revisar protocolo terapêutico completo',
            '• Considerar abordagens complementares',
            '• Aumentar frequência das sessões',
            '• Investigar fatores externos impactantes',
            '• Avaliar necessidade de apoio multidisciplinar',
            '• Realizar sessão de emergência se necessário'
        ];
    }
    
    y += 5;
    recomendacoes.forEach(rec => {
        adicionarTexto(rec, 10, false, corTexto);
    });
    
    y += 10;
    adicionarTexto('PROXIMOS PASSOS:', 12, true, corPrincipal);
    y += 2;
    const passos = [
        '1. Discutir este relatório detalhado com o paciente',
        '2. Ajustar protocolo conforme áreas críticas',
        '3. Agendar próxima avaliação em 30 dias',
        '4. Documentar evolução nas próximas sessões',
        '5. Focar nas terapias mais eficazes identificadas',
        '6. Manter comunicação próxima com o paciente'
    ];
    
    passos.forEach(passo => {
        adicionarTexto(passo, 9, false, corTexto);
    });
    
    // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        const yRodape = alturaPagina - 15;
        doc.line(margemEsquerda, yRodape, margemEsquerda + larguraUtil, yRodape);
        
        // Texto
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${totalPages}`, margemEsquerda, yRodape + 5);
        doc.text('APP 5D Therapists - Documento Confidencial', centroX, yRodape + 5, { align: 'center' });
        doc.text(new Date().toLocaleDateString('pt-BR'), margemEsquerda + larguraUtil, yRodape + 5, { align: 'right' });
    }

    // Fazer download
    const fileName = `Relatorio_Quantico_${pacienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return doc;
}
