
import React, { useState, useEffect } from 'react';
import { PraticaQuantica } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, ChevronDown, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const QuantumCard = ({ children, className, ...props }) => (
    <Card 
        className={`bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
        {...props}
    >
        {children}
    </Card>
);

export default function PraticasQuanticas() {
    const [praticas, setPraticas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtroCategoria, setFiltroCategoria] = useState('Todas');
    const [termoBusca, setTermoBusca] = useState('');

    useEffect(() => {
        const fetchPraticas = async () => {
            setIsLoading(true);
            const data = await PraticaQuantica.list();
            setPraticas(data);
            setIsLoading(false);
        };
        fetchPraticas();
    }, []);

    const categorias = ['Todas', ...new Set(praticas.map(p => p.categoria))];

    const praticasFiltradas = praticas.filter(pratica => {
        const correspondeCategoria = filtroCategoria === 'Todas' || pratica.categoria === filtroCategoria;
        const correspondeBusca = termoBusca === '' || pratica.titulo.toLowerCase().includes(termoBusca.toLowerCase()) || pratica.descricao_curta.toLowerCase().includes(termoBusca.toLowerCase());
        return correspondeCategoria && correspondeBusca;
    });

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Base de Conhecimento</h1>
                <p className="text-base text-gray-600">Explore um vasto compêndio de técnicas, práticas e saberes.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input 
                        placeholder="Buscar por título, palavra-chave..."
                        className="pl-10 bg-white/80 border-gray-300 h-12"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {categorias.map(cat => (
                        <Button 
                            key={cat}
                            variant={filtroCategoria === cat ? 'default' : 'outline'}
                            onClick={() => setFiltroCategoria(cat)}
                            className={filtroCategoria === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <p className="text-gray-600">Carregando práticas...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {praticasFiltradas.map(pratica => (
                             <motion.div
                                key={pratica.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                layout
                            >
                                <Collapsible asChild>
                                    <QuantumCard>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
                                                <Library className="text-purple-600" />
                                                {pratica.titulo}
                                            </CardTitle>
                                            <CardDescription className="text-gray-600 mt-2">{pratica.descricao_curta}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <CollapsibleContent className="prose prose-sm text-gray-700">
                                               <p>{pratica.conteudo_detalhado}</p>
                                            </CollapsibleContent>
                                             <CollapsibleTrigger asChild>
                                                <Button variant="link" className="text-purple-600 p-0 h-auto flex items-center gap-1">
                                                    Ver Detalhes da Prática <ChevronDown className="w-4 h-4 transition-transform" />
                                                </Button>
                                            </CollapsibleTrigger>
                                        </CardContent>
                                    </QuantumCard>
                                </Collapsible>
                             </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
