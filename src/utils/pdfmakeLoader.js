/**
 * Loader para pdfmake que funciona tanto em dev quanto em produção
 * Resolve o problema de imports dinâmicos no Vercel
 */

let pdfMakeCache = null;
let vfsCache = null;

/**
 * Carrega pdfmake com múltiplas estratégias de fallback
 */
export async function loadPdfMake() {
    if (pdfMakeCache && vfsCache) {
        return { pdfMake: pdfMakeCache, vfs: vfsCache };
    }

    const errors = [];

    // Estratégia 1: Import direto do caminho completo
    try {
        console.log('📦 Tentando carregar pdfmake (estratégia 1: caminho completo)...');
        const pdfMakeModule = await import('pdfmake/build/pdfmake');
        const vfsModule = await import('pdfmake/build/vfs_fonts');
        
        const pdfMake = pdfMakeModule?.default || pdfMakeModule;
        const vfs = extractVfs(vfsModule);
        
        if (pdfMake && pdfMake.createPdf) {
            if (vfs) pdfMake.vfs = vfs;
            pdfMakeCache = pdfMake;
            vfsCache = vfs;
            console.log('✅ pdfmake carregado com sucesso (estratégia 1)');
            return { pdfMake, vfs };
        }
    } catch (e) {
        errors.push({ strategy: 1, error: e.message });
        console.warn('⚠️ Estratégia 1 falhou:', e.message);
    }

    // Estratégia 2: Import com extensão .js
    try {
        console.log('📦 Tentando carregar pdfmake (estratégia 2: com .js)...');
        const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
        const vfsModule = await import('pdfmake/build/vfs_fonts.js');
        
        const pdfMake = pdfMakeModule?.default || pdfMakeModule;
        const vfs = extractVfs(vfsModule);
        
        if (pdfMake && pdfMake.createPdf) {
            if (vfs) pdfMake.vfs = vfs;
            pdfMakeCache = pdfMake;
            vfsCache = vfs;
            console.log('✅ pdfmake carregado com sucesso (estratégia 2)');
            return { pdfMake, vfs };
        }
    } catch (e) {
        errors.push({ strategy: 2, error: e.message });
        console.warn('⚠️ Estratégia 2 falhou:', e.message);
    }

    // Estratégia 3: Import do pacote raiz
    try {
        console.log('📦 Tentando carregar pdfmake (estratégia 3: pacote raiz)...');
        const pdfMakeModule = await import('pdfmake');
        const vfsModule = await import('pdfmake/build/vfs_fonts');
        
        const pdfMake = pdfMakeModule?.default || pdfMakeModule?.pdfMake || pdfMakeModule;
        const vfs = extractVfs(vfsModule);
        
        if (pdfMake && typeof pdfMake.createPdf === 'function') {
            if (vfs) pdfMake.vfs = vfs;
            pdfMakeCache = pdfMake;
            vfsCache = vfs;
            console.log('✅ pdfmake carregado com sucesso (estratégia 3)');
            return { pdfMake, vfs };
        }
    } catch (e) {
        errors.push({ strategy: 3, error: e.message });
        console.warn('⚠️ Estratégia 3 falhou:', e.message);
    }

    // Se todas falharam, lançar erro detalhado
    const errorMessage = `Não foi possível carregar pdfmake. Tentativas falharam:\n${errors.map(e => `  - Estratégia ${e.strategy}: ${e.error}`).join('\n')}`;
    console.error('❌ Todas as estratégias falharam:', errors);
    throw new Error(errorMessage);
}

/**
 * Extrai VFS do módulo de fontes (suporta múltiplas estruturas)
 */
function extractVfs(fontsModule) {
    if (!fontsModule) return null;
    
    const module = fontsModule.default || fontsModule;
    
    // Tentar diferentes estruturas possíveis
    return module?.pdfMake?.vfs || 
           module?.vfs || 
           module?.default?.pdfMake?.vfs || 
           module?.default?.vfs || 
           (typeof module === 'object' && Object.keys(module).length > 0 ? module : null);
}

