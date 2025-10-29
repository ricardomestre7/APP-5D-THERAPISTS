import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Terapia } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Sparkles, ChevronRight, Clock, TrendingUp, AlertTriangle, CheckCircle2, Info, BookOpen, ClipboardList, Stethoscope, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function TerapiasPage() {
    const [terapias, setTerapias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTerapias = async () => {
            setIsLoading(true);
            try {
                const listaTerapias = await Terapia.list();
                // Mostrar TODAS as terapias (sem filtro)
                setTerapias(listaTerapias || []);
            } catch (error) {
                console.error('Erro ao carregar terapias:', error);
                setTerapias([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTerapias();
    }, []);

    const nivelCores = {
        'Iniciante': 'bg-green-100 text-green-700',
        'Intermediário': 'bg-yellow-100 text-yellow-700',
        'Avançado': 'bg-red-100 text-red-700'
    };

    const guideCards = [
        {
            title: "1. Explorar Terapias Disponíveis",
            description: "Conheça todas as técnicas terapêuticas pré-configuradas no sistema",
            icon: BookOpen,
            iconColor: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "2. Estudar Detalhes de Cada Terapia",
            description: "Acesse informações completas sobre aplicação, benefícios e contraindicações",
            icon: Stethoscope,
            iconColor: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "3. Aplicar em Sessões Reais",
            description: "Utilize as terapias ao registrar sessões com seus pacientes",
            icon: ClipboardList,
            iconColor: "text-purple-600",
            bgColor: "bg-purple-50"
        },
        {
            title: "4. Acompanhar Resultados",
            description: "Analise a eficácia de cada terapia através dos relatórios quânticos",
            icon: BarChart3,
            iconColor: "text-orange-600",
            bgColor: "bg-orange-50"
        }
    ];

    return (
        <div>
            <header className="mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Catálogo de Terapias</h1>
                    <p className="text-base text-gray-600">Seu conjunto de técnicas e ferramentas quânticas pré-configuradas.</p>
                </div>
            </header>

            {/* Seção de Guia */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Como Usar o Sistema de Terapias</h2>
                </div>
                <p className="text-base text-gray-600 mb-6">
                    Siga este guia para aproveitar ao máximo o catálogo de terapias quânticas do APP 5D.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
                    {guideCards.map((guide, index) => (
                        <Card key={index} className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all">
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-lg ${guide.bgColor} flex items-center justify-center flex-shrink-0`}>
                                        <guide.icon className={`w-6 h-6 ${guide.iconColor}`} />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg font-bold text-slate-900 mb-2">
                                            {guide.title}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600">
                                            {guide.description}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600 mt-4">Carregando terapias...</p>
                </div>
            ) : terapias.length === 0 ? (
                <Card className="bg-white border-2 border-dashed border-gray-300 text-center py-12">
                    <CardContent>
                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma terapia encontrada</h3>
                        <p className="text-gray-600">As terapias aparecerão aqui quando estiverem cadastradas.</p>
                    </CardContent>
                </Card>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Terapias Disponíveis ({terapias.length})</h2>
                    </div>
                    <div className="space-y-6">
                        <AnimatePresence>
                            {terapias.map((terapia) => (
                                <motion.div
                                    key={terapia.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    layout
                                >
                                    <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                                                            <Sparkles className="text-green-600" />
                                                            {terapia.nome}
                                                        </CardTitle>
                                                        {terapia.nivel_complexidade && (
                                                            <Badge className={nivelCores[terapia.nivel_complexidade]}>
                                                                {terapia.nivel_complexidade}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardDescription className="mt-2 text-gray-600">{terapia.descricao}</CardDescription>
                                                    
                                                    {/* Informações Rápidas */}
                                                    <div className="flex flex-wrap gap-4 mt-4">
                                                        {terapia.duracao_sessao && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Clock className="w-4 h-4 text-blue-500" />
                                                                <span>{terapia.duracao_sessao}</span>
                                                            </div>
                                                        )}
                                                        {terapia.frequencia_recomendada && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <TrendingUp className="w-4 h-4 text-green-500" />
                                                                <span>{terapia.frequencia_recomendada}</span>
                                                            </div>
                                                        )}
                                                        {terapia.tempo_resultados && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                                                <span>Resultados em: {terapia.tempo_resultados}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Seções de Informação */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Campos Avaliados:</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {terapia.campos_avaliados?.map((campo, index) => (
                                                                    <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                                                                        {campo}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Sistemas Avaliados:</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {terapia.sistemas_avaliados?.map((sistema, index) => (
                                                                    <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
                                                                        {sistema}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Benefícios */}
                                                    {terapia.beneficios && terapia.beneficios.length > 0 && (
                                                        <div className="mt-4">
                                                            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                                Principais Benefícios:
                                                            </h4>
                                                            {Array.isArray(terapia.beneficios) ? (
                                                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                                    {terapia.beneficios.slice(0, 3).map((beneficio, index) => (
                                                                        <li key={index}>{beneficio}</li>
                                                                    ))}
                                                                    {terapia.beneficios.length > 3 && (
                                                                        <li className="text-purple-600 font-medium">
                                                                            +{terapia.beneficios.length - 3} benefícios adicionais
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-sm text-gray-600">{terapia.beneficios}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Indicações */}
                                                    {terapia.indicacoes && terapia.indicacoes.length > 0 && (
                                                        <div className="mt-4">
                                                            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                                                                <Info className="w-4 h-4 text-blue-600" />
                                                                Indicações:
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Array.isArray(terapia.indicacoes) ? terapia.indicacoes.map((indicacao, index) => (
                                                                    <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-200">
                                                                        {indicacao}
                                                                    </span>
                                                                )) : (
                                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-200">
                                                                        {terapia.indicacoes}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Contraindicações */}
                                                    {terapia.contraindicacoes && (
                                                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                                            <h4 className="font-semibold text-sm text-red-700 mb-2 flex items-center gap-2">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                Contraindicações:
                                                            </h4>
                                                            {Array.isArray(terapia.contraindicacoes) ? (
                                                                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                                                    {terapia.contraindicacoes.map((contra, index) => (
                                                                        <li key={index}>{contra}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-sm text-red-600">{terapia.contraindicacoes}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <Link to={createPageUrl(`DetalhesTerapia?id=${terapia.id}`)}>
                                                    <Button variant="outline" className="ml-4 flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50">
                                                        Ver Detalhes Completos
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}