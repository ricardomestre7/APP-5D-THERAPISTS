import { jsPDF } from 'jspdf';

/**
 * Gera um PDF profissional do relatório quântico
 */
export async function gerarPDFRelatorio({ pacienteNome, analise, terapeutaNome }) {
    const doc = new jsPDF();
    let y = 20;
    const margemEsquerda = 20;
    const larguraUtil = 170;

    // ========== CORES HARMONIOSAS ==========
    const corPrincipal = [139, 92, 246]; // Roxo
    const corTexto = [60, 60, 60]; // Cinza escuro
    const corTituloSecao = [100, 100, 100]; // Cinza médio
    const corSucesso = [34, 197, 94]; // Verde
    const corAtencao = [251, 191, 36]; // Amarelo
    const corCritico = [239, 68, 68]; // Vermelho
    const corFundoClaro = [248, 250, 252]; // Cinza clarinho

    // ========== FUNÇÕES AUXILIARES ==========
    const adicionarTexto = (texto, tamanho = 10, negrito = false, cor = corTexto) => {
        doc.setFontSize(tamanho);
        doc.setTextColor(cor[0], cor[1], cor[2]);
        doc.setFont('helvetica', negrito ? 'bold' : 'normal');
        
        const linhas = doc.splitTextToSize(texto, larguraUtil);
        linhas.forEach(linha => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(linha, margemEsquerda, y);
            y += tamanho * 0.5;
        });
        y += 3;
    };

    const adicionarTituloSecao = (titulo) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
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
        if (y > 260) {
            doc.addPage();
            y = 20;
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
        if (y > 260) {
            doc.addPage();
            y = 20;
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
        doc.text(`${valor}/${maxValor}`, margemEsquerda + 120, y);
        
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

    // ========== CAPA ==========
    // Fundo roxo gradiente (simulado)
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 210, 80, 'F');
    
    doc.setFillColor(120, 80, 220);
    doc.rect(0, 60, 210, 20, 'F');
    
    // Título
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATORIO QUANTICO', 105, 35, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Evolucao Terapeutica', 105, 50, { align: 'center' });
    
    // Info do paciente
    y = 100;
    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PACIENTE:', margemEsquerda, y);
    doc.setFont('helvetica', 'normal');
    doc.text(pacienteNome, margemEsquerda + 30, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('DATA:', margemEsquerda, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('pt-BR'), margemEsquerda + 30, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('TERAPEUTA:', margemEsquerda, y);
    doc.setFont('helvetica', 'normal');
    doc.text(terapeutaNome || 'Terapeuta', margemEsquerda + 30, y);
    
    // ========== PÁGINA 2: RESUMO EXECUTIVO ==========
    doc.addPage();
    y = 30;
    
    adicionarTituloSecao('RESUMO EXECUTIVO');
    
    // Score Geral - DESTAQUE
    doc.setFontSize(11);
    doc.setTextColor(corTituloSecao[0], corTituloSecao[1], corTituloSecao[2]);
    doc.text('Score Geral de Evolucao:', margemEsquerda, y);
    y += 10;
    
    // Círculo com score
    const scoreColor = analise.scoreGeral >= 70 ? corSucesso : analise.scoreGeral >= 50 ? corAtencao : corCritico;
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(50, y + 10, 18, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(String(analise.scoreGeral), 50, y + 13, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('/100', 50, y + 20, { align: 'center' });
    
    // Interpretação
    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let interpretacao = '';
    if (analise.scoreGeral >= 70) {
        interpretacao = 'EXCELENTE - Paciente em otima evolucao!';
    } else if (analise.scoreGeral >= 50) {
        interpretacao = 'BOM - Progressao positiva identificada.';
    } else {
        interpretacao = 'ATENCAO - Necessita revisao do protocolo.';
    }
    doc.text(interpretacao, 80, y + 15);
    
    y += 40;
    
    // Outras métricas
    adicionarCaixaInfo('Total de Sessoes Realizadas', String(analise.totalSessoes || 0), corPrincipal);
    adicionarCaixaInfo('Velocidade de Melhoria', analise.velocidadeMelhoria || 'Moderada', corPrincipal);
    adicionarCaixaInfo('Campos que Necessitam Atencao', String((analise.camposCriticos || []).length), corCritico);
    
    // ========== PÁGINA 3: ANÁLISE POR CAMPO ==========
    if (analise.indicesPorCampo) {
        doc.addPage();
        y = 30;
        
        adicionarTituloSecao('ANALISE DETALHADA POR CAMPO');
        
        Object.entries(analise.indicesPorCampo).forEach(([campo, dados]) => {
            const valor = parseFloat(dados?.atual || 0);
            adicionarBarraProgresso(campo, valor);
        });
    }
    
    // ========== PÁGINA 4: CAMPOS CRÍTICOS ==========
    if (analise.camposCriticos && analise.camposCriticos.length > 0) {
        doc.addPage();
        y = 30;
        
        adicionarTituloSecao('CAMPOS QUE NECESSITAM ATENCAO');
        
        analise.camposCriticos.forEach((critico) => {
            if (y > 240) {
                doc.addPage();
                y = 30;
            }
            
            // Caixa de alerta
            doc.setDrawColor(corCritico[0], corCritico[1], corCritico[2]);
            doc.setLineWidth(1);
            doc.setFillColor(255, 245, 245);
            doc.roundedRect(margemEsquerda, y, larguraUtil, 25, 3, 3, 'FD');
            
            // Nome do campo
            doc.setFontSize(11);
            doc.setTextColor(corCritico[0], corCritico[1], corCritico[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(critico.campo, margemEsquerda + 5, y + 8);
            
            // Valor
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Valor atual: ${critico.valor}/10`, margemEsquerda + 5, y + 14);
            
            // Recomendação
            doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
            const recomendacaoLinhas = doc.splitTextToSize(critico.recomendacao || '', larguraUtil - 10);
            doc.text(recomendacaoLinhas, margemEsquerda + 5, y + 20);
            
            y += 30;
        });
    }
    
    // ========== PÁGINA FINAL: RECOMENDAÇÕES ==========
    doc.addPage();
    y = 30;
    
    adicionarTituloSecao('RECOMENDACOES TERAPEUTICAS');
    
    let recomendacoes = [];
    if (analise.scoreGeral >= 70) {
        adicionarTexto('STATUS: EXCELENTE EVOLUCAO', 12, true, corSucesso);
        recomendacoes = [
            '- Manter o ritmo atual de sessoes',
            '- Consolidar resultados obtidos',
            '- Focar em manutencao preventiva',
            '- Celebrar conquistas com o paciente'
        ];
    } else if (analise.scoreGeral >= 50) {
        adicionarTexto('STATUS: BOA PROGRESSAO', 12, true, corAtencao);
        recomendacoes = [
            '- Intensificar trabalho nos campos criticos',
            '- Considerar terapias complementares',
            '- Avaliar frequencia das sessoes',
            '- Ajustar protocolo conforme necessario'
        ];
    } else {
        adicionarTexto('STATUS: ATENCAO NECESSARIA', 12, true, corCritico);
        recomendacoes = [
            '- URGENTE: Revisar protocolo terapeutico completo',
            '- Considerar abordagens complementares',
            '- Aumentar frequencia das sessoes',
            '- Investigar fatores externos impactantes'
        ];
    }
    
    y += 5;
    recomendacoes.forEach(rec => {
        adicionarTexto(rec, 10, false, corTexto);
    });
    
    y += 10;
    adicionarTexto('PROXIMOS PASSOS:', 11, true, corPrincipal);
    const passos = [
        '1. Discutir este relatorio com o paciente',
        '2. Ajustar protocolo conforme necessario',
        '3. Agendar proxima avaliacao em 30 dias',
        '4. Documentar evolucao nas proximas sessoes'
    ];
    
    passos.forEach(passo => {
        adicionarTexto(passo, 10, false, corTexto);
    });
    
    // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Pagina ${i} de ${totalPages}`, 20, 285);
        doc.text('APP 5D Therapists - Documento Confidencial', 105, 285, { align: 'center' });
        doc.text(new Date().toLocaleDateString('pt-BR'), 190, 285, { align: 'right' });
    }

    // Fazer download
    const fileName = `Relatorio_Quantico_${pacienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return doc;
}

