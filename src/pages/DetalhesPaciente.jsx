import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Paciente } from '@/api/entities';
import { Sessao } from '@/api/entities';
import { Terapia } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Phone, Cake, FileText, HeartPulse, PlusCircle, Sparkles, ArrowLeft, FileDown, BarChart3, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SessaoForm from '../components/SessaoForm';
import { motion, AnimatePresence } from 'framer-motion';
// Base44 removido
import { useAnalisadorQuantico } from '../components/AnalisadorQuantico';

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
            <CardContent className="space-y-3">
                {Object.entries(sessao.resultados || {}).map(([key, value]) => (
                    <div key={key} className="text-sm">
                        <p className="text-gray-500">{key}:</p>
                        <p className="text-gray-800 font-medium pl-2">{String(value)}</p>
                    </div>
                ))}
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
    const [isConvitePortalOpen, setIsConvitePortalOpen] = useState(false);
    const location = useLocation();
    const pacienteId = new URLSearchParams(location.search).get('id');
    const navigate = useNavigate();

    // Estados para relatórios
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const fetchData = useCallback(async () => {
        if (pacienteId) {
            setIsLoading(true);
            const [pacienteData, sessoesData, terapiasData] = await Promise.all([
                Paciente.get(pacienteId),
                Sessao.filter({ paciente_id: pacienteId }, '-data_sessao'),
                Terapia.list()
            ]);

            setPaciente(pacienteData);
            setSessoes(sessoesData);
            
            const terapiasMap = terapiasData.reduce((acc, t) => {
                acc[t.id] = t;
                return acc;
            }, {});
            setTerapias(terapiasMap);
            
            setIsLoading(false);
        }
    }, [pacienteId]);

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
            // Base44 removido - implementar nova integração
            console.log('📄 PDF gerado (demo):', paciente.nome);
            const response = { data: 'demo-pdf-data' };

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_quantico_${paciente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
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
                    <Button 
                        onClick={() => setIsConvitePortalOpen(true)}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold flex items-center gap-2 hover:opacity-90"
                    >
                        <Sparkles className="w-5 h-5" />
                        Convidar ao Portal
                    </Button>

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