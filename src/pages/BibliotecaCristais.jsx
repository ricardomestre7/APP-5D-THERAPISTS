import React, { useState, useEffect } from 'react';
import { Cristal } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Gem, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function BibliotecaCristaisPage() {
    const [cristais, setCristais] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroChakra, setFiltroChakra] = useState('Todos');

    useEffect(() => {
        const fetchCristais = async () => {
            setIsLoading(true);
            const data = await Cristal.list();
            setCristais(data);
            setIsLoading(false);
        };
        fetchCristais();
    }, []);

    const chakras = ['Todos', 'Raiz', 'Sacral', 'Plexo Solar', 'Cardíaco', 'Laríngeo', 'Terceiro Olho', 'Coronário'];

    const cristaisFiltrados = cristais.filter(cristal => {
        const correspondeBusca = termoBusca === '' || 
            cristal.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            cristal.cor_principal?.toLowerCase().includes(termoBusca.toLowerCase());
        const correspondeChakra = filtroChakra === 'Todos' || 
            cristal.chakras_principais?.includes(filtroChakra);
        return correspondeBusca && correspondeChakra;
    });

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Gem className="text-purple-600" />
                    Biblioteca de Cristais e Pedras
                </h1>
                <p className="text-base text-gray-600">Enciclopédia completa de cristaloterapia com propriedades mineralógicas, energéticas e uso terapêutico.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input 
                        placeholder="Buscar por nome, cor, propriedades..."
                        className="pl-10 bg-white/80 border-gray-300 h-12"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {chakras.map(chakra => (
                        <Button 
                            key={chakra}
                            variant={filtroChakra === chakra ? 'default' : 'outline'}
                            onClick={() => setFiltroChakra(chakra)}
                            className={`whitespace-nowrap ${filtroChakra === chakra ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            {chakra}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <p className="text-gray-600">Carregando biblioteca...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {cristaisFiltrados.map(cristal => (
                            <motion.div
                                key={cristal.id}
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
                                                        <Gem className="text-purple-600" />
                                                        {cristal.nome}
                                                    </CardTitle>
                                                    {cristal.nome_cientifico && (
                                                        <p className="text-sm italic text-gray-500">{cristal.nome_cientifico}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {cristal.cor_principal && (
                                                            <Badge className="bg-blue-100 text-blue-700">
                                                                {cristal.cor_principal}
                                                            </Badge>
                                                        )}
                                                        {cristal.dureza && (
                                                            <Badge className="bg-gray-100 text-gray-700">
                                                                Dureza: {cristal.dureza}
                                                            </Badge>
                                                        )}
                                                        {cristal.estrutura && (
                                                            <Badge className="bg-gray-100 text-gray-700">
                                                                {cristal.estrutura}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {cristal.chakras_principais && cristal.chakras_principais.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Chakras:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {cristal.chakras_principais.map((chakra, idx) => (
                                                            <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                                                                {chakra}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {cristal.propriedades_energeticas && cristal.propriedades_energeticas.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Propriedades Energéticas:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {cristal.propriedades_energeticas.slice(0, 3).map((prop, idx) => (
                                                            <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs">
                                                                {prop}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <CollapsibleContent className="space-y-4">
                                                {cristal.translucencia && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">Transparência:</p>
                                                        <p className="text-sm text-gray-600">{cristal.translucencia}</p>
                                                    </div>
                                                )}

                                                {cristal.elementos && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Elementos:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.isArray(cristal.elementos) ? cristal.elementos.map((el, idx) => (
                                                                <Badge key={idx} className="bg-orange-100 text-orange-700">{el}</Badge>
                                                            )) : <Badge className="bg-orange-100 text-orange-700">{cristal.elementos}</Badge>}
                                                        </div>
                                                    </div>
                                                )}

                                                {cristal.signos_astrologicos && cristal.signos_astrologicos.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Signos Astrológicos:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {cristal.signos_astrologicos.map((signo, idx) => (
                                                                <Badge key={idx} className="bg-yellow-100 text-yellow-700">{signo}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {cristal.emocoes_tratadas && cristal.emocoes_tratadas.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Emoções Tratadas:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {cristal.emocoes_tratadas.slice(0, 5).map((emocao, idx) => (
                                                                <span key={idx} className="bg-pink-100 text-pink-700 px-2 py-1 rounded-md text-xs">{emocao}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {cristal.usos_espirituais && cristal.usos_espirituais.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Usos Espirituais:</p>
                                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                            {cristal.usos_espirituais.map((uso, idx) => (
                                                                <li key={idx}>{uso}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {cristal.indicacoes_fisicas && cristal.indicacoes_fisicas.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Indicações Físicas:</p>
                                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                            {cristal.indicacoes_fisicas.slice(0, 4).map((ind, idx) => (
                                                                <li key={idx}>{ind}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {cristal.formas_uso && cristal.formas_uso.length > 0 && (
                                                    <div className="bg-blue-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-blue-700 mb-1">💎 Como Usar:</p>
                                                        <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                                                            {cristal.formas_uso.slice(0, 3).map((forma, idx) => (
                                                                <li key={idx}>{forma}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {cristal.forma_limpeza && (
                                                    <div className="bg-green-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-green-700 mb-1">🧹 Limpeza:</p>
                                                        <p className="text-sm text-green-600">{cristal.forma_limpeza}</p>
                                                    </div>
                                                )}

                                                {cristal.contraindicacoes && cristal.contraindicacoes.length > 0 && (
                                                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                        <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Contraindicações:</p>
                                                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                                            {cristal.contraindicacoes.map((contra, idx) => (
                                                                <li key={idx}>{contra}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {cristal.sinergias && cristal.sinergias.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">💫 Sinergias:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.isArray(cristal.sinergias) ? cristal.sinergias.map((s, idx) => (
                                                                <Badge key={idx} className="bg-indigo-100 text-indigo-700">{s}</Badge>
                                                            )) : <Badge className="bg-indigo-100 text-indigo-700">{cristal.sinergias}</Badge>}
                                                        </div>
                                                    </div>
                                                )}

                                                {cristal.curiosidades_historicas && (
                                                    <div className="bg-purple-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-purple-700 mb-1">📜 Curiosidades Históricas:</p>
                                                        <p className="text-sm text-purple-600">{cristal.curiosidades_historicas}</p>
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