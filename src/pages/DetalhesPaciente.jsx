import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Paciente, Sessao, Terapia, User as UserEntity } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Phone, Cake, FileText, HeartPulse, PlusCircle, ArrowLeft, FileDown, BarChart3, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SessaoForm from '../components/SessaoForm';
import { motion, AnimatePresence } from 'framer-motion';
// Base44 removido
import { useAnalisadorQuantico } from '../components/AnalisadorQuantico';
import GraficoSnapshotSessao from '../components/graficos/GraficoSnapshotSessao';

const QuantumCard = ({ children, className, ...props }) => (
    <Card 
        className={`bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 text-gray-800 ${className}`}
        {...props}
    >
        {children}
    </Card>
);

const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-purple-500 mt-1" />
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value || 'Não informado'}</p>
        </div>
    </div>
);

const SessaoHistoryItem = ({ sessao, terapia }) => {
    if (!terapia) return null;

    // Preparar dados para gráfico - apenas valores numéricos
    const resultadosNumericos = Object.entries(sessao.resultados || {})
        .filter(([key, value]) => {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
        })
        .map(([key, value]) => ({
            label: key.length > 30 ? key.substring(0, 30) + '...' : key,
            valor: parseFloat(value)
        }));

    const temGrafico = resultadosNumericos.length > 0;

    return (
        <QuantumCard className="mb-4">
            <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center text-gray-800">
                    <span className="flex items-center gap-3">
                        <HeartPulse className="text-green-500" />
                        {terapia.nome}
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                        {format(new Date(sessao.data_sessao), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Gráfico Inteligente baseado no tipo de terapia */}
                {temGrafico && (
                    <div className="border-t border-gray-200 pt-4 min-h-[450px] w-full">
                        <GraficoSnapshotSessao
                            terapia={terapia}
                            dadosDaSessao={sessao.resultados || {}}
                        />
                    </div>
                )}

                {/* Lista de Resultados */}
                <div className="space-y-3">
                    {Object.entries(sessao.resultados || {}).map(([key, value]) => {
                        const valorNum = parseFloat(value);
                        const ehNumero = !isNaN(valorNum) && valorNum > 0;
                        
                        return (
                            <div key={key} className="text-sm">
                                <p className="text-gray-500">{key}:</p>
                                <p className="text-gray-800 font-medium pl-2">
                                    {ehNumero ? `${String(value)}/10` : String(value)}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {sessao.observacoes_gerais && (
                     <div className="text-sm pt-2 border-t border-gray-200">
                        <p className="text-gray-500">Observações Gerais:</p>
                        <p className="text-gray-800 font-medium pl-2">{sessao.observacoes_gerais}</p>
                    </div>
                )}
            </CardContent>
        </QuantumCard>
    );
};

export default function DetalhesPaciente() {
    const [paciente, setPaciente] = useState(null);
    const [sessoes, setSessoes] = useState([]);
    const [terapias, setTerapias] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSessaoFormOpen, setIsSessaoFormOpen] = useState(false);
    const location = useLocation();
    const pacienteId = new URLSearchParams(location.search).get('id');
    const navigate = useNavigate();

    // Log para debug
    useEffect(() => {
        console.log('📍 URL atual:', location.pathname + location.search);
        console.log('🔍 ID do paciente extraído da URL:', pacienteId);
    }, [location, pacienteId]);

    // Estados para relatórios
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const fetchData = useCallback(async () => {
        if (!pacienteId) {
            console.error('❌ Erro: ID do paciente não fornecido na URL');
            alert('Erro: ID do paciente não encontrado na URL. Redirecionando...');
            navigate('/Pacientes');
            return;
        }

        console.log('🔄 Carregando dados do paciente:', pacienteId);
        setIsLoading(true);
        
        try {
            console.log('📋 Buscando dados do paciente, sessões e terapias...');
            const [pacienteData, sessoesData, terapiasData] = await Promise.all([
                Paciente.get(pacienteId),
                Sessao.filter({ paciente_id: pacienteId }, '-data_sessao'),
                Terapia.list()
            ]);

            console.log('✅ Dados carregados:');
            console.log('- Paciente:', pacienteData ? `Encontrado: ${pacienteData.nome}` : 'NÃO ENCONTRADO');
            console.log('- Sessões:', sessoesData.length);
            console.log('- Terapias:', terapiasData.length);

            if (!pacienteData) {
                console.error('❌ Paciente não encontrado no Firestore');
                alert(`Erro: Paciente com ID "${pacienteId}" não foi encontrado.\n\nVerifique se o paciente existe e se você tem permissão para acessá-lo.`);
                navigate('/Pacientes');
                return;
            }

            setPaciente(pacienteData);
            setSessoes(sessoesData);
            
            const terapiasMap = terapiasData.reduce((acc, t) => {
                acc[t.id] = t;
                return acc;
            }, {});
            setTerapias(terapiasMap);
            
            console.log('✅ Dados configurados com sucesso');
        } catch (error) {
            console.error('❌ Erro ao carregar dados do paciente:', error);
            console.error('📋 Detalhes do erro:', {
                code: error.code,
                message: error.message,
                pacienteId,
                stack: error.stack
            });
            
            let mensagemErro = 'Erro ao carregar dados do paciente. Tente novamente.';
            
            if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Missing or insufficient')) {
                mensagemErro = '❌ Erro de Permissões no Firestore!\n\nConfigure as regras do Firestore.\n\nVeja: CONFIGURAR_FIRESTORE_RULES.md';
            } else if (error.message) {
                mensagemErro = `Erro: ${error.message}`;
            }
            
            alert(mensagemErro);
            navigate('/Pacientes');
        } finally {
            setIsLoading(false);
        }
    }, [pacienteId, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Gerar análise usando o hook
    const analise = useAnalisadorQuantico(sessoes, terapias);

    const handleSaveSessao = async (data) => {
        try {
            setIsLoading(true);
            await Sessao.create(data);
            setIsSessaoFormOpen(false);
            await fetchData();
        } catch (error) {
            console.error('Erro ao salvar sessão:', error);
            alert('Erro ao salvar sessão. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGerarPDF = async () => {
        if (!analise || sessoes.length === 0) {
            alert('É necessário ter pelo menos uma sessão registrada para gerar o relatório.');
            return;
        }
        
        setIsGeneratingPDF(true);
        try {
            const { gerarPDFRelatorio } = await import('@/utils/gerarPDF');
            const user = await UserEntity.me();
            
            // Preparar objeto de terapias para o PDF (id -> objeto completo)
            const terapiasMap = {};
            terapias.forEach(terapia => {
                terapiasMap[terapia.id] = terapia;
            });
            
            await gerarPDFRelatorio({
                pacienteNome: paciente.nome,
                analise: analise,
                terapeutaNome: user?.full_name || 'Terapeuta',
                sessoes: sessoes,
                terapias: terapiasMap
            });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            
            // Mensagem de erro mais detalhada
            let mensagemErro = 'Erro ao gerar PDF. ';
            if (error.message?.includes('permission') || error.message?.includes('unauthenticated')) {
                mensagemErro += 'Verifique sua autenticação.';
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                mensagemErro += 'Erro de conexão. Verifique sua internet.';
            } else if (error.message?.includes('Cloud Function')) {
                mensagemErro += 'As Cloud Functions podem não estar configuradas. Usando método alternativo...';
            } else {
                mensagemErro += 'Tente novamente ou use o botão na página de Relatórios.';
            }
            
            alert(mensagemErro);
        } finally {
            setIsGeneratingPDF(false);
        }
    };


    if (isLoading) {
        return <p className="text-center text-gray-500">Carregando dados do paciente...</p>;
    }

    if (!paciente) {
        return <p className="text-center text-red-500">Paciente não encontrado.</p>;
    }

    return (
        <div className="bg-white min-h-screen">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                     <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 flex-shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Voltar</span>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">{paciente.nome}</h1>
                        <p className="text-base text-gray-600">Prontuário Quântico e Histórico de Sessões</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    {sessoes.length > 0 && (
                        <>
                            <Button
                                onClick={handleGerarPDF}
                                disabled={isGeneratingPDF}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            >
                                {isGeneratingPDF ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Gerando...</>
                                ) : (
                                    <><FileDown className="w-5 h-5" /> Gerar Relatório PDF</>
                                )}
                            </Button>

                        </>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Patient Details Column */}
                <div className="lg:col-span-1 space-y-6">
                    <QuantumCard>
                        <CardHeader><CardTitle className="text-xl font-bold text-slate-900">Informações Pessoais</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={Mail} label="E-mail" value={paciente.email} />
                            <DetailItem icon={Phone} label="Telefone" value={paciente.telefone} />
                            <DetailItem icon={Cake} label="Data de Nascimento" value={paciente.data_nascimento ? format(new Date(paciente.data_nascimento), 'dd/MM/yyyy', { locale: ptBR }) : null} />
                        </CardContent>
                    </QuantumCard>
                    <QuantumCard>
                        <CardHeader><CardTitle className="text-xl font-bold text-slate-900">Queixa Principal</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                                <p className="text-gray-700">{paciente.queixa_principal || 'Nenhuma queixa principal registrada.'}</p>
                            </div>
                        </CardContent>
                    </QuantumCard>

                    {/* Card de Estatísticas Rápidas */}
                    {sessoes.length > 0 && analise && (
                        <QuantumCard className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Resumo da Evolução
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-purple-700">Score Geral:</p>
                                    <p className="text-2xl font-bold text-purple-900">{analise.scoreGeral}/100</p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700">Total de Sessões:</p>
                                    <p className="text-xl font-bold text-purple-900">{analise.totalSessoes}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700">Velocidade:</p>
                                    <p className="text-lg font-semibold text-purple-900">{analise.velocidadeMelhoria}</p>
                                </div>
                            </CardContent>
                        </QuantumCard>
                    )}
                </div>

                {/* Sessions Column */}
                <div className="lg:col-span-2">
                    <QuantumCard>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                                Histórico de Sessões
                            </CardTitle>
                            <Button onClick={() => setIsSessaoFormOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2">
                                <PlusCircle className="w-5 h-5" />
                                Registrar Nova Sessão
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <AnimatePresence>
                                {sessoes.length > 0 ? (
                                    sessoes.map(sessao => (
                                        <motion.div
                                            key={sessao.id}
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <SessaoHistoryItem sessao={sessao} terapia={terapias[sessao.terapia_id]} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <p>Nenhuma sessão registrada para este paciente ainda.</p>
                                        <p className="mt-1">Clique em "Registrar Nova Sessão" para começar.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </QuantumCard>
                </div>
            </div>

            <SessaoForm
                open={isSessaoFormOpen}
                onOpenChange={setIsSessaoFormOpen}
                pacienteId={paciente.id}
                onSave={handleSaveSessao}
            />

        </div>
    );
}