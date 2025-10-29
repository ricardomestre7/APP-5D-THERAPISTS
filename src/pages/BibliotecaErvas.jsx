
import React, { useState, useEffect } from 'react';
import { ErvaPlanta } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Leaf, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function BibliotecaErvasPage() {
    const [ervas, setErvas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroSistema, setFiltroSistema] = useState('Todos');

    useEffect(() => {
        const fetchErvas = async () => {
            setIsLoading(true);
            const data = await ErvaPlanta.list();
            setErvas(data);
            setIsLoading(false);
        };
        fetchErvas();
    }, []);

    const sistemas = ['Todos', 'Digestivo', 'Respiratório', 'Nervoso', 'Imunológico', 'Circulatório'];

    const ervasFiltradas = ervas.filter(erva => {
        const correspondeBusca = termoBusca === '' || 
            erva.nome_popular?.toLowerCase().includes(termoBusca.toLowerCase()) ||
            erva.nome_cientifico?.toLowerCase().includes(termoBusca.toLowerCase()) ||
            erva.propriedades_medicinais?.some(prop => prop.toLowerCase().includes(termoBusca.toLowerCase()));
        
        const correspondeSistema = filtroSistema === 'Todos' || 
            (erva.sistemas_corpo && Array.isArray(erva.sistemas_corpo) && erva.sistemas_corpo.includes(filtroSistema));
        
        return correspondeBusca && correspondeSistema;
    });

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Leaf className="text-green-600" />
                    Biblioteca de Ervas e Plantas Medicinais
                </h1>
                <p className="text-base text-gray-600">Enciclopédia completa de fitoterapia com propriedades medicinais, energéticas e uso clínico comprovado.</p>
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
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {sistemas.map(sistema => (
                        <Button 
                            key={sistema}
                            variant={filtroSistema === sistema ? 'default' : 'outline'}
                            onClick={() => setFiltroSistema(sistema)}
                            className={`whitespace-nowrap ${
                                filtroSistema === sistema 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                            }`}
                        >
                            {sistema}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <p className="text-gray-600">Carregando biblioteca...</p>
            ) : ervasFiltradas.length === 0 ? (
                <Card className="bg-white border-2 border-dashed border-gray-300 text-center py-12">
                    <CardContent>
                        <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma erva encontrada</h3>
                        <p className="text-gray-600">Tente ajustar os filtros ou termo de busca.</p>
                        <p className="text-sm text-gray-500 mt-2">Total de ervas: {ervas.length}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {ervasFiltradas.map(erva => (
                            <motion.div
                                key={erva.id}
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
                                                        <Leaf className="text-green-600" />
                                                        {erva.nome_popular}
                                                    </CardTitle>
                                                    {erva.nome_cientifico && (
                                                        <p className="text-sm italic text-gray-500">{erva.nome_cientifico}</p>
                                                    )}
                                                    {erva.familia && (
                                                        <Badge className="mt-2 bg-green-100 text-green-700">
                                                            {erva.familia}
                                                        </Badge>
                                                    )}
                                                    {erva.origem && Array.isArray(erva.origem) && (
                                                        <p className="text-xs text-gray-500 mt-1">Origem: {erva.origem.join(', ')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {erva.propriedades_medicinais && erva.propriedades_medicinais.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Propriedades Medicinais:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {erva.propriedades_medicinais.slice(0, 4).map((prop, idx) => (
                                                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
                                                                {prop}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {erva.indicacoes_tradicionais && erva.indicacoes_tradicionais.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-1">Indicações Tradicionais:</p>
                                                    <ul className="list-disc list-inside text-sm text-gray-600">
                                                        {erva.indicacoes_tradicionais.slice(0, 3).map((ind, idx) => (
                                                            <li key={idx}>{ind}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <CollapsibleContent className="space-y-4">
                                                {erva.habitat && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">Habitat:</p>
                                                        <p className="text-sm text-gray-600">{erva.habitat}</p>
                                                    </div>
                                                )}

                                                {erva.partes_usadas && erva.partes_usadas.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Partes Usadas:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {erva.partes_usadas.map((parte, idx) => (
                                                                <Badge key={idx} className="bg-green-100 text-green-700">{parte}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {erva.principios_ativos && erva.principios_ativos.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Princípios Ativos:</p>
                                                        <p className="text-sm text-gray-600">{erva.principios_ativos.join(', ')}</p>
                                                    </div>
                                                )}

                                                {erva.indicacoes_fisicas && erva.indicacoes_fisicas.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Indicações Físicas:</p>
                                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                            {erva.indicacoes_fisicas.map((ind, idx) => (
                                                                <li key={idx}>{ind}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {erva.propriedades_energeticas && erva.propriedades_energeticas.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Propriedades Energéticas:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {erva.propriedades_energeticas.map((prop, idx) => (
                                                                <Badge key={idx} className="bg-orange-100 text-orange-700">{prop}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {erva.chakras && erva.chakras.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Chakras:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {erva.chakras.map((chakra, idx) => (
                                                                <Badge key={idx} className="bg-purple-100 text-purple-700">{chakra}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {erva.elemento && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Elemento:</p>
                                                        <Badge className="bg-yellow-100 text-yellow-700">{erva.elemento}</Badge>
                                                    </div>
                                                )}

                                                {erva.formas_uso && erva.formas_uso.length > 0 && (
                                                    <div className="bg-blue-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-blue-700 mb-1">🌿 Formas de Uso:</p>
                                                        <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                                                            {erva.formas_uso.map((forma, idx) => (
                                                                <li key={idx}>{forma}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {erva.dosagem && (
                                                    <div className="bg-green-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-green-700 mb-1">💊 Dosagem:</p>
                                                        <p className="text-sm text-green-600">{erva.dosagem}</p>
                                                    </div>
                                                )}

                                                {erva.contraindicacoes && erva.contraindicacoes.length > 0 && (
                                                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                        <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Contraindicações:</p>
                                                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                                            {erva.contraindicacoes.map((contra, idx) => (
                                                                <li key={idx}>{contra}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {erva.sinergias && erva.sinergias.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">💫 Sinergias:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {erva.sinergias.map((s, idx) => (
                                                                <Badge key={idx} className="bg-indigo-100 text-indigo-700">{s}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {erva.cultivo && (
                                                    <div className="bg-green-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-green-700 mb-1">🌱 Cultivo:</p>
                                                        <p className="text-sm text-green-600">{erva.cultivo}</p>
                                                    </div>
                                                )}

                                                {erva.historia_folclore && (
                                                    <div className="bg-purple-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-purple-700 mb-1">📜 História e Folclore:</p>
                                                        <p className="text-sm text-purple-600">{erva.historia_folclore}</p>
                                                    </div>
                                                )}

                                                {erva.curiosidades_historicas && (
                                                    <div className="bg-purple-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-purple-700 mb-1">✨ Curiosidades:</p>
                                                        <p className="text-sm text-purple-600">{erva.curiosidades_historicas}</p>
                                                    </div>
                                                )}

                                                {erva.estudos_cientificos && (
                                                    <div className="bg-blue-50 p-3 rounded-lg">
                                                        <p className="text-sm font-semibold text-blue-700 mb-1">🔬 Estudos Científicos:</p>
                                                        <p className="text-sm text-blue-600">{erva.estudos_cientificos}</p>
                                                    </div>
                                                )}
                                            </CollapsibleContent>

                                            <CollapsibleTrigger asChild>
                                                <Button variant="link" className="text-green-600 p-0 h-auto flex items-center gap-1 w-full justify-center hover:text-green-700">
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
