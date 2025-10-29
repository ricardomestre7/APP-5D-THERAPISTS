import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

export const useAnalisadorQuantico = (sessoes, terapias) => {
    return useMemo(() => {
        if (!sessoes || sessoes.length === 0) return null;

        // 1. SCORE GERAL
        let somaTotal = 0;
        let contador = 0;
        
        sessoes.forEach(sessao => {
            if (sessao.resultados) {
                Object.values(sessao.resultados).forEach(valor => {
                    const num = parseFloat(valor);
                    if (!isNaN(num)) {
                        somaTotal += num;
                        contador++;
                    }
                });
            }
        });
        
        const scoreGeral = contador > 0 ? Math.round((somaTotal / contador) * 10) : 0;

        // 2. ÍNDICES POR CAMPO
        const camposSoma = {};
        const camposCount = {};
        
        sessoes.forEach(sessao => {
            const terapia = terapias[sessao.terapia_id];
            if (terapia && terapia.campos_formulario && sessao.resultados) {
                terapia.campos_formulario.forEach(campo => {
                    const campoNome = campo.campo_associado || campo.label;
                    const valor = sessao.resultados[campo.label];
                    const num = parseFloat(valor);
                    
                    if (!isNaN(num) && campoNome) {
                        camposSoma[campoNome] = (camposSoma[campoNome] || 0) + num;
                        camposCount[campoNome] = (camposCount[campoNome] || 0) + 1;
                    }
                });
            }
        });

        const indicesPorCampo = {};
        Object.keys(camposSoma).forEach(campo => {
            const media = camposSoma[campo] / camposCount[campo];
            const percentual = Math.round(media * 10);
            let nivel = 'Crítico';
            if (media >= 7) nivel = 'Excelente';
            else if (media >= 5) nivel = 'Bom';
            else if (media >= 3) nivel = 'Atenção';
            
            indicesPorCampo[campo] = {
                atual: media.toFixed(1),
                percentual,
                nivel
            };
        });

        // 3. CAMPOS CRÍTICOS
        const camposCriticos = [];
        Object.entries(indicesPorCampo).forEach(([campo, dados]) => {
            if (parseFloat(dados.atual) < 5) {
                camposCriticos.push({
                    campo,
                    valor: dados.atual,
                    recomendacao: `Focar nas próximas sessões para elevar ${campo}`
                });
            }
        });

        // 4. VELOCIDADE DE MELHORIA
        let velocidade = 'Estável';
        if (sessoes.length >= 2) {
            const primeira = sessoes[sessoes.length - 1];
            const ultima = sessoes[0];
            
            let somaInicial = 0, somaFinal = 0, count = 0;
            
            if (primeira.resultados) {
                Object.values(primeira.resultados).forEach(v => {
                    const num = parseFloat(v);
                    if (!isNaN(num)) { somaInicial += num; count++; }
                });
            }
            
            if (ultima.resultados) {
                Object.values(ultima.resultados).forEach(v => {
                    const num = parseFloat(v);
                    if (!isNaN(num)) somaFinal += num;
                });
            }
            
            if (count > 0) {
                const mediaInicial = somaInicial / count;
                const mediaFinal = somaFinal / count;
                const diferenca = mediaFinal - mediaInicial;
                
                if (diferenca > 1) velocidade = 'Rápida Evolução';
                else if (diferenca > 0.5) velocidade = 'Evolução Moderada';
                else if (diferenca < -0.5) velocidade = 'Regressão';
            }
        }

        return {
            scoreGeral,
            totalSessoes: sessoes.length,
            indicesPorCampo,
            camposCriticos,
            velocidadeMelhoria: velocidade
        };
    }, [sessoes, terapias]);
};

export default function AnalisadorQuantico({ sessoes, terapias, onAnaliseGerada }) {
    const analise = useAnalisadorQuantico(sessoes, terapias);

    React.useEffect(() => {
        if (analise && onAnaliseGerada) {
            onAnaliseGerada(analise);
        }
    }, [analise, onAnaliseGerada]);

    if (!analise) {
        return (
            <Card className="bg-white border-0 shadow-xl">
                <CardContent className="py-12 text-center">
                    <p className="text-gray-600">Aguardando dados para análise...</p>
                </CardContent>
            </Card>
        );
    }

    // DADOS PARA GRÁFICO DE BARRAS
    const dadosBarras = Object.entries(analise.indicesPorCampo).map(([campo, dados]) => ({
        campo: campo.length > 15 ? campo.substring(0, 15) + '...' : campo,
        valor: parseFloat(dados.atual),
        fill: parseFloat(dados.atual) >= 7 ? '#10b981' : parseFloat(dados.atual) >= 5 ? '#f59e0b' : '#ef4444'
    }));

    // DADOS PARA GRÁFICO DE LINHA (Evolução)
    const dadosLinha = sessoes.slice().reverse().map((sessao, index) => {
        let soma = 0;
        let count = 0;
        
        if (sessao.resultados) {
            Object.values(sessao.resultados).forEach(v => {
                const num = parseFloat(v);
                if (!isNaN(num)) {
                    soma += num;
                    count++;
                }
            });
        }
        
        return {
            sessao: `S${index + 1}`,
            media: count > 0 ? (soma / count).toFixed(1) : 0
        };
    });

    // DADOS PARA RADAR
    const dadosRadar = Object.entries(analise.indicesPorCampo).slice(0, 6).map(([campo, dados]) => ({
        campo: campo.length > 10 ? campo.substring(0, 10) + '...' : campo,
        valor: parseFloat(dados.atual)
    }));

    return (
        <div className="space-y-6">
            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="w-6 h-6 text-purple-600" />
                            <p className="text-sm font-semibold text-purple-700">Score Geral</p>
                        </div>
                        <p className="text-4xl font-bold text-purple-900">{analise.scoreGeral}<span className="text-xl">/100</span></p>
                        <p className="text-xs text-purple-600 mt-1">
                            {analise.scoreGeral >= 70 ? 'Excelente' : analise.scoreGeral >= 50 ? 'Bom' : 'Atenção Necessária'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-700">Sessões</p>
                        </div>
                        <p className="text-4xl font-bold text-blue-900">{analise.totalSessoes}</p>
                        <p className="text-xs text-blue-600 mt-1">Realizadas</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                            <p className="text-sm font-semibold text-green-700">Velocidade</p>
                        </div>
                        <p className="text-lg font-bold text-green-900">{analise.velocidadeMelhoria}</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <p className="text-sm font-semibold text-red-700">Campos Críticos</p>
                        </div>
                        <p className="text-4xl font-bold text-red-900">{analise.camposCriticos.length}</p>
                        <p className="text-xs text-red-600 mt-1">Necessitam atenção</p>
                    </CardContent>
                </Card>
            </div>

            {/* GRÁFICO DE BARRAS */}
            <Card className="bg-white border-0 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">📊 Índices por Campo Energético</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dadosBarras}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="campo" angle={-45} textAnchor="end" height={100} />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* GRÁFICO DE LINHA */}
            <Card className="bg-white border-0 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">📈 Evolução ao Longo das Sessões</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dadosLinha}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="sessao" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="media" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} name="Média Geral" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* GRÁFICO RADAR */}
            {dadosRadar.length > 0 && (
                <Card className="bg-white border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-gray-800">🎯 Visão Holística (Radar)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={dadosRadar}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="campo" />
                                <PolarRadiusAxis domain={[0, 10]} />
                                <Radar name="Estado Atual" dataKey="valor" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* CAMPOS CRÍTICOS */}
            {analise.camposCriticos.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            Campos Críticos (Abaixo de 5/10)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analise.camposCriticos.map((critico, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-red-300">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-red-800">{critico.campo}</h4>
                                        <span className="text-2xl font-bold text-red-600">{critico.valor}/10</span>
                                    </div>
                                    <p className="text-sm text-red-700">💡 {critico.recomendacao}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}