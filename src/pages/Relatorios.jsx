import React, { useState, useEffect } from 'react';
import { Paciente } from '@/api/entities';
import { Sessao } from '@/api/entities';
import { Terapia } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Loader2, FileDown, Info, TrendingUp, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import AnalisadorQuantico from '../components/AnalisadorQuantico';
import { User } from '@/api/entities';
import { gerarPDFRelatorio } from '../utils/gerarPDF';

export default function RelatoriosPage() {
    const [pacientes, setPacientes] = useState([]);
    const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
    const [sessoes, setSessoes] = useState([]);
    const [terapias, setTerapias] = useState({});
    const [analise, setAnalise] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [mostrarGuia, setMostrarGuia] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            const user = await User.me();
            setCurrentUser(user);
            
            const [pacientesList, terapiasList] = await Promise.all([
                Paciente.filter({ terapeuta_id: user.id }),
                Terapia.list()
            ]);
            
            setPacientes(pacientesList);
            
            const terapiasMap = terapiasList.reduce((acc, t) => {
                acc[t.id] = t;
                return acc;
            }, {});
            setTerapias(terapiasMap);
        };
        loadInitialData();
    }, []);

    const handleSelectPaciente = async (pacienteId) => {
        setPacienteSelecionado(pacienteId);
        setAnalise(null);
        
        if (pacienteId) {
            setIsLoading(true);
            const sessoesData = await Sessao.filter({ paciente_id: pacienteId }, '-data_sessao');
            setSessoes(sessoesData);
            setIsLoading(false);
        } else {
            setSessoes([]);
        }
    };

    const handleGerarAnalise = (analiseData) => {
        setAnalise(analiseData);
    };

    const handleGerarPDF = async () => {
        console.log('🖱️ Botão "Gerar PDF" clicado na página Relatórios!');
        console.log('📊 Estado atual:', {
            hasAnalise: !!analise,
            pacienteSelecionado,
            totalSessoes: sessoes?.length || 0
        });
        
        if (!analise || !pacienteSelecionado) {
            console.warn('⚠️ Validação falhou: analise ou pacienteSelecionado vazio');
            alert('É necessário selecionar um paciente e gerar a análise antes de gerar o PDF.');
            return;
        }
        
        console.log('✅ Validação passou, iniciando geração...');
        setIsGeneratingPDF(true);
        
        try {
            const paciente = pacientes.find(p => p.id === pacienteSelecionado);
            console.log('👤 Paciente encontrado:', paciente?.nome || 'N/A');
            
            console.log('📄 Chamando gerarPDFRelatorio...');
            await gerarPDFRelatorio({
                pacienteNome: paciente?.nome || 'Paciente',
                analise,
                terapeutaNome: currentUser?.full_name || 'Terapeuta',
                sessoes: sessoes,
                terapias: terapias // Passar terapias para renderizar gráficos corretamente
            });
            console.log('✅ PDF gerado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error);
            console.error('📋 Stack trace:', error.stack);
            alert(`Erro ao gerar PDF: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
        } finally {
            console.log('🏁 Finalizando processo de geração de PDF...');
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Relatórios Quânticos</h1>
                <p className="text-base text-gray-600">Análise profunda de evolução com Inteligência Artificial</p>
            </header>

            {/* GUIA DE INTERPRETAÇÃO */}
            {mostrarGuia && (
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Info className="w-6 h-6 text-white" />
                                </div>
                                <CardTitle className="text-xl text-gray-800">📊 Guia de Interpretação dos Relatórios</CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setMostrarGuia(false)}>
                                Ocultar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Score Geral */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Score Geral de Evolução (0-100)
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <p><strong className="text-green-700">70-100 (Excelente):</strong> Paciente em ótima evolução! Manter o ritmo atual de sessões e consolidar resultados.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <p><strong className="text-yellow-700">50-69 (Bom):</strong> Boa progressão. Intensificar trabalho nos campos críticos identificados.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <p><strong className="text-red-700">0-49 (Atenção):</strong> Necessita revisão completa do protocolo. Considerar abordagens complementares.</p>
                                </div>
                            </div>
                        </div>

                        {/* Gráficos de Barras */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                Gráficos de Barras por Campo
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-700"><strong>O que mostram:</strong> Nível atual (0-10) de cada campo energético avaliado nas sessões.</p>
                                <ul className="space-y-1 ml-4">
                                    <li className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                        <span><strong className="text-green-700">Verde (7-10):</strong> Campo equilibrado e saudável</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                                        <span><strong className="text-yellow-700">Amarelo (5-6):</strong> Campo em processo de equilibração</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                        <span><strong className="text-red-700">Vermelho (1-4):</strong> Campo crítico - necessita atenção urgente</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Campos Críticos */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                Campos Críticos
                            </h4>
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>São campos com valores abaixo de 5/10.</strong> Indicam áreas que precisam de intervenção prioritária.
                            </p>
                            <p className="text-sm text-gray-600">
                                💡 <strong>Ação Recomendada:</strong> Focar próximas sessões nesses campos específicos, considerar terapias complementares ou intensificar frequência.
                            </p>
                        </div>

                        {/* Análise de Tendência */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Análise de Tendência
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-700"><strong>Mostra a evolução ao longo das sessões:</strong></p>
                                <ul className="space-y-1 ml-4">
                                    <li><strong>📈 Ascendente:</strong> Campo melhorando consistentemente (ótimo!)</li>
                                    <li><strong>📉 Descendente:</strong> Campo piorando (requer atenção)</li>
                                    <li><strong>➡️ Estável:</strong> Campo sem variação significativa</li>
                                    <li><strong>📊 Flutuante:</strong> Campo com altos e baixos (instabilidade)</li>
                                </ul>
                            </div>
                        </div>

                        {/* Previsão Próxima Sessão */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Previsão para Próxima Sessão
                            </h4>
                            <p className="text-sm text-gray-700 mb-2">
                                Usa <strong>Regressão Linear</strong> (algoritmo matemático) para prever valores futuros baseado no histórico.
                            </p>
                            <p className="text-sm text-gray-600">
                                💡 <strong>Uso Prático:</strong> Ajuda a planejar a próxima sessão e ajustar expectativas realistas com o paciente.
                            </p>
                        </div>

                        {/* Eficácia por Terapia */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Ranking de Eficácia por Terapia
                            </h4>
                            <p className="text-sm text-gray-700 mb-2">
                                Mostra quais terapias foram mais eficazes para <strong>este paciente específico</strong>.
                            </p>
                            <p className="text-sm text-gray-600">
                                💡 <strong>Uso Prático:</strong> Priorizar nas próximas sessões as terapias que trouxeram melhores resultados.
                            </p>
                        </div>

                        {/* Dica Final */}
                        <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                            <p className="text-sm text-purple-900">
                                <strong>💡 Dica Final:</strong> Use o <strong>Agente 5D</strong> (botão flutuante roxo) para tirar dúvidas específicas sobre qualquer gráfico ou métrica!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!mostrarGuia && (
                <Button 
                    variant="outline" 
                    onClick={() => setMostrarGuia(true)}
                    className="mb-6 border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                    <Info className="w-4 h-4 mr-2" />
                    Mostrar Guia de Interpretação
                </Button>
            )}

            {/* Seleção de Paciente */}
            <Card className="bg-white border-0 shadow-xl mb-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900">Selecione um Paciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={pacienteSelecionado || ''} onValueChange={handleSelectPaciente}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Escolha um paciente para gerar relatório" />
                        </SelectTrigger>
                        <SelectContent>
                            {pacientes.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Análise */}
            {pacienteSelecionado && (
                <>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                            <span className="ml-3 text-gray-600">Carregando sessões...</span>
                        </div>
                    ) : sessoes.length === 0 ? (
                        <Card className="bg-white border-2 border-dashed border-gray-300 text-center py-12">
                            <CardContent>
                                <p className="text-gray-600">Nenhuma sessão registrada para este paciente ainda.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="analisador-quantico-container">
                            <AnalisadorQuantico
                                sessoes={sessoes}
                                terapias={terapias}
                                onAnaliseGerada={handleGerarAnalise}
                            />
                        </div>
                    )}

                    {analise && (
                        <div className="mt-6 flex gap-4 justify-end">
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🖱️ Clique no botão detectado (Relatórios)!');
                                    handleGerarPDF();
                                }}
                                disabled={isGeneratingPDF || !analise || !pacienteSelecionado}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                title={(!analise || !pacienteSelecionado) ? 'É necessário selecionar um paciente e gerar a análise primeiro' : 'Gerar relatório PDF completo'}
                            >
                                {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                                {isGeneratingPDF ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}