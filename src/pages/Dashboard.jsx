import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Sparkles, Activity, BookOpen, UserPlus, ClipboardList, BarChart3, ChevronRight, TrendingUp } from 'lucide-react';
import { Paciente } from '@/api/entities';
import { Terapia } from '@/api/entities';
import { Sessao } from '@/api/entities';
import { User } from '@/api/entities';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [stats, setStats] = useState({
        pacientes: 0,
        terapias: 0,
        sessoes: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const currentUser = await User.me();
                if (!currentUser) {
                    setIsLoading(false);
                    return;
                }

                const [pacientesList, terapiasList, sessoesList] = await Promise.all([
                    Paciente.filter({ terapeuta_id: currentUser.id }),
                    Terapia.list(),
                    Sessao.filter({ created_by: currentUser.email })
                ]);
                
                setStats({
                    pacientes: pacientesList.length,
                    terapias: terapiasList.length,
                    sessoes: sessoesList.length
                });
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
                // Define valores padrão em caso de erro
                setStats({
                    pacientes: 0,
                    terapias: 0,
                    sessoes: 0
                });
            } finally {
                setIsLoading(false);
            }
        };
        
        loadStats();
    }, []);

    const guides = [
        {
            title: "1. Adicionar Seus Pacientes",
            description: "Configure o cadastro completo dos seus clientes",
            icon: UserPlus,
            iconColor: "text-purple-600",
            linkTo: "Pacientes"
        },
        {
            title: "2. Registrar Sessões de Terapia",
            description: "Como documentar cada atendimento com dados estruturados",
            icon: ClipboardList,
            iconColor: "text-green-600",
            linkTo: "Pacientes"
        },
        {
            title: "3. Acompanhar Evolução e Relatórios",
            description: "Visualize o progresso dos pacientes através de gráficos",
            icon: BarChart3,
            iconColor: "text-blue-600",
            linkTo: "Relatorios"
        },
        {
            title: "4. Consultar a Base de Conhecimento",
            description: "Acesse informações detalhadas sobre cada prática",
            icon: BookOpen,
            iconColor: "text-orange-600",
            linkTo: "PraticasQuanticas"
        }
    ];

    return (
        <div>
            <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className="w-10 h-10 text-purple-600" />
                    </motion.div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">Painel 5D</h1>
                        <p className="text-base text-gray-600">Bem-vindo(a) de volta à sua jornada quântica.</p>
                    </div>
                </div>
                {stats.sessoes > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700"
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium">Ótimo progresso! Continue assim! 🎉</span>
                    </motion.div>
                )}
            </motion.div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Pacientes Ativos</p>
                                <CardTitle className="text-4xl font-bold text-slate-900 mt-1">
                                    {isLoading ? '...' : stats.pacientes}
                                </CardTitle>
                                <p className="text-xs text-gray-600 mt-1">
                                    {stats.pacientes === 0 ? 'Nenhum cadastrado' : 'prontuários ativos'}
                                </p>
                            </div>
                            <motion.div 
                                className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Users className="w-7 h-7 text-purple-600" />
                            </motion.div>
                        </CardHeader>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Terapias Disponíveis</p>
                                <CardTitle className="text-4xl font-bold text-slate-900 mt-1">
                                    {isLoading ? '...' : stats.terapias}
                                </CardTitle>
                                <p className="text-xs text-gray-600 mt-1">técnicas pré-configuradas</p>
                            </div>
                            <motion.div 
                                className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg"
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Sparkles className="w-7 h-7 text-green-600" />
                            </motion.div>
                        </CardHeader>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Sessões Realizadas</p>
                                <CardTitle className="text-4xl font-bold text-slate-900 mt-1">
                                    {isLoading ? '...' : stats.sessoes}
                                </CardTitle>
                                <p className="text-xs text-gray-600 mt-1">
                                    {stats.sessoes === 0 ? 'Nenhuma registrada' : 'atendimentos documentados'}
                                </p>
                            </div>
                            <motion.div 
                                className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            >
                                <Activity className="w-7 h-7 text-blue-600" />
                            </motion.div>
                        </CardHeader>
                    </Card>
                </motion.div>
            </div>

            {/* Guide */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <motion.div 
                        className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <BookOpen className="w-5 h-5 text-green-600" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-slate-900">Como Usar o APP 5D</h2>
                </div>
                <p className="text-base text-gray-600 mb-6">
                    Siga este guia passo a passo para aproveitar todas as funcionalidades do sistema de gestão quântica.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {guides.map((guide, index) => {
                        const Icon = guide.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all group cursor-pointer">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <Icon className={`w-5 h-5 ${guide.iconColor}`} />
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
                                            <Link to={createPageUrl(guide.linkTo)}>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-purple-600 hover:bg-purple-50 group-hover:translate-x-1 transition-transform">
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}