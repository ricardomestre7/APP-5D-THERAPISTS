import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { loginWithGoogle } from '@/api/firebaseAuth';
import { User } from '@/api/entities';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Zap, Heart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { onAuthChange, getCurrentUser } from '@/api/firebaseAuth';

export default function WelcomePage() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    // Verificar se já está autenticado (com proteção contra loop)
    const hasRedirectedRef = useRef(false);
    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser && !hasRedirectedRef.current) {
                console.log('👤 Usuário já autenticado, verificando perfil...');
                hasRedirectedRef.current = true;
                try {
                    const terapeutaProfile = await User.me();
                    if (terapeutaProfile) {
                        console.log('✅ Perfil encontrado, redirecionando...');
                        navigate('/Dashboard');
                    } else {
                        console.log('⚠️ Perfil não encontrado (provavelmente erro de permissões)');
                        hasRedirectedRef.current = false; // Permitir tentar novamente
                    }
                } catch (error) {
                    console.error('❌ Erro ao verificar perfil:', error);
                    hasRedirectedRef.current = false; // Permitir tentar novamente
                    if (error.message?.includes('permissions') || error.code === 'permission-denied') {
                        alert('❌ Configure as regras do Firestore!\n\nVeja: CONFIGURAR_FIRESTORE_RULES.md');
                    }
                }
            } else if (!firebaseUser) {
                hasRedirectedRef.current = false; // Reset quando deslogar
            }
        });
        return unsubscribe;
    }, [navigate]);
    
    const handleLogin = async () => {
        setIsLoading(true);
        try {
            console.log('🔄 Iniciando login com Google...');
            
            // Fazer login com Google via Firebase
            const firebaseUser = await loginWithGoogle();
            console.log('✅ Login Firebase bem-sucedido:', firebaseUser);
            
            // Criar/buscar perfil de terapeuta (isso é feito automaticamente em User.me())
            const terapeutaProfile = await User.me();
            console.log('✅ Perfil de terapeuta:', terapeutaProfile);
            
            toast.success("Bem-vindo(a) ao APP 5D!", {
                description: `${terapeutaProfile?.full_name || 'Terapeuta'}, sua jornada quântica está prestes a começar.`,
                duration: 3000,
            });
            
            // Pequeno delay para a animação do toast
            setTimeout(() => {
                navigate('/Dashboard');
            }, 500);
        } catch (error) {
            console.error("❌ Login failed", error);
            toast.error("Erro ao fazer login", {
                description: error.message || "Por favor, tente novamente.",
            });
            setIsLoading(false);
        }
    };

    const features = [
        { icon: Shield, text: "Seguro e Confiável" },
        { icon: Zap, text: "Instantâneo" },
        { icon: Heart, text: "Compassivo" }
    ];

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-4 overflow-hidden relative"
            style={{
                backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(91, 33, 182, 0.8) 50%, rgba(67, 56, 202, 0.8) 100%)',
            }}
        >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            <motion.div 
                className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-purple-300/30 rounded-2xl p-8 text-center shadow-2xl shadow-purple-500/20 relative z-10"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center">
                        <motion.div 
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
                            animate={{ 
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ 
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <span className="text-4xl font-bold text-white">5D</span>
                        </motion.div>
                        <motion.div
                            className="absolute -top-2 -right-2"
                            animate={{ 
                                rotate: 360,
                            }}
                            transition={{ 
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <Sparkles className="w-8 h-8 text-yellow-300" />
                        </motion.div>
                    </div>
                </motion.div>
                
                <motion.h1 
                    className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    APP 5D Therapists
                </motion.h1>
                
                <motion.p 
                    className="text-blue-100 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    Plataforma Quântica de Terapias Integrativas
                </motion.p>

                <motion.p 
                    className="text-blue-100/80 text-sm mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    Gestão completa para terapeutas holísticos
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <Button 
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full h-14 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5 mr-2" />
                                Entrar ou Cadastrar-se com Google
                            </>
                        )}
                    </Button>
                </motion.div>

                <motion.div 
                    className="flex justify-center gap-6 mt-6 pt-6 border-t border-white/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                >
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="flex flex-col items-center gap-2">
                                <Icon className="w-5 h-5 text-blue-200" />
                                <span className="text-xs text-blue-100/70">{feature.text}</span>
                            </div>
                        );
                    })}
                </motion.div>

            </motion.div>

            {/* Rodapé */}
            <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <p className="text-lg font-semibold text-white/80 mb-2">
                        App 5D Theraphists
                    </p>
                    <p className="text-sm text-blue-100/70 mb-2">
                        criado e desenvolvido para o desenvolvimento das praticas integrativas holisticas terapêuticas
                    </p>
                    <p className="text-xs text-blue-200/50">
                        @2025 Direitos reservados - Mestre Ricardo
                    </p>
                </motion.div>
            </footer>
        </div>
    );
}