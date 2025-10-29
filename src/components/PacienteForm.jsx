import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function PacienteForm({ open, onOpenChange, paciente, onSave, onDelete }) {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        genero: '',
        endereco: {
            rua: '',
            cidade: '',
            estado: '',
            cep: ''
        },
        queixa_principal: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            if (paciente) {
                setFormData({
                    nome: paciente.nome || '',
                    email: paciente.email || '',
                    telefone: paciente.telefone || '',
                    data_nascimento: paciente.data_nascimento || '',
                    genero: paciente.genero || '',
                    endereco: paciente.endereco || {
                        rua: '',
                        cidade: '',
                        estado: '',
                        cep: ''
                    },
                    queixa_principal: paciente.queixa_principal || ''
                });
            } else {
                setFormData({
                    nome: '',
                    email: '',
                    telefone: '',
                    data_nascimento: '',
                    genero: '',
                    endereco: {
                        rua: '',
                        cidade: '',
                        estado: '',
                        cep: ''
                    },
                    queixa_principal: ''
                });
            }
            setErrors({});
        }
    }, [paciente, open]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nome?.trim()) {
            newErrors.nome = 'Nome é obrigatório';
        }
        
        if (!formData.email?.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        
        if (!formData.data_nascimento) {
            newErrors.data_nascimento = 'Data de nascimento é obrigatória';
        }
        
        if (!formData.genero) {
            newErrors.genero = 'Gênero é obrigatório';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSaving(true);
        try {
            console.log('📝 Formulário sendo enviado com dados:', formData);
            await onSave(formData);
            console.log('✅ Formulário salvo com sucesso, fechando...');
            // Só fecha se não houver erro
            onOpenChange(false);
        } catch (error) {
            console.error('❌ Erro ao salvar paciente no formulário:', error);
            console.error('📋 Detalhes do erro no formulário:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            // Não mostrar alert aqui - o handleSavePaciente já mostra
            // Manter formulário aberto para permitir correção
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Limpar erro do campo quando usuário digitar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleEnderecoChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            endereco: {
                ...prev.endereco,
                [field]: value
            }
        }));
    };

    const handleDelete = async () => {
        if (!onDelete || !paciente) return;
        
        setIsDeleting(true);
        try {
            await onDelete(paciente.id);
            setShowDeleteDialog(false);
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao deletar paciente:', error);
            alert('Erro ao deletar paciente. Tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white text-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                        {paciente ? 'Editar Paciente' : 'Novo Paciente'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {paciente ? 'Edite as informações do paciente' : 'Preencha os dados para cadastrar um novo paciente'}
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dados Pessoais</h3>
                        
                        <div>
                            <Label className="text-gray-700">
                                Nome Completo <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.nome}
                                onChange={(e) => handleChange('nome', e.target.value)}
                                className={`mt-1 bg-white border-gray-300 ${errors.nome ? 'border-red-500' : ''}`}
                                placeholder="Digite o nome completo"
                            />
                            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-700">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={`mt-1 bg-white border-gray-300 ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="email@exemplo.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <Label className="text-gray-700">Telefone</Label>
                                <Input
                                    value={formData.telefone}
                                    onChange={(e) => handleChange('telefone', e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="mt-1 bg-white border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-700">
                                    Data de Nascimento <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.data_nascimento}
                                    onChange={(e) => handleChange('data_nascimento', e.target.value)}
                                    className={`mt-1 bg-white border-gray-300 ${errors.data_nascimento ? 'border-red-500' : ''}`}
                                />
                                {errors.data_nascimento && <p className="text-red-500 text-xs mt-1">{errors.data_nascimento}</p>}
                            </div>
                            <div>
                                <Label className="text-gray-700">
                                    Gênero <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.genero}
                                    onValueChange={(value) => handleChange('genero', value)}
                                >
                                    <SelectTrigger className={`mt-1 bg-white border-gray-300 ${errors.genero ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Selecione o gênero..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-[9999]">
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Feminino">Feminino</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                        <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.genero && <p className="text-red-500 text-xs mt-1">{errors.genero}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Endereço (Opcional)</h3>
                        
                        <div>
                            <Label className="text-gray-700">Rua/Avenida</Label>
                            <Input
                                value={formData.endereco.rua}
                                onChange={(e) => handleEnderecoChange('rua', e.target.value)}
                                className="mt-1 bg-white border-gray-300"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-gray-700">Cidade</Label>
                                <Input
                                    value={formData.endereco.cidade}
                                    onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                                    className="mt-1 bg-white border-gray-300"
                                />
                            </div>
                            <div>
                                <Label className="text-gray-700">Estado</Label>
                                <Input
                                    value={formData.endereco.estado}
                                    onChange={(e) => handleEnderecoChange('estado', e.target.value)}
                                    placeholder="UF"
                                    maxLength={2}
                                    className="mt-1 bg-white border-gray-300"
                                />
                            </div>
                            <div>
                                <Label className="text-gray-700">CEP</Label>
                                <Input
                                    value={formData.endereco.cep}
                                    onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                                    placeholder="00000-000"
                                    className="mt-1 bg-white border-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Queixa Principal */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações Terapêuticas</h3>
                        
                        <div>
                            <Label className="text-gray-700">Queixa Principal / Intenção</Label>
                            <Textarea
                                value={formData.queixa_principal}
                                onChange={(e) => handleChange('queixa_principal', e.target.value)}
                                placeholder="Descreva a queixa ou intenção principal do paciente ao buscar as terapias quânticas..."
                                className="mt-1 bg-white border-gray-300 h-32"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between pt-4">
                        {/* Botão de Excluir (apenas quando editando) */}
                        {paciente && onDelete && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={isSaving || isDeleting}
                                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Paciente
                            </Button>
                        )}
                        
                        {/* Botões à direita */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving || isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving || isDeleting}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" /> {paciente ? 'Atualizar' : 'Cadastrar'}</>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-red-600">
                            <AlertCircle className="w-6 h-6" />
                            Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                            Tem certeza que deseja excluir o paciente <strong>{paciente?.nome}</strong>?
                            <br /><br />
                            Esta ação não pode ser desfeita. Todos os dados do paciente, incluindo histórico de sessões, serão permanentemente removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Excluindo...</>
                            ) : (
                                <><Trash2 className="w-4 h-4 mr-2" /> Excluir</>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}