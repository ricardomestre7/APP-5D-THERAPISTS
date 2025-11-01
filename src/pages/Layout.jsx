

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Users, BarChart3, Library, Sparkles, Loader2, LogOut, Menu, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ChatbotFloating from '@/components/ChatbotFloating';
import { motion } from 'framer-motion';
import { User } from '@/api/entities';
import { onAuthChange, logout as firebaseLogout } from '@/api/firebaseAuth';

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
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">5D Therapists</h1>
                    <p className="text-sm md:text-base text-gray-500">Terapias Quânticas</p>
                </div>
            </div>

            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === createPageUrl(item.page);
                    
                    return (
                        <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            className={`flex items-center gap-4 px-5 py-4 rounded-lg transition-all ${
                                isActive
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className={`w-6 h-6 md:w-7 md:h-7 ${isActive ? item.color : 'text-gray-400'}`} />
                            <span className="font-medium text-base md:text-lg">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-gray-200">
                <Link
                    to={createPageUrl('MinhaConta')}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Avatar className="h-14 w-14 md:h-16 md:w-16">
                        <AvatarImage src={user?.profile_picture_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg md:text-xl font-bold">
                            {getInitials(user?.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-base md:text-lg font-semibold text-gray-900 truncate">
                            {user?.full_name || 'Usuário'}
                        </p>
                        <p className="text-sm md:text-base text-gray-500 truncate">{user?.email}</p>
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
    const redirectCountRef = useRef(0);
    const maxRedirects = 2;

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            console.log('🔄 Carregando usuário no Layout...');
            
            // Prevenir loop infinito
            if (redirectCountRef.current >= maxRedirects) {
                console.error('🛑 Loop infinito detectado, parando redirecionamentos');
                setLoading(false);
                alert('Erro de configuração: Configure as regras do Firestore no Firebase Console. Veja CONFIGURAR_FIRESTORE_RULES.md');
                return;
            }
            
            // Verificar autenticação Firebase
            const unsubscribe = onAuthChange(async (firebaseUser) => {
                if (!firebaseUser) {
                    console.log('⚠️ Nenhum usuário autenticado, redirecionando para login...');
                    redirectCountRef.current = 0; // Reset ao redirecionar para Welcome
                    navigate(createPageUrl('Welcome'));
                    return;
                }
                
                try {
                    // Buscar perfil de terapeuta
                    const terapeutaProfile = await User.me();
                    if (terapeutaProfile) {
                        console.log('👤 Terapeuta encontrado:', terapeutaProfile);
                        setUser(terapeutaProfile);
                        redirectCountRef.current = 0; // Reset em caso de sucesso
                    } else {
                        console.log('⚠️ Perfil não encontrado, redirecionando...');
                        redirectCountRef.current++;
                        if (redirectCountRef.current < maxRedirects) {
                            navigate(createPageUrl('Welcome'));
                        }
                    }
                } catch (error) {
                    console.error('❌ Erro ao carregar perfil:', error);
                    redirectCountRef.current++;
                    
                    // Se for erro de permissão, mostrar mensagem clara
                    if (error.message?.includes('permissions') || error.code === 'permission-denied') {
                        console.error('🔐 ERRO DE PERMISSÃO: Configure as regras do Firestore!');
                        alert('❌ Erro de Permissões!\n\nConfigure as regras do Firestore no Firebase Console.\n\nVeja o arquivo: CONFIGURAR_FIRESTORE_RULES.md\n\nO loop será interrompido agora.');
                        redirectCountRef.current = maxRedirects; // Parar loop
                    } else if (redirectCountRef.current < maxRedirects) {
                        navigate(createPageUrl('Welcome'));
                    }
                } finally {
                    setLoading(false);
                }
            });
            
            // Retornar função de limpeza
            return () => unsubscribe();
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            redirectCountRef.current++;
            if (redirectCountRef.current < maxRedirects) {
                navigate(createPageUrl('Welcome'));
            }
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await firebaseLogout();
            localStorage.removeItem('5d_user_profile'); // Limpar localStorage também
            console.log('✅ Logout realizado com sucesso');
            navigate(createPageUrl('Welcome'));
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
            // Redirecionar mesmo com erro
            localStorage.removeItem('5d_user_profile');
            navigate(createPageUrl('Welcome'));
        }
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
            <aside className="hidden lg:block w-72 md:w-80 bg-white border-r border-gray-200">
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

                <main className="flex-1 overflow-y-auto p-8 md:p-10">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                <footer className="flex-shrink-0 bg-white py-6 px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            App 5D Theraphists
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                            criado e desenvolvido para o desenvolvimento das praticas integrativas holisticas terapêuticas
                        </p>
                        <p className="text-xs text-gray-400">
                            @2025 Direitos reservados - Mestre Ricardo
                        </p>
                    </div>
                </footer>
            </div>

            <ChatbotFloating />
        </div>
    );
}

