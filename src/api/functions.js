
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

/**
 * Gerar PDF usando Puppeteer no backend (Firebase Functions)
 * Qualidade profissional com gráficos renderizados perfeitamente
 */
export const gerarRelatorioPDF = async (data) => {
    try {
        console.log('🔄 Chamando Cloud Function para gerar PDF...');
        
        const app = getApp();
        const functions = getFunctions(app);
        const gerarPDF = httpsCallable(functions, 'gerarPDFRelatorio');
        
        // Chamar Cloud Function
        const result = await gerarPDF(data);
        
        if (result.data.success && result.data.pdf) {
            // Converter base64 para blob
            const pdfBase64 = result.data.pdf;
            const binaryString = atob(pdfBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            
            // Download do PDF
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.data.filename || `relatorio_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            console.log('✅ PDF gerado e baixado com sucesso!');
            return { success: true, blob };
        } else {
            throw new Error('Resposta inválida da Cloud Function');
        }
    } catch (error) {
        console.error('❌ Erro ao gerar PDF via Cloud Function:', error);
        
        // Fallback para método local (jsPDF) em caso de erro
        console.log('🔄 Tentando fallback para geração local...');
        throw error; // Re-lançar para o componente lidar com o erro
    }
};

export const enviarRelatorioPorEmail = async (data) => {
    console.log('📧 Email enviado (demo):', data);
    return { success: true };
};

