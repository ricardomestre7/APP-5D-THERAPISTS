
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    BookOpen, Users, Sparkles, ClipboardList, BarChart3, Library, 
    Droplet, Gem, Leaf, MessageCircle, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle2, Info, Lightbulb, Play, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const SectionCard = ({ icon: Icon, title, children, color = "bg-purple-500" }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all mb-4">
            <CardHeader 
                className="cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl text-gray-800">{title}</CardTitle>
                    </div>
                    {isOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                </div>
            </CardHeader>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CardContent className="pt-0">
                            {children}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

const StepCard = ({ number, title, description }) => (
    <div className="flex gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {number}
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    </div>
);

const TipBox = ({ type = "info", title, children }) => {
    const configs = {
        info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", iconColor: "text-blue-600" },
        warning: { icon: AlertCircle, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", iconColor: "text-yellow-600" },
        success: { icon: CheckCircle2, bg: "bg-green-50", border: "border-green-200", text: "text-green-700", iconColor: "text-green-600" },
        tip: { icon: Lightbulb, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", iconColor: "text-purple-600" }
    };

    const config = configs[type];
    const IconComponent = config.icon;

    return (
        <div className={`${config.bg} border ${config.border} rounded-lg p-4 mb-4`}>
            <div className="flex gap-3">
                <IconComponent className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                    {title && <h5 className={`font-bold ${config.text} mb-2`}>{title}</h5>}
                    <div className={`text-sm ${config.text}`}>{children}</div>
                </div>
            </div>
        </div>
    );
};

export default function ManualTerapeuta() {
    return (
        <div>
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">Manual do Terapeuta</h1>
                        <p className="text-base text-gray-600 mt-1">Guia completo de utilização do APP 5D Therapists</p>
                    </div>
                </div>
            </header>

            {/* BEM-VINDO */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-8 border-0 shadow-2xl">
                <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-4">✨ Bem-vindo ao APP 5D Therapists!</h2>
                    <p className="text-lg mb-4">
                        Este é o sistema de gestão mais completo para terapeutas holísticos, quânticos e integradores.
                    </p>
                    <p className="text-white/90">
                        Desenvolvido com amor para facilitar seu trabalho de cura, permitindo que você foque no que realmente importa: 
                        <strong className="text-white"> o bem-estar dos seus pacientes</strong>.
                    </p>
                </CardContent>
            </Card>

            {/* 1. INTRODUÇÃO */}
            <SectionCard icon={Play} title="1. Introdução - Visão Geral do Sistema" color="bg-blue-500">
                <div className="space-y-4">
                    <p className="text-gray-700">
                        O <strong>APP 5D Therapists</strong> é uma plataforma integrada que oferece:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <Users className="w-8 h-8 text-blue-600 mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Gestão de Pacientes</h4>
                            <p className="text-sm text-gray-600">Cadastro completo, histórico e acompanhamento</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <Sparkles className="w-8 h-8 text-green-600 mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Catálogo de Terapias</h4>
                            <p className="text-sm text-gray-600">15+ terapias pré-configuradas</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <ClipboardList className="w-8 h-8 text-purple-600 mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Registro de Sessões</h4>
                            <p className="text-sm text-gray-600">Documentação estruturada e profissional</p>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-pink-600 mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Relatórios Quânticos</h4>
                            <p className="text-sm text-gray-600">Análises profundas com IA</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                            <Library className="w-8 h-8 text-orange-600 mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Bibliotecas</h4>
                            <p className="text-sm text-gray-600">Óleos, Cristais, Ervas - 45+ recursos</p>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-lg">
                            <MessageCircle className="w-8 h-8 text-indigo-600 mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Agente 5D (IA)</h4>
                            <p className="text-sm text-gray-600">Assistente especializado 24/7</p>
                        </div>
                    </div>

                    <TipBox type="tip" title="Dica Inicial">
                        Explore o sistema clicando em cada seção do menu. Não tenha medo de experimentar - todos os dados podem ser editados!
                    </TipBox>
                </div>
            </SectionCard>

            {/* 2. PRIMEIROS PASSOS */}
            <SectionCard icon={Settings} title="2. Primeiros Passos - Configurando Seu Perfil" color="bg-purple-500">
                <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                        Antes de começar a atender pacientes, configure seu perfil profissional:
                    </p>

                    <StepCard 
                        number="1"
                        title="Acesse 'Minha Conta'"
                        description="Clique no seu nome no rodapé do menu lateral esquerdo"
                    />

                    <StepCard 
                        number="2"
                        title="Complete Seu Perfil"
                        description="Adicione seu nome completo e uma foto profissional (clique no ícone da câmera)"
                    />

                    <StepCard 
                        number="3"
                        title="Configure Senha Forte"
                        description="Vá na aba 'Segurança' e defina uma senha segura (mínimo 8 caracteres)"
                    />

                    <TipBox type="success" title="Foto Profissional">
                        Uma foto de perfil profissional transmite confiança aos pacientes. Escolha uma imagem clara e acolhedora.
                    </TipBox>
                </div>
            </SectionCard>

            {/* 3. GESTÃO DE PACIENTES */}
            <SectionCard icon={Users} title="3. Gestão de Pacientes - Cadastro e Acompanhamento" color="bg-indigo-500">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">3.1 Cadastrando Novo Paciente</h3>
                    
                    <StepCard 
                        number="1"
                        title="Acesse 'Pacientes'"
                        description="Clique em 'Pacientes' no menu lateral"
                    />

                    <StepCard 
                        number="2"
                        title="Clique em 'Novo Paciente'"
                        description="Botão roxo no canto superior direito"
                    />

                    <StepCard 
                        number="3"
                        title="Preencha os Dados"
                        description="Nome é obrigatório. E-mail e telefone são recomendados para contato futuro"
                    />

                    <StepCard 
                        number="4"
                        title="Registre a Queixa Principal"
                        description="Anote a motivação/queixa inicial que trouxe o paciente até você. Isso será importante para avaliar evolução"
                    />

                    <TipBox type="warning" title="LGPD - Proteção de Dados">
                        Todos os dados dos pacientes são confidenciais e protegidos. Apenas você (terapeuta dono da conta) tem acesso.
                    </TipBox>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">3.2 Visualizando Detalhes do Paciente</h3>

                    <p className="text-gray-700 mb-3">Ao clicar em qualquer card de paciente, você terá acesso a:</p>

                    <ul className="space-y-2 ml-6">
                        <li className="flex gap-2 text-gray-700">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span><strong>Informações Pessoais:</strong> Nome, contato, data de nascimento</span>
                        </li>
                        <li className="flex gap-2 text-gray-700">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span><strong>Queixa Principal:</strong> Motivação inicial</span>
                        </li>
                        <li className="flex gap-2 text-gray-700">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span><strong>Histórico Completo:</strong> Todas as sessões realizadas</span>
                        </li>
                        <li className="flex gap-2 text-gray-700">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span><strong>Botões de Ação:</strong> Registrar nova sessão, convidar ao portal</span>
                        </li>
                    </ul>

                    <TipBox type="tip" title="Portal do Paciente">
                        Use o botão "Convidar ao Portal" para dar acesso ao paciente. Ele poderá acompanhar sua evolução online!
                    </TipBox>
                </div>
            </SectionCard>

            {/* 4. CONHECENDO AS TERAPIAS */}
            <SectionCard icon={Sparkles} title="4. Catálogo de Terapias - Conhecendo as Técnicas" color="bg-green-500">
                <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                        O sistema possui <strong>15+ terapias pré-configuradas</strong> com informações completas:
                    </p>

                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                        <h4 className="font-bold text-green-800 mb-2">📚 Cada Terapia Contém:</h4>
                        <ul className="space-y-1 text-sm text-green-700">
                            <li>✓ Descrição completa da técnica</li>
                            <li>✓ Campos e sistemas que avalia</li>
                            <li>✓ Benefícios comprovados</li>
                            <li>✓ Indicações e contraindicações</li>
                            <li>✓ Duração e frequência recomendada</li>
                            <li>✓ Materiais necessários</li>
                            <li>✓ Preparo do ambiente e paciente</li>
                            <li>✓ Técnica de aplicação passo a passo</li>
                            <li>✓ Formulário de avaliação estruturado</li>
                        </ul>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-3">4.1 Como Usar o Catálogo</h3>

                    <StepCard 
                        number="1"
                        title="Acesse 'Terapias'"
                        description="No menu lateral"
                    />

                    <StepCard 
                        number="2"
                        title="Explore as Terapias Disponíveis"
                        description="Role a página e leia as informações de preview de cada terapia"
                    />

                    <StepCard 
                        number="3"
                        title="Clique em 'Ver Detalhes Completos'"
                        description="Para acessar informações aprofundadas, incluindo técnica de aplicação completa"
                    />

                    <StepCard 
                        number="4"
                        title="Estude Antes de Aplicar"
                        description="Leia atentamente preparação, técnica e contraindicações antes de usar com pacientes"
                    />

                    <TipBox type="info" title="Terapias Incluídas">
                        Reiki, Xamanismo, Cristaloterapia, Aromaterapia, Mesa Quântica, Florais, Cromoterapia, Ayurveda, 
                        Acupuntura, Fitoterapia, Barras de Access, e muito mais!
                    </TipBox>

                    <TipBox type="tip" title="Quando Usar Cada Terapia">
                        Cada terapia possui uma seção "Indicações" que mostra os casos mais adequados. Use o Agente 5D para tirar dúvidas!
                    </TipBox>
                </div>
            </SectionCard>

            {/* 5. REGISTRANDO SESSÕES */}
            <SectionCard icon={ClipboardList} title="5. Registro de Sessões - Documentação Profissional" color="bg-pink-500">
                <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                        O registro estruturado de sessões é o <strong>coração do sistema</strong>. Aqui você documenta cada atendimento de forma profissional.
                    </p>

                    <h3 className="text-lg font-bold text-gray-800 mb-3">5.1 Como Registrar uma Sessão</h3>

                    <StepCard 
                        number="1"
                        title="Acesse a Ficha do Paciente"
                        description="Em 'Pacientes', clique no paciente desejado"
                    />

                    <StepCard 
                        number="2"
                        title="Clique em 'Registrar Nova Sessão'"
                        description="Botão verde no histórico do paciente"
                    />

                    <StepCard 
                        number="3"
                        title="Selecione a Terapia Aplicada"
                        description="Escolha qual terapia foi utilizada nesta sessão"
                    />

                    <StepCard 
                        number="4"
                        title="Defina Data e Hora"
                        description="Por padrão usa a data/hora atual, mas você pode alterar"
                    />

                    <StepCard 
                        number="5"
                        title="Preencha o Formulário Estruturado"
                        description="Cada terapia tem campos específicos. Preencha com atenção!"
                    />

                    <StepCard 
                        number="6"
                        title="Adicione Observações Gerais"
                        description="Campo livre para anotações importantes sobre a sessão"
                    />

                    <StepCard 
                        number="7"
                        title="Salve a Sessão"
                        description="Clique em 'Salvar Sessão' e pronto!"
                    />

                    <TipBox type="warning" title="IMPORTANTE - Escalas de 1 a 10">
                        A maioria dos campos usa escala de 1 a 10. Seja consistente na avaliação:
                        <ul className="mt-2 space-y-1 ml-4">
                            <li>• 1-3: Baixo/Ruim/Desequilibrado</li>
                            <li>• 4-6: Moderado/Regular</li>
                            <li>• 7-10: Alto/Bom/Equilibrado</li>
                        </ul>
                    </TipBox>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">5.2 Entendendo os Formulários</h3>

                    <p className="text-gray-700 mb-3">
                        Cada terapia possui um <strong>formulário único</strong> baseado nos campos que ela avalia:
                    </p>

                    <div className="bg-pink-50 p-4 rounded-lg">
                        <h5 className="font-bold text-pink-800 mb-2">Exemplo - Reiki Usui:</h5>
                        <ul className="space-y-1 text-sm text-pink-700">
                            <li>• Nível Energético Geral (1-10)</li>
                            <li>• Estado Emocional (1-10)</li>
                            <li>• Chakras (7 campos, 1-10 cada)</li>
                            <li>• Sensações Físicas Relatadas</li>
                            <li>• Visualizações ou Insights</li>
                        </ul>
                    </div>

                    <TipBox type="tip" title="Dica Profissional">
                        Quanto mais completo o preenchimento, melhor será a análise nos relatórios! Não pule campos.
                    </TipBox>
                </div>
            </SectionCard>

            {/* 6. RELATÓRIOS QUÂNTICOS */}
            <SectionCard icon={BarChart3} title="6. Relatórios Quânticos - Análise de Evolução com IA" color="bg-orange-500">
                <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                        Os <strong>Relatórios Quânticos</strong> são a funcionalidade mais poderosa do sistema. 
                        Usando Inteligência Artificial, o sistema analisa todas as sessões e gera insights profundos.
                    </p>

                    <h3 className="text-lg font-bold text-gray-800 mb-3">6.1 Gerando um Relatório</h3>

                    <StepCard 
                        number="1"
                        title="Acesse 'Relatórios'"
                        description="No menu lateral"
                    />

                    <StepCard 
                        number="2"
                        title="Selecione o Paciente"
                        description="Escolha qual paciente deseja analisar"
                    />

                    <StepCard 
                        number="3"
                        title="Clique em 'Gerar Análise Quântica'"
                        description="O sistema processará todas as sessões (pode levar 10-30 segundos)"
                    />

                    <StepCard 
                        number="4"
                        title="Explore a Análise"
                        description="Visualize gráficos, tendências e insights na tela"
                    />

                    <StepCard 
                        number="5"
                        title="Gere o PDF Completo"
                        description="Clique em 'Gerar PDF' para criar relatório profissional"
                    />

                    <StepCard 
                        number="6"
                        title="Envie por E-mail (opcional)"
                        description="Use o botão 'Enviar por E-mail' para compartilhar com o paciente"
                    />

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">6.2 O Que o Relatório Contém</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <h5 className="font-bold text-orange-800 mb-2">📊 Análises Quantitativas:</h5>
                            <ul className="space-y-1 text-sm text-orange-700">
                                <li>• Score Geral de Evolução (0-100)</li>
                                <li>• Velocidade de Melhoria</li>
                                <li>• Análise por Campo Energético</li>
                                <li>• Gráficos de Progressão</li>
                                <li>• Consistência e Estabilidade</li>
                            </ul>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h5 className="font-bold text-purple-800 mb-2">🔮 Análises Qualitativas:</h5>
                            <ul className="space-y-1 text-sm text-purple-700">
                                <li>• Tendências de Cada Campo</li>
                                <li>• Campos Críticos (atenção!)</li>
                                <li>• Previsão Próxima Sessão</li>
                                <li>• Eficácia por Terapia</li>
                                <li>• Recomendações Personalizadas</li>
                            </ul>
                        </div>
                    </div>

                    <TipBox type="success" title="PDF Profissional">
                        O PDF gerado tem 15-20 páginas com:
                        <ul className="mt-2 space-y-1">
                            <li>✓ Capa personalizada</li>
                            <li>✓ Gráficos coloridos</li>
                            <li>✓ Análise detalhada campo a campo</li>
                            <li>✓ Recomendações terapêuticas</li>
                            <li>✓ Rodapé profissional em todas as páginas</li>
                        </ul>
                    </TipBox>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">6.3 Interpretando os Resultados</h3>

                    <div className="space-y-3">
                        <div className="p-3 bg-green-50 border-l-4 border-green-500">
                            <strong className="text-green-800">Score 70-100:</strong>
                            <span className="text-green-700 ml-2">Excelente evolução! Manter ritmo.</span>
                        </div>
                        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500">
                            <strong className="text-yellow-800">Score 50-69:</strong>
                            <span className="text-yellow-700 ml-2">Boa evolução. Intensificar campos críticos.</span>
                        </div>
                        <div className="p-3 bg-red-50 border-l-4 border-red-500">
                            <strong className="text-red-800">Score 0-49:</strong>
                            <span className="text-red-700 ml-2">Necessita atenção. Revisar abordagem.</span>
                        </div>
                    </div>

                    <TipBox type="warning" title="Campos Críticos">
                        Se o relatório apontar "Campos Críticos", preste atenção especial! São áreas que precisam de intervenção urgente.
                    </TipBox>
                </div>
            </SectionCard>

            {/* 7. BIBLIOTECAS */}
            <SectionCard icon={Library} title="7. Bibliotecas - Recursos Terapêuticos" color="bg-teal-500">
                <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                        O sistema possui <strong>3 bibliotecas especializadas</strong> com 45+ recursos catalogados:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <Droplet className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                            <h4 className="font-bold text-gray-800">Óleos Essenciais</h4>
                            <p className="text-sm text-gray-600 mt-1">15 óleos completos</p>
                        </div>
                        <div className="bg-pink-50 p-4 rounded-lg text-center">
                            <Gem className="w-12 h-12 text-pink-600 mx-auto mb-2" />
                            <h4 className="font-bold text-gray-800">Cristais</h4>
                            <p className="text-sm text-gray-600 mt-1">15 cristais catalogados</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <Leaf className="w-12 h-12 text-green-600 mx-auto mb-2" />
                            <h4 className="font-bold text-gray-800">Ervas & Plantas</h4>
                            <p className="text-sm text-gray-600 mt-1">15 ervas medicinais</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-3">7.1 O Que Você Encontra</h3>

                    <div className="bg-teal-50 p-4 rounded-lg">
                        <h5 className="font-bold text-teal-800 mb-2">📚 Cada Recurso Contém:</h5>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-teal-700">
                            <li>✓ Nome popular e científico</li>
                            <li>✓ Propriedades terapêuticas</li>
                            <li>✓ Indicações de uso</li>
                            <li>✓ Contraindicações</li>
                            <li>✓ Chakras relacionados</li>
                            <li>✓ Frequência vibracional</li>
                            <li>✓ Sinergias (combina com)</li>
                            <li>✓ Curiosidades históricas</li>
                            <li>✓ Estudos científicos</li>
                            <li>✓ Formas de uso</li>
                        </ul>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">7.2 Como Usar as Bibliotecas</h3>

                    <StepCard 
                        number="1"
                        title="Escolha a Biblioteca"
                        description="Óleos, Cristais ou Ervas no menu lateral"
                    />

                    <StepCard 
                        number="2"
                        title="Use a Busca"
                        description="Digite nome, propriedade ou sistema do corpo"
                    />

                    <StepCard 
                        number="3"
                        title="Filtre por Categoria"
                        description="Óleos: por nota aromática / Cristais: por chakra / Ervas: por sistema"
                    />

                    <StepCard 
                        number="4"
                        title="Clique em 'Ver Detalhes Completos'"
                        description="Para acessar informações aprofundadas"
                    />

                    <TipBox type="tip" title="Uso Prático">
                        Use as bibliotecas para:
                        <ul className="mt-2 space-y-1">
                            <li>• Consultar antes de uma sessão</li>
                            <li>• Recomendar recursos aos pacientes</li>
                            <li>• Criar sinergias terapêuticas</li>
                            <li>• Estudar e aprofundar conhecimento</li>
                        </ul>
                    </TipBox>
                </div>
            </SectionCard>

            {/* 8. AGENTE 5D */}
            <SectionCard icon={MessageCircle} title="8. Agente 5D - Seu Assistente com IA" color="bg-indigo-500">
                <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                        O <strong>Agente 5D</strong> é um assistente com Inteligência Artificial especializado em terapias quânticas, 
                        disponível 24/7 através do botão flutuante roxo no canto inferior direito.
                    </p>

                    <div className="bg-indigo-50 p-6 rounded-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-indigo-900">Olá! Eu sou o Agente 5D ✨</h4>
                                <p className="text-indigo-700">Seu guia especializado em terapias quânticas</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-3">8.1 O Que o Agente 5D Pode Fazer</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h5 className="font-bold text-purple-800 mb-2">🔍 Consultas:</h5>
                            <ul className="space-y-1 text-sm text-purple-700">
                                <li>• Explicar qualquer terapia</li>
                                <li>• Tirar dúvidas sobre técnicas</li>
                                <li>• Comparar abordagens</li>
                                <li>• Sugerir protocolos</li>
                            </ul>
                        </div>
                        <div className="bg-pink-50 p-4 rounded-lg">
                            <h5 className="font-bold text-pink-800 mb-2">💡 Orientações:</h5>
                            <ul className="space-y-1 text-sm text-pink-700">
                                <li>• Quando usar cada terapia</li>
                                <li>• Contraindicações</li>
                                <li>• Sinergias terapêuticas</li>
                                <li>• Casos complexos</li>
                            </ul>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">8.2 Exemplos de Perguntas</h3>

                    <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                            <p className="text-gray-700"><strong>Você:</strong> "Qual terapia é melhor para ansiedade?"</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                            <p className="text-gray-700"><strong>Você:</strong> "Como combinar Reiki com Aromaterapia?"</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                            <p className="text-gray-700"><strong>Você:</strong> "Quais cristais usar para o chakra cardíaco?"</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                            <p className="text-gray-700"><strong>Você:</strong> "Contraindicações do óleo de hortelã?"</p>
                        </div>
                    </div>

                    <TipBox type="success" title="Acesso Direto ao Conhecimento">
                        O Agente 5D tem acesso a TODAS as terapias e bibliotecas do sistema! Pergunte o que quiser.
                    </TipBox>
                </div>
            </SectionCard>

            {/* 9. MELHORES PRÁTICAS */}
            <SectionCard icon={Lightbulb} title="9. Melhores Práticas e Dicas Profissionais" color="bg-yellow-500">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">9.1 Documentação</h3>
                    <ul className="space-y-2">
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Registre TODAS as sessões:</strong> Quanto mais dados, melhor a análise</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Seja consistente nas escalas:</strong> Use o mesmo critério sempre</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Use observações gerais:</strong> Anote insights importantes</span>
                        </li>
                    </ul>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">9.2 Relatórios</h3>
                    <ul className="space-y-2">
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Gere relatórios a cada 5-8 sessões:</strong> Frequência ideal para ver evolução</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Compartilhe com pacientes:</strong> Mostra profissionalismo e evolução</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Use para ajustar abordagem:</strong> Se um campo não melhora, mude a estratégia</span>
                        </li>
                    </ul>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">9.3 Comunicação com Pacientes</h3>
                    <ul className="space-y-2">
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Convide ao Portal:</strong> Pacientes engajados evoluem mais rápido</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Envie relatórios por e-mail:</strong> Reforça a jornada de cura</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700"><strong>Explique os resultados:</strong> Paciente informado = paciente motivado</span>
                        </li>
                    </ul>

                    <TipBox type="tip" title="Profissionalismo">
                        O uso consistente do sistema transmite profissionalismo e seriedade no trabalho terapêutico!
                    </TipBox>
                </div>
            </SectionCard>

            {/* 10. FAQ */}
            <SectionCard icon={AlertCircle} title="10. Perguntas Frequentes (FAQ)" color="bg-red-500">
                <div className="space-y-4">
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">Como adiciono outro terapeuta ao sistema?</h5>
                        <p className="text-sm text-gray-600">
                            Cada terapeuta deve criar sua própria conta usando o e-mail dele. O sistema é individual por terapeuta.
                        </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">Posso deletar uma sessão por engano?</h5>
                        <p className="text-sm text-gray-600">
                            Atualmente não há opção de deletar sessões pela interface (proteção de dados). Entre em contato com suporte se necessário.
                        </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">Os dados são seguros?</h5>
                        <p className="text-sm text-gray-600">
                            Sim! Todos os dados são criptografados e protegidos. Apenas você tem acesso aos seus pacientes.
                        </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">Posso usar em celular?</h5>
                        <p className="text-sm text-gray-600">
                            Sim! O sistema é 100% responsivo. Funciona perfeitamente em smartphones e tablets.
                        </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">Quantos pacientes posso cadastrar?</h5>
                        <p className="text-sm text-gray-600">
                            Ilimitados! Não há limite de pacientes ou sessões.
                        </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">O Agente 5D responde em português?</h5>
                        <p className="text-sm text-gray-600">
                            Sim! O Agente 5D responde em português brasileiro, de forma acolhedora e especializada.
                        </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">Posso adicionar minhas próprias terapias?</h5>
                        <p className="text-sm text-gray-600">
                            As terapias atuais são fixas e completas. Para adicionar terapias personalizadas, entre em contato com o suporte.
                        </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <h5 className="font-bold text-gray-800 mb-1">As terapias substituem tratamentos médicos?</h5>
                        <p className="text-sm text-gray-600">
                            Este é um sistema de Terapias Integrativas Quânticas, focado na expansão da consciência, equilíbrio energético e cura holística através de práticas ancestrais e quânticas. As terapias trabalham nos planos físico, emocional, mental, espiritual e anímico do ser.
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* SUPORTE */}
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-2xl">
                <CardContent className="p-8 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-3">Precisa de Ajuda?</h2>
                    <p className="mb-4">
                        Use o <strong>Agente 5D</strong> (botão flutuante roxo) para tirar dúvidas a qualquer momento!
                    </p>
                    <p className="text-blue-100">
                        Ele tem acesso a todo este manual e pode te orientar passo a passo.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
