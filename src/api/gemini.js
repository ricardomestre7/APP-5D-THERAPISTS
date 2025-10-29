/**
 * Google Gemini AI Integration
 * 
 * Para usar esta funcionalidade:
 * 1. Acesse: https://ai.google.dev/
 * 2. Crie uma API Key
 * 3. Adicione ao arquivo .env.local:
 *    VITE_GEMINI_API_KEY=sua-api-key-aqui
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

// Initialize Gemini AI
if (API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            systemInstruction: `Você é o Agente 5D, um assistente quântico especializado em terapias holísticas. 
Você ajuda terapeutas quânticos com:
- Cadastro e gestão de pacientes
- Criação de sessões terapêuticas
- Geração de relatórios e análises
- Informações sobre terapias quânticas, cristais, ervas e óleos essenciais
- Orientação sobre práticas terapêuticas

Seja sempre:
- Educado e empático
- Conciso mas informativo
- Usar emojis quando apropriado
- Focado em ajudar o terapeuta

O contexto é um sistema de gestão para terapeutas quânticos.`
        });
        console.log('✅ Gemini AI inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar Gemini:', error);
    }
} else {
    console.warn('⚠️ VITE_GEMINI_API_KEY não configurada. Usando modo demo.');
}

/**
 * Send message to Gemini AI
 * @param {string} message - User message
 * @returns {Promise<string>} - AI response
 */
export const sendMessageToGemini = async (message) => {
    if (!API_KEY || !model) {
        throw new Error('Gemini API não configurada');
    }

    try {
        const result = await model.generateContent(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Erro ao chamar Gemini:', error);
        throw error;
    }
};

/**
 * Check if Gemini is available
 */
export const isGeminiAvailable = () => {
    return API_KEY && model !== null;
};

export default { sendMessageToGemini, isGeminiAvailable };

