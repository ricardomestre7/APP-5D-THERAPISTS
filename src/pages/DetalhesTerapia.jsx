
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Terapia } from '@/api/entities';
import { Sessao } from '@/api/entities';
import { Paciente } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, TrendingUp, Users, Calendar, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User } from '@/api/entities';
import { Badge } from '@/components/ui/badge'; // Added import for Badge

const QuantumCard = ({ children, className, ...props }) => (
    <Card 
        className={`bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-gray-800 ${className}`}
        {...props}
    >
        {children}
    </Card>
);

const fieldColors = {
    'Energético': '#8b5cf6',
    'Emocional': '#ec4899',
    'Físico': '#22c55e',
    'Vibracional': '#3b82f6',
    'Quântico': '#f97316',
    'Mental': '#fbbf24',
    'Espiritual': '#a855f7',
    'Default': '#64748b'
};

export default function DetalhesTerapia() {
    const [terapia, setTerapia] = useState(null);
    const [sessoes, setSessoes] = useState([]);
    const [pacientes, setPacientes] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const terapiaId = new URLSearchParams(location.search).get('id');

    useEffect(() => {
        const loadData = async () => {
            if (!terapiaId) return;
            setIsLoading(true);
            
            try {
                const currentUser = await User.me();
                const [terapiaData, sessoesData, pacientesData] = await Promise.all([
                    Terapia.get(terapiaId),
                    Sessao.filter({ terapia_id: terapiaId, created_by: currentUser.email }, 'data_sessao'),
                    Paciente.filter({ terapeuta_id: currentUser.id })
                ]);

                setTerapia(terapiaData);
                setSessoes(sessoesData);
                
                const pacientesMap = pacientesData.reduce((acc, p) => {
                    acc[p.id] = p;
                    return acc;
                }, {});
                setPacientes(pacientesMap);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [terapiaId]);

    const chartData = useMemo(() => {
        if (!sessoes.length || !terapia) return [];

        const processedData = sessoes.map(sessao => {
            const scores = {};
            
            terapia.campos_avaliados?.forEach(field => {
                scores[field] = { total: 0, count: 0 };
            });

            terapia.campos_formulario?.forEach(campo => {
                if (campo.tipo === 'escala_1_10' && scores[campo.campo_associado]) {
                    const value = parseFloat(sessao.resultados[campo.label]);
                    if (!isNaN(value)) {
                        scores[campo.campo_associado].total += value;
                        scores[campo.campo_associado].count++;
                    }
                }
            });

            const finalScores = {
                name: format(new Date(sessao.data_sessao), 'dd/MM', { locale: ptBR }),
                fullDate: format(new Date(sessao.data_sessao), "dd 'de' MMMM, yyyy", { locale: ptBR }),
                paciente: pacientes[sessao.paciente_id]?.nome || 'Paciente'
            };
            
            Object.keys(scores).forEach(field => {
                if (scores[field].count > 0) {
                    finalScores[field] = parseFloat((scores[field].total / scores[field].count).toFixed(2));
                }
            });

            return finalScores;
        }).filter(Boolean);

        return processedData;
    }, [sessoes, terapia, pacientes]);

    const availableFields = useMemo(() => {
        if (!chartData.length) return [];
        const fields = new Set();
        chartData.forEach(dataPoint => {
            Object.keys(dataPoint).forEach(key => {
                if(key !== 'name' && key !== 'fullDate' && key !== 'paciente') {
                    fields.add(key);
                }
            });
        });
        return Array.from(fields);
    }, [chartData]);

    const estatisticas = useMemo(() => {
        return {
            totalSessoes: sessoes.length,
            pacientesAtendidos: new Set(sessoes.map(s => s.paciente_id)).size,
            mediasGerais: availableFields.reduce((acc, field) => {
                const valores = chartData.map(d => d[field]).filter(v => v !== undefined);
                if (valores.length > 0) {
                    acc[field] = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
                }
                return acc;
            }, {})
        };
    }, [sessoes, chartData, availableFields]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-purple-500/30 p-4 rounded-lg text-white shadow-xl">
                    <p className="font-bold text-purple-300">{`Data: ${data.fullDate}`}</p>
                    <p className="text-sm text-slate-300 mb-2">{`Paciente: ${data.paciente}`}</p>
                    {payload.map(pld => (
                         <p key={pld.dataKey} style={{ color: pld.color }} className="font-semibold">
                             {`${pld.dataKey}: ${pld.value}`}
                         </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-slate-600">Carregando detalhes da terapia...</p>
            </div>
        );
    }

    if (!terapia) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-red-600">Terapia não encontrada.</p>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                            <Sparkles className="text-purple-500" />
                            {terapia.nome}
                        </h1>
                        <p className="text-gray-600 mt-2">{terapia.descricao}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <QuantumCard>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Sessões Realizadas</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-800">{estatisticas.totalSessoes}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            {estatisticas.totalSessoes === 0 ? 'Nenhuma sessão ainda' : 'atendimentos registrados'}
                        </p>
                    </CardContent>
                </QuantumCard>

                <QuantumCard>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Pacientes Atendidos</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-800">{estatisticas.pacientesAtendidos}</div>
                        <p className="text-xs text-gray-500 mt-1">pessoas únicas</p>
                    </CardContent>
                </QuantumCard>

                <QuantumCard>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Média Geral</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-800">
                            {Object.keys(estatisticas.mediasGerais).length > 0 
                                ? (Object.values(estatisticas.mediasGerais).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / Object.values(estatisticas.mediasGerais).length).toFixed(1)
                                : '-'
                            }
                        </div>
                        <p className="text-xs text-gray-500 mt-1">pontuação média</p>
                    </CardContent>
                </QuantumCard>
            </div>

            {/* NOVAS SEÇÕES DE INFORMAÇÕES DETALHADAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Informações Gerais */}
                {(terapia.duracao_sessao || terapia.frequencia_recomendada || terapia.tempo_resultados || terapia.nivel_complexidade) && (
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <Info className="text-blue-500" />
                                Informações Gerais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {terapia.duracao_sessao && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Duração da Sessão:</p>
                                    <p className="text-sm text-gray-600">{terapia.duracao_sessao}</p>
                                </div>
                            )}
                            {terapia.frequencia_recomendada && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Frequência Recomendada:</p>
                                    <p className="text-sm text-gray-600">{terapia.frequencia_recomendada}</p>
                                </div>
                            )}
                            {terapia.tempo_resultados && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Tempo para Resultados:</p>
                                    <p className="text-sm text-gray-600">{terapia.tempo_resultados}</p>
                                </div>
                            )}
                            {terapia.nivel_complexidade && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Nível de Complexidade:</p>
                                    <Badge className={
                                        terapia.nivel_complexidade === 'Iniciante' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                        terapia.nivel_complexidade === 'Intermediário' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                        'bg-red-100 text-red-700 hover:bg-red-100'
                                    }>
                                        {terapia.nivel_complexidade}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </QuantumCard>
                )}

                {/* Benefícios */}
                {terapia.beneficios && (
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <CheckCircle2 className="text-green-500" />
                                Benefícios
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Array.isArray(terapia.beneficios) ? (
                                <ul className="space-y-2">
                                    {terapia.beneficios.map((beneficio, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{beneficio}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-700">{terapia.beneficios}</p>
                            )}
                        </CardContent>
                    </QuantumCard>
                )}
            </div>

            {/* Indicações e Contraindicações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {terapia.indicacoes && (
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <TrendingUp className="text-blue-500" />
                                Indicações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {Array.isArray(terapia.indicacoes) ? terapia.indicacoes.map((indicacao, index) => (
                                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm border border-blue-200">
                                        {indicacao}
                                    </span>
                                )) : (
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm border border-blue-200">
                                        {terapia.indicacoes}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </QuantumCard>
                )}

                {terapia.contraindicacoes && (
                    <QuantumCard className="border-red-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-red-700">
                                <AlertTriangle className="text-red-500" />
                                Contraindicações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Array.isArray(terapia.contraindicacoes) ? (
                                <ul className="space-y-2">
                                    {terapia.contraindicacoes.map((contra, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            <span>{contra}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-red-700">{terapia.contraindicacoes}</p>
                            )}
                        </CardContent>
                    </QuantumCard>
                )}
            </div>

            {/* Técnica de Aplicação */}
            {terapia.tecnica_aplicacao && (
                <QuantumCard className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-gray-800">
                            <Sparkles className="text-purple-500" />
                            Técnica de Aplicação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{terapia.tecnica_aplicacao}</p>
                    </CardContent>
                </QuantumCard>
            )}

            {/* Preparação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {terapia.preparacao_ambiente && (
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="text-gray-800">Preparação do Ambiente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{terapia.preparacao_ambiente}</p>
                        </CardContent>
                    </QuantumCard>
                )}

                {terapia.preparacao_paciente && (
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="text-gray-800">Preparação do Paciente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{terapia.preparacao_paciente}</p>
                        </CardContent>
                    </QuantumCard>
                )}
            </div>

            {/* Materiais Necessários */}
            {terapia.materiais_necessarios && terapia.materiais_necessarios.length > 0 && (
                <QuantumCard className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-gray-800">Materiais Necessários</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {terapia.materiais_necessarios.map((material, index) => (
                                <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm border border-gray-200">
                                    {material}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </QuantumCard>
            )}

            {/* Cuidados Pós-Sessão e Resultados Esperados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {terapia.cuidados_pos_sessao && (
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="text-gray-800">Cuidados Pós-Sessão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{terapia.cuidados_pos_sessao}</p>
                        </CardContent>
                    </QuantumCard>
                )}

                {terapia.resultados_esperados && (
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="text-gray-800">Resultados Esperados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{terapia.resultados_esperados}</p>
                        </CardContent>
                    </QuantumCard>
                )}
            </div>

            {/* Observações do Terapeuta */}
            {terapia.observacoes_terapeuta && (
                <QuantumCard className="mb-8 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="text-purple-800">Observações para o Terapeuta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-purple-900 whitespace-pre-line">{terapia.observacoes_terapeuta}</p>
                    </CardContent>
                </QuantumCard>
            )}

            {/* Referências de Estudo */}
            {terapia.referencias_estudo && terapia.referencias_estudo.length > 0 && (
                <QuantumCard className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-gray-800">Referências e Estudos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {terapia.referencias_estudo.map((ref, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-purple-600 font-semibold">{index + 1}.</span>
                                    <span>{ref}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </QuantumCard>
            )}

            {/* Campos Avaliados e Sistemas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <QuantumCard>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-gray-800">
                            <Info className="text-purple-500" />
                            Campos Avaliados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {terapia.campos_avaliados?.map((campo, index) => (
                                <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {campo}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </QuantumCard>

                <QuantumCard>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-gray-800">
                            <Sparkles className="text-blue-500" />
                            Sistemas Avaliados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {terapia.sistemas_avaliados?.map((sistema, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {sistema}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </QuantumCard>
            </div>

            {/* Gráficos e Análises (código existente) */}
            {chartData.length > 0 && (
                <>
                    <QuantumCard className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <TrendingUp className="text-purple-500" />
                                Evolução das Sessões ao Longo do Tempo
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Acompanhe a progressão dos campos energéticos ao longo das sessões com esta terapia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px] w-full">
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                                    <XAxis dataKey="name" stroke="#64748b" />
                                    <YAxis domain={[0, 10]} stroke="#64748b" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    {availableFields.map(field => (
                                        <Line 
                                            key={field}
                                            type="monotone" 
                                            dataKey={field} 
                                            stroke={fieldColors[field] || fieldColors['Default']} 
                                            strokeWidth={3}
                                            dot={{ r: 5 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </QuantumCard>

                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <BarChart className="text-green-500" />
                                Médias por Campo Avaliado
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Comparação das médias gerais de cada campo nesta terapia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={Object.entries(estatisticas.mediasGerais).map(([field, value]) => ({ campo: field, media: parseFloat(value) }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                                    <XAxis dataKey="campo" stroke="#64748b" />
                                    <YAxis domain={[0, 10]} stroke="#64748b" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            borderRadius: '8px',
                                            color: 'white'
                                        }} 
                                    />
                                    <Bar dataKey="media" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </QuantumCard>
                </>
            )}

            {chartData.length === 0 && (
                <QuantumCard className="text-center py-12">
                    <CardContent>
                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500 opacity-50" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Nenhuma Sessão Registrada
                        </h3>
                        <p className="text-gray-600">
                            Registre sessões usando esta terapia para visualizar gráficos e análises detalhadas.
                        </p>
                    </CardContent>
                </QuantumCard>
            )}
        </div>
    );
}
