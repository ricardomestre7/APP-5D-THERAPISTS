

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Users, BarChart3, Library, Sparkles, Loader2, LogOut, Menu, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// Base44 removido
import ChatbotFloating from '@/components/ChatbotFloating';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Painel', icon: Home, page: 'Dashboard', color: 'text-blue-500' },
    { name: 'Pacientes', icon: Users, page: 'Pacientes', color: 'text-purple-500' },
    { name: 'Terapias', icon: Sparkles, page: 'Terapias', color: 'text-green-500' },
    { name: 'Base de Conhecimento', icon: Library, page: 'PraticasQuanticas', color: 'text-orange-500' },
    { name: 'Biblioteca de Óleos', icon: Library, page: 'BibliotecaOleos', color: 'text-purple-500' },
    { name: 'Biblioteca de Cristais', icon: Library, page: 'BibliotecaCristais', color: 'text-pink-500' },
    { name: 'Biblioteca de Ervas', icon: Library, page: 'BibliotecaErvas', color: 'text-green-500' },
    { name: 'Relatórios', icon: BarChart3, page: 'Relatorios', color: 'text-pink-500' },
    { name: 'Manual do Terapeuta', icon: BookOpen, page: 'ManualTerapeuta', color: 'text-indigo-500' }
];

const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const SidebarContent = ({ user, onLogout }) => {
    const location = useLocation();

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">5D Therapists</h1>
                    <p className="text-xs text-gray-500">Terapias Quânticas</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === createPageUrl(item.page);
                    
                    return (
                        <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                isActive
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-400'}`} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <Link
                    to={createPageUrl('MinhaConta')}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profile_picture_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {getInitials(user?.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.full_name || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </Link>
                <Button
                    variant="ghost"
                    className="w-full mt-2 justify-start text-gray-600"
                    onClick={onLogout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                </Button>
            </div>
        </div>
    );
};

export default function Layout({ children, currentPageName }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            console.log('🔄 Carregando usuário no Layout...');
            // Buscar usuário atual do localStorage
            const savedUser = localStorage.getItem('5d_user_profile');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                console.log('👤 Usuário encontrado:', user);
                setUser(user);
            } else {
                console.log('⚠️ Nenhum usuário encontrado, redirecionando para login...');
                // Não redireciona automaticamente, permite acesso demo
                setUser({ 
                    full_name: 'Usuário Demo', 
                    email: 'demo@example.com',
                    id: 'demo-user-001'
                });
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            // Em caso de erro, permite continuar com usuário demo
            setUser({ 
                full_name: 'Usuário Demo', 
                email: 'demo@example.com',
                id: 'demo-user-001'
            });
        } finally {
            setLoading(false);
            console.log('✅ Carregamento de usuário concluído');
        }
    };

    const handleLogout = async () => {
        // Base44 removido - implementar logout
        navigate(createPageUrl('Welcome'));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-4"
                >
                    <Loader2 className="w-12 h-12 text-purple-600" />
                </motion.div>
                <motion.p 
                    className="text-gray-600 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Carregando sua jornada quântica...
                </motion.p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="hidden lg:block w-64 bg-white border-r border-gray-200">
                <SidebarContent user={user} onLogout={handleLogout} />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="lg:hidden bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900">5D Therapists</h1>
                        </div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-64">
                                <SidebarContent user={user} onLogout={handleLogout} />
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <ChatbotFloating />
        </div>
    );
}

