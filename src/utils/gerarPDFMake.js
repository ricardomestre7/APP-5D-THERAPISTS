/**
 * Geração de PDF usando pdfmake
 * Solução 100% frontend, sem dependência de backend
 * Código limpo e fácil de manter
 */

// pdfmake será importado dinamicamente para melhor compatibilidade
let pdfMakeInstance = null;

// Função para inicializar pdfmake (carrega apenas quando necessário)
async function getPdfMake() {
    if (!pdfMakeInstance) {
        try {
            console.log('📦 Importando pdfmake...');
            // Tentar importação dinâmica
            const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
            const pdfFontsModule = await import('pdfmake/build/vfs_fonts.js');
            
            console.log('✅ Módulos importados, configurando...');
            
            // Obter o objeto correto (pode ser default ou o próprio objeto)
            const pdfMake = pdfMakeModule.default || pdfMakeModule;
            
            if (!pdfMake) {
                throw new Error('pdfmake não foi encontrado no módulo');
            }
            
            // Configurar fontes - vfs_fonts pode ter diferentes estruturas
            // Estrutura 1: pdfFonts.pdfMake.vfs
            // Estrutura 2: pdfFonts.default.pdfMake.vfs
            // Estrutura 3: pdfFonts.vfs
            // Estrutura 4: pdfFonts.default.vfs
            // Estrutura 5: pdfFonts (direto)
            const fontsModule = pdfFontsModule.default || pdfFontsModule;
            let vfs = null;
            
            if (fontsModule) {
                // Tentar diferentes estruturas possíveis
                vfs = fontsModule.pdfMake?.vfs || 
                      fontsModule.vfs ||
                      fontsModule.default?.pdfMake?.vfs ||
                      fontsModule.default?.vfs ||
                      fontsModule;
                
                if (vfs && typeof vfs === 'object') {
                    pdfMake.vfs = vfs;
                    console.log('✅ Fontes configuradas (vfs encontrado)');
                } else {
                    console.warn('⚠️ Estrutura de fontes inesperada, tentando usar direto');
                    pdfMake.vfs = fontsModule;
                }
            } else {
                console.warn('⚠️ Fontes não encontradas, PDF pode ter problemas de renderização');
            }
            
            pdfMakeInstance = pdfMake;
            console.log('✅ pdfmake inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao importar pdfmake:', error);
            
            // Tentar fallback com require se disponível (em ambiente Node.js)
            if (typeof require !== 'undefined') {
                try {
                    console.log('🔄 Tentando fallback com require...');
                    const pdfMake = require('pdfmake/build/pdfmake');
                    const pdfFonts = require('pdfmake/build/vfs_fonts');
                    
                    let vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || pdfFonts;
                    if (vfs) {
                        pdfMake.vfs = vfs;
                    }
                    pdfMakeInstance = pdfMake;
                    console.log('✅ pdfmake carregado via require');
                } catch (requireError) {
                    console.error('❌ Erro ao usar require como fallback:', requireError);
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }
    return pdfMakeInstance;
}

/**
 * Gera relatório PDF profissional usando pdfmake
 * @param {Object} params - Dados para o relatório
 */
export async function gerarPDFRelatorio({
    pacienteNome = '',
    terapeutaNome = '',
    sessoes = [],
    analise = {},
    terapias = {},
}) {
    try {
        console.log('🔄 Iniciando geração de PDF com pdfmake...', {
            pacienteNome,
            totalSessoes: sessoes?.length || 0,
            hasAnalise: !!analise
        });
        
        // ============================================================================
        // PADRÃO DE MARGENS (pdfmake)
        // ============================================================================
        // Sintaxe disponível para margins:
        // 
        // 1. Array completo: [left, top, right, bottom]
        //    margin: [5, 2, 10, 20]
        //
        // 2. Array simplificado: [horizontal, vertical]
        //    margin: [5, 2]
        //
        // 3. Valor único: equalLeftTopRightBottom
        //    margin: 5
        //
        // 4. Propriedades individuais: marginLeft, marginTop, marginRight, marginBottom
        //    marginLeft: 5, marginTop: 2, marginRight: 10, marginBottom: 20
        //
        // Neste documento, usamos principalmente [left, top, right, bottom] para precisão
        // ============================================================================

        // Preparar dados
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const scoreGeral = analise?.scoreGeral || 0;
        const totalSessoes = Array.isArray(sessoes) ? sessoes.length : 0;
        const camposCriticos = Array.isArray(analise?.camposCriticos) ? analise.camposCriticos : [];

        // Definir cores - Paleta holística azul/verde (evitando vermelho)
        const cores = {
            principal: '#3B82F6', // Azul principal
            secundario: '#10B981', // Verde saúde holística
            azul: '#3B82F6',
            azulClaro: '#60A5FA',
            azulEscuro: '#2563EB',
            verde: '#10B981',
            verdeClaro: '#34D399',
            verdeEscuro: '#059669',
            sucesso: '#10B981',
            atencao: '#F59E0B', // Mantido para alertas (amarelo/laranja)
            critico: '#F59E0B', // Mudado de vermelho para amarelo/laranja
            texto: '#1F2937',
            cinza: '#6B7280',
            fundo: '#F0F9FF', // Azul muito claro
        };

        // Função auxiliar para determinar cor do status
        const getStatusColor = (valor) => {
            if (valor >= 7) return cores.sucesso;
            if (valor >= 5) return cores.atencao;
            return cores.critico;
        };

        const getStatusTexto = (valor) => {
            if (valor >= 7) return 'Excelente';
            if (valor >= 5) return 'Bom';
            if (valor >= 3) return 'Atenção';
            return 'Crítico';
        };

        // Função para criar fundo decorativo - aplicado em TODAS as páginas
        const criarFundoDecorativo = (pageIndex = 0) => {
            // Usar pageIndex para variar posições das bolas em cada página
            const offsetX = (pageIndex * 15) % 100;
            const offsetY = (pageIndex * 20) % 150;
            
            return [
                {
                    // Background base azul claro
                    canvas: [
                        {
                            type: 'rect',
                            x: 0,
                            y: 0,
                            w: 595,
                            h: 842,
                            color: cores.fundo,
                            fillOpacity: 1
                        }
                    ],
                    absolutePosition: { x: 0, y: 0 }
                },
                {
                    // Bolas dimensionais decorativas (posições variadas por página)
                    canvas: [
                        {
                            type: 'ellipse',
                            x: 30 + offsetX,
                            y: 80 + offsetY,
                            r1: 100,
                            r2: 100,
                            color: cores.azulClaro,
                            fillOpacity: 0.12,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 250 + (offsetX * 0.8),
                            y: 120 + (offsetY * 0.6),
                            r1: 80,
                            r2: 80,
                            color: cores.verdeClaro,
                            fillOpacity: 0.12,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 180 + (offsetX * 0.5),
                            y: 220 + offsetY,
                            r1: 60,
                            r2: 60,
                            color: cores.azul,
                            fillOpacity: 0.15,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 420 + offsetX,
                            y: 280 + (offsetY * 0.7),
                            r1: 90,
                            r2: 90,
                            color: cores.verde,
                            fillOpacity: 0.12,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 330 + (offsetX * 0.6),
                            y: 380 + offsetY,
                            r1: 70,
                            r2: 70,
                            color: cores.verdeClaro,
                            fillOpacity: 0.14,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 80 + (offsetX * 0.7),
                            y: 580 + offsetY,
                            r1: 95,
                            r2: 95,
                            color: cores.azulEscuro,
                            fillOpacity: 0.10,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 400 + offsetX,
                            y: 630 + (offsetY * 0.8),
                            r1: 85,
                            r2: 85,
                            color: cores.verdeEscuro,
                            fillOpacity: 0.12,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 500 + (offsetX * 0.3),
                            y: 200 + (offsetY * 0.5),
                            r1: 65,
                            r2: 65,
                            color: cores.azul,
                            fillOpacity: 0.11,
                            lineWidth: 0
                        },
                        {
                            type: 'ellipse',
                            x: 150 + (offsetX * 0.4),
                            y: 700 + offsetY,
                            r1: 75,
                            r2: 75,
                            color: cores.verde,
                            fillOpacity: 0.13,
                            lineWidth: 0
                        }
                    ],
                    absolutePosition: { x: 0, y: 0 }
                }
            ];
        };

        // Função helper para criar cabeçalhos de seção (compacto)
        const criarCabecalhoSecao = (titulo, subtitulo, descricao) => {
            return [
                {
                    text: titulo,
                    style: 'tituloSecaoPagina',
                    // margin: [left, top, right, bottom]
                    margin: [0, 15, 0, 6], // [esquerda, superior, direita, inferior]
                    alignment: 'center'
                },
                ...(subtitulo ? [{
                    text: subtitulo,
                    style: 'subtituloSecaoPagina',
                    margin: [0, 0, 0, 4], // [esquerda, superior, direita, inferior]
                    alignment: 'center'
                }] : []),
                ...(descricao ? [{
                    text: descricao,
                    style: 'descricaoSecaoPagina',
                    margin: [0, 0, 0, 18], // [esquerda, superior, direita, inferior]
                    alignment: 'center'
                }] : [])
            ];
        };

        // CAPA DEDICADA - Página separada com fundo de bolas dimensionais
        const capa = [
            {
                // Background base azul claro
                canvas: [
                    {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 595, // largura A4 em pontos
                        h: 842, // altura A4 em pontos
                        color: cores.fundo,
                        fillOpacity: 1
                    }
                ],
                absolutePosition: { x: 0, y: 0 }
            },
            {
                // Bolas dimensionais se cruzando como fundo decorativo
                canvas: [
                    // Círculo grande azul (fundo)
                    {
                        type: 'ellipse',
                        x: 50,
                        y: 100,
                        r1: 120,
                        r2: 120,
                        color: cores.azulClaro,
                        fillOpacity: 0.15,
                        lineWidth: 0
                    },
                    // Círculo médio verde (cruzando)
                    {
                        type: 'ellipse',
                        x: 300,
                        y: 150,
                        r1: 90,
                        r2: 90,
                        color: cores.verdeClaro,
                        fillOpacity: 0.15,
                        lineWidth: 0
                    },
                    // Círculo pequeno azul (sobreposto)
                    {
                        type: 'ellipse',
                        x: 200,
                        y: 250,
                        r1: 70,
                        r2: 70,
                        color: cores.azul,
                        fillOpacity: 0.2,
                        lineWidth: 0
                    },
                    // Círculo médio verde (outro lado)
                    {
                        type: 'ellipse',
                        x: 450,
                        y: 300,
                        r1: 100,
                        r2: 100,
                        color: cores.verde,
                        fillOpacity: 0.15,
                        lineWidth: 0
                    },
                    // Círculo pequeno verde (sobreposto)
                    {
                        type: 'ellipse',
                        x: 350,
                        y: 400,
                        r1: 80,
                        r2: 80,
                        color: cores.verdeClaro,
                        fillOpacity: 0.18,
                        lineWidth: 0
                    },
                    // Círculo grande azul (inferior)
                    {
                        type: 'ellipse',
                        x: 100,
                        y: 600,
                        r1: 110,
                        r2: 110,
                        color: cores.azulEscuro,
                        fillOpacity: 0.12,
                        lineWidth: 0
                    },
                    // Círculo médio verde (inferior direito)
                    {
                        type: 'ellipse',
                        x: 420,
                        y: 650,
                        r1: 95,
                        r2: 95,
                        color: cores.verdeEscuro,
                        fillOpacity: 0.15,
                        lineWidth: 0
                    }
                ],
                absolutePosition: { x: 0, y: 0 }
            },
            {
                stack: [
                    {
                        text: 'RELATÓRIO QUÂNTICO',
                        style: 'tituloCapa',
                        margin: [0, 120, 0, 20],
                        alignment: 'center'
                    },
                    {
                        text: 'Evolução Terapêutica',
                        style: 'subtituloCapa',
                        margin: [0, 0, 0, 15],
                        alignment: 'center'
                    },
                    {
                        text: 'Análise Profunda de Progresso Energético',
                        style: 'descricaoCapa',
                        margin: [0, 0, 0, 80],
                        alignment: 'center'
                    },
                    // Ícone quântico com score (substituindo a bola vermelha)
                    {
                        columns: [
                            { width: 'auto', text: '' },
                            {
                                width: 140,
                                stack: [
                                    {
                                        // Ícone quântico (estrelas/círculos dimensionais)
                                        canvas: [
                                            // Círculo central azul
                                            {
                                                type: 'ellipse',
                                                x: 50,
                                                y: 50,
                                                r1: 40,
                                                r2: 40,
                                                color: cores.azul,
                                                fillOpacity: 0.3,
                                                lineWidth: 2,
                                                lineColor: cores.azulEscuro
                                            },
                                            // Círculo interno verde (sobreposto)
                                            {
                                                type: 'ellipse',
                                                x: 50,
                                                y: 50,
                                                r1: 25,
                                                r2: 25,
                                                color: cores.verde,
                                                fillOpacity: 0.4,
                                                lineWidth: 0
                                            },
                                            // Linhas dimensionais (estrelas)
                                            {
                                                type: 'line',
                                                x1: 50,
                                                y1: 10,
                                                x2: 50,
                                                y2: 90,
                                                lineWidth: 1.5,
                                                lineColor: cores.azulClaro
                                            },
                                            {
                                                type: 'line',
                                                x1: 10,
                                                y1: 50,
                                                x2: 90,
                                                y2: 50,
                                                lineWidth: 1.5,
                                                lineColor: cores.azulClaro
                                            },
                                            {
                                                type: 'line',
                                                x1: 25,
                                                y1: 25,
                                                x2: 75,
                                                y2: 75,
                                                lineWidth: 1.5,
                                                lineColor: cores.verdeClaro
                                            },
                                            {
                                                type: 'line',
                                                x1: 75,
                                                y1: 25,
                                                x2: 25,
                                                y2: 75,
                                                lineWidth: 1.5,
                                                lineColor: cores.verdeClaro
                                            },
                                            // Pequenos círculos nos pontos
                                            {
                                                type: 'ellipse',
                                                x: 50,
                                                y: 10,
                                                r1: 3,
                                                r2: 3,
                                                color: cores.azulEscuro,
                                                fillOpacity: 1
                                            },
                                            {
                                                type: 'ellipse',
                                                x: 50,
                                                y: 90,
                                                r1: 3,
                                                r2: 3,
                                                color: cores.azulEscuro,
                                                fillOpacity: 1
                                            },
                                            {
                                                type: 'ellipse',
                                                x: 10,
                                                y: 50,
                                                r1: 3,
                                                r2: 3,
                                                color: cores.azulEscuro,
                                                fillOpacity: 1
                                            },
                                            {
                                                type: 'ellipse',
                                                x: 90,
                                                y: 50,
                                                r1: 3,
                                                r2: 3,
                                                color: cores.azulEscuro,
                                                fillOpacity: 1
                                            }
                                        ],
                                        margin: [0, 0, 0, 10]
                                    },
                                    {
                                        text: String(scoreGeral),
                                        style: 'scoreCapa',
                                        alignment: 'center',
                                        color: cores.azulEscuro
                                    },
                                    {
                                        text: '/100',
                                        style: 'scoreLabelCapa',
                                        alignment: 'center',
                                        color: cores.verdeEscuro
                                    }
                                ]
                            },
                            { width: 'auto', text: '' }
                        ],
                        margin: [0, 0, 0, 60]
                    },
                    // Informações do paciente
                    {
                        columns: [
                            { width: 80, text: '' },
                            {
                                width: 'auto',
                                stack: [
                                    {
                                        text: 'INFORMAÇÕES DO RELATÓRIO',
                                        style: 'infoCapaLabel',
                                        margin: [0, 0, 0, 20]
                                    },
                                    {
                                        columns: [
                                            {
                                                width: 'auto',
                                                stack: [
                                                    { text: 'Paciente:', style: 'labelCapa' },
                                                    { text: 'Data:', style: 'labelCapa', margin: [0, 15, 0, 0] },
                                                    { text: 'Terapeuta:', style: 'labelCapa', margin: [0, 15, 0, 0] },
                                                    { text: 'Total de Sessões:', style: 'labelCapa', margin: [0, 15, 0, 0] }
                                                ]
                                            },
                                            {
                                                width: 20,
                                                text: ''
                                            },
                                            {
                                                width: 'auto',
                                                stack: [
                                                    { text: pacienteNome || 'N/A', style: 'valorCapa' },
                                                    { text: dataAtual, style: 'valorCapa', margin: [0, 15, 0, 0] },
                                                    { text: terapeutaNome || 'Terapeuta', style: 'valorCapa', margin: [0, 15, 0, 0] },
                                                    { text: String(totalSessoes), style: 'valorCapa', margin: [0, 15, 0, 0] }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            { width: 80, text: '' }
                        ],
                        margin: [0, 0, 0, 0]
                    }
                ]
            }
        ];

        // Resumo Executivo - usando estilo da capa
        const resumoExecutivoConteudo = [
            {
                columns: [
                    {
                        width: 80,
                        stack: [
                            {
                                canvas: [
                                    {
                                        type: 'ellipse',
                                        x: 10,
                                        y: 10,
                                        r1: 30,
                                        r2: 30,
                                        color: getStatusColor(scoreGeral / 10)
                                    }
                                ],
                                margin: [0, 0, 0, 10]
                            },
                            {
                                text: String(scoreGeral),
                                style: 'scoreNumero',
                                alignment: 'center'
                            },
                            {
                                text: '/100',
                                style: 'scoreLabel',
                                alignment: 'center'
                            }
                        ]
                    },
                    {
                        width: 'auto',
                        stack: [
                            {
                                text: scoreGeral >= 70 
                                    ? '✨ EXCELENTE - Paciente em ótima evolução!'
                                    : scoreGeral >= 50
                                    ? '✓ BOM - Progressão positiva identificada.'
                                    : '⚠ ATENÇÃO - Necessita revisão do protocolo.',
                                style: 'interpretacao',
                                color: getStatusColor(scoreGeral / 10),
                                margin: [20, 30, 0, 0]
                            }
                        ]
                    }
                ],
                margin: [0, 0, 0, 20]
            },
            {
                columns: [
                    {
                        width: '33%',
                        stack: [
                            {
                                text: '📊 Total de Sessões',
                                style: 'metricLabel'
                            },
                            {
                                text: String(totalSessoes),
                                style: 'metricValue',
                                color: cores.principal
                            }
                        ],
                        margin: [0, 0, 10, 0]
                    },
                    {
                        width: '33%',
                        stack: [
                            {
                                text: '⚡ Velocidade de Melhoria',
                                style: 'metricLabel'
                            },
                            {
                                text: analise?.velocidadeMelhoria || 'Moderada',
                                style: 'metricValue',
                                color: cores.azul
                            }
                        ],
                        margin: [0, 0, 10, 0]
                    },
                    {
                        width: '33%',
                        stack: [
                            {
                                text: '⚠️ Campos Críticos',
                                style: 'metricLabel'
                            },
                            {
                                text: String(camposCriticos.length),
                                style: 'metricValue',
                                color: cores.critico
                            }
                        ],
                        margin: [0, 0, 0, 0]
                    }
                ],
                margin: [0, 0, 0, 20]
            },
            // DETALHES ADICIONAIS - Informações expandidas
            {
                text: 'VISÃO DETALHADA DA EVOLUÇÃO',
                style: 'subtituloSecao',
                margin: [0, 30, 0, 15],
                color: cores.azulEscuro
            },
            // Período de acompanhamento e comparação
            ...(sessoes.length > 0 ? (() => {
                const primeiraSessao = sessoes[sessoes.length - 1];
                const ultimaSessao = sessoes[0];
                
                // Calcular médias da primeira e última sessão
                let primeiraMedia = 0, ultimaMedia = 0, count = 0;
                
                if (primeiraSessao?.resultados) {
                    Object.values(primeiraSessao.resultados).forEach(v => {
                        const num = parseFloat(v);
                        if (!isNaN(num)) { primeiraMedia += num; count++; }
                    });
                    primeiraMedia = count > 0 ? primeiraMedia / count : 0;
                }
                
                if (ultimaSessao?.resultados) {
                    let countUltima = 0;
                    Object.values(ultimaSessao.resultados).forEach(v => {
                        const num = parseFloat(v);
                        if (!isNaN(num)) { ultimaMedia += num; countUltima++; }
                    });
                    ultimaMedia = countUltima > 0 ? ultimaMedia / countUltima : 0;
                }
                
                const evolucaoPercentual = primeiraMedia > 0 
                    ? (((ultimaMedia - primeiraMedia) / primeiraMedia) * 100).toFixed(1)
                    : '0';
                const evolucaoNumerica = (ultimaMedia - primeiraMedia).toFixed(1);
                const evolucaoPositiva = parseFloat(evolucaoNumerica) > 0;
                
                const dataPrimeira = primeiraSessao?.data_sessao 
                    ? new Date(primeiraSessao.data_sessao).toLocaleDateString('pt-BR')
                    : '-';
                const dataUltima = ultimaSessao?.data_sessao 
                    ? new Date(ultimaSessao.data_sessao).toLocaleDateString('pt-BR')
                    : '-';
                
                return [
                    {
                        columns: [
                            {
                                width: '50%',
                                stack: [
                                    {
                                        text: '📅 Período de Acompanhamento',
                                        fontSize: 10,
                                        bold: true,
                                        color: cores.azulEscuro,
                                        margin: [0, 0, 0, 8]
                                    },
                                    {
                                        text: `Primeira Sessão: ${dataPrimeira}`,
                                        fontSize: 9,
                                        color: cores.cinza,
                                        margin: [0, 0, 0, 3]
                                    },
                                    {
                                        text: `Última Sessão: ${dataUltima}`,
                                        fontSize: 9,
                                        color: cores.cinza,
                                        margin: [0, 0, 0, 8]
                                    },
                                    {
                                        text: `Duração: ${totalSessoes} sessão(ões) registrada(s)`,
                                        fontSize: 9,
                                        bold: true,
                                        color: cores.verdeEscuro
                                    }
                                ],
                                margin: [0, 0, 10, 0]
                            },
                            {
                                width: '50%',
                                stack: [
                                    {
                                        text: '📈 Comparação Temporal',
                                        fontSize: 10,
                                        bold: true,
                                        color: cores.azulEscuro,
                                        margin: [0, 0, 0, 8]
                                    },
                                    {
                                        columns: [
                                            {
                                                width: 'auto',
                                                stack: [
                                                    { text: 'Média Inicial:', fontSize: 9, color: cores.cinza, margin: [0, 0, 0, 3] },
                                                    { text: 'Média Atual:', fontSize: 9, color: cores.cinza, margin: [0, 8, 0, 3] },
                                                    { text: 'Evolução:', fontSize: 9, bold: true, color: cores.azulEscuro, margin: [0, 8, 0, 0] }
                                                ]
                                            },
                                            {
                                                width: 15,
                                                text: ''
                                            },
                                            {
                                                width: 'auto',
                                                stack: [
                                                    { 
                                                        text: primeiraMedia.toFixed(1), 
                                                        fontSize: 11, 
                                                        bold: true, 
                                                        color: cores.cinza,
                                                        margin: [0, 0, 0, 3]
                                                    },
                                                    { 
                                                        text: ultimaMedia.toFixed(1), 
                                                        fontSize: 11, 
                                                        bold: true, 
                                                        color: cores.verdeEscuro,
                                                        margin: [0, 8, 0, 3]
                                                    },
                                                    { 
                                                        text: `${evolucaoPositiva ? '+' : ''}${evolucaoNumerica} (${evolucaoPositiva ? '+' : ''}${evolucaoPercentual}%)`, 
                                                        fontSize: 11, 
                                                        bold: true, 
                                                        color: evolucaoPositiva ? cores.verdeEscuro : cores.critico,
                                                        margin: [0, 8, 0, 0]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                margin: [0, 0, 0, 0]
                            }
                        ],
                        margin: [0, 0, 0, 15]
                    }
                ];
            })() : []),
            // Campos em destaque (melhores e piores)
            ...(analise?.indicesPorCampo && Object.keys(analise.indicesPorCampo).length > 0 ? (() => {
                const camposArray = Object.entries(analise.indicesPorCampo)
                    .map(([nome, dados]) => ({
                        nome,
                        valor: parseFloat(dados.atual || 0),
                        percentual: dados.percentual || 0
                    }))
                    .sort((a, b) => b.valor - a.valor);
                
                const top3Melhores = camposArray.slice(0, 3).filter(c => c.valor >= 5);
                const top3Piores = camposArray.slice(-3).filter(c => c.valor < 7);
                
                return [
                    {
                        columns: [
                            {
                                width: top3Piores.length > 0 ? '50%' : '100%',
                                stack: [
                                    {
                                        text: '⭐ Campos em Destaque Positivo',
                                        fontSize: 10,
                                        bold: true,
                                        color: cores.verdeEscuro,
                                        margin: [0, 0, 0, 10]
                                    },
                                    ...(top3Melhores.length > 0 ? top3Melhores.map((campo, idx) => ({
                                        margin: [0, 0, 0, 8],
                                        border: [true, true, true, true],
                                        borderColor: cores.verde,
                                        fillColor: '#F0FDF4',
                                        stack: [
                                            {
                                                text: `${idx + 1}. ${campo.nome}`,
                                                fontSize: 10,
                                                bold: true,
                                                color: cores.verdeEscuro,
                                                margin: [8, 6, 8, 4]
                                            },
                                            {
                                                text: `Nível: ${campo.valor.toFixed(1)}/10 (${campo.percentual}%)`,
                                                fontSize: 9,
                                                color: cores.verdeEscuro,
                                                margin: [8, 0, 8, 6]
                                            }
                                        ]
                                    })) : [{
                                        text: 'Nenhum campo acima da média identificado',
                                        fontSize: 9,
                                        color: cores.cinza,
                                        italics: true,
                                        margin: [0, 0, 0, 8]
                                    }])
                                ],
                                margin: [0, 0, top3Piores.length > 0 ? 10 : 0, 0]
                            },
                            ...(top3Piores.length > 0 ? [{
                                width: '50%',
                                stack: [
                                    {
                                        text: '⚠️ Campos Necessitando Atenção',
                                        fontSize: 10,
                                        bold: true,
                                        color: cores.critico,
                                        margin: [0, 0, 0, 10]
                                    },
                                    ...top3Piores.map((campo, idx) => ({
                                        margin: [0, 0, 0, 8],
                                        border: [true, true, true, true],
                                        borderColor: cores.critico,
                                        fillColor: '#FEF3C7',
                                        stack: [
                                            {
                                                text: `${idx + 1}. ${campo.nome}`,
                                                fontSize: 10,
                                                bold: true,
                                                color: cores.critico,
                                                margin: [8, 6, 8, 4]
                                            },
                                            {
                                                text: `Nível: ${campo.valor.toFixed(1)}/10 (${campo.percentual}%)`,
                                                fontSize: 9,
                                                color: cores.critico,
                                                margin: [8, 0, 8, 6]
                                            }
                                        ]
                                    }))
                                ],
                                margin: [0, 0, 0, 0]
                            }] : [])
                        ],
                        margin: [0, 0, 0, 20]
                    }
                ];
            })() : [])
        ];

        // Montar Resumo Executivo completo (com fundo)
        const resumoExecutivo = [
            { text: '', pageBreak: 'before' }, // Quebra antes (apenas se necessário)
            // Aplicar fundo decorativo na página
            ...criarFundoDecorativo(1),
            ...criarCabecalhoSecao(
                'RESUMO EXECUTIVO',
                'Visão Geral da Evolução',
                'Análise Consolidada dos Resultados Terapêuticos'
            ),
            // Conteúdo do resumo executivo
            {
                // margin: [left, top, right, bottom]
                margin: [0, 8, 0, 0], // [esquerda, superior, direita, inferior]
                stack: resumoExecutivoConteudo
            }
        ];

        // INSIGHTS E OBSERVAÇÕES - página separada (com fundo)
        const insightsSecao = [
            { text: '', pageBreak: 'before' }, // Quebra antes (apenas se necessário)
            // Aplicar fundo decorativo na página
            ...criarFundoDecorativo(2),
            ...criarCabecalhoSecao(
                'INSIGHTS E OBSERVAÇÕES',
                'Análise Interpretativa dos Resultados',
                'Observações Detalhadas sobre a Evolução'
            ),
            {
                // margin: [left, top, right, bottom]
                margin: [0, 8, 0, 0], // [esquerda, superior, direita, inferior]
                stack: [
                    {
                        stack: [
                            {
                                text: `• Score Geral: ${scoreGeral}/100 pontos - ${scoreGeral >= 70 ? 'Nível excelente de harmonia energética' : scoreGeral >= 50 ? 'Nível satisfatório com potencial de melhoria' : 'Necessita atenção imediata para reequilíbrio'}`,
                                fontSize: 10,
                                color: cores.texto,
                                margin: [0, 0, 0, 8]
                            },
                            {
                                text: `• Velocidade de Evolução: ${analise?.velocidadeMelhoria || 'Avaliação em andamento'} - ${analise?.velocidadeMelhoria === 'Rápida Evolução' ? 'Progresso acelerado positivo' : analise?.velocidadeMelhoria === 'Evolução Moderada' ? 'Progressão consistente' : analise?.velocidadeMelhoria === 'Regressão' ? 'Atenção: reversão de ganhos identificada' : 'Estabilidade mantida'}`,
                                fontSize: 10,
                                color: cores.texto,
                                margin: [0, 0, 0, 8]
                            },
                            {
                                text: `• Total de Campos Críticos: ${camposCriticos.length} campo(s) - ${camposCriticos.length === 0 ? 'Excelente! Nenhum campo crítico identificado' : camposCriticos.length <= 2 ? 'Situação controlável com foco direcionado' : 'Requer protocolo de atenção intensiva'}`,
                                fontSize: 10,
                                color: cores.texto,
                                margin: [0, 0, 0, 8]
                            },
                            {
                                text: `• Recomendação Geral: ${scoreGeral >= 70 ? 'Manter protocolo atual e continuar monitoramento' : scoreGeral >= 50 ? 'Reforçar áreas específicas e ajustar estratégia terapêutica' : 'Revisão urgente do protocolo e intensificação das intervenções'}`,
                                fontSize: 10,
                                color: cores.texto,
                                bold: true,
                                margin: [0, 0, 0, 0]
                            }
                        ],
                        border: [true, true, true, true],
                        borderColor: cores.azulClaro,
                        fillColor: '#EFF6FF',
                        padding: [15, 20, 15, 20],
                        margin: [0, 0, 0, 0]
                    }
                ]
            }
        ];

        // Tabela de Análise por Campo - APRIMORADA
        const tabelaCampos = [];
        if (analise?.indicesPorCampo && typeof analise.indicesPorCampo === 'object') {
            const indicesEntries = Object.entries(analise.indicesPorCampo);
            
            if (indicesEntries.length > 0) {
                // Adicionar quebra de página
                tabelaCampos.push({ text: '', pageBreak: 'before' });
                // Aplicar fundo decorativo na página
                tabelaCampos.push(...criarFundoDecorativo(3));
                tabelaCampos.push(...criarCabecalhoSecao(
                    'ANÁLISE DETALHADA POR CAMPO',
                    'Avaliação Individual dos Campos Energéticos',
                    'Análise Profunda de Cada Dimensão Avaliada'
                ));
                
                // Adicionar conteúdo da tabela (mais compacto)
                tabelaCampos.push({
                    text: 'DETALHAMENTO POR CAMPO ENERGÉTICO',
                    fontSize: 11,
                    bold: true,
                    color: cores.azulEscuro,
                    // margin: [left, top, right, bottom]
                    margin: [0, 12, 0, 8] // [esquerda, superior, direita, inferior]
                });

                // Cabeçalho da tabela - com mais colunas
                const tableBody = [
                    [
                        { 
                            text: 'Campo Energético', 
                            style: 'tableHeader', 
                            fillColor: '#EFF6FF', // Fundo azul muito claro ao invés de sólido
                            color: cores.azulEscuro, // Texto escuro
                            alignment: 'left'
                        },
                        { 
                            text: 'Nível Atual', 
                            style: 'tableHeader', 
                            fillColor: '#EFF6FF',
                            color: cores.azulEscuro, // Texto escuro
                            alignment: 'center'
                        },
                        { 
                            text: 'Evolução', 
                            style: 'tableHeader', 
                            fillColor: '#EFF6FF',
                            color: cores.azulEscuro, // Texto escuro
                            alignment: 'center'
                        },
                        { 
                            text: 'Status', 
                            style: 'tableHeader', 
                            fillColor: '#EFF6FF',
                            color: cores.azulEscuro, // Texto escuro
                            alignment: 'center'
                        },
                        { 
                            text: 'Prioridade', 
                            style: 'tableHeader', 
                            fillColor: '#EFF6FF',
                            color: cores.azulEscuro, // Texto escuro
                            alignment: 'center'
                        }
                    ]
                ];

                // Ordenar por valor (menor primeiro = mais crítico)
                const sortedEntries = indicesEntries.sort((a, b) => {
                    const valorA = parseFloat(a[1]?.atual || 0);
                    const valorB = parseFloat(b[1]?.atual || 0);
                    return valorA - valorB;
                });

                // Linhas da tabela com mais informações
                sortedEntries.forEach(([campo, dados], index) => {
                    const valor = parseFloat(dados?.atual || 0);
                    const anterior = parseFloat(dados?.anterior || valor);
                    const statusColor = getStatusColor(valor);
                    const statusTexto = getStatusTexto(valor);
                    
                    // Calcular evolução
                    const evolucao = valor - anterior;
                    const evolucaoTexto = evolucao > 0 ? `+${evolucao.toFixed(1)}` : evolucao.toFixed(1);
                    const evolucaoColor = evolucao > 0 ? cores.sucesso : evolucao < 0 ? cores.critico : cores.cinza;
                    
                    // Determinar prioridade
                    let prioridade = '';
                    let prioridadeColor = cores.cinza;
                    if (valor < 3) {
                        prioridade = 'URGENTE';
                        prioridadeColor = cores.critico;
                    } else if (valor < 5) {
                        prioridade = 'ALTA';
                        prioridadeColor = cores.atencao;
                    } else if (valor < 7) {
                        prioridade = 'MÉDIA';
                        prioridadeColor = cores.atencao;
                    } else {
                        prioridade = 'BAIXA';
                        prioridadeColor = cores.sucesso;
                    }

                    tableBody.push([
                        { 
                            text: campo, 
                            style: 'tableCell', 
                            bold: true,
                            fillColor: null // Sempre transparente, zebrado é aplicado no layout
                        },
                        { 
                            text: `${valor.toFixed(1)}/10`, 
                            style: 'tableCell', 
                            bold: true, 
                            color: statusColor,
                            alignment: 'center'
                        },
                        { 
                            text: evolucaoTexto, 
                            style: 'tableCell', 
                            color: evolucaoColor,
                            alignment: 'center'
                        },
                        { 
                            text: statusTexto, 
                            style: 'tableCell', 
                            color: statusColor,
                            alignment: 'center'
                        },
                        { 
                            text: prioridade, 
                            style: 'tableCell', 
                            fontSize: 8, 
                            color: prioridadeColor,
                            alignment: 'center'
                        }
                    ]);
                });

                // Layout customizado otimizado para tabela de campos
                const tableLayoutCampos = {
                    hLineWidth: (i, node) => {
                        // i = 0: linha acima da primeira linha (topo da tabela) - SEM linha
                        // i = 1 até node.table.body.length - 1: linhas entre as linhas de dados
                        // i = node.table.body.length: linha abaixo da última linha (final da tabela) - COM linha
                        if (i === 0) return 0; // Sem linha no topo
                        // Garantir que a linha final SEMPRE apareça (espessura maior para garantir visibilidade)
                        if (i === node.table.body.length) return 1; // Linha delimitadora no final da tabela - mais espessa
                        return i === 1 ? 1 : 0.5; // Linha grossa após cabeçalho (i=1), fina entre linhas (i>1)
                    },
                    vLineWidth: () => 0.5, // Linhas verticais finas
                    hLineColor: (i, node) => {
                        // Linha mais escura após cabeçalho e no final
                        if (i === node.table.body.length) return cores.cinza; // Linha final - garantir cor visível
                        return i === 1 ? cores.principal : cores.cinza;
                    },
                    vLineColor: () => cores.cinza,
                    fillColor: (rowIndex) => {
                        // Zebrado: linhas pares com fundo claro (exceto cabeçalho)
                        return rowIndex === 0 ? null : (rowIndex % 2 === 0 ? '#FAFAFA' : null);
                    },
                    paddingLeft: () => 8,
                    paddingRight: () => 8,
                    paddingTop: (i) => i === 0 ? 6 : 4,
                    paddingBottom: (i, node) => i === node.table.body.length - 1 ? 6 : 4
                };

                tabelaCampos.push({
                    table: {
                        headerRows: 1, // Cabeçalho se repete em múltiplas páginas
                        // widths: '*' = flexível, números = fixo em pontos
                        widths: ['*', 'auto', 'auto', 'auto', 'auto'], // Campo flexível, demais fixas
                        body: tableBody
                    },
                    layout: tableLayoutCampos,
                    // margin: [left, top, right, bottom]
                    margin: [0, 0, 0, 12] // [esquerda, superior, direita, inferior] - otimizado
                });
            }
        }

        // Histórico de Sessões
        const historicoSessoes = [];
        const ultimasSessoes = Array.isArray(sessoes) ? sessoes.slice(0, 10) : [];
        
        if (ultimasSessoes.length > 0) {
            historicoSessoes.push({ text: '', pageBreak: 'before' });
            // Aplicar fundo decorativo na página
            historicoSessoes.push(...criarFundoDecorativo(4));
            historicoSessoes.push(...criarCabecalhoSecao(
                'HISTÓRICO DE SESSÕES',
                'Registro Completo das Sessões Realizadas',
                'Evolução Temporal das Intervenções Terapêuticas'
            ));
            historicoSessoes.push({
                text: 'HISTÓRICO COMPLETO DE SESSÕES',
                fontSize: 11,
                bold: true,
                color: cores.azulEscuro,
                // margin: [left, top, right, bottom]
                margin: [0, 12, 0, 8] // [esquerda, superior, direita, inferior]
            });

            const tableBody = [
                [
                    { 
                        text: 'Data', 
                        style: 'tableHeader', 
                        fillColor: '#EFF6FF', // Fundo azul muito claro
                        color: cores.azulEscuro, // Texto escuro
                        alignment: 'center'
                    },
                    { 
                        text: 'Terapia', 
                        style: 'tableHeader', 
                        fillColor: '#EFF6FF',
                        color: cores.azulEscuro, // Texto escuro
                        alignment: 'left'
                    },
                    { 
                        text: 'Média', 
                        style: 'tableHeader', 
                        fillColor: '#EFF6FF',
                        color: cores.azulEscuro, // Texto escuro
                        alignment: 'center'
                    },
                    { 
                        text: 'Campos Avaliados', 
                        style: 'tableHeader', 
                        fillColor: '#EFF6FF',
                        color: cores.azulEscuro, // Texto escuro
                        alignment: 'center'
                    },
                    { 
                        text: 'Status', 
                        style: 'tableHeader', 
                        fillColor: '#EFF6FF',
                        color: cores.azulEscuro, // Texto escuro
                        alignment: 'center'
                    }
                ]
            ];

            ultimasSessoes.forEach((sessao) => {
                // Calcular média e quantidade de campos avaliados
                let soma = 0, count = 0;
                const camposAvaliados = [];
                
                if (sessao?.resultados && typeof sessao.resultados === 'object') {
                    Object.entries(sessao.resultados).forEach(([campo, valor]) => {
                        const num = parseFloat(valor);
                        if (!isNaN(num) && num > 0) { 
                            soma += num; 
                            count++;
                            camposAvaliados.push(campo);
                        }
                    });
                }
                
                const media = count > 0 ? (soma / count).toFixed(1) : '0';
                const numMedia = parseFloat(media);
                const statusColor = getStatusColor(numMedia);
                const statusTexto = numMedia >= 7 ? 'Excelente' : numMedia >= 5 ? 'Bom' : 'Atenção';
                const status = numMedia >= 7 ? '✓' : numMedia >= 5 ? '~' : '!';

                const dataSessao = sessao?.data_sessao 
                    ? new Date(sessao.data_sessao).toLocaleDateString('pt-BR')
                    : '-';

                const terapia = terapias[sessao?.terapia_id]?.nome || sessao?.terapia_id || '-';
                const qtdCampos = camposAvaliados.length > 0 ? String(camposAvaliados.length) : '0';

                tableBody.push([
                    { 
                        text: dataSessao, 
                        style: 'tableCell',
                        alignment: 'center',
                        fillColor: null // Sempre transparente, zebrado é aplicado no layout
                    },
                    { 
                        text: String(terapia).substring(0, 30), // Aumentado para 30 caracteres
                        style: 'tableCell',
                        alignment: 'left'
                    },
                    { 
                        text: media, 
                        style: 'tableCell', 
                        bold: true, 
                        color: statusColor,
                        alignment: 'center'
                    },
                    { 
                        text: qtdCampos, 
                        style: 'tableCell', 
                        alignment: 'center'
                    },
                    { 
                        text: `${status} ${statusTexto}`, 
                        style: 'tableCell', 
                        fontSize: 8, 
                        color: statusColor,
                        alignment: 'center'
                    }
                ]);
            });

            // Layout customizado otimizado para histórico de sessões
            const tableLayoutSessoes = {
                hLineWidth: (i, node) => {
                    // i = 0: linha acima da primeira linha (topo da tabela) - SEM linha
                    // i = 1 até node.table.body.length - 1: linhas entre as linhas de dados
                    // i = node.table.body.length: linha abaixo da última linha (final da tabela) - COM linha
                    if (i === 0) return 0; // Sem linha no topo
                    // Garantir que a linha final SEMPRE apareça (espessura maior para garantir visibilidade)
                    if (i === node.table.body.length) return 1; // Linha delimitadora no final da tabela - mais espessa
                    return i === 1 ? 1 : 0.5; // Linha grossa após cabeçalho (i=1), fina entre linhas (i>1)
                },
                vLineWidth: () => 0.5, // Linhas verticais finas
                hLineColor: (i, node) => {
                    // Linha mais escura após cabeçalho e no final
                    if (i === node.table.body.length) return cores.cinza; // Linha final - garantir cor visível
                    return i === 1 ? cores.azul : cores.cinza;
                },
                vLineColor: () => cores.cinza,
                fillColor: (rowIndex) => {
                    // Zebrado: linhas pares com fundo claro (exceto cabeçalho)
                    return rowIndex === 0 ? null : (rowIndex % 2 === 0 ? '#FAFAFA' : null);
                },
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: (i) => i === 0 ? 6 : 4,
                paddingBottom: (i, node) => i === node.table.body.length - 1 ? 6 : 4
            };

            historicoSessoes.push({
                table: {
                    headerRows: 1, // Cabeçalho se repete em múltiplas páginas
                    // widths: '*' = flexível, números = fixo em pontos, 'auto' = ajusta ao conteúdo
                    widths: ['auto', '*', 'auto', 'auto', 'auto'], // Terapia flexível, demais fixas/auto
                    body: tableBody
                },
                layout: tableLayoutSessoes,
                // margin: [left, top, right, bottom]
                margin: [0, 0, 0, 12] // [esquerda, superior, direita, inferior] - otimizado
            });
        }

        // Campos Críticos
        const camposCriticosSecao = [];
        if (camposCriticos.length > 0) {
            camposCriticosSecao.push({ text: '', pageBreak: 'before' });
            // Aplicar fundo decorativo na página
            camposCriticosSecao.push(...criarFundoDecorativo(5));
            camposCriticosSecao.push(...criarCabecalhoSecao(
                'CAMPOS QUE NECESSITAM ATENÇÃO',
                'Áreas Requerendo Intervenção Imediata',
                'Priorização de Campos Energéticos Críticos'
            ));
            camposCriticosSecao.push({
                text: 'CAMPOS QUE NECESSITAM ATENÇÃO URGENTE',
                fontSize: 11,
                bold: true,
                color: cores.critico,
                // margin: [left, top, right, bottom]
                margin: [0, 12, 0, 8] // [esquerda, superior, direita, inferior]
            });

            // Adicionar resumo antes dos campos
            camposCriticosSecao.push({
                text: `Total de ${camposCriticos.length} campo(s) identificado(s) como crítico(s)`,
                fontSize: 10,
                color: cores.critico,
                italics: true,
                // margin: [left, top, right, bottom]
                margin: [0, 0, 0, 10] // [esquerda, superior, direita, inferior]
            });

            // Organizar campos críticos em colunas para melhor aproveitamento do espaço
            const camposCriticosItems = camposCriticos.map((critico) => {
                // Calcular quanto falta para meta (considerando 7 como meta)
                const meta = 7;
                const faltante = Math.max(0, meta - critico.valor);
                const percentualMeta = (critico.valor / meta) * 100;
                
                return {
                    // margin: [left, top, right, bottom]
                    margin: [0, 0, 0, 8], // [esquerda, superior, direita, inferior] - reduzido para caber mais
                    border: [true, true, true, true],
                    borderColor: cores.critico,
                    fillColor: '#FEF3C7',
                    stack: [
                        {
                            text: `🔴 ${critico.campo}`,
                            style: 'campoCriticoTitulo',
                            fontSize: 11, // Reduzido um pouco
                            margin: [8, 8, 8, 4] // [esquerda, superior, direita, inferior]
                        },
                        {
                            columns: [
                                {
                                    width: 'auto',
                                    stack: [
                                        {
                                            text: `Valor: ${critico.valor}/10 (${percentualMeta.toFixed(0)}% da meta)`,
                                            style: 'campoCriticoValor',
                                            fontSize: 9,
                                            margin: [8, 0, 8, 4]
                                        },
                                        {
                                            text: faltante > 0 
                                                ? `⚠️ Faltam ${faltante.toFixed(1)} pontos`
                                                : '✓ Meta atingida',
                                            fontSize: 8,
                                            color: faltante > 0 ? cores.critico : cores.sucesso,
                                            margin: [8, 0, 8, 4],
                                            bold: faltante > 0
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            text: critico.recomendacao || 'Focar nas próximas sessões para elevar este campo energético',
                            style: 'campoCriticoTexto',
                            fontSize: 8, // Reduzido para caber melhor
                            margin: [8, 0, 8, 8]
                        }
                    ]
                };
            });

            // Dividir em 2 colunas se houver mais de 2 campos críticos
            if (camposCriticos.length > 2) {
                const metade = Math.ceil(camposCriticosItems.length / 2);
                const coluna1 = camposCriticosItems.slice(0, metade);
                const coluna2 = camposCriticosItems.slice(metade);
                
                camposCriticosSecao.push({
                    columns: [
                        {
                            width: '48%',
                            stack: coluna1
                        },
                        {
                            width: 10,
                            text: '' // Espaçamento entre colunas
                        },
                        {
                            width: '48%',
                            stack: coluna2
                        }
                    ],
                    // margin: [left, top, right, bottom]
                    margin: [0, 0, 0, 0] // [esquerda, superior, direita, inferior]
                });
            } else {
                // Se 2 ou menos, manter em uma coluna
                camposCriticosItems.forEach(item => {
                    camposCriticosSecao.push(item);
                });
            }
            
            // Com o layout de 2 colunas, normalmente todos os campos cabem na mesma página
            // A continuação só é necessária se houver mais de 8 campos críticos
            if (camposCriticos.length > 8) {
                camposCriticosSecao.push({
                    text: '',
                    pageBreak: 'before'
                });
                // Aplicar fundo decorativo na página de continuação
                camposCriticosSecao.push(...criarFundoDecorativo(6));
                camposCriticosSecao.push(...criarCabecalhoSecao(
                    'CAMPOS CRÍTICOS (Continuação)',
                    'Áreas Requerendo Intervenção Imediata',
                    'Complemento da Análise de Campos Prioritários'
                ));
                
                // Continuar com os campos restantes em 2 colunas também
                const camposRestantes = camposCriticos.slice(8).map((critico) => {
                    const meta = 7;
                    const faltante = Math.max(0, meta - critico.valor);
                    const percentualMeta = (critico.valor / meta) * 100;
                    
                    return {
                        margin: [0, 0, 0, 8],
                        border: [true, true, true, true],
                        borderColor: cores.critico,
                        fillColor: '#FEF3C7',
                        stack: [
                            {
                                text: `🔴 ${critico.campo}`,
                                fontSize: 11,
                                margin: [8, 8, 8, 4]
                            },
                            {
                                text: `Valor: ${critico.valor}/10 (${percentualMeta.toFixed(0)}% da meta)`,
                                fontSize: 9,
                                margin: [8, 0, 8, 4]
                            },
                            {
                                text: critico.recomendacao || 'Focar nas próximas sessões para elevar este campo energético',
                                fontSize: 8,
                                margin: [8, 0, 8, 8]
                            }
                        ]
                    };
                });
                
                const metadeRestante = Math.ceil(camposRestantes.length / 2);
                const coluna1Restante = camposRestantes.slice(0, metadeRestante);
                const coluna2Restante = camposRestantes.slice(metadeRestante);
                
                camposCriticosSecao.push({
                    columns: [
                        {
                            width: '48%',
                            stack: coluna1Restante
                        },
                        {
                            width: 10,
                            text: ''
                        },
                        {
                            width: '48%',
                            stack: coluna2Restante
                        }
                    ],
                    margin: [0, 0, 0, 0]
                });
            }
        }

        // Recomendações Terapêuticas
        const recomendacoes = [];
        let recomendacoesLista = [];
        
        if (scoreGeral >= 70) {
            recomendacoesLista = [
                'Manter o ritmo atual de sessões',
                'Consolidar resultados obtidos',
                'Focar em manutenção preventiva',
                'Celebrar conquistas com o paciente',
                'Documentar técnicas mais eficazes',
                'Considerar intensificação gradual se necessário'
            ];
        } else if (scoreGeral >= 50) {
            recomendacoesLista = [
                'Intensificar trabalho nos campos críticos',
                'Considerar terapias complementares',
                'Avaliar frequência das sessões',
                'Ajustar protocolo conforme necessário',
                'Monitorar evoluções nos próximos 30 dias',
                'Focar em técnicas mais eficazes'
            ];
        } else {
            recomendacoesLista = [
                'URGENTE: Revisar protocolo terapêutico completo',
                'Considerar abordagens complementares',
                'Aumentar frequência das sessões',
                'Investigação de fatores externos impactantes',
                'Avaliar necessidade de apoio multidisciplinar',
                'Realizar sessão de emergência se necessário'
            ];
        }

        // Recomendações (com fundo) - Ajuste de diagramação para começar no topo da página
        // Quebra de página explícita sem margem extra
        recomendacoes.push({ text: '', pageBreak: 'before' });
        // Aplicar fundo decorativo na página
        recomendacoes.push(...criarFundoDecorativo(7));
        
        // Cabeçalho com margem superior mínima para começar próximo ao topo
        recomendacoes.push({
            text: 'RECOMENDAÇÕES TERAPÊUTICAS',
            style: 'tituloSecaoPagina',
            margin: [0, 0, 0, 4], // Margem superior zerada, começa no topo
            alignment: 'center'
        });
        recomendacoes.push({
            text: 'Orientações para Continuidade do Tratamento',
            style: 'subtituloSecaoPagina',
            margin: [0, 0, 0, 8], // Margem inferior reduzida
            alignment: 'center'
        });

        // Conteúdo das recomendações - tamanhos originais, espaçamentos otimizados
        recomendacoes.push({
            stack: [
                {
                    text: scoreGeral >= 70 ? 'STATUS: EXCELENTE EVOLUÇÃO' 
                        : scoreGeral >= 50 ? 'STATUS: BOA PROGRESSÃO'
                        : 'STATUS: ATENÇÃO NECESSÁRIA',
                    fontSize: 12, // Tamanho original
                    bold: true,
                    color: getStatusColor(scoreGeral / 10),
                    margin: [0, 0, 0, 8], // Margem padrão
                    alignment: 'center'
                },
                {
                    ul: recomendacoesLista.map(r => `• ${r}`),
                    fontSize: 10, // Tamanho original
                    color: cores.texto,
                    margin: [0, 0, 0, 8], // Margem padrão
                    lineHeight: 1.3, // Tamanho original
                    alignment: 'left'
                },
                // Campos críticos (se houver)
                ...(camposCriticos.length > 0 ? [
                    {
                        text: 'CAMPOS PRIORITÁRIOS:',
                        style: 'subtituloSecao',
                        margin: [0, 6, 0, 4] // Margens padrão
                    },
                    {
                        ul: camposCriticos.slice(0, 3).map(c => 
                            `${c.campo} (${c.valor}/10)`
                        ),
                        fontSize: 10, // Tamanho original
                        color: cores.texto,
                        margin: [0, 0, 0, 8], // Margem padrão
                        lineHeight: 1.3 // Tamanho original
                    }
                ] : []),
                {
                    text: 'PRÓXIMOS PASSOS:',
                    style: 'subtituloSecao',
                    margin: [0, 6, 0, 4] // Margens padrão
                },
                {
                    ol: [
                        'Discutir este relatório com o paciente',
                        'Ajustar protocolo conforme áreas críticas',
                        'Agendar próxima avaliação em 30 dias',
                        'Documentar evolução nas próximas sessões',
                        `Focar nas terapias eficazes (${totalSessoes} sessões)`,
                        'Manter comunicação próxima',
                        'Monitorar campos prioritários semanalmente'
                    ],
                    fontSize: 10, // Tamanho original
                    color: cores.texto,
                    margin: [0, 0, 0, 8], // Margem padrão
                    lineHeight: 1.3 // Tamanho original
                },
                // Informações do relatório
                {
                    text: 'INFORMAÇÕES DO RELATÓRIO',
                    style: 'subtituloSecao',
                    fontSize: 10, // Tamanho original
                    margin: [0, 6, 0, 4] // Margens padrão
                },
                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                {
                                    text: `📊 ${totalSessoes} sessões | Score: ${scoreGeral}/100`,
                                    fontSize: 9, // Tamanho original
                                    color: cores.texto,
                                    margin: [0, 0, 0, 2]
                                },
                                {
                                    text: `📋 ${analise?.indicesPorCampo ? Object.keys(analise.indicesPorCampo).length : 0} campos avaliados`,
                                    fontSize: 9, // Tamanho original
                                    color: cores.texto,
                                    margin: [0, 0, 0, 4]
                                }
                            ]
                        },
                        {
                            width: '50%',
                            stack: [
                                {
                                    text: `⚠️ ${camposCriticos.length} campo(s) crítico(s)`,
                                    fontSize: 9, // Tamanho original
                                    color: cores.texto,
                                    margin: [0, 0, 0, 2]
                                },
                                {
                                    text: `📅 ${dataAtual}`,
                                    fontSize: 9, // Tamanho original
                                    color: cores.texto,
                                    margin: [0, 0, 0, 0] // Sem margem final
                                }
                            ]
                        }
                    ],
                    margin: [0, 0, 0, 0] // Sem margem final
                }
            ],
            margin: [20, 0, 20, 0] // Margens laterais para centralização
        });

        // Montar documento completo
        const docDefinition = {
            pageSize: 'A4',
            // pageMargins: [left, top, right, bottom] em pontos (1 ponto = 0.353mm)
            pageMargins: [35, 60, 35, 60], // [esquerda, superior, direita, inferior] - otimizado para máximo aproveitamento
            fonts: {
                Roboto: {
                    normal: 'Roboto-Regular.ttf',
                    bold: 'Roboto-Medium.ttf',
                    italics: 'Roboto-Italic.ttf',
                    bolditalics: 'Roboto-MediumItalic.ttf'
                }
            },
            // Nota: pdfmake não suporta background como função diretamente
            // O fundo será aplicado através do conteúdo de cada seção
            header: function(currentPage, pageCount) {
                // Não mostrar header na capa (página 1)
                if (currentPage === 1) {
                    return { text: '', margin: 0 };
                }
                return {
                    text: `Página ${currentPage} de ${pageCount}`,
                    alignment: 'right',
                    fontSize: 8,
                    color: cores.cinza,
                    margin: [0, 15, 40, 0],
                    bold: true
                };
            },
            footer: function(currentPage, pageCount) {
                // Não mostrar footer na capa (página 1)
                if (currentPage === 1) {
                    return { text: '', margin: 0 };
                }
                return {
                    columns: [
                        {
                            text: 'APP 5D Therapists - Documento Confidencial',
                            fontSize: 8,
                            color: cores.cinza,
                            bold: true
                        },
                        {
                            text: dataAtual,
                            alignment: 'right',
                            fontSize: 8,
                            color: cores.cinza,
                            bold: true
                        }
                    ],
                    margin: [40, 15, 40, 0]
                };
            },
            content: [
                // CAPA (página 1)
                ...capa,
                // RESUMO EXECUTIVO (página 2) - COM FUNDO
                ...resumoExecutivo,
                // INSIGHTS E OBSERVAÇÕES (página 3)
                ...insightsSecao,
                // TABELA DE CAMPOS (página 4)
                ...tabelaCampos,
                // HISTÓRICO DE SESSÕES (página 5)
                ...historicoSessoes,
                // CAMPOS CRÍTICOS (página 6+)
                ...camposCriticosSecao,
                // RECOMENDAÇÕES (página final)
                ...recomendacoes
            ],
            styles: {
                // Estilos da Capa (cores holísticas azul/verde)
                tituloCapa: {
                    fontSize: 42,
                    bold: true,
                    color: cores.azulEscuro
                },
                subtituloCapa: {
                    fontSize: 24,
                    color: cores.azul,
                    bold: true
                },
                descricaoCapa: {
                    fontSize: 14,
                    color: cores.verdeEscuro,
                    italics: true
                },
                scoreCapa: {
                    fontSize: 48,
                    bold: true,
                    color: cores.azulEscuro
                },
                scoreLabelCapa: {
                    fontSize: 14,
                    color: cores.verdeEscuro
                },
                infoCapaLabel: {
                    fontSize: 12,
                    bold: true,
                    color: cores.azulEscuro,
                    uppercase: true
                },
                labelCapa: {
                    fontSize: 11,
                    color: cores.cinza
                },
                valorCapa: {
                    fontSize: 13,
                    bold: true,
                    color: cores.texto
                },
                // Estilos antigos (mantidos para compatibilidade)
                tituloPrincipal: {
                    fontSize: 28,
                    bold: true,
                    color: '#FFFFFF'
                },
                subtitulo: {
                    fontSize: 18,
                    color: '#FFFFFF'
                },
                descricao: {
                    fontSize: 12,
                    color: '#FFFFFF',
                    italics: true
                },
                labelInfo: {
                    fontSize: 10,
                    color: cores.cinza
                },
                valorInfo: {
                    fontSize: 12,
                    bold: true,
                    color: cores.texto
                },
                tituloSecao: {
                    fontSize: 16,
                    bold: true,
                    color: cores.principal,
                    margin: [0, 0, 0, 10]
                },
                scoreNumero: {
                    fontSize: 32,
                    bold: true,
                    color: '#FFFFFF'
                },
                scoreLabel: {
                    fontSize: 12,
                    color: '#FFFFFF'
                },
                interpretacao: {
                    fontSize: 14,
                    bold: true
                },
                metricLabel: {
                    fontSize: 9,
                    color: cores.cinza
                },
                metricValue: {
                    fontSize: 18,
                    bold: true
                },
                tableHeader: {
                    bold: true,
                    fontSize: 10,
                    color: '#FFFFFF' // Branco apenas quando fillColor está presente (cabeçalho colorido)
                },
                tableCell: {
                    fontSize: 9,
                    color: cores.texto
                },
                campoCriticoTitulo: {
                    fontSize: 14,
                    bold: true,
                    color: cores.critico
                },
                campoCriticoValor: {
                    fontSize: 12,
                    bold: true,
                    color: cores.critico
                },
                campoCriticoTexto: {
                    fontSize: 10,
                    color: cores.texto
                },
                statusRecomendacao: {
                    fontSize: 14,
                    bold: true
                },
                listaRecomendacoes: {
                    fontSize: 10,
                    color: cores.texto
                },
                subtituloSecao: {
                    fontSize: 12,
                    bold: true,
                    color: cores.principal
                },
                listaPassos: {
                    fontSize: 10,
                    color: cores.texto
                },
                // Novos estilos para cabeçalhos de seção
                tituloSecaoPagina: {
                    fontSize: 28,
                    bold: true,
                    color: cores.azulEscuro
                },
                subtituloSecaoPagina: {
                    fontSize: 16,
                    color: cores.azul,
                    bold: true
                },
                descricaoSecaoPagina: {
                    fontSize: 12,
                    color: cores.verdeEscuro,
                    italics: true
                }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 10,
                color: cores.texto
            }
        };

        // Obter instância do pdfmake
        console.log('📦 Carregando pdfmake...');
        const pdfMake = await getPdfMake();
        
        if (!pdfMake || !pdfMake.createPdf) {
            throw new Error('pdfmake não foi carregado corretamente');
        }
        
        console.log('✅ pdfmake carregado, gerando PDF...');
        
        // Gerar e baixar PDF
        const fileName = `Relatorio_Quantico_${pacienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        console.log('📄 Criando documento PDF...');
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        if (!pdfDocGenerator || typeof pdfDocGenerator.download !== 'function') {
            throw new Error('Erro ao criar gerador de PDF');
        }
        
        console.log('💾 Fazendo download do PDF...');
        pdfDocGenerator.download(fileName);

        console.log('✅ PDF gerado e baixado com sucesso usando pdfmake!');
        return { success: true, fileName };

    } catch (error) {
        console.error('❌ Erro ao gerar PDF com pdfmake:', error);
        console.error('📋 Detalhes do erro:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw new Error(`Erro ao gerar PDF: ${error.message}`);
    }
}

