import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Base44 removido

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
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Base44 removido - implementar nova integração
            await new Promise(r => setTimeout(r, 1000));
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Em breve, integração de chatbot será implementada!' 
            }]);
        } catch (error) {
            console.error('Erro:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Desculpe, erro ao processar.' 
            }]);
        } finally {
            setIsLoading(false);
        }
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