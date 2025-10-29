
export const gerarRelatorioPDF = async (data) => {
    console.log('📄 PDF gerado (demo):', data);
    return { data: 'mock-pdf-data' };
};

export const enviarRelatorioPorEmail = async (data) => {
    console.log('📧 Email enviado (demo):', data);
    return { success: true };
};

