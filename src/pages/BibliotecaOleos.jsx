import React, { useState, useEffect } from 'react';
import { OleoEssencial } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Droplet, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function BibliotecaOleosPage() {
    const [oleos, setOleos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroNota, setFiltroNota] = useState('Todas');

    useEffect(() => {
        const fetchOleos = async () => {
            setIsLoading(true);
            try {
                const data = await OleoEssencial.list();
                setOleos(data || []);
            } catch (error) {
                console.error('Erro ao carregar óleos:', error);
                setOleos([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOleos();
    }, []);

    const notas = ['Todas', 'Nota de Topo', 'Nota de Coração', 'Nota de Base'];

    const oleosFiltrados = oleos.filter(oleo => {
        const correspondeBusca = termoBusca === '' || 
            oleo.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            oleo.nome_cientifico?.toLowerCase().includes(termoBusca.toLowerCase());
        const correspondeNota = filtroNota === 'Todas' || oleo.nota_aromatica === filtroNota;
        return correspondeBusca && correspondeNota;
    });

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Droplet className="text-purple-600" />
                    Biblioteca de Óleos Essenciais
                </h1>
                <p className="text-base text-gray-600">Enciclopédia completa de aromaterapia com propriedades terapêuticas, vibracionais e uso clínico.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input 
                        placeholder="Buscar por nome, nome científico, propriedades..."
                        className="pl-10 bg-white/80 border-gray-300 h-12"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {notas.map(nota => (
                        <Button 
                            key={nota}
                            variant={filtroNota === nota ? 'default' : 'outline'}
                            onClick={() => setFiltroNota(nota)}
                            className={filtroNota === nota ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}
                        >
                            {nota}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600 mt-4">Carregando biblioteca...</p>
                </div>
            ) : oleos.length === 0 ? (
                <Card className="bg-white border-2 border-dashed border-gray-300 text-center py-12">
                    <CardContent>
                        <Droplet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum óleo encontrado</h3>
                        <p className="text-gray-600">Tente ajustar os filtros ou termo de busca.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {oleosFiltrados.map(oleo => (
                            <motion.div
                                key={oleo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                layout
                            >
                                <Collapsible asChild>
                                    <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3 mb-2">
                                                        <Droplet className="text-purple-600" />
                                                        {oleo.nome}
                                                    </CardTitle>
                                                    {oleo.nome_cientifico && (
                                                        <p className="text-sm italic text-gray-500">{oleo.nome_cientifico}</p>
                                                    )}
                                                    {oleo.nota_aromatica && (
                                                        <Badge className="mt-2 bg-purple-100 text-purple-700">
                                                            {oleo.nota_aromatica}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Preview Info */}
                                            {oleo.aroma && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Aroma:</p>
                                                    <p className="text-sm text-gray-600">{oleo.aroma}</p>
                                                </div>
                                            )}

                                            {oleo.propriedades_aromaticas && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Propriedades:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.isArray(oleo.propriedades_aromaticas) 
                                                            ? oleo.propriedades_aromaticas.slice(0, 4).map((prop, idx) => (
                                                                <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs">
                                                                    {prop}
                                                                </span>
                                                            ))
                                                            : <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs">
                                                                {oleo.propriedades_aromaticas}
                                                            </span>
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            <CollapsibleContent className="space-y-4">
                                                {/* Detalhes Completos */}
                                                {oleo.componentes_principais && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Componentes Principais:</p>
                                                        <p className="text-sm text-gray-600">
                                                            {Array.isArray(oleo.componentes_principais) 
                                                                ? oleo.componentes_principais.join(', ')
                                                                : oleo.componentes_principais
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {oleo.chakras && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Chakras:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.isArray(oleo.chakras) 
                                                                ? oleo.chakras.map((chakra, idx) => (
                                                                    <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                                                                        {chakra}
                                                                    </span>
                                                                ))
                                                                : <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                                                                    {oleo.chakras}
                                                                </span>
                                                            }
                                                        </div>
                                                    </div>
                                                )}

                                                {oleo.emocoes_tratadas && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Emoções Tratadas:</p>
                                                        <p className="text-sm text-gray-600">
                                                            {Array.isArray(oleo.emocoes_tratadas) 
                                                                ? oleo.emocoes_tratadas.join(', ')
                                                                : oleo.emocoes_tratadas
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {oleo.indicacoes_fisicas && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Indicações Físicas:</p>
                                                        {Array.isArray(oleo.indicacoes_fisicas) ? (
                                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                                                {oleo.indicacoes_fisicas.map((ind, idx) => (
                                                                    <li key={idx}>{ind}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-gray-600">{oleo.indicacoes_fisicas}</p>
                                                        )}
                                                    </div>
                                                )}

                                                {oleo.contraindicacoes && (
                                                    <div className="bg-red-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Contraindicações:</p>
                                                        {Array.isArray(oleo.contraindicacoes) ? (
                                                            <ul className="list-disc list-inside text-sm text-red-600">
                                                                {oleo.contraindicacoes.map((contra, idx) => (
                                                                    <li key={idx}>{contra}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-red-600">{oleo.contraindicacoes}</p>
                                                        )}
                                                    </div>
                                                )}

                                                {oleo.curiosidades && (
                                                    <div className="bg-purple-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-purple-700 mb-1">✨ Curiosidades:</p>
                                                        <p className="text-sm text-purple-600">{oleo.curiosidades}</p>
                                                    </div>
                                                )}
                                            </CollapsibleContent>

                                            <CollapsibleTrigger asChild>
                                                <Button variant="link" className="text-purple-600 p-0 h-auto flex items-center gap-1 w-full justify-center">
                                                    Ver Detalhes Completos <ChevronDown className="w-4 h-4" />
                                                </Button>
                                            </CollapsibleTrigger>
                                        </CardContent>
                                    </Card>
                                </Collapsible>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}