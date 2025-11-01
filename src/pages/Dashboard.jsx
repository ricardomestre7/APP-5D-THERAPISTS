import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

                const [pacientesList, terapiasList, todasSessoes] = await Promise.all([
                    Paciente.filter({ terapeuta_id: currentUser.id }),
                    Terapia.list(),
                    Sessao.filter({ terapeuta_id: currentUser.id }) // Filtrar por terapeuta_id
                ]);
                
                // Filtrar sessões órfãs (sem paciente válido)
                const pacienteIds = new Set(pacientesList.map(p => p.id));
                const sessoesList = todasSessoes.filter(sessao => {
                    // Só contar sessões que têm paciente_id válido e o paciente ainda existe
                    return sessao.paciente_id && pacienteIds.has(sessao.paciente_id);
                });
                
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
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
            <motion.div 
                className="mb-6 md:mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-purple-600" />
                    </motion.div>
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900">Painel 5D</h1>
                        <p className="text-base md:text-lg lg:text-xl text-gray-600 mt-1">Bem-vindo(a) de volta à sua jornada quântica.</p>
                    </div>
                    {stats.sessoes > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 whitespace-nowrap"
                        >
                            <TrendingUp className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm md:text-base font-medium">Ótimo progresso! Continue assim! 🎉</span>
                        </motion.div>
                    )}
                </div>
            </motion.div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 p-4 md:p-6">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-semibold text-purple-700 uppercase tracking-wide">Pacientes Ativos</p>
                                <CardTitle className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mt-1 md:mt-2">
                                    {isLoading ? '...' : stats.pacientes}
                                </CardTitle>
                                <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                                    {stats.pacientes === 0 ? 'Nenhum cadastrado' : 'prontuários ativos'}
                                </p>
                            </div>
                            <motion.div 
                                className="w-14 h-14 md:w-16 md:h-20 lg:w-20 lg:h-20 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0 ml-3"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Users className="w-7 h-7 md:w-8 md:h-10 lg:w-10 lg:h-10 text-purple-600" />
                            </motion.div>
                        </CardHeader>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 p-4 md:p-6">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-semibold text-green-700 uppercase tracking-wide">Terapias Disponíveis</p>
                                <CardTitle className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mt-1 md:mt-2">
                                    {isLoading ? '...' : stats.terapias}
                                </CardTitle>
                                <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">técnicas pré-configuradas</p>
                            </div>
                            <motion.div 
                                className="w-14 h-14 md:w-16 md:h-20 lg:w-20 lg:h-20 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0 ml-3"
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Sparkles className="w-7 h-7 md:w-8 md:h-10 lg:w-10 lg:h-10 text-green-600" />
                            </motion.div>
                        </CardHeader>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] h-full sm:col-span-2 lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 p-4 md:p-6">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-semibold text-blue-700 uppercase tracking-wide">Sessões Realizadas</p>
                                <CardTitle className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mt-1 md:mt-2">
                                    {isLoading ? '...' : stats.sessoes}
                                </CardTitle>
                                <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                                    {stats.sessoes === 0 ? 'Nenhuma registrada' : 'atendimentos documentados'}
                                </p>
                            </div>
                            <motion.div 
                                className="w-14 h-14 md:w-16 md:h-20 lg:w-20 lg:h-20 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0 ml-3"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            >
                                <Activity className="w-7 h-7 md:w-8 md:h-10 lg:w-10 lg:h-10 text-blue-600" />
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
                className="mb-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <motion.div 
                        className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <BookOpen className="w-5 h-5 text-green-600" />
                    </motion.div>
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Como Usar o APP 5D</h2>
                        <p className="text-sm md:text-base lg:text-lg text-gray-600 mt-2">
                            Siga este guia passo a passo para aproveitar todas as funcionalidades do sistema de gestão quântica.
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
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
                                <Link to={createPageUrl(guide.linkTo)} className="block h-full">
                                    <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all group cursor-pointer h-full flex flex-col">
                                        <CardHeader className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col">
                                            <div className="flex flex-col h-full">
                                                <div className="flex items-start justify-between gap-3 md:gap-4 mb-3">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <Icon className={`w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 ${guide.iconColor}`} />
                                                    </div>
                                                    <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-transform flex-shrink-0">
                                                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-2 md:mb-3">
                                                        {guide.title}
                                                    </CardTitle>
                                                    <p className="text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed">
                                                        {guide.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}