import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageToGemini, isGeminiAvailable } from '@/api/gemini';

export default function ChatbotFloating() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && !conversationId) {
            initConversation();
        }
    }, [isOpen]);

    const initConversation = async () => {
        try {
            // Base44 removido - implementar nova integração
            setConversationId(null);
            setMessages([{
                role: 'assistant',
                content: '✨ Olá! Sou o Agente 5D. Como posso ajudar?'
            }]);
        } catch (error) {
            console.error('Erro:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMsg = inputMessage.trim();
        const userMsgLower = userMsg.toLowerCase();
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            let response;
            
            // Try to use Gemini AI if available
            if (isGeminiAvailable()) {
                try {
                    response = await sendMessageToGemini(userMsg);
                } catch (geminiError) {
                    console.error('Erro ao chamar Gemini, usando fallback:', geminiError);
                    // Fallback to keyword-based responses
                    response = getChatbotResponse(userMsgLower);
                }
            } else {
                // Use keyword-based responses as fallback
                response = getChatbotResponse(userMsgLower);
            }
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: response 
            }]);
        } catch (error) {
            console.error('Erro:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Desculpe, erro ao processar sua mensagem.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getChatbotResponse = (message) => {
        // Respostas baseadas em padrões de palavras-chave
        
        if (message.includes('ola') || message.includes('olá') || message.includes('oi') || message.includes('bom dia') || message.includes('boa tarde') || message.includes('boa noite')) {
            return 'Olá! Sou o Agente 5D, seu assistente quântico. Como posso ajudar você hoje? 💫';
        }
        
        if (message.includes('paciente') || message.includes('cadastrar') || message.includes('adicionar')) {
            return 'Para cadastrar um paciente:\n1. Vá em "Pacientes" no menu lateral\n2. Clique em "Novo Paciente"\n3. Preencha os dados\n4. Clique em "Cadastrar"\n\n💡 Dica: Mantenha os dados atualizados!';
        }
        
        if (message.includes('sessao') || message.includes('sessão')) {
            return 'Para criar uma sessão:\n1. Acesse o paciente desejado\n2. Clique em "Nova Sessão"\n3. Selecione as terapias aplicadas\n4. Adicione observações\n5. Salve\n\n✨ Cada sessão ajuda a construir o histórico quântico do paciente!';
        }
        
        if (message.includes('relatório') || message.includes('relatorio')) {
            return 'Para gerar relatórios:\n1. Vá em "Relatórios" no menu\n2. Selecione um paciente\n3. Aguarde a análise quântica\n4. Clique em "Gerar PDF"\n\n📊 Os relatórios incluem gráficos, tendências e análises profundas!';
        }
        
        if (message.includes('terapia') || message.includes('quântica')) {
            return 'As terapias quânticas são modalidades que trabalham com:\n• Energia sutil do corpo\n• Frequências vibracionais\n• Cristais, ervas e óleos\n• Meditação e visualização\n\n✨ Cada terapia tem sua energia específica!';
        }
        
        if (message.includes('ajuda') || message.includes('help')) {
            return 'Posso ajudar com:\n• Cadastro de pacientes\n• Criação de sessões\n• Geração de relatórios\n• Informações sobre terapias\n• Navegação no sistema\n\n💬 Pergunte o que precisar!';
        }
        
        if (message.includes('menu') || message.includes('navegação') || message.includes('navegacao')) {
            return 'Menu Principal:\n🏠 Dashboard - Visão geral\n👥 Pacientes - Gerenciar\n✨ Terapias - Catálogo\n📚 Base de Conhecimento\n📊 Relatórios - Análises\n👤 Minha Conta - Perfil\n\n💡 Clique nos itens do menu para navegar!';
        }
        
        if (message.includes('obrigado') || message.includes('obrigada') || message.includes('valeu') || message.includes('tchau')) {
            return 'De nada! Fico feliz em ajudar. Qualquer dúvida, só chamar! 🌟\n\nTenha uma jornada quântica maravilhosa! ✨';
        }
        
        // Resposta padrão
        return 'Entendi! Para melhor te ajudar, posso orientar sobre:\n• Cadastro de pacientes\n• Criação de sessões\n• Geração de relatórios\n• Terapias quânticas\n• Navegação no sistema\n\n💬 Como deseja prosseguir?';
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 shadow-2xl"
                            size="icon"
                        >
                            <Sparkles className="w-8 h-8 text-white" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-w-[calc(100vw-3rem)]"
                    >
                        <Card className="flex flex-col h-full bg-white shadow-2xl">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 text-white" />
                                    <h3 className="text-white font-bold">Agente 5D</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-white hover:bg-white/20"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                                msg.role === 'user'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white text-gray-800 shadow-md'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white rounded-2xl px-4 py-3 shadow-md">
                                            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white border-t">
                                <div className="flex gap-2">
                                    <Input
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Digite sua pergunta..."
                                        disabled={isLoading}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !inputMessage.trim()}
                                        className="bg-purple-600"
                                        size="icon"
                                    >
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}