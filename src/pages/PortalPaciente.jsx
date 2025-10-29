
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Paciente } from '@/api/entities';
import { Sessao } from '@/api/entities';
import { DiarioBemEstar } from '@/api/entities';
import { PraticaRecomendada } from '@/api/entities';
import { PraticaQuantica } from '@/api/entities';
import { Agendamento } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, BookOpen, Calendar, TrendingUp, Sparkles } from 'lucide-react';

const QuantumCard = ({ children, className, ...props }) => (
    <Card 
        className={`bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 text-gray-800 ${className}`}
        {...props}
    >
        {children}
    </Card>
);

export default function PortalPaciente() {
    const [user, setUser] = useState(null);
    const [pacienteData, setPacienteData] = useState(null);
    const [sessoes, setSessoes] = useState([]);
    const [diarios, setDiarios] = useState([]);
    const [praticasRecomendadas, setPraticasRecomendadas] = useState([]);
    const [agendamentos, setAgendamentos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);

                // Buscar dados do paciente baseado no email do usuário
                const pacientes = await Paciente.filter({ email: currentUser.email });
                if (pacientes.length > 0) {
                    const paciente = pacientes[0];
                    setPacienteData(paciente);

                    // Carregar histórico de sessões
                    const sessoesData = await Sessao.filter({ paciente_id: paciente.id }, '-data_sessao');
                    setSessoes(sessoesData);

                    // Carregar diários
                    const diariosData = await DiarioBemEstar.filter({ paciente_id: paciente.id }, '-data_entrada');
                    setDiarios(diariosData);

                    // Carregar práticas recomendadas
                    const praticasData = await PraticaRecomendada.filter({ paciente_id: paciente.id, ativa: true });
                    setPraticasRecomendadas(praticasData);

                    // Carregar agendamentos
                    const agendamentosData = await Agendamento.filter({ paciente_id: paciente.id }, 'data_agendamento');
                    setAgendamentos(agendamentosData);
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <p className="text-gray-600">Carregando seu portal...</p>
            </div>
        );
    }

    if (!pacienteData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50">
                <QuantumCard className="text-center p-8">
                    <CardContent>
                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                        <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Portal do Paciente</h2>
                        <p className="text-gray-600 mb-4">
                            Você foi convidado para acessar este portal, mas ainda não temos um cadastro seu como paciente.
                        </p>
                        <p className="text-sm text-gray-500">
                            Entre em contato com seu terapeuta para que ele finalize seu cadastro no sistema.
                        </p>
                    </CardContent>
                </QuantumCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-3">
                        Olá, {pacienteData.nome.split(' ')[0]}! ✨
                    </h1>
                    <p className="text-lg text-gray-600">
                        Bem-vindo ao seu portal pessoal de evolução quântica
                    </p>
                </header>

                <Tabs defaultValue="jornada" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-md border border-slate-200">
                        <TabsTrigger value="jornada" className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Minha Jornada
                        </TabsTrigger>
                        <TabsTrigger value="praticas" className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Práticas
                        </TabsTrigger>
                        <TabsTrigger value="diario" className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Diário
                        </TabsTrigger>
                        <TabsTrigger value="agenda" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Agenda
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="jornada" className="space-y-6">
                        <QuantumCard>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <TrendingUp className="text-purple-500" />
                                    Minha Evolução
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sessoes.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-gray-600">
                                            Você já realizou <strong>{sessoes.length}</strong> sessões de terapia quântica.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {sessoes.slice(0, 3).map((sessao, index) => (
                                                <div key={sessao.id} className="p-4 bg-purple-50 rounded-lg">
                                                    <p className="font-semibold text-purple-700">
                                                        Sessão {sessoes.length - index}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(sessao.data_sessao).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Sua jornada está começando! Aguarde sua primeira sessão.</p>
                                )}
                            </CardContent>
                        </QuantumCard>
                    </TabsContent>

                    <TabsContent value="praticas" className="space-y-6">
                        <QuantumCard>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <BookOpen className="text-green-500" />
                                    Práticas Recomendadas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {praticasRecomendadas.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {praticasRecomendadas.map((recomendacao) => (
                                            <div key={recomendacao.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                <h4 className="font-semibold text-green-800 mb-2">
                                                    Prática Recomendada
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    Frequência: {recomendacao.frequencia_sugerida}
                                                </p>
                                                {recomendacao.instrucoes_especiais && (
                                                    <p className="text-sm mt-2 text-gray-700">
                                                        {recomendacao.instrucoes_especiais}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Seu terapeuta ainda não fez recomendações específicas para você.</p>
                                )}
                            </CardContent>
                        </QuantumCard>
                    </TabsContent>

                    <TabsContent value="diario" className="space-y-6">
                        <QuantumCard>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Heart className="text-pink-500" />
                                    Diário de Bem-Estar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Heart className="w-16 h-16 mx-auto mb-4 text-pink-400" />
                                    <h3 className="text-xl font-semibold mb-2">Em Breve!</h3>
                                    <p className="text-gray-600">
                                        Aqui você poderá registrar diariamente como se sente e acompanhar sua evolução.
                                    </p>
                                </div>
                            </CardContent>
                        </QuantumCard>
                    </TabsContent>

                    <TabsContent value="agenda" className="space-y-6">
                        <QuantumCard>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Calendar className="text-blue-500" />
                                    Meus Agendamentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Calendar className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                                    <h3 className="text-xl font-semibold mb-2">Em Breve!</h3>
                                    <p className="text-gray-600">
                                        Aqui você verá seus próximos agendamentos e poderá solicitar novas sessões.
                                    </p>
                                </div>
                            </CardContent>
                        </QuantumCard>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
