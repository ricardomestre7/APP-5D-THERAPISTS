// Integrations API - Sem Base44

export const Core = {
    UploadFile: async (data) => ({
        file_url: `https://demo.app/storage/${data.file?.name || 'file.png'}`
    }),
    InvokeLLM: async (data) => ({
        response: 'Resposta do LLM (demo)',
        success: true
    }),
    SendEmail: async (data) => ({
        success: true,
        message_id: 'demo-msg-id'
    })
};

export const InvokeLLM = async (data) => Core.InvokeLLM(data);
export const SendEmail = async (data) => Core.SendEmail(data);
export const UploadFile = async (data) => Core.UploadFile(data);
export const GenerateImage = async (data) => ({ url: 'https://demo.image.png' });
export const ExtractDataFromUploadedFile = async (data) => ({ data: 'extracted-data' });
export const CreateFileSignedUrl = async (data) => ({ url: 'https://demo.signed.url' });
export const UploadPrivateFile = async (data) => Core.UploadFile(data);

