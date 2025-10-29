
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
// Base44 removido
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, Loader2, Camera, Lock, Eye, EyeOff, CheckCircle2, GraduationCap, Award, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const QuantumCard = ({ children, className, ...props }) => (
    <Card 
        className={`bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 text-gray-800 ${className}`}
        {...props}
    >
        {children}
    </Card>
);

export default function MinhaContaPage() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({ 
        fullName: '', 
        profilePictureUrl: '',
        especialidade: '',
        registro: '',
        formacao: '',
        bio: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [newImageFile, setNewImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Estado para troca de senha
    const [senhaData, setSenhaData] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    });
    const [showSenhas, setShowSenhas] = useState({
        atual: false,
        nova: false,
        confirmar: false
    });
    const [isSavingSenha, setIsSavingSenha] = useState(false);
    const [senhaMessage, setSenhaMessage] = useState({ type: '', text: '' });
    
    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await User.me();
            setUser(currentUser);
            setFormData({
                fullName: currentUser.full_name || '',
                profilePictureUrl: currentUser.profile_picture_url || '',
                especialidade: currentUser.especialidade || '',
                registro: currentUser.registro || '',
                formacao: currentUser.formacao || '',
                bio: currentUser.bio || ''
            });
        };
        loadUser();
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, profilePictureUrl: event.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        let updatedData = { 
            full_name: formData.fullName,
            especialidade: formData.especialidade,
            registro: formData.registro,
            formacao: formData.formacao,
            bio: formData.bio
        };

        if (newImageFile) {
            setIsUploading(true);
            try {
                // Simular upload de imagem (data URL já está em formData.profilePictureUrl)
                console.log('📤 Upload de foto (demo):', newImageFile.name);
                updatedData.profile_picture_url = formData.profilePictureUrl;
            } catch (error) {
                console.error("Erro no upload da imagem:", error);
                setIsSaving(false);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        try {
            // Salvar perfil atualizado
            await User.updateMe(updatedData);
            
            // Recarregar dados do usuário
            const updatedUser = await User.me();
            setUser(updatedUser);
            setFormData({
                fullName: updatedUser.full_name || '',
                profilePictureUrl: updatedUser.profile_picture_url || formData.profilePictureUrl,
                especialidade: updatedUser.especialidade || '',
                registro: updatedUser.registro || '',
                formacao: updatedUser.formacao || '',
                bio: updatedUser.bio || ''
            });
            setNewImageFile(null);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSenhaChange = (e) => {
        setSenhaData({ ...senhaData, [e.target.id]: e.target.value });
        setSenhaMessage({ type: '', text: '' });
    };

    const handleSalvarSenha = async () => {
        setSenhaMessage({ type: '', text: '' });

        // Validações
        if (!senhaData.senhaAtual || !senhaData.novaSenha || !senhaData.confirmarSenha) {
            setSenhaMessage({ type: 'error', text: 'Todos os campos são obrigatórios.' });
            return;
        }

        if (senhaData.novaSenha !== senhaData.confirmarSenha) {
            setSenhaMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
            return;
        }

        if (senhaData.novaSenha.length < 8) {
            setSenhaMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 8 caracteres.' });
            return;
        }

        setIsSavingSenha(true);

        try {
            // Base44 removido - implementar nova integração
            console.log('🔑 Senha atualizada (demo)');
            await new Promise(r => setTimeout(r, 1000)); // Simular atualização

            setSenhaMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
        } catch (error) {
            setSenhaMessage({ 
                type: 'error', 
                text: error.message || 'Erro ao alterar senha. Verifique se a senha atual está correta.' 
            });
        } finally {
            setIsSavingSenha(false);
        }
    };
    
    if (!user) {
        return (
            <div className="flex items-center justify-center h-96 bg-white">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            </div>
        );
    }

    const getInitials = (name) => {
        if (!name) return '??';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-white min-h-screen">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Minha Conta</h1>
                <p className="text-base text-gray-600">Gerencie suas informações de perfil e segurança.</p>
            </header>

            <Tabs defaultValue="perfil" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                    <TabsTrigger value="perfil" className="font-semibold">Perfil</TabsTrigger>
                    <TabsTrigger value="seguranca" className="font-semibold">Segurança</TabsTrigger>
                </TabsList>

                <TabsContent value="perfil">
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-slate-900">Configurações do Perfil</CardTitle>
                            <CardDescription className="text-gray-600">Atualize seu nome e foto de perfil.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Avatar className="w-24 h-24 border-4 border-purple-400/50">
                                        <AvatarImage src={formData.profilePictureUrl} alt={formData.fullName} />
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-3xl">
                                            {getInitials(formData.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label htmlFor="image-upload" className="absolute -bottom-2 -right-2 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                                        <Camera className="w-5 h-5 text-white" />
                                    </label>
                                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="fullName">Nome Completo</Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="mt-1 bg-gray-100 border-gray-300 text-gray-800"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    value={user.email}
                                    disabled
                                    className="mt-1 bg-gray-200 border-gray-300 text-gray-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="especialidade" className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-purple-500" />
                                        Especialidade
                                    </Label>
                                    <Input
                                        id="especialidade"
                                        value={formData.especialidade}
                                        onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                                        className="mt-1 bg-gray-100 border-gray-300 text-gray-800"
                                        placeholder="Ex: Terapia Quântica, Reflexologia"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="registro" className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                        Número de Registro Profissional
                                    </Label>
                                    <Input
                                        id="registro"
                                        value={formData.registro}
                                        onChange={(e) => setFormData({ ...formData, registro: e.target.value })}
                                        className="mt-1 bg-gray-100 border-gray-300 text-gray-800"
                                        placeholder="Ex: CRP, CFT, etc."
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="formacao" className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-purple-500" />
                                    Formação Acadêmica
                                </Label>
                                <Input
                                    id="formacao"
                                    value={formData.formacao}
                                    onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                                    className="mt-1 bg-gray-100 border-gray-300 text-gray-800"
                                    placeholder="Ex: Psicologia, Terapia Holística, etc."
                                />
                            </div>
                            <div>
                                <Label htmlFor="bio">Biografia Profissional</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="mt-1 bg-gray-100 border-gray-300 text-gray-800 resize-none"
                                    rows={4}
                                    placeholder="Conte um pouco sobre sua experiência e abordagem terapêutica..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Máximo 500 caracteres.</p>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    {isUploading ? 'Enviando imagem...' : (isSaving ? 'Salvando...' : 'Salvar Alterações')}
                                </Button>
                            </div>
                        </CardContent>
                    </QuantumCard>
                </TabsContent>

                <TabsContent value="seguranca">
                    <QuantumCard>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                                <Lock className="text-purple-500" />
                                Alterar Senha
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Mantenha sua conta segura com uma senha forte.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="senhaAtual">Senha Atual</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="senhaAtual"
                                        type={showSenhas.atual ? 'text' : 'password'}
                                        value={senhaData.senhaAtual}
                                        onChange={handleSenhaChange}
                                        className="bg-gray-100 border-gray-300 text-gray-800 pr-10"
                                        placeholder="Digite sua senha atual"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSenhas({ ...showSenhas, atual: !showSenhas.atual })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showSenhas.atual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="novaSenha">Nova Senha</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="novaSenha"
                                        type={showSenhas.nova ? 'text' : 'password'}
                                        value={senhaData.novaSenha}
                                        onChange={handleSenhaChange}
                                        className="bg-gray-100 border-gray-300 text-gray-800 pr-10"
                                        placeholder="Digite sua nova senha (mínimo 8 caracteres)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSenhas({ ...showSenhas, nova: !showSenhas.nova })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showSenhas.nova ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="confirmarSenha"
                                        type={showSenhas.confirmar ? 'text' : 'password'}
                                        value={senhaData.confirmarSenha}
                                        onChange={handleSenhaChange}
                                        className="bg-gray-100 border-gray-300 text-gray-800 pr-10"
                                        placeholder="Confirme sua nova senha"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSenhas({ ...showSenhas, confirmar: !showSenhas.confirmar })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showSenhas.confirmar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {senhaMessage.text && (
                                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                                    senhaMessage.type === 'success' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {senhaMessage.type === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    )}
                                    <p className="text-sm">{senhaMessage.text}</p>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button 
                                    onClick={handleSalvarSenha} 
                                    disabled={isSavingSenha}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {isSavingSenha ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                    {isSavingSenha ? 'Alterando...' : 'Alterar Senha'}
                                </Button>
                            </div>
                        </CardContent>
                    </QuantumCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}
