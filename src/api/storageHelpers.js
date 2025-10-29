/**
 * Firebase Storage Helper Functions
 * Funções auxiliares para upload/download de arquivos
 */

import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject,
    uploadBytesResumable
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload de arquivo
 */
export const uploadFile = async (file, path, onProgress = null) => {
    try {
        const storageRef = ref(storage, path);
        
        if (onProgress) {
            // Upload com monitoramento de progresso
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                },
                (error) => {
                    console.error('Erro no upload:', error);
                    throw error;
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    return downloadURL;
                }
            );
            
            // Retornar URL quando concluir
            await uploadTask;
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } else {
            // Upload simples
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        }
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        throw error;
    }
};

/**
 * Upload de imagem (com otimização)
 */
export const uploadImage = async (file, path, maxWidth = 1920, quality = 0.8) => {
    try {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Redimensionar se necessário
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Converter para blob
                    canvas.toBlob(async (blob) => {
                        try {
                            const storageRef = ref(storage, path);
                            await uploadBytes(storageRef, blob);
                            const downloadURL = await getDownloadURL(storageRef);
                            resolve(downloadURL);
                        } catch (error) {
                            reject(error);
                        }
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Erro ao fazer upload de imagem:', error);
        throw error;
    }
};

/**
 * Deletar arquivo
 */
export const deleteFile = async (path) => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log('✅ Arquivo deletado com sucesso');
    } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
        throw error;
    }
};

/**
 * Obter URL de um arquivo existente
 */
export const getFileURL = async (path) => {
    try {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error('Erro ao obter URL do arquivo:', error);
        throw error;
    }
};

