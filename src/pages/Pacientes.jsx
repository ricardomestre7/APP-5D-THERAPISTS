
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Paciente } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, User, Mail, Phone, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PacienteForm from '../components/PacienteForm';
import { User as UserEntity } from '@/api/entities'; // Importar User e renomeá-lo para evitar conflito com o ícone

const QuantumCard = ({ children, className, ...props }) => (
    <Card
        className={`bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
        {...props}
    >
        {children}
    </Card>
);

export default function PacientesPage() {
    const [pacientes, setPacientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPaciente, setEditingPaciente] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // Estado para armazenar o usuário atual

    const fetchPacientes = async (user) => {
        if (!user || !user.id) { // Se não houver usuário, não busca pacientes
            console.log('⚠️ Nenhum usuário fornecido, limpando lista de pacientes');
            setIsLoading(false);
            setPacientes([]);
            return;
        }
        
        console.log('🔍 Buscando pacientes para o terapeuta:', user.id);
        console.log('👤 Dados do terapeuta:', user);
        
        setIsLoading(true);
        try {
            // Filtrar pacientes por terapeuta_id
            const listaPacientes = await Paciente.filter({ terapeuta_id: user.id }, '-created_date');
            console.log('✅ Pacientes encontrados:', listaPacientes.length);
            if (listaPacientes.length > 0) {
                console.log('📋 Primeiro paciente:', listaPacientes[0]);
            } else {
                console.log('ℹ️ Nenhum paciente cadastrado ainda. Isso é normal para um novo terapeuta.');
            }
            setPacientes(listaPacientes);
        } catch (error) {
            console.error('❌ Erro ao buscar pacientes:', error);
            console.error('📋 Detalhes do erro:', {
                code: error.code,
                message: error.message,
                terapeuta_id: user?.id
            });
            setPacientes([]);
            
            // Só mostrar alert para erros de permissão (erro real)
            // Não mostrar para lista vazia ou outros erros menores
            if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Missing or insufficient')) {
                const mensagemErro = '❌ Erro de Permissões no Firestore!\n\n' +
                    '📋 Ação necessária:\n' +
                    '1. Abra o Firebase Console\n' +
                    '2. Vá em Firestore Database → Rules\n' +
                    '3. Cole as regras do arquivo: REGRAS_FIRESTORE_COMPLETAS.txt\n' +
                    '4. Clique em "Publicar"\n' +
                    '5. Recarregue esta página\n\n' +
                    'Ou siga as instruções em: CONFIGURAR_FIRESTORE_RULES.md';
                
                alert(mensagemErro);
            } else {
                // Para outros erros, logar mas não incomodar o usuário com alert
                // a menos que seja um erro crítico
                console.warn('⚠️ Erro ao buscar pacientes (não crítico):', error);
            }
        } finally {
            // Forçar o loading para false após um tempo
            setTimeout(() => {
                setIsLoading(false);
            }, 100);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                console.log('🔄 Carregando dados iniciais...');
                const user = await UserEntity.me(); // Obter informações do usuário logado
                console.log('👤 Usuário carregado:', user);
                setCurrentUser(user);
                fetchPacientes(user); // Chamar fetchPacientes com o usuário atual
            } catch (error) {
                console.error('❌ Erro ao carregar dados iniciais:', error);
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []); // Executa apenas uma vez ao montar o componente

    const handleAddPaciente = () => {
        setEditingPaciente(null); // Clear any existing patient data for a new entry
        setIsFormOpen(true); // Open the form
    };

    const handleEditPaciente = (paciente, e) => {
        // Prevent event propagation to the Link component when clicking the edit button
        e.stopPropagation();
        e.preventDefault();
        setEditingPaciente(paciente); // Set the patient to be edited
        setIsFormOpen(true); // Open the form
    };

    const handleSavePaciente = async (data) => {
        if (!currentUser || !currentUser.id) {
            console.error("❌ Erro: Usuário atual não encontrado ou sem ID.");
            alert('❌ Erro: Você precisa estar logado para adicionar pacientes.\n\nFaça logout e login novamente.');
            return;
        }

        console.log('💾 Salvando paciente para terapeuta:', currentUser.id);
        console.log('📋 Dados do terapeuta atual:', currentUser);
        console.log('📝 Dados do formulário:', data);

        try {
            if (editingPaciente) {
                // Se estiver editando, mantenha o terapeuta_id original
                console.log('✏️ Editando paciente existente:', editingPaciente.id);
                console.log('🔗 Mantendo terapeuta_id:', editingPaciente.terapeuta_id);
                await Paciente.update(editingPaciente.id, { ...data, terapeuta_id: editingPaciente.terapeuta_id });
                console.log('✅ Paciente atualizado com sucesso');
                alert(`✅ Paciente "${data.nome}" atualizado com sucesso!`);
            } else {
                // Se for novo, associe ao terapeuta atual
                const dataToSave = { ...data, terapeuta_id: currentUser.id };
                console.log('➕ Criando novo paciente associado ao terapeuta:', currentUser.id);
                console.log('📦 Dados completos a serem salvos:', {
                    nome: dataToSave.nome,
                    email: dataToSave.email,
                    terapeuta_id: dataToSave.terapeuta_id,
                    ...dataToSave
                });
                
                // Validar terapeuta_id antes de criar
                if (!dataToSave.terapeuta_id) {
                    throw new Error('Terapeuta ID não encontrado. Faça login novamente.');
                }
                
                console.log('🔄 Chamando Paciente.create...');
                const createdPaciente = await Paciente.create(dataToSave);
                console.log('✅ Paciente criado com sucesso:', createdPaciente);
                console.log('🔗 Conexão terapeuta-paciente estabelecida:', {
                    terapeuta_id: currentUser.id,
                    paciente_id: createdPaciente.id,
                    paciente_nome: createdPaciente.nome
                });
                alert(`✅ Paciente "${data.nome}" cadastrado com sucesso!`);
            }
            
            setIsFormOpen(false); // Close the form after saving
            console.log('🔄 Atualizando lista de pacientes...');
            await fetchPacientes(currentUser); // Refresh the list of patients, passando o usuário atual
            console.log('✅ Lista de pacientes atualizada');
        } catch (error) {
            console.error('❌ Erro ao salvar paciente:', error);
            console.error('📋 Detalhes do erro:', {
                code: error.code,
                message: error.message,
                terapeuta_id: currentUser?.id,
                stack: error.stack
            });
            
            // Mensagens de erro mais específicas
            let mensagemErro = 'Erro ao salvar paciente. Tente novamente.';
            
            if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Missing or insufficient')) {
                mensagemErro = '❌ Erro de Permissões no Firestore!\n\n' +
                    '📋 Ação necessária:\n' +
                    '1. Abra o Firebase Console\n' +
                    '2. Vá em Firestore Database → Rules\n' +
                    '3. Cole as regras do arquivo: REGRAS_FIRESTORE_COMPLETAS.txt\n' +
                    '4. Clique em "Publicar"\n' +
                    '5. Recarregue esta página\n\n' +
                    'Ou siga as instruções em: CONFIGURAR_FIRESTORE_RULES.md';
            } else if (error.message?.includes('terapeuta_id') || !currentUser?.id) {
                mensagemErro = '❌ Erro: Terapeuta não identificado.\n\nFaça logout e login novamente.';
            } else if (error.message) {
                mensagemErro = `❌ Erro: ${error.message}`;
            }
            
            alert(mensagemErro);
            // Não fechar o formulário em caso de erro para permitir corrigir
            throw error; // Re-lançar para o formulário saber que houve erro
        }
    };

    const handleDeletePaciente = async (pacienteId) => {
        if (!currentUser) {
            console.error("Erro: Usuário atual não encontrado.");
            return;
        }

        try {
            await Paciente.delete(pacienteId);
            console.log('✅ Paciente deletado com sucesso');
            fetchPacientes(currentUser); // Refresh the list of patients
        } catch (error) {
            console.error('Erro ao deletar paciente:', error);
            throw error;
        }
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Pacientes</h1>
                    <p className="text-base text-gray-600">Gerencie seus pacientes e seus históricos.</p>
                </div>
                <Button onClick={handleAddPaciente} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Novo Paciente
                </Button>
            </header>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.p
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-gray-600"
                    >
                        Carregando pacientes...
                    </motion.p>
                ) : pacientes.length === 0 ? (
                    <motion.div
                        key="no-patients"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <QuantumCard className="border-dashed border-2 border-gray-300 text-center py-12">
                            <CardContent>
                                <h3 className="text-xl font-semibold text-gray-800">Nenhum paciente encontrado</h3>
                                <p className="text-gray-600 mt-2">Clique em "Novo Paciente" para começar a adicionar.</p>
                            </CardContent>
                        </QuantumCard>
                    </motion.div>
                ) : (
                    <motion.div
                        key="patient-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {pacientes.map((paciente) => (
                                <motion.div
                                    key={paciente.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                >
                                    {/* Link to patient details page */}
                                    <Link 
                                        to={createPageUrl(`DetalhesPaciente?id=${paciente.id}`)}
                                        onClick={() => {
                                            console.log('🔗 Navegando para detalhes do paciente:', {
                                                pacienteId: paciente.id,
                                                pacienteNome: paciente.nome,
                                                url: createPageUrl(`DetalhesPaciente?id=${paciente.id}`)
                                            });
                                        }}
                                    >
                                        <QuantumCard>
                                            <CardHeader className="flex flex-row justify-between items-start">
                                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                                    <User className="text-purple-600" />
                                                    {paciente.nome}
                                                </CardTitle>
                                                {/* Edit button */}
                                                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-gray-100 text-gray-500 hover:text-purple-600" onClick={(e) => handleEditPaciente(paciente, e)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail className="w-4 h-4" />
                                                    <span>{paciente.email || 'Não informado'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{paciente.telefone || 'Não informado'}</span>
                                                </div>
                                            </CardContent>
                                        </QuantumCard>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Paciente Form Modal */}
            <PacienteForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                paciente={editingPaciente} // Pass the patient data if editing
                onSave={handleSavePaciente} // Callback for saving/updating
                onDelete={handleDeletePaciente} // Callback for deleting
            />
        </div>
    );
}
