/**
 * Firestore Helper Functions
 * Funções auxiliares para trabalhar com Firestore
 */

import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Criar documento
 */
export const createDocument = async (collectionName, data, docId = null) => {
    try {
        console.log(`📝 Criando documento em "${collectionName}":`, data);
        if (docId) {
            // Criar com ID específico
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, {
                ...data,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });
            console.log(`✅ Documento criado com ID: ${docId}`);
            return { id: docId, ...data };
        } else {
            // Criar com ID automático
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });
            console.log(`✅ Documento criado com ID automático: ${docRef.id}`);
            return { id: docRef.id, ...data };
        }
    } catch (error) {
        console.error('❌ Erro ao criar documento:', error);
        throw error;
    }
};

/**
 * Buscar documento por ID
 */
export const getDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar documento:', error);
        throw error;
    }
};

/**
 * Atualizar documento
 */
export const updateDocument = async (collectionName, docId, data) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
            ...data,
            updated_at: serverTimestamp()
        });
        return { id: docId, ...data };
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        throw error;
    }
};

/**
 * Deletar documento
 */
export const deleteDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        console.log('✅ Documento deletado com sucesso');
    } catch (error) {
        console.error('Erro ao deletar documento:', error);
        throw error;
    }
};

/**
 * Buscar documentos com filtro
 */
export const queryDocuments = async (collectionName, filters = [], orderByField = null, orderDirection = 'asc') => {
    try {
        console.log(`🔍 Buscando documentos em "${collectionName}" com filtros:`, filters);
        let q = collection(db, collectionName);
        
        // Aplicar filtros
        filters.forEach(filter => {
            q = query(q, where(filter.field, filter.operator, filter.value));
        });
        
        // Aplicar ordenação
        if (orderByField) {
            q = query(q, orderBy(orderByField, orderDirection));
        }
        
        const querySnapshot = await getDocs(q);
        const documents = [];
        
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ Encontrados ${documents.length} documentos em "${collectionName}"`);
        return documents;
    } catch (error) {
        console.error('❌ Erro ao buscar documentos:', error);
        throw error;
    }
};

/**
 * Buscar todos os documentos de uma coleção
 */
export const getAllDocuments = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];
        
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        
        return documents;
    } catch (error) {
        console.error('Erro ao buscar todos os documentos:', error);
        throw error;
    }
};

