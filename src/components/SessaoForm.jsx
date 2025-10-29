import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Upload, Camera, Eye, Sparkles, X } from 'lucide-react';
import { Terapia } from '@/api/entities';
// Base44 removido
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SessaoForm({ open, onOpenChange, pacienteId, onSave }) {
    const [terapias, setTerapias] = useState([]);
    const [terapiaSelecionada, setTerapiaSelecionada] = useState(null);
    const [dataSessao, setDataSessao] = useState('');
    const [resultados, setResultados] = useState({});
    const [observacoes, setObservacoes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados para fotos (Iridologia)
    const [fotosIris, setFotosIris] = useState([]);
    const [isUploadingFoto, setIsUploadingFoto] = useState(false);
    const [isAnalisandoIA, setIsAnalisandoIA] = useState(false);
    const [analiseIA, setAnaliseIA] = useState('');

    useEffect(() => {
        if (open) {
            loadTerapias();
            setDataSessao(new Date().toISOString().slice(0, 16));
            setResultados({});
            setObservacoes('');
            setFotosIris([]);
            setAnaliseIA('');
        }
    }, [open]);

    const loadTerapias = async () => {
        const lista = await Terapia.list();
        setTerapias(lista);
    };

    const handleTerapiaChange = (terapiaId) => {
        const terapia = terapias.find(t => t.id === terapiaId);
        setTerapiaSelecionada(terapia);
        
        const novosResultados = {};
        terapia?.campos_formulario?.forEach(campo => {
            novosResultados[campo.label] = '';
        });
        setResultados(novosResultados);
    };

    const handleResultadoChange = (label, value) => {
        setResultados(prev => ({ ...prev, [label]: value }));
    };

    const handleUploadFoto = async (e, tipo) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingFoto(true);
        try {
            // Base44 removido - implementar nova integração
            console.log('📤 Upload de foto (demo):', file.name);
            const file_url = 'https://demo.file.url/photo.jpg';
            
            setFotosIris(prev => [...prev, {
                url: file_url,
                tipo: tipo,
                descricao: tipo === 'iris_direita' ? 'Íris Direita' : tipo === 'iris_esquerda' ? 'Íris Esquerda' : 'Geral'
            }]);
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload da foto. Tente novamente.');
        } finally {
            setIsUploadingFoto(false);
        }
    };

    const handleRemoverFoto = (index) => {
        setFotosIris(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalisarComIA = async () => {
        if (fotosIris.length === 0) {
            alert('Por favor, adicione pelo menos uma foto da íris primeiro.');
            return;
        }

        setIsAnalisandoIA(true);
        try {
            const prompt = `Você é um especialista em IRIDOLOGIA. Analise as imagens da íris fornecidas e identifique:

1. **Constituição da Íris**: Linfática, Hematogênica ou Mista
2. **Densidade**: Forte, Média ou Fraca
3. **Cor da Íris**: Azul, Marrom, Mista
4. **Anéis e Círculos**: Presença de arco senil, anel de sódio, anel nervoso
5. **Manchas e Sinais**: Localização e possível significado
6. **Lacunas**: Presença e localização
7. **Radii Solaris**: Intensidade e quantidade
8. **Áreas de Atenção**: Quais órgãos/sistemas merecem atenção

Forneça uma análise DETALHADA e PROFISSIONAL em português, como se fosse para um terapeuta de iridologia experiente.

IMPORTANTE: Esta é uma análise de apoio terapêutico integrativo, não diagnóstico médico.`;

            // Base44 removido - implementar nova integração
            console.log('🧠 LLM invocado (demo)');
            console.log('📷 Fotos:', fotosIris.map(f => f.url));
            
            // Simular resposta da IA
            const response = `Análise iridológica demo gerada para ${fotosIris.length} foto(s). Em produção, esta análise seria gerada por IA especializada.`;
            
            setAnaliseIA(response);
        } catch (error) {
            console.error('Erro na análise com IA:', error);
            alert('Erro ao analisar com IA. Tente novamente.');
        } finally {
            setIsAnalisandoIA(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validação básica
        if (!terapiaSelecionada) {
            alert('Por favor, selecione uma terapia.');
            return;
        }
        
        setIsSaving(true);

        try {
            const data = {
                paciente_id: pacienteId,
                terapia_id: terapiaSelecionada.id,
                data_sessao: new Date(dataSessao).toISOString(),
                resultados,
                observacoes_gerais: observacoes,
                fotos_anexadas: fotosIris,
                analise_ia: analiseIA
            };

            await onSave(data);
            setIsSaving(false);
            onOpenChange(false); // Fechar o modal após salvar
        } catch (error) {
            console.error('❌ Erro ao salvar sessão:', error);
            alert('Erro ao salvar sessão. Tente novamente.');
            setIsSaving(false);
        }
    };

    const renderCampo = (campo) => {
        // Se campo é string, converter para objeto padrão
        let campoFormatado = campo;
        if (typeof campo === 'string') {
            campoFormatado = {
                label: campo,
                tipo: 'texto_curto',
                campo_associado: 'Geral',
                instrucoes_praticas: '',
                dicas_observacao: ''
            };
        }

        const value = resultados[campoFormatado.label] || '';

        switch (campoFormatado.tipo) {
            case 'escala_1_10':
                return (
                    <div key={campoFormatado.label} className="space-y-2">
                        <Label className="text-gray-700 font-semibold">{campoFormatado.label}</Label>
                        {campoFormatado.instrucoes_praticas && (
                            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                💡 <strong>Como avaliar:</strong> {campoFormatado.instrucoes_praticas}
                            </p>
                        )}
                        {campoFormatado.dicas_observacao && (
                            <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                                👁️ <strong>O que observar:</strong> {campoFormatado.dicas_observacao}
                            </p>
                        )}
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={value}
                                onChange={(e) => handleResultadoChange(campoFormatado.label, e.target.value)}
                                className="w-20 text-center text-lg font-bold"
                            />
                            <Input
                                type="range"
                                min="1"
                                max="10"
                                value={value || 1}
                                onChange={(e) => handleResultadoChange(campoFormatado.label, e.target.value)}
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-500 w-16">{value || 1}/10</span>
                        </div>
                    </div>
                );

            case 'texto_curto':
                return (
                    <div key={campoFormatado.label} className="space-y-2">
                        <Label className="text-gray-700 font-semibold">{campoFormatado.label}</Label>
                        {campoFormatado.instrucoes_praticas && (
                            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                💡 {campoFormatado.instrucoes_praticas}
                            </p>
                        )}
                        <Input
                            value={value}
                            onChange={(e) => handleResultadoChange(campoFormatado.label, e.target.value)}
                            className="bg-white border-gray-300"
                        />
                    </div>
                );

            case 'texto_longo':
                return (
                    <div key={campoFormatado.label} className="space-y-2">
                        <Label className="text-gray-700 font-semibold">{campoFormatado.label}</Label>
                        {campoFormatado.instrucoes_praticas && (
                            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                💡 {campoFormatado.instrucoes_praticas}
                            </p>
                        )}
                        <Textarea
                            value={value}
                            onChange={(e) => handleResultadoChange(campoFormatado.label, e.target.value)}
                            className="bg-white border-gray-300 h-24"
                        />
                    </div>
                );

            case 'multipla_escolha':
                return (
                    <div key={campoFormatado.label} className="space-y-2">
                        <Label className="text-gray-700 font-semibold">{campoFormatado.label}</Label>
                        {campoFormatado.instrucoes_praticas && (
                            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                💡 {campoFormatado.instrucoes_praticas}
                            </p>
                        )}
                        <Select value={value} onValueChange={(val) => handleResultadoChange(campoFormatado.label, val)}>
                            <SelectTrigger className="bg-white border-gray-300">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {campoFormatado.opcoes?.map(opcao => (
                                    <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={campoFormatado.label} className="space-y-2">
                        <Label className="text-gray-700 font-semibold">{campoFormatado.label}</Label>
                        {campoFormatado.instrucoes_praticas && (
                            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                💡 {campoFormatado.instrucoes_praticas}
                            </p>
                        )}
                        <div className="space-y-2">
                            {campoFormatado.opcoes?.map(opcao => {
                                const selecionados = value ? value.split(',') : [];
                                const isChecked = selecionados.includes(opcao);
                                
                                return (
                                    <label key={opcao} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                let novos = [...selecionados];
                                                if (e.target.checked) {
                                                    novos.push(opcao);
                                                } else {
                                                    novos = novos.filter(s => s !== opcao);
                                                }
                                                handleResultadoChange(campoFormatado.label, novos.join(','));
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700">{opcao}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const isIridologia = terapiaSelecionada?.nome?.toLowerCase().includes('iridologia');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white text-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Camera className="text-purple-600" />
                        Registrar Nova Sessão
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Preencha os dados para registrar uma nova sessão terapêutica
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seleção de Terapia e Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700 font-semibold">Terapia *</Label>
                            <Select value={terapiaSelecionada?.id || ''} onValueChange={handleTerapiaChange}>
                                <SelectTrigger className="mt-1 bg-white border-gray-300">
                                    <SelectValue placeholder="Selecione a terapia..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-64 overflow-y-auto">
                                    {terapias.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-gray-700 font-semibold">Data e Hora da Sessão *</Label>
                            <Input
                                type="datetime-local"
                                value={dataSessao}
                                onChange={(e) => setDataSessao(e.target.value)}
                                required
                                className="mt-1 bg-white border-gray-300"
                            />
                        </div>
                    </div>

                    {/* SEÇÃO ESPECIAL PARA IRIDOLOGIA */}
                    {isIridologia && (
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-300">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-3 text-purple-800">
                                    <Eye className="w-6 h-6" />
                                    📸 Análise de Iridologia - Upload de Fotos da Íris
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Instruções */}
                                <div className="bg-white p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-bold text-blue-800 mb-2">💡 Como Fotografar a Íris Corretamente:</h4>
                                    <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                                        <li>Use luz natural ou flash para iluminação adequada</li>
                                        <li>Peça ao paciente para olhar direto para a câmera</li>
                                        <li>Aproxime a câmera para capturar detalhes da íris</li>
                                        <li>Fotografe AMBOS OS OLHOS separadamente</li>
                                        <li>Certifique-se que a foto está nítida e com boa resolução</li>
                                    </ul>
                                </div>

                                {/* Upload de Fotos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-700 font-semibold mb-2 block">Íris Direita</Label>
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                                            <Upload className="w-8 h-8 text-blue-600 mb-2" />
                                            <span className="text-sm text-blue-600 font-medium">Clique para carregar</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => handleUploadFoto(e, 'iris_direita')}
                                                disabled={isUploadingFoto}
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <Label className="text-gray-700 font-semibold mb-2 block">Íris Esquerda</Label>
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors">
                                            <Upload className="w-8 h-8 text-purple-600 mb-2" />
                                            <span className="text-sm text-purple-600 font-medium">Clique para carregar</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => handleUploadFoto(e, 'iris_esquerda')}
                                                disabled={isUploadingFoto}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {isUploadingFoto && (
                                    <div className="flex items-center justify-center gap-2 text-blue-600">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Enviando foto...</span>
                                    </div>
                                )}

                                {/* Fotos Carregadas */}
                                {fotosIris.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-gray-800">Fotos Carregadas:</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {fotosIris.map((foto, index) => (
                                                <div key={index} className="relative">
                                                    <img 
                                                        src={foto.url} 
                                                        alt={foto.descricao}
                                                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                                                    />
                                                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                                        {foto.descricao}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-8 w-8"
                                                        onClick={() => handleRemoverFoto(index)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Botão Analisar com IA */}
                                {fotosIris.length > 0 && (
                                    <Button
                                        type="button"
                                        onClick={handleAnalisarComIA}
                                        disabled={isAnalisandoIA}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                                    >
                                        {isAnalisandoIA ? (
                                            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analisando com IA...</>
                                        ) : (
                                            <><Sparkles className="w-5 h-5 mr-2" /> Analisar Íris com Inteligência Artificial</>
                                        )}
                                    </Button>
                                )}

                                {/* Resultado da Análise IA */}
                                {analiseIA && (
                                    <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                                        <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5" />
                                            Análise Iridológica por IA:
                                        </h4>
                                        <div className="text-sm text-gray-700 whitespace-pre-line max-h-64 overflow-y-auto">
                                            {analiseIA}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Campos do Formulário da Terapia */}
                    {terapiaSelecionada && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                Avaliação - {terapiaSelecionada.nome}
                            </h3>
                            {terapiaSelecionada.campos_formulario?.map(campo => renderCampo(campo))}
                        </div>
                    )}

                    {/* Observações Gerais */}
                    <div>
                        <Label className="text-gray-700 font-semibold">Observações Gerais</Label>
                        <Textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Adicione observações gerais sobre a sessão..."
                            className="mt-1 bg-white border-gray-300 h-32"
                        />
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="mt-2 sm:mt-0"
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !terapiaSelecionada}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Registrar Sessão</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}