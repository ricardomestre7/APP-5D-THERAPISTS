// Sistema de Pacientes com Firebase Firestore
import { queryDocuments, createDocument, getDocument, updateDocument, deleteDocument } from './firestoreHelpers';
import { getCurrentUser, onAuthChange } from './firebaseAuth';

export const Paciente = {
    filter: async (params, order) => {
        // SEMPRE buscar do Firestore - sem fallback silencioso
        const filters = [];
        
        // Aplicar filtro se houver terapeuta_id
        if (params && params.terapeuta_id) {
            filters.push({ field: 'terapeuta_id', operator: '==', value: params.terapeuta_id });
        }
        
        // Firestore requer índice composto para filtro + ordenação
        // Vamos buscar sem ordenação e ordenar em memória para evitar necessidade de criar índice
        const pacientes = await queryDocuments('pacientes', filters, null, 'asc');
        console.log(`✅ ${pacientes.length} paciente(s) encontrado(s) no Firestore para terapeuta ${params?.terapeuta_id || 'todos'}`);
        
        // Converter timestamps do Firestore para strings ISO e ordenar
        let pacientesProcessados = pacientes.map(p => ({
            ...p,
            created_date: p.created_at?.toDate?.()?.toISOString() || p.created_date,
            updated_date: p.updated_at?.toDate?.()?.toISOString() || p.updated_date
        }));
        
        // Ordenar em memória se necessário
        if (order === '-created_date') {
            pacientesProcessados = pacientesProcessados.sort((a, b) => {
                const dateA = new Date(a.created_date || a.created_at || 0);
                const dateB = new Date(b.created_date || b.created_at || 0);
                return dateB.getTime() - dateA.getTime(); // Ordem descendente (mais recente primeiro)
            });
        }
        
        return pacientesProcessados;
    },
    
    create: async (data) => {
        // GARANTIR que terapeuta_id está presente
        if (!data.terapeuta_id) {
            throw new Error('ERRO: terapeuta_id é obrigatório. Não é possível salvar paciente sem terapeuta associado.');
        }
        
        console.log('💾 Salvando paciente no Firestore (permanente)...');
        console.log('🔗 Terapeuta ID:', data.terapeuta_id);
        
        // SEMPRE criar no Firestore PRIMEIRO - se falhar, erro explícito
        const paciente = await createDocument('pacientes', data);
        console.log('✅ Paciente criado PERMANENTEMENTE no Firestore:', paciente.id);
        console.log('📋 Dados salvos:', { 
            id: paciente.id, 
            nome: data.nome, 
            terapeuta_id: data.terapeuta_id 
        });
        
        // Salvar também no localStorage APENAS como cache local (não é fonte de verdade)
        try {
            const savedPatients = localStorage.getItem('5d_pacientes');
            const pacientes = savedPatients ? JSON.parse(savedPatients) : [];
            pacientes.push(paciente);
            localStorage.setItem('5d_pacientes', JSON.stringify(pacientes));
            console.log('💾 Cache local atualizado (backup secundário)');
        } catch (localError) {
            console.warn('⚠️ Erro ao atualizar cache local (não crítico):', localError);
            // Não falhar se localStorage falhar - Firestore é a fonte de verdade
        }
        
        return paciente;
    },
    
    update: async (id, data) => {
        if (!id) {
            throw new Error('ERRO: ID do paciente é obrigatório para atualização.');
        }
        
        console.log('💾 Atualizando paciente no Firestore (permanente)...', id);
        
        // SEMPRE atualizar no Firestore PRIMEIRO - se falhar, erro explícito
        await updateDocument('pacientes', id, data);
        console.log('✅ Paciente atualizado PERMANENTEMENTE no Firestore:', id);
        
        // Atualizar cache local (não crítico)
        try {
            const savedPatients = localStorage.getItem('5d_pacientes');
            if (savedPatients) {
                const pacientes = JSON.parse(savedPatients);
                const index = pacientes.findIndex(p => p.id === id);
                
                if (index !== -1) {
                    pacientes[index] = { ...pacientes[index], ...data, updated_date: new Date().toISOString() };
                    localStorage.setItem('5d_pacientes', JSON.stringify(pacientes));
                    console.log('💾 Cache local atualizado (backup secundário)');
                }
            }
        } catch (localError) {
            console.warn('⚠️ Erro ao atualizar cache local (não crítico):', localError);
        }
        
        return { id, ...data };
    },
    
    get: async (id) => {
        if (!id) {
            throw new Error('ERRO: ID do paciente é obrigatório.');
        }
        
        console.log('🔍 Buscando paciente no Firestore com ID:', id);
        
        try {
            // SEMPRE buscar do Firestore - sem fallback
            const paciente = await getDocument('pacientes', id);
            
            if (!paciente) {
                console.warn(`⚠️ Paciente ${id} não encontrado no Firestore`);
                return null;
            }
            
            console.log('✅ Paciente encontrado no Firestore:', {
                id: paciente.id,
                nome: paciente.nome,
                terapeuta_id: paciente.terapeuta_id
            });
            
            return {
                ...paciente,
                created_date: paciente.created_at?.toDate?.()?.toISOString() || paciente.created_date,
                updated_date: paciente.updated_at?.toDate?.()?.toISOString() || paciente.updated_date
            };
        } catch (error) {
            console.error('❌ Erro ao buscar paciente:', error);
            console.error('📋 Detalhes:', {
                code: error.code,
                message: error.message,
                pacienteId: id
            });
            throw error;
        }
    },
    
    delete: async (id) => {
        if (!id) {
            throw new Error('ERRO: ID do paciente é obrigatório para exclusão.');
        }
        
        console.log('🗑️ Deletando paciente PERMANENTEMENTE do Firestore:', id);
        
        // SEMPRE deletar do Firestore - se falhar, erro explícito
        await deleteDocument('pacientes', id);
        console.log('✅ Paciente deletado PERMANENTEMENTE do Firestore:', id);
        
        // Deletar do cache local também (não crítico)
        try {
            const savedPatients = localStorage.getItem('5d_pacientes');
            if (savedPatients) {
                const pacientes = JSON.parse(savedPatients);
                const pacientesAtualizados = pacientes.filter(p => p.id !== id);
                localStorage.setItem('5d_pacientes', JSON.stringify(pacientesAtualizados));
                console.log('💾 Cache local atualizado (backup secundário)');
            }
        } catch (localError) {
            console.warn('⚠️ Erro ao atualizar cache local (não crítico):', localError);
        }
    }
};
    
export const Terapia = {
    list: async () => [
        { 
            id: '1',
            nome: 'Reiki Usui', 
            categoria: 'Energético',
            tipo_visualizacao_sugerido: 'radar',
            nivel_dificuldade: 'Iniciante', 
            duracao_media: '60-90min', 
            descricao: 'Técnica japonesa milenar de canalização de energia universal através da imposição de mãos, promovendo equilíbrio profundo em todos os níveis do ser.', 
            beneficios: ['Redução significativa de estresse e ansiedade', 'Alívio de dores físicas crônicas e agudas', 'Melhora profunda da qualidade do sono', 'Equilíbrio emocional e estabilidade mental', 'Fortalecimento do sistema imunológico', 'Aceleração do processo de cura natural do corpo', 'Aumento da vitalidade e disposição diária', 'Harmonização e ativação dos 7 chakras principais', 'Liberação de bloqueios energéticos ancestrais', 'Conexão com o Eu Superior e propósito de vida'], 
            contraindicacoes: 'Não há contraindicações absolutas - o Reiki é seguro para todas as idades, Sempre complementar a tratamentos médicos convencionais, Não substitui diagnóstico ou tratamento médico', 
            campos_formulario: [
                {"label":"Nível de Energia Vital","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"Peça ao paciente que feche os olhos, respire profundamente 3 vezes e se conecte com sua sensação interna de vitalidade. Pergunte: 'Numa escala de 1 a 10, onde 1 é totalmente esgotado e 10 é energia abundante, como você se sente agora?' Observe também a cor da pele, brilho nos olhos, postura corporal e tom de voz.","dicas_observacao":"Níveis baixos (1-4) indicam depleção energética severa - priorize técnicas de revitalização. Médios (5-7) são normais mas melhoráveis. Altos (8-10) indicam boa vitalidade - foque em manutenção. Observe mudanças ao longo das sessões - melhora progressiva é esperada."},
                {"label":"Estado Emocional Geral","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"Faça perguntas abertas como: 'Como você está se sentindo emocionalmente hoje?' Deixe o paciente falar livremente. Depois pergunte: 'De 1 a 10, onde 1 é muito mal emocionalmente e 10 é ótimo, onde você se encontra?' Observe expressões faciais, tom de voz, postura e linguagem corporal.","dicas_observacao":"Scores baixos (1-4) sugerem sofrimento emocional intenso - trabalhe chakra cardíaco e plexo solar com mais atenção. Médios (5-7) são comuns. Altos (8-10) indicam bom equilíbrio. Atenção a incongruências entre o que é dito e a linguagem corporal."},
                {"label":"Tensão Física e Dores","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"Peça ao paciente para fazer uma varredura mental do corpo, da cabeça aos pés. Pergunte: 'Onde você sente tensão ou dor? Numa escala de 1 a 10, sendo 1 sem dor e 10 dor insuportável, quanto é sua dor/tensão agora?' Anote as áreas específicas mencionadas.","dicas_observacao":"Scores altos (7-10) exigem atenção especial nessas áreas. Trabalhe mais tempo nas regiões afetadas. Dores no pescoço/ombros geralmente relacionam-se a responsabilidades excessivas. Lombar a questões de suporte/segurança. Acompanhe a evolução sessão a sessão."},
                {"label":"Qualidade do Sono","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"Pergunte: 'Como tem sido seu sono nas últimas noites? Você dorme bem, acorda descansado?' Depois: 'De 1 a 10, onde 1 é péssimo (insônia total) e 10 é excelente (sono profundo e reparador), como você avalia seu sono?' Pergunte sobre pesadelos, acordar no meio da noite, hora de dormir/acordar.","dicas_observacao":"Scores baixos (1-5) indicam desequilíbrio significativo - trabalhe chakra frontal e coronário. Insônia pode estar ligada a hiperatividade mental ou ansiedade. Melhora do sono geralmente é um dos primeiros benefícios percebidos. Monitorar evolução é importante indicador de progresso."},
                {"label":"Clareza Mental e Foco","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"Pergunte: 'Como está sua capacidade de concentração e clareza de pensamentos? Você consegue focar nas tarefas?' De 1 a 10, onde 1 é mente totalmente confusa/dispersa e 10 é foco cristalino, onde você está?' Observe a coerência e clareza na comunicação do paciente durante a anamnese.","dicas_observacao":"Scores baixos (1-5) sugerem necessidade de trabalhar chakra frontal (terceiro olho) com mais atenção. Névoa mental pode estar relacionada a sobrecarga emocional ou fadiga. Pacientes com foco excessivo (9-10) podem precisar trabalhar relaxamento mental."},
                {"label":"Conexão Espiritual","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"Com sensibilidade, pergunte: 'Você tem sentido conexão com algo maior que você mesmo? Pode ser Deus, universo, natureza, propósito de vida... De 1 a 10, onde 1 é totalmente desconectado e 10 é profundamente conectado, como você se sente?' Respeite crenças individuais.","dicas_observacao":"Scores baixos (1-4) sugerem trabalhar chakra coronário e questões existenciais. Não force conceitos espirituais - cada pessoa tem seu caminho. Conexão espiritual geralmente aumenta naturalmente com as sessões. Respeite o tempo e processo de cada um."},
                {"label":"Observações do Paciente","tipo":"texto_longo","campo_associado":"Emocional","instrucoes_praticas":"Pergunte: 'Há algo específico que você gostaria de compartilhar sobre como está se sentindo? Alguma situação ou emoção que está presente para você agora?' Deixe o paciente falar livremente. Anote as palavras-chave e temas que surgirem.","dicas_observacao":"Preste atenção aos temas recorrentes. Padrões emocionais que se repetem indicam áreas que precisam de trabalho. Às vezes o que NÃO é dito é tão importante quanto o que é dito. Respeite o ritmo de abertura de cada paciente."}
            ] 
        },
        { 
            id: '2', 
            nome: 'Terapia dos Cristais', 
            categoria: 'Energético',
            tipo_visualizacao_sugerido: 'chakra_bar',
            nivel_dificuldade: 'Intermediário', 
            duracao_media: '60-90min', 
            descricao: 'Terapia vibracional milenar que utiliza a ressonância energética dos cristais e pedras preciosas para harmonização, cura e expansão da consciência. Cada cristal possui frequência específica que interage com o campo bioenergético humano.', 
            beneficios: ['Harmonização e ativação dos 7 chakras principais', 'Limpeza profunda do campo áurico e energético', 'Proteção energética e fortalecimento da aura', 'Equilíbrio emocional através de frequências vibracionais', 'Amplificação de intenções e processos de manifestação', 'Conexão profunda com a sabedoria da Terra', 'Alívio de dores físicas através de frequências específicas', 'Expansão da consciência e percepção sutil', 'Transmutação de energias densas em luz', 'Ancoragem e aterramento energético'], 
            contraindicacoes: 'Não há contraindicações absolutas para cristaloterapia, Pessoas muito sensíveis podem ter reações intensas - iniciar com cristais suaves, Não deixar cristais em contato direto com pele sensível por tempo prolongado, Alguns cristais não devem ser expostos à água (selenita, pirita, malaquita), Cristais não substituem tratamento médico convencional', 
            campos_formulario: [
                {"label":"Equilíbrio dos Chakras","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"Peça ao paciente que feche os olhos e escaneie internamente seu corpo energético. 'Como você sente seus centros de energia (chakras)? Equilibrados ou desequilibrados?' Use pêndulo para testar cada chakra antes da sessão (rotação horária = equilibrado, anti-horária = bloqueado, imóvel = estagnado). 'De 1 a 10, onde 10 é chakras perfeitamente alinhados e vibrantes, como você se sente?'","dicas_observacao":"**1-4 (Desequilibrado):** Vários chakras bloqueados ou desalinhados. Pêndulo mostra rotações irregulares. Paciente relata sensações de peso, pressão ou vazio em certas áreas. Priorize cristais específicos para cada chakra afetado. Sessões semanais. **5-7 (Parcialmente Equilibrado):** Alguns chakras funcionam bem, outros precisam atenção. Trabalho focado. **8-10 (Equilibrado):** Chakras fluindo harmoniosamente. Manutenção e expansão. Após sessão com cristais, testar novamente com pêndulo - deve haver melhora imediata na rotação. Peça feedback: 'Qual chakra você sente mais ativo agora?'"},
                {"label":"Sensação de Aterramento","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"'Você se sente conectado com seu corpo e com a Terra, ou mais mental/desconectado?' Observe se pessoa é muito 'aérea', vive no mental, esquece de comer, se machuca frequentemente. 'De 1 a 10, onde 10 é totalmente ancorado e presente no corpo, como você está?' Teste: peça para sentir os pés no chão e descrever a sensação.","dicas_observacao":"**1-4 (Desaterrado):** Pessoa vive muito no mental, desconectada do corpo. 1º chakra fraco. USE: Jaspe vermelho, hematita, turmalina negra nos pés e base. Pode colocar cristais pesados nas mãos também. Após sessão, peça para caminhar descalço se possível. **5-7 (Aterramento Moderado):** Flutuações. Reforçar com cristais de terra. **8-10 (Bem Aterrado):** Boa conexão corpo-terra. Cristais de aterramento para estabilizar. Pessoas desaterradas se beneficiam MUITO de cristaloterapia - mudança pode ser dramática."},
                {"label":"Nível de Proteção Energética","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"'Você se sente protegido energeticamente ou muito vulnerável às energias externas?' 'Absorve facilmente as emoções dos outros?' 'Se sente drenado após estar com certas pessoas ou ambientes?' 'De 1 a 10, onde 10 é totalmente protegido, como está sua proteção?'","dicas_observacao":"**1-4 (Desprotegido):** Pessoa é 'esponja energética', absorve tudo ao redor. Empatas extremos. Campo áurico com buracos ou muito poroso. USE: Turmalina negra (proteção máxima), obsidiana, labradorita (escudo psíquico). Criar grade de proteção ao redor do corpo com cristais. Ensinar a usar cristal de proteção no bolso diariamente. **5-7 (Proteção Moderada):** Reforçar. **8-10 (Bem Protegido):** Manutenção. IMPORTANTE: Empatas e sensitivos PRECISAM de proteção diária com cristais."},
                {"label":"Clareza de Intuição","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"'Você confia na sua intuição? Ouve sua voz interior claramente?' 'Recebe insights, sincronicidades, sonhos significativos?' 'De 1 a 10, onde 10 é intuição cristalina e conexão com guias, como você está?' Observe se pessoa tem facilidade de escolher cristais intuitivamente.","dicas_observacao":"**1-4 (Bloqueado):** 6º chakra (terceiro olho) bloqueado. Pessoa muito mental, não confia no sutil. USE: Ametista, lápis lazúli, sodalita na testa. Pode deixar ametista no 3º olho por tempo prolongado. **5-7 (Desenvolvendo):** Intuição está despertando. Continuar trabalho. **8-10 (Clara):** Percepção sutil ativa. Cristais para EXPANSÃO (apofil ita, moldavita, fenacita). Cristaloterapia é excelente para desenvolver clarividência/clariaudiência. Muitos pacientes têm experiências visuais/intuitivas durante sessão com cristais."},
                {"label":"Equilíbrio Emocional","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"'Como está seu coração emocional? Aberto ou fechado/protegido?' 'Consegue dar e receber amor facilmente?' 'Carrega mágoas, ressentimentos?' 'De 1 a 10, onde 10 é coração totalmente aberto e equilibrado, como você está?'","dicas_observacao":"**1-4 (Fechado/Ferido):** 4º chakra bloqueado. Traumas emocionais, dificuldade de confiar. USE: Quartzo rosa (amor incondicional), rodocrosita (cura emocional profunda), kunzita. Colocar cristais sobre o coração por tempo prolongado. Pode haver choro liberador. **5-7 (Cicatrizando):** Coração em processo de cura. **8-10 (Aberto):** Fluxo emocional saudável. Quartzo rosa é o CRISTAL UNIVERSAL de cura emocional - todos se beneficiam. Pergunte após sessão: 'Como seu coração se sente agora?'"},
                {"label":"Vitalidade Física","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"'Como está sua energia física e vitalidade?' 'Acorda disposto ou esgotado?' 'De 1 a 10, onde 10 é vitalidade máxima, como está?' Observe cor da pele, postura, energia ao falar.","dicas_observacao":"**1-4 (Baixa):** Depleção energética. USE: Citrino (energia solar), cornalina (vitalidade), quartzo rutilado. Trabalhar 2º e 3º chakras. **5-7 (Moderada):** Equilíbrio. **8-10 (Alta):** Excelente vitalidade. Cristais são excelentes para revitalização rápida. Citrino é conhecido como 'vitamina da pedra'."},
                {"label":"Cristais que Chamaram Atenção","tipo":"multipla_escolha","campo_associado":"Vibracional","opcoes":["Ametista","Quartzo Rosa","Quartzo Branco","Citrino","Turmalina Negra","Lápis Lazúli","Água-marinha","Jaspe Vermelho","Cornalina","Selenita","Malaquita","Obsidiana","Olho de Tigre","Outros"],"instrucoes_praticas":"Deixe o paciente ver e tocar os cristais disponíveis ANTES da sessão. 'Quais cristais chamam sua atenção? Quais você sente vontade de pegar?' Não interfira, apenas observe. Anote quais foram escolhidos. A escolha intuitiva revela MUITO sobre o que a pessoa precisa energeticamente.","dicas_observacao":"**Interpretação Intuitiva:** O cristal que a pessoa escolhe é exatamente o que ela precisa. Quartzo Rosa = precisa de amor próprio. Ametista = busca espiritual/transmutação. Turmalina = precisa de proteção/limpeza. Citrino = precisa de alegria/prosperidade. Jaspe vermelho = precisa de aterramento. Lápis lazúli = quer desenvolver intuição. Se pessoa escolher MUITOS cristais = necessidade grande de cura. Se não sentir atração por nenhum = bloqueio energético ou resistência. Use pêndulo para confirmar escolha."},
                {"label":"Sensações Durante a Sessão com Cristais","tipo":"texto_longo","campo_associado":"Vibracional","opcoes":[],"instrucoes_praticas":"Pergunte AO FINAL: 'O que você sentiu com os cristais sobre seu corpo?' 'Algum cristal específico você sentiu mais?' 'Teve sensações físicas (calor, frio, formigamento, peso, leveza)?' 'Visões, cores?' 'Emoções?' Anote detalhadamente.","dicas_observacao":"**Sensações comuns:** CALOR (geralmente no coração com quartzo rosa, no 3º olho com ametista) = ativação, cura. FRIO (comum com turmalina negra) = limpeza, retirada de energia densa. PESO (principalmente com hematita/jaspe) = aterramento profundo. LEVEZA (ametista, selenita) = elevação vibracional. FORMIGAMENTO = ativação energética. PULSAÇÃO = cristal trabalhando intensamente. CORES (geralmente a cor do próprio cristal) = chakra sendo trabalhado. EMOÇÕES aflorando = liberação. SONO profundo = corpo em cura. 'Cristal quente na minha mão' = cristal absorveu energia densa. SE pessoa não sentiu nada: tranquilize, mas considere que talvez precise de sessões mais longas ou cristais mais potentes. Cerca de 15-20% das pessoas são menos sensíveis, mas os efeitos acontecem nos dias seguintes."}
            ] 
        },
        { 
            id: '3', 
            nome: 'Aromaterapia Quântica', 
            categoria: 'Olfativo',
            tipo_visualizacao_sugerido: 'line',
            nivel_dificuldade: 'Intermediário', 
            duracao_media: '60-90min', 
            descricao: 'Arte terapêutica ancestral que utiliza a inteligência vibracional dos óleos essenciais puros para harmonização física, emocional, mental e espiritual. Cada essência carrega a frequência da planta mãe, atuando em múltiplos níveis do ser.', 
            beneficios: ['Equilíbrio emocional profundo através do sistema límbico', 'Redução imediata de estresse e ansiedade', 'Melhora da qualidade do sono e relaxamento', 'Fortalecimento do sistema imunológico', 'Alívio de dores de cabeça e enxaquecas', 'Harmonização hormonal natural', 'Elevação do estado vibracional', 'Clareza mental e foco aumentados', 'Transformação de padrões emocionais limitantes', 'Conexão com memórias profundas e cura de traumas'], 
            contraindicacoes: 'Gravidez: evitar óleos emenagogos (sálvia, alecrim, manjericão) no 1º trimestre, Epilepsia: evitar óleos estimulantes (rosmaninho, hissopo), Hipertensão: evitar óleos hipertensores (alecrim, tomilho), Crianças menores de 2 anos: usar apenas óleos suaves e muito diluídos, Pele sensível: sempre diluir em óleo carreador, nunca aplicar puro, Alergias: fazer teste de sensibilidade antes de usar novo óleo, Animais domésticos: alguns óleos são tóxicos para pets (tea tree para gatos)', 
            campos_formulario: [
                {"label":"Reação Olfativa Inicial","tipo":"texto_curto","campo_associado":"Olfativo","opcoes":[],"instrucoes_praticas":"Apresente 3-5 óleos essenciais em tiras de papel. Peça para inalar cada um separadamente e descrever a primeira sensação/reação. 'O que você sente ao cheirar este óleo?' 'Gosta ou não gosta?' 'Traz alguma memória ou emoção?' Anote EXATAMENTE as palavras usadas: 'Adoro', 'Não suporto', 'Me acalma', 'Me dá náusea', 'Lembra minha avó', etc.","dicas_observacao": null},
                {"label":"Óleos que Mais Ressoaram","tipo":"multipla_escolha","campo_associado":"Emocional","opcoes":["Lavanda","Bergamota","Ylang-ylang","Rosa","Vetiver","Sândalo","Camomila","Gerânio","Laranja Doce","Hortelã-pimenta","Alecrim","Tea Tree","Eucalipto","Cedro","Patchouli","Outros"],"instrucoes_praticas":"Após olfação, pergunte: 'Quais óleos você mais gostou? Escolha até 3.' Deixe a pessoa cheirar novamente se necessário. A escolha intuitiva é SEMPRE a correta - não questione. Anote a ordem de preferência (1º, 2º, 3º).","dicas_observacao":"**Decodificação Emocional dos Óleos:** LAVANDA = precisa de paz, relaxamento, cura emocional. BERGAMOTA = precisa de alegria, otimismo, luz. YLANG-YLANG = precisa reconectar com feminino, sensualidade, amor. ROSA = precisa de amor próprio, cura do coração, compaixão. VETIVER = precisa de aterramento, estabilidade, raízes. SÂNDALO = busca espiritual, meditação, conexão divina. CAMOMILA = precisa de calma, paz interior, alívio de raiva. GERÂNIO = equilíbrio hormonal, feminino sagrado. LARANJA = alegria infantil, criança interior, descontração. HORTELÃ = clareza mental, foco, despertar. ALECRIM = memória, concentração, vitalidade mental. EUCALIPTO = libertação, abrir espaço, respirar. CEDRO = força, proteção, estrutura. Use esses insights para direcionar a conversa terapêutica."},
                {"label":"Estado Emocional Antes da Sessão","tipo":"escala_1_10","campo_associado":"Emocional","opcoes":[],"instrucoes_praticas":"ANTES de qualquer inalação, pergunte: 'Como você se sente emocionalmente AGORA, antes de começarmos?' 'De 1 a 10, onde 1 é muito mal e 10 é muito bem?' Anote o valor e palavras-chave (ansioso, triste, pesado, etc.).","dicas_observacao":"Este é o BASELINE. Você vai comparar com o estado pós-sessão para medir a eficácia. Valores 1-4 = crise emocional, precisa de suporte intenso. Valores 5-7 = flutuações normais. Valores 8-10 = bem emocionalmente. A aromaterapia costuma elevar o estado em 2-4 pontos imediatamente!"},
                {"label":"Estado Emocional Depois da Sessão","tipo":"escala_1_10","campo_associado":"Emocional","opcoes":[],"instrucoes_praticas":"AO FINAL da sessão, pergunte novamente: 'E agora, como você se sente emocionalmente?' 'De 1 a 10?' Compare com o valor inicial. Calcule a diferença.","dicas_observacao":"**Análise:** Se subiu 2+ pontos = aromaterapia está funcionando excelentemente. Se subiu 1 ponto = efeito sutil mas positivo. Se manteve igual = talvez precisou de mais tempo ou blend diferente. Se CAIU = pode indicar crise de cura (emoções reprimidas emergindo) - POSITIVO a longo prazo, mas trabalhe terapeuticamente. Geralmente aromaterapia tem efeito IMEDIATO no humor - é uma das técnicas mais rápidas."},
                {"label":"Qualidade do Sono (última semana)","tipo":"escala_1_10","campo_associado":"Físico","opcoes":[],"instrucoes_praticas":"Pergunte sobre a semana que passou: 'Como tem sido seu sono?' 'De 1 a 10?' Se pessoa já usou aromaterapia em casa desde última sessão, pergunte: 'Notou diferença depois de usar os óleos?'","dicas_observacao":"Lavanda é O ÓLEO do sono (comprovado cientificamente). Se pessoa tem insônia, prescreva: 2-3 gotas de lavanda no travesseiro antes de dormir OU difusor no quarto 30 min antes. Blend sono: Lavanda + Camomila + Cedro. Maioria relata melhora JÁ na primeira noite. Se não melhorar, investigar causas mais profundas (ansiedade severa, apneia, etc.)."},
                {"label":"Nível de Ansiedade/Estresse","tipo":"escala_1_10","campo_associado":"Mental","opcoes":[],"instrucoes_praticas":"'Qual seu nível de ansiedade ou estresse AGORA?' 'De 1 a 10?' Observe: respiração rápida, inquietação, tensão mandibular. Após inalação de óleo calmante, pergunte novamente em 5-10 minutos.","dicas_observacao":"Óleos anti-ansiedade: LAVANDA (número 1), BERGAMOTA (eleva humor), CAMOMILA (acalma), VETIVER (aterra). Blend calmante: 3 gotas lavanda + 2 gotas bergamota + 1 gota vetiver. Efeito é RÁPIDO (3-10 min) porque essências entram direto no sistema límbico via olfato. Se ansiedade não reduzir, talvez pessoa tenha bloqueio olfativo ou precisará de terapia complementar."},
                {"label":"Memórias ou Emoções que Emergiram","tipo":"texto_longo","campo_associado":"Emocional","opcoes":[],"instrucoes_praticas":"Durante ou ao final da olfação, pergunte: 'Alguma memória, imagem ou emoção veio à tona?' Deixe a pessoa compartilhar livremente. NÃO induza, apenas acolha. Aromas acessam memórias profundas do cérebro límbico. Anote detalhadamente o que for compartilhado.","dicas_observacao":"**MUITO IMPORTANTE:** Olfato é o sentido ligado DIRETAMENTE ao sistema límbico (memória + emoção). Aromas podem trazer: memórias da infância, traumas esquecidos, pessoas falecidas, momentos significativos. Se pessoa começa a CHORAR = excelente liberação emocional! Acolha com compaixão. Se surgem memórias traumáticas fortes, pode ser necessário encaminhar para psicoterapia complementar. ROSA frequentemente traz questões de amor/abandono. LAVANDA traz memórias de cuidado materno. ÓLEOS AMADEIRADOS (cedro, sândalo) trazem figura paterna. Documente tudo - são informações preciosíssimas para o processo terapêutico."},
                {"label":"Sensações Físicas Durante Sessão","tipo":"texto_longo","campo_associado":"Físico","opcoes":[],"instrucoes_praticas":"Pergunte: 'Que sensações você teve no corpo durante a sessão?' (se fez massagem aromática, inalação ou difusão). Calor, frio, formigamento, relaxamento muscular, respiração profunda, peso, leveza? Anote.","dicas_observacao":"CALOR = circulação ativada, óleos penetrando (comum com gengibre, canela, alecrim). FRIO/REFRESCÂNCIA = óleos como hortelã, eucalipto. FORMIGAMENTO = ativação energética. RESPIRAÇÃO PROFUNDA AUTOMÁTICA = sistema nervoso relaxando. SONO/TORPOR = relaxamento profundo (ótimo). TONTURA LEVE = pode ser inalação muito intensa - ventilar. NÁUSEA = possível reação alérgica ou óleo muito forte - parar e oferecer água. Maioria das pessoas sente RELAXAMENTO PROFUNDO com óleos calmantes."}
            ] 
        },
        { 
            id: '4', 
            nome: 'Radiestesia Clínica', 
            categoria: 'Energético',
            tipo_visualizacao_sugerido: 'radar',
            nivel_dificuldade: 'Intermediário', 
            duracao_media: '45-60min', 
            descricao: 'Avaliação energética e vibracional de alta precisão para identificar desequilíbrios sutis através de instrumentos radiestésicos como pêndulos e varetas. Técnica milenar que permite o terapeuta acessar informações do campo bioenergético do paciente.', 
            beneficios: ['Identificação precisa de desequilíbrios energéticos antes de se manifestarem fisicamente', 'Detecção de bloqueios em chakras e meridianos', 'Avaliação de compatibilidade com alimentos, remédios e terapias', 'Medição de níveis vibracionais do paciente', 'Identificação de causas profundas de sintomas persistentes', 'Orientação para escolha de cristais, florais e essências adequadas', 'Avaliação do campo áurico e suas camadas', 'Detecção de energias densas ou entidades que possam estar influenciando', 'Mensuração do progresso terapêutico de forma objetiva', 'Auxílio na tomada de decisões terapêuticas personalizadas'], 
            contraindicacoes: 'Não substitui diagnóstico médico convencional, Sempre complementar exames laboratoriais com avaliação radiestésica, O terapeuta deve estar centrado e neutro - estados emocionais alterados podem influenciar as leituras, Evitar em ambientes com muitas interferências eletromagnéticas', 
            campos_formulario: [
                {"label":"Nível Vibracional Geral (Escala Bovis)","tipo":"escala_1_10","campo_associado":"Vibracional","instrucoes_praticas":"Use o pêndulo sobre o gráfico de Bovis posicionado no centro do peito do paciente. Pergunte mentalmente: 'Qual o nível vibracional atual desta pessoa?' Observe onde o pêndulo aponta. Converta para escala 1-10: até 6.500 Bovis = nível 1-3 (baixo), 6.500-8.000 = 4-6 (médio), acima de 8.000 = 7-10 (alto).","dicas_observacao":"Níveis baixos (1-4) indicam depleção energética severa, possível presença de energias densas. Médios (5-7) são normais para maioria das pessoas urbanas. Altos (8-10) indicam boa saúde vibracional. Monitorar evolução - deve aumentar gradualmente com tratamento."},
                {"label":"Estado dos 7 Chakras Principais","tipo":"texto_curto","campo_associado":"Energético","instrucoes_praticas":"Com pêndulo sobre cada chakra, pergunte: 'Qual a porcentagem de abertura/funcionamento deste chakra?' Anote: Coronário, Frontal, Laríngeo, Cardíaco, Plexo Solar, Sacral, Básico. Use escala 0-100%. Observe também sentido de giro (horário=equilibrado, anti-horário=desequilibrado, parado=bloqueado).","dicas_observacao":"Chakras abaixo de 50% precisam atenção urgente. Bloqueios completos (0-20%) indicam trauma ou questão profunda. Observe padrões: bloqueio no coração geralmente relaciona-se a mágoas; plexo solar a poder pessoal; básico a sobrevivência/segurança. Anote qual precisa mais trabalho."},
                {"label":"Órgãos ou Sistemas em Desequilíbrio","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"Use gráfico de anatomia ou desenho do corpo. Passe pêndulo sobre cada sistema perguntando: 'Este sistema está em equilíbrio?' Anote onde receber NÃO. Investigue profundidade: 'É desequilíbrio energético, emocional ou físico?' Liste todos os pontos identificados com nível de prioridade.","dicas_observacao":"Fígado frequentemente aparece em quem retém raiva. Pulmões em questões de tristeza/luto. Rins em medos profundos. Estômago em ansiedade. Sempre correlacione órgão físico com significado emocional/energético. Priorize top 3 para trabalhar primeiro."},
                {"label":"Presença de Bloqueios Energéticos ou Miasmas","tipo":"multipla_escolha","campo_associado":"Energético","opcoes":["Nenhum bloqueio","Bloqueios leves","Bloqueios moderados","Bloqueios severos","Presença de miasmas"],"instrucoes_praticas":"Pergunte ao pêndulo: 'Existem bloqueios energéticos neste paciente?' Se SIM, pergunte gravidade usando as opções. Depois identifique localização: 'O bloqueio está no campo etérico? Emocional? Mental?' Anote localização e intensidade em cada camada do campo áurico.","dicas_observacao":"Bloqueios leves resolvem com 1-2 sessões de limpeza. Moderados precisam 4-6 sessões. Severos ou miasmas (energias muito densas/antigas) podem requerer 8-12 sessões + trabalho multidimensional. Miasmas geralmente são hereditários ou de vidas passadas - considerar terapias como Apometria."},
                {"label":"Compatibilidade com Tratamentos Propostos","tipo":"texto_longo","campo_associado":"Vibracional","instrucoes_praticas":"Liste terapias/remédios/florais que considera indicar. Para cada um, segure amostra ou escreva nome em papel, coloque perto do paciente e pergunte: 'Este tratamento é compatível e benéfico agora?' Anote SIM, NÃO ou NEUTRO. Teste também dosagem e frequência ideais.","dicas_observacao":"Nem sempre o que parece óbvio é o indicado. Confie na radiestesia. Se algo der NÃO, pergunte: 'Será indicado no futuro?' ou 'Existe algo melhor?' Paciente pode não estar pronto vibrationalmente para certa terapia - respeite o timing. Reavalie periodicamente."},
                {"label":"Causas Profundas do Desequilíbrio","tipo":"texto_longo","campo_associado":"Emocional","instrucoes_praticas":"Após mapear sintomas, investigue causas perguntando: 'A causa é física? Emocional? Mental? Espiritual? Ancestral? De vida passada?' Use lista de emoções (raiva, medo, culpa, mágoa, etc.) e teste uma por uma. Pergunte também: 'Há questão familiar envolvida?' Anote tudo.","dicas_observacao":"Causas raramente são apenas físicas. Doenças crônicas quase sempre têm raiz emocional/espiritual. Questões familiares aparecem muito - considere Constelação. Vida passada ou ancestral requer trabalhos mais profundos. Sempre trate causa raiz, não só sintoma. Seja delicado ao comunicar ao paciente."},
                {"label":"Nível de Estresse e Sobrecarga Mental","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"Posicione pêndulo sobre a cabeça do paciente (área do chakra coronário e frontal). Pergunte: 'Qual o nível de estresse mental desta pessoa, de 1 a 10?' Observe também se há pensamentos obsessivos, preocupações excessivas ou confusão mental perguntando especificamente sobre cada aspecto.","dicas_observacao":"Níveis acima de 7 indicam sobrecarga severa - risco de burnout. Recomende práticas de meditação, florais para mente (White Chestnut, Vervain) e redução de estímulos. Pensamentos obsessivos aparecem como giro rápido do pêndulo. Confusão mental como oscilação errática. Priorize acalmar a mente antes de trabalhar outros aspectos."},
                {"label":"Abertura e Receptividade ao Tratamento","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"Pergunte ao pêndulo: 'Qual o nível de abertura e receptividade deste paciente ao tratamento proposto, de 1 a 10?' Avalie também se há resistências inconscientes, crenças limitantes ou sabotagem interna perguntando: 'Existem resistências bloqueando a cura?' Se SIM, investigue quais.","dicas_observacao":"Níveis baixos (1-4) indicam ceticismo ou resistência - eduque o paciente, construa confiança. Médios (5-7) são normais - paciente aberto mas ainda com dúvidas. Altos (8-10) excelente prognóstico. Se detectar resistência inconsciente, trabalhe crenças antes de aplicar outras terapias. Pessoa pode não estar pronta para curar-se (ganho secundário da doença)."}
            ] 
        },
        { 
            id: '5',
            nome: 'Florais de Bach', 
            categoria: 'Emocional',
            tipo_visualizacao_sugerido: 'area',
            nivel_dificuldade: 'Iniciante', 
            duracao_media: '45-60min', 
            descricao: 'Sistema terapêutico vibracional desenvolvido pelo Dr. Edward Bach nos anos 1930, utilizando 38 essências florais para equilibrar estados emocionais e padrões comportamentais. Cada floral trabalha uma emoção específica, promovendo harmonia mental e emocional profunda.', 
            beneficios: ['Equilíbrio emocional rápido e duradouro', 'Redução de ansiedade, medo e preocupações excessivas', 'Transformação de padrões comportamentais negativos', 'Aumento da autoconfiança e autoestima', 'Alívio de traumas emocionais e choques', 'Melhora na gestão do estresse diário', 'Clareza mental e foco aumentados', 'Auxílio em processos de mudança e transição', 'Harmonização de relacionamentos interpessoais', 'Suporte emocional em doenças físicas'], 
            contraindicacoes: 'Não há contraindicações - seguros para todas as idades, Podem ser usados em bebês, crianças, adultos, idosos, Seguros durante gravidez e amamentação, Não interagem com medicamentos, Não causam dependência ou efeitos colaterais, Diabéticos: versões sem álcool disponíveis (glicerina)', 
            campos_formulario: [
                { label: 'Estado Emocional Predominante', tipo: 'texto_longo', campo_associado: 'Emocional', instrucoes_praticas: 'Peça ao paciente para descrever o sentimento mais presente. Observe a linguagem corporal e tom de voz.', dicas_observacao: 'Identifique padrões e emoções recorrentes. O floral ideal será aquele que ressoa com a emoção predominante.' },
                { label: 'Intensidade do Desequilíbrio Emocional', tipo: 'escala_1_10', campo_associado: 'Emocional', instrucoes_praticas: 'Avalie de 1 (equilibrado) a 10 (muito desequilibrado). Observe sinais de estresse, ansiedade ou tristeza profunda.', dicas_observacao: 'Scores altos (8-10) indicam necessidade de florais de emergência (Rescue Remedy).' },
                { label: 'Medos Específicos Identificados', tipo: 'texto_longo', campo_associado: 'Mental', instrucoes_praticas: 'Pergunte sobre medos conscientes ou inconscientes. Pode ser medo de altura, de falhar, de ser abandonado, etc.', dicas_observacao: 'Anote medos específicos que surgirem na conversa. Podem indicar necessidade de florais como Mimulus, Aspen, Red Chestnut.' },
                { label: 'Padrões Comportamentais Negativos', tipo: 'texto_longo', campo_associado: 'Comportamental', instrucoes_praticas: 'Identifique hábitos ou reações indesejadas. Ex: procrastinação, irritabilidade, isolamento.', dicas_observacao: 'Padrões repetitivos indicam necessidade de florais comportamentais como Pine, Willow, Oak.' },
                { label: 'Nível de Autoestima e Autoconfiança', tipo: 'escala_1_10', campo_associado: 'Emocional', instrucoes_praticas: 'Avalie de 1 (muito baixa) a 10 (muito alta). Observe a postura, contato visual e a forma como o paciente se descreve.', dicas_observacao: 'Baixa autoestima (1-4) indica necessidade de florais como Larch, Crab Apple, Cerato.' },
                { label: 'Situações de Trauma ou Choque Recente', tipo: 'texto_longo', campo_associado: 'Emocional', instrucoes_praticas: 'Pergunte sobre eventos estressantes recentes: perdas, acidentes, mudanças drásticas.', dicas_observacao: 'Traumas recentes exigem florais de choque como Star of Bethlehem, Rescue Remedy, Cherry Plum.' },
                { label: 'Capacidade de Adaptação a Mudanças', tipo: 'escala_1_10', campo_associado: 'Comportamental', instrucoes_praticas: 'Avalie de 1 (muita dificuldade) a 10 (muita facilidade). Observe a flexibilidade do paciente diante de imprevistos.', dicas_observacao: 'Resistência a mudanças indica necessidade de florais como Walnut, Willow, Honeysuckle.' },
                { label: 'Qualidade das Relações Interpessoais', tipo: 'escala_1_10', campo_associado: 'Social', instrucoes_praticas: 'Avalie de 1 (muito problemáticas) a 10 (muito saudáveis). Pergunte sobre relações familiares, de trabalho e amizades.', dicas_observacao: 'Dificuldades relacionais podem indicar necessidade de florais como Beech, Chicory, Heather, Vine.' }
            ]
        },
        {
            id: '6',
            nome: 'Aromaterapia Energética',
            categoria: 'Emocional',
            tipo_visualizacao_sugerido: 'line',
            nivel_dificuldade: 'Intermediário',
            duracao_media: '45-60min',
            descricao: 'Uso terapêutico avançado de óleos essenciais puros para influenciar estados emocionais, energéticos e vibracionais. Cada óleo possui frequência específica que interage com chakras, sistema límbico e campo bioenergético, promovendo cura em múltiplas dimensões.', 
            beneficios: ['Equilíbrio emocional imediato através do olfato', 'Redução de ansiedade e estresse em até 60%', 'Ativação de memórias positivas e cura de traumas', 'Harmonização de chakras através de frequências aromáticas', 'Melhora da qualidade do sono e relaxamento profundo', 'Aumento da vibração energética pessoal', 'Alívio de sintomas de depressão leve', 'Fortalecimento do sistema imunológico', 'Clareza mental e foco aumentados', 'Transformação de padrões emocionais através do olfato'], 
            contraindicacoes: 'Gestantes: evitar óleos de canela, cravo, alecrim e sálvia, Epilepsia: evitar óleos estimulantes como alecrim e eucalipto, Hipertensão: evitar óleos estimulantes, Asma: usar com cautela óleos muito intensos, Sempre diluir óleos essenciais - nunca usar puros na pele, Teste de alergia obrigatório antes do uso, Crianças menores de 3 anos: uso restrito e sempre diluído', 
            campos_formulario: [
                {"label":"Resposta Emocional ao Óleo (Lavanda)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Ofereça tira de papel com lavanda. Observe PRIMEIRA REAÇÃO facial. Pergunte: 'Como se sente ao cheirar (1-10)?'. Anote micro-expressões: relaxamento, tensão, aversão, prazer.","dicas_observacao":"1-3: Aversão, rejeição. 4-6: Neutro. 7-8: Agradável. 9-10: Amor, reconexão. Aversão pode indicar trauma associado."},
                {"label":"Nível de Estresse Percebido","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Antes da sessão, pergunte: 'Qual seu nível de estresse agora (1-10)?'. Observe tensão muscular, respiração acelerada, inquietação, expressão facial tensa.","dicas_observacao":"1-3: Relaxado. 4-6: Estresse moderado. 7-8: Alto estresse. 9-10: Exaustão, burnout iminente."},
                {"label":"Qualidade do Sono (Última Semana)","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte detalhes: 'Como foi seu sono nos últimos 7 dias (1-10)?'. Investigue: quantas horas, acordou durante a noite, sonhos, despertar. Olheiras e cansaço visível são indicadores.","dicas_observacao":"1-3: Insônia severa. 4-6: Sono fragmentado. 7-8: Bom sono. 9-10: Sono reparador e profundo."},
                {"label":"Vitalidade Energética","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Qual seu nível de energia vital hoje (1-10)?'. Observe postura, voz (forte ou fraca), movimentos (lentos ou vigorosos), brilho nos olhos.","dicas_observacao":"1-3: Exausto, sem energia. 4-6: Energia moderada. 7-8: Boa energia. 9-10: Vitalidade plena, radiante."},
                {"label":"Conexão com Memórias Positivas","tipo":"escala_1_10","campo_associado":"Olfativo","instrucoes_praticas":"COMO AVALIAR: Após inalação dos óleos, pergunte: 'Consegue acessar memórias positivas agora (1-10)?'. Observe se o paciente sorri, relaxa, relata lembranças felizes. Aromas ativam memórias límbicas.","dicas_observacao":"1-3: Bloqueio total. 4-6: Algumas memórias. 7-8: Fácil acesso. 9-10: Memórias vívidas e emocionantes."}
            ] 
        },
        {
            id: '7',
            nome: 'Cromoterapia', 
            categoria: 'Energético',
            tipo_visualizacao_sugerido: 'chakra_bar',
            nivel_dificuldade: 'Iniciante',
                        duracao_media: '30-45min', 
                        descricao: 'Uso terapêutico científico das cores e suas frequências específicas para equilibrar centros energéticos, estados emocionais e sistemas orgânicos. Cada cor possui comprimento de onda único que interage com chakras e células, promovendo cura em múltiplos níveis.', 
                        beneficios: ['Harmonização e ativação dos 7 chakras principais', 'Equilíbrio emocional através de frequências cromáticas', 'Estímulo da regeneração celular', 'Redução de dores através de cores específicas', 'Melhora do humor e energia vital', 'Regulação do ritmo circadiano (azul)', 'Estímulo da circulação sanguínea (vermelho)', 'Relaxamento profundo e redução de ansiedade (verde/azul)', 'Aumento de criatividade e expressão (laranja)', 'Purificação energética e transmutação (violeta)'], 
                        contraindicacoes: 'Epilepsia fotossensível: cuidado com luzes piscantes, Hipertensão severa: evitar vermelho em excesso, Hipotensão: evitar azul em excesso, Mania ou hipomania: evitar cores estimulantes (vermelho, laranja), Gestantes: usar com cautela cores muito estimulantes, Sempre usar tempos adequados de exposição', 
                        campos_formulario: [
                            {"label":"Estado do Chakra Raiz (Vermelho)","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Pêndulo sobre chakra raiz (base da coluna). Pergunte: 'Nível de equilíbrio (1-10)?'. Investigue: sensação de segurança, enraizamento, questões financeiras, saúde óssea. Observe ansiedade e medo.","dicas_observacao":"1-3: Bloqueado, medo, insegurança. 4-6: Parcialmente aberto. 7-8: Equilibrado. 9-10: Plenamente ativado e enraizado."},
                            {"label":"Nível de Vitalidade e Motivação (Laranja)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Qual seu nível de motivação para viver (1-10)?'. Observe entusiasmo ao falar, expressão facial, energia ao se movimentar. Chakra sacral: criatividade, sexualidade, prazer.","dicas_observacao":"1-3: Deprimido, sem motivação. 4-6: Motivação moderada. 7-8: Motivado e criativo. 9-10: Entusiasmado, apaixonado pela vida."},
                            {"label":"Autoconfiança e Poder Pessoal (Amarelo)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Qual sua autoconfiança hoje (1-10)?'. Observe postura ereta, voz firme, capacidade de tomar decisões. Chakra plexo solar: autoestima, força de vontade.","dicas_observacao":"1-3: Inseguro, submisso. 4-6: Confiança moderada. 7-8: Confiante. 9-10: Empoderado, forte."},
                            {"label":"Capacidade de Amar e Perdoar (Verde)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Consegue perdoar e amar incondicionalmente (1-10)?'. Investigue mágoas, ressentimentos. Observe se toca o peito ao falar de emoções. Chakra cardíaco.","dicas_observacao":"1-3: Mágoas profundas, coração fechado. 4-6: Algumas dificuldades. 7-8: Amoroso. 9-10: Amor incondicional."},
                            {"label":"Clareza de Comunicação (Azul)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Observe durante conversa: clareza ao se expressar, voz (fraca/forte), capacidade de dizer 'não', autenticidade. Chakra laríngeo: comunicação e verdade pessoal.","dicas_observacao":"1-3: Voz fraca, não se expressa. 4-6: Comunicação moderada. 7-8: Comunica-se bem. 9-10: Expressão clara e autêntica."}
                        ] 
        },
        {
            id: '8',
            nome: 'ThetaHealing', 
            categoria: 'Mental',
            tipo_visualizacao_sugerido: 'bar',
            nivel_dificuldade: 'Avançado',
                        duracao_media: '60-90min', 
                        descricao: 'Técnica avançada de meditação e cura quântica que acessa o estado theta cerebral (4-7 Hz) para promover mudanças instantâneas em crenças limitantes, traumas e padrões de DNA. Desenvolvida por Vianna Stibal, permite reprogramação profunda da mente subconsciente.', 
                        beneficios: ['Mudança instantânea de crenças limitantes', 'Cura de traumas emocionais profundos', 'Reprogramação de padrões genéticos (epigenética)', 'Libertação de votos, promessas e juramentos de vidas passadas', 'Cura de relacionamentos através da mudança de percepção', 'Manifestação acelerada de objetivos e sonhos', 'Conexão profunda com o Criador/Fonte', 'Aumento de intuição e dons espirituais', 'Cura física através da mudança de frequência celular', 'Transformação de autossabotagem em autorrealização'], 
                        contraindicacoes: 'Pacientes com transtornos psicóticos agudos não controlados, Esquizofrenia severa sem acompanhamento médico, Pessoas em crise psiquiátrica aguda, Pacientes que não acreditam na técnica (resistência total), Sempre complementar, nunca substituir tratamento psiquiátrico, Requer abertura e vontade de mudança do paciente', 
                        campos_formulario: [
                            {"label":"Intensidade da Crença Limitante (Antes)","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Após identificar a crença (ex: 'Não mereço ser feliz'), pergunte: 'O quanto você ACREDITA nisso (1-10)?'. Observe reação emocional ao falar da crença. Faça teste muscular para confirmar.","dicas_observacao":"1-3: Crença fraca. 4-6: Crença moderada. 7-8: Crença forte. 9-10: Crença central, muito enraizada."},
                            {"label":"Resultado do Teste Muscular (Antes)","tipo":"multipla_escolha","campo_associado":"Mental","opcoes":["Forte (crença presente)","Fraco (crença ausente)"],"instrucoes_praticas":"COMO AVALIAR: Paciente com braço estendido. Diga a crença limitante. Pressione o braço. FORTE = crença presente no subconsciente. FRACO = crença ausente.","dicas_observacao":"Teste SEMPRE antes e depois da mudança. Garante que a crença foi realmente transmutada."},
                            {"label":"Resultado do Teste Muscular (Depois)","tipo":"multipla_escolha","campo_associado":"Mental","opcoes":["Forte (nova crença integrada)","Fraco (mudança incompleta)"],"instrucoes_praticas":"COMO AVALIAR: Após comando de mudança, teste a NOVA crença positiva. Braço deve ficar FORTE. Se ficar fraco, repetir o processo ou ensinar o sentimento.","dicas_observacao":"FORTE = sucesso na mudança. FRACO = resistência, necessário trabalho adicional."},
                            {"label":"Nível de Resistência à Mudança","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Observe hesitação, justificativas, 'mas...'. Pergunte: 'Você REALMENTE quer mudar isso (1-10)?'. 10 = total abertura. 1 = resistência total. Resistência alta indica ganho secundário.","dicas_observacao":"1-3: Muita resistência, ganhos secundários. 4-6: Ambivalência. 7-8: Abertura. 9-10: Total vontade de mudar."},
                            {"label":"Bem-Estar Após Sessão","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Ao final, pergunte: 'Como se sente agora (1-10)?'. Observe expressão facial, postura, brilho nos olhos, leveza. Mudança drástica indica sucesso.","dicas_observacao":"1-3: Ainda pesado. 4-6: Leve melhora. 7-8: Bem melhor. 9-10: Leve, renovado, transformado."}
                        ] 
        },
        {
            id: '9',
            nome: 'Mapa Astral Terapêutico', 
            categoria: 'Espiritual',
            tipo_visualizacao_sugerido: 'radar',
            nivel_dificuldade: 'Avançado',
                        duracao_media: '90-120min', 
                        descricao: 'Análise astrológica profunda personalizada para identificar ciclos cósmicos de impacto, transições planetárias, padrões kármicos e potenciais de saúde física, emocional e espiritual. Ferramenta poderosa de autoconhecimento e planejamento terapêutico.', 
                        beneficios: ['Compreensão profunda de padrões de personalidade e comportamento', 'Identificação de talentos naturais e propósito de vida', 'Reconhecimento de desafios kármicos e lições de alma', 'Previsão de ciclos favoráveis para tratamentos e mudanças', 'Entendimento de questões de saúde através de planetas e casas', 'Clareza sobre relacionamentos e dinâmicas familiares', 'Timing ideal para decisões importantes', 'Integração de aspectos sombrios da personalidade', 'Reconexão com missão de alma', 'Planejamento estratégico de vida baseado em trânsitos'], 
                        contraindicacoes: 'Não deve ser usado como única ferramenta de diagnóstico de saúde, Evitar criar dependência ou determinismo (\'está escrito nas estrelas\'), Não substitui tratamentos médicos ou psicológicos, Cuidado com interpretações que geram medo ou ansiedade, Sempre empoderar o livre-arbítrio do cliente, Não fazer previsões categóricas sobre morte ou doenças graves', 
                        campos_formulario: [
                            {"label":"Consciência de Propósito de Vida","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Você sente clareza sobre seu propósito nesta vida (1-10)?'. Observe se a pessoa parece perdida, confusa ou conectada. Analise Sol, Lua, Ascendente e Nodo Norte no mapa.","dicas_observacao":"1-3: Totalmente perdido. 4-6: Algumas pistas. 7-8: Boa clareza. 9-10: Missão clara e em ação."},
                            {"label":"Intensidade de Desafios Kármicos Atuais","tipo":"escala_1_10","campo_associado":"Kármico","instrucoes_praticas":"COMO AVALIAR: Analise Saturno, Plutão, Nodo Sul e Casa 12. Veja trânsitos atuais difíceis (quadraturas, oposições). Pergunte sobre repetições de padrões. 10 = muitos desafios pesados. 1 = fluindo tranquilo.","dicas_observacao":"1-3: Fase tranquila. 4-6: Desafios moderados. 7-8: Período intenso. 9-10: Crise kármica profunda."},
                            {"label":"Potencial de Saúde (Casa 6 e Planetas)","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Analise Casa 6, planetas em Virgem, aspectos a Saturno e Marte. Planetas retrógrados na Casa 6 indicam questões crônicas. Júpiter na 6: boa saúde. Saturno: vulnerabilidades. Escala: 10 = saúde excelente, 1 = frágil.","dicas_observacao":"1-3: Tendências a doenças. 4-6: Saúde moderada. 7-8: Boa vitalidade. 9-10: Saúde vibrante."},
                            {"label":"Facilidade em Relacionamentos (Vênus e Casa 7)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Analise Vênus, Casa 7, aspectos Vênus-Saturno (dificuldades), Vênus-Júpiter (facilidade). Pergunte sobre histórico de relacionamentos. 10 = relaciona-se com facilidade. 1 = muitas dificuldades.","dicas_observacao":"1-3: Padrões destrutivos. 4-6: Desafios moderados. 7-8: Boas relações. 9-10: Relacionamentos harmoniosos."},
                            {"label":"Momento Atual de Transformação (Trânsitos)","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Veja trânsitos de planetas lentos (Saturno, Urano, Netuno, Plutão) sobre planetas natais. Quadraturas e oposições = transformação intensa. Trígonos = facilidade. 10 = mudanças profundas. 1 = estável.","dicas_observacao":"1-3: Estabilidade. 4-6: Pequenas mudanças. 7-8: Transformações significativas. 9-10: Crise transformadora."}
                        ] 
        },
        {
            id: '10',
            nome: 'Terapia Frequencial com Som', 
            categoria: 'Vibracional',
            tipo_visualizacao_sugerido: 'line',
            nivel_dificuldade: 'Iniciante',
                        duracao_media: '30-60min', 
                        descricao: 'Aplicação científica de frequências sonoras específicas (Hz) para harmonização vibracional celular, relaxamento profundo do sistema nervoso e reprogramação de padrões energéticos através de ressonância acústica terapêutica.', 
                        beneficios: ['Redução imediata de estresse e ansiedade', 'Sincronização das ondas cerebrais (alfa, theta, delta)', 'Regeneração celular através de frequências específicas', 'Alívio de dores crônicas por vibração sonora', 'Harmonização profunda dos chakras', 'Melhora da qualidade do sono', 'Aumento de concentração e clareza mental', 'Liberação de bloqueios emocionais através do som', 'Elevação da frequência vibracional pessoal', 'Equilíbrio do sistema nervoso autônomo'], 
                        contraindicacoes: 'Epilepsia: evitar frequências pulsantes rápidas, Marcapasso: consultar médico antes, Zumbido severo: usar volumes baixos, Gestantes: evitar frequências muito graves, Pessoas com implantes cocleares: cautela, Volume SEMPRE moderado - nunca alto', 
                        campos_formulario: [
                            {"label":"Nível de Tensão Muscular","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Palpe ombros, pescoço, mandíbula. Pergunte: 'Nível de tensão (1-10)?'. Observe postura rígida, movimentos restritos.","dicas_observacao":"1-3: Relaxado. 4-6: Tensão moderada. 7-8: Muito tenso. 9-10: Contratura severa."},
                            {"label":"Qualidade das Ondas Cerebrais (Estado Mental)","tipo":"multipla_escolha","campo_associado":"Mental","opcoes":["Beta (alerta/ansioso)","Alfa (relaxado)","Theta (meditativo)","Delta (sono profundo)"],"instrucoes_praticas":"COMO AVALIAR: Observe estado do paciente. Beta: olhos abertos, agitado. Alfa: relaxado, olhos fechados. Theta: meditação profunda. Delta: dormindo.","dicas_observacao":"Objetivo: levar de Beta para Alfa/Theta durante sessão."},
                            {"label":"Resposta à Frequência 432Hz (Ancoragem)","tipo":"escala_1_10","campo_associado":"Vibracional","instrucoes_praticas":"COMO AVALIAR: Após 10 min de 432Hz, pergunte: 'Como se sente (1-10)?'. Observe respiração mais lenta, expressão facial relaxada.","dicas_observacao":"1-3: Desconforto. 4-6: Neutro. 7-8: Agradável. 9-10: Profundo relaxamento."},
                            {"label":"Nível de Ansiedade Antes da Sessão","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Ansiedade agora (1-10)?'. Observe inquietação, respiração rápida, fala acelerada, mãos tremendo.","dicas_observacao":"1-3: Calmo. 4-6: Ansiedade leve. 7-8: Ansiedade moderada. 9-10: Pânico."},
                            {"label":"Nível de Ansiedade Após Sessão","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Após sessão, pergunte novamente. Compare com valor inicial. Redução de 3+ pontos = sucesso terapêutico.","dicas_observacao":"Objetivo: redução significativa do valor inicial."}
                        ] 
                    },
        {
            id: '11',
            nome: 'Terapia com Geometrias Sagradas', 
            categoria: 'Energético',
            tipo_visualizacao_sugerido: 'mandala',
            nivel_dificuldade: 'Intermediário',
                    duracao_media: '45-60min', 
                    descricao: 'Aplicação terapêutica de padrões geométricos universais (Flor da Vida, Metatron, Proporção Áurea) para ativação celular, reconexão cósmica e harmonização através de códigos matemáticos presentes na natureza e no universo.', 
                    beneficios: ['Ativação de códigos de DNA adormecidos', 'Harmonização celular através de padrões perfeitos', 'Reconexão com geometria sagrada universal', 'Equilíbrio energético profundo', 'Expansão de consciência e percepção', 'Proteção energética através de geometrias', 'Manifestação acelerada pela Lei da Atração', 'Cura de padrões desarmônicos', 'Conexão com inteligência cósmica', 'Regeneração através de proporções áureas'], 
                    contraindicacoes: 'Pessoas muito céticas podem não ressoar, Evitar em casos de psicose aguda, Requer abertura mental e espiritual, Não forçar em quem não está pronto, Sempre respeitar o tempo de cada um', 
                    campos_formulario: [
                        {"label":"Nível de Ativação Energética","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Use pêndulo sobre o chakra cardíaco antes e após geometrias. Pergunte: 'Nível de ativação (1-10)?'. Observe também: formigamentos, calor, sensações no corpo.","dicas_observacao":"1-3: Energia baixa. 4-6: Moderada. 7-8: Alta ativação. 9-10: Ativação profunda."},
                        {"label":"Conexão com a Geometria (Flor da Vida)","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"COMO AVALIAR: Após visualização da Flor da Vida, pergunte: 'Sentiu conexão/ressonância (1-10)?'. Observe emoção, lágrimas, arrepios.","dicas_observacao":"1-3: Sem conexão. 4-6: Leve. 7-8: Forte ressonância. 9-10: Experiência transcendental."},
                        {"label":"Sensações Físicas Durante Aplicação","tipo":"multipla_escolha","campo_associado":"Vibracional","opcoes":["Calor","Formigamento","Vibração","Expansão","Leveza","Nenhuma"],"instrucoes_praticas":"COMO AVALIAR: Durante aplicação das geometrias, pergunte: 'O que está sentindo?'. Marque todas as opções relatadas.","dicas_observacao":"Múltiplas sensações indicam forte ativação. 'Nenhuma' pode indicar bloqueio."},
                        {"label":"Clareza de Propósito Após Sessão","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Sua clareza sobre seu caminho agora (1-10)?'. Geometrias ativam compreensão de propósito.","dicas_observacao":"1-3: Confuso. 4-6: Alguma clareza. 7-8: Claro. 9-10: Clareza cristalina."},
                        {"label":"Frequência Vibracional (Escala Bovis)","tipo":"escala_1_10","campo_associado":"Vibracional","instrucoes_praticas":"COMO AVALIAR: Use pêndulo com escala Bovis. Antes e após sessão. Medir UB (Unidades Bovis). Converter para escala 1-10.","dicas_observacao":"1-3: Baixa vibração. 4-6: Neutra. 7-8: Alta. 9-10: Muito elevada."}
                    ] 
                },
                { 
            id: '12', 
            nome: 'Cristaloterapia',
            categoria: 'Energético',
            tipo_visualizacao_sugerido: 'chakra_bar',
            nivel_dificuldade: 'Intermediário',
                    duracao_media: '60-90min', 
                    descricao: 'Terapia vibracional ancestral através da aplicação terapêutica de cristais e pedras preciosas para harmonização energética profunda, cura de traumas e expansão da consciência. Cada cristal possui frequência única que ressoa com chakras e campo bioenergético.', 
                    beneficios: ['Harmonização profunda dos 7 chakras', 'Limpeza e fortalecimento do campo áurico', 'Transmutação de energias densas', 'Proteção energética potente', 'Cura de traumas emocionais através de ressonância', 'Ativação de capacidades intuitivas', 'Ancoragem e enraizamento (pedras escuras)', 'Expansão de consciência (ametista, quartzo)', 'Equilíbrio emocional e mental', 'Regeneração celular através de frequências'], 
                    contraindicacoes: 'Não há contraindicações físicas, Pessoas muito céticas podem não sentir efeitos, Evitar cristais muito estimulantes à noite (citrino, cornalina), Cristais absorvem energias - limpeza constante é essencial, Respeitar tempo de adaptação com cristais intensos', 
                    campos_formulario: [
                        {"label":"Estado do Chakra Raiz (Obsidiana/Turmalina)","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Pêndulo sobre chakra raiz antes/após cristal. Pergunte: 'Equilíbrio (1-10)?'. Observe: sensação de segurança, enraizamento, estabilidade.","dicas_observacao":"1-3: Bloqueado, medo. 4-6: Parcialmente aberto. 7-8: Equilibrado. 9-10: Plenamente ativado."},
                        {"label":"Resposta ao Cristal de Quartzo Rosa (Coração)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Após aplicação no chakra cardíaco, pergunte: 'Sensação de amor/abertura (1-10)?'. Observe: lágrimas, emoção, suspiros, relaxamento do peito.","dicas_observacao":"1-3: Bloqueio. 4-6: Leve abertura. 7-8: Boa abertura. 9-10: Coração expandido, amor."},
                        {"label":"Nível de Proteção Energética","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Após cristais de proteção (turmalina negra, obsidiana), pergunte: 'Sente-se protegido (1-10)?'. Use pêndulo para medir campo áurico.","dicas_observacao":"1-3: Vulnerável. 4-6: Alguma proteção. 7-8: Bem protegido. 9-10: Campo forte e selado."},
                        {"label":"Clareza Mental (Ametista no 3º Olho)","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Após ametista no 3º olho, pergunte: 'Clareza mental agora (1-10)?'. Observe: foco, insights, visões, compreensões súbitas.","dicas_observacao":"1-3: Confuso. 4-6: Alguma clareza. 7-8: Claro. 9-10: Clarividência, insights profundos."},
                        {"label":"Sensações Físicas Durante Sessão","tipo":"multipla_escolha","campo_associado":"Vibracional","opcoes":["Calor","Frio","Formigamento","Peso","Leveza","Vibração","Nenhuma"],"instrucoes_praticas":"COMO AVALIAR: Durante sessão, pergunte periodicamente: 'O que está sentindo?'. Anote todas as sensações. Cristais ativos geram sensações.","dicas_observacao":"Múltiplas sensações = boa ressonância. 'Nenhuma' pode indicar bloqueio ou cristal inadequado."}
                    ] 
                },
                { 
            id: '13', 
            nome: 'Astrologia Quântica', 
            categoria: 'Espiritual',
            tipo_visualizacao_sugerido: 'radar',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '90-120min', 
                    descricao: 'Análise astrológica avançada integrada com campos quânticos, padrões energéticos pessoais e leitura multidimensional para compreensão profunda de propósito de alma, timing cósmico e potenciais de manifestação.', 
                    beneficios: ['Compreensão do propósito de alma nesta vida', 'Identificação de talentos multidimensionais', 'Timing perfeito para decisões importantes', 'Reconhecimento de ciclos kármicos', 'Previsão de janelas de oportunidade', 'Integração de aspectos sombrios', 'Ativação de potenciais adormecidos', 'Compreensão de relacionamentos quânticos', 'Navegação consciente de trânsitos desafiadores', 'Manifestação alinhada com cosmos'], 
                    contraindicacoes: 'Não é ferramenta determinista, Livre-arbítrio sempre prevalece, Não substitui psicoterapia ou tratamento médico, Evitar criar dependência de \'o que as estrelas dizem\', Sempre empoderar o cliente, Não fazer previsões absolutas de eventos', 
                    campos_formulario: [
                        {"label":"Clareza de Propósito de Alma (Nodo Norte)","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"COMO AVALIAR: Analise Nodo Norte (missão). Pergunte: 'Clareza sobre sua missão (1-10)?'. Observe conexão emocional ao discutir propósito.","dicas_observacao":"1-3: Perdido. 4-6: Algumas pistas. 7-8: Claro. 9-10: Missão ativa e consciente."},
                        {"label":"Intensidade de Quiron (Ferida Sagrada)","tipo":"escala_1_10","campo_associado":"Kármico","instrucoes_praticas":"COMO AVALIAR: Analise posição de Quiron. Pergunte sobre área de vida correspondente. 10 = ferida muito ativa. 1 = integrada/curada. Observe dor ao falar do tema.","dicas_observacao":"1-3: Curada. 4-6: Em processo. 7-8: Ainda dolorosa. 9-10: Ferida aberta, precisa cura urgente."},
                        {"label":"Momento Atual no Ciclo de Saturno","tipo":"multipla_escolha","campo_associado":"Temporal","opcoes":["Construção (0-7 anos)","Teste (7-14)","Responsabilidade (14-21)","Saturno Return (28-30)","Maturidade (30+)"],"instrucoes_praticas":"COMO AVALIAR: Veja idade e trânsitos de Saturno. Saturno Return (28-30 anos) = grande teste. Identifique fase atual.","dicas_observacao":"Cada fase tem desafios específicos. Saturno Return é crucial."},
                        {"label":"Potencial de Manifestação Atual (Júpiter/Vênus)","tipo":"escala_1_10","campo_associado":"Quântico","instrucoes_praticas":"COMO AVALIAR: Veja trânsitos de Júpiter e Vênus. Trígonos/sextis = alta manifestação. Quadraturas/oposições = bloqueios. 10 = momento excelente. 1 = difícil.","dicas_observacao":"1-3: Momento de recolhimento. 4-6: Neutro. 7-8: Bom momento. 9-10: Portal aberto!"},
                        {"label":"Bem-Estar Emocional Após Consulta","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Após consulta, pergunte: 'Como se sente (1-10)?'. Análise bem feita traz alívio, clareza e esperança.","dicas_observacao":"1-3: Confuso/pesado. 4-6: Neutro. 7-8: Aliviado. 9-10: Empoderado e inspirado."}
                    ] 
                },
                { 
                    id: '14', 
                    nome: 'Terapia Adulto Índigo', 
                    categoria: 'Espiritual', 
                    nivel_dificuldade: 'Avançado', 
                    duracao_media: '90min', 
                    descricao: 'Terapia especializada para adultos com perfil índigo, cristal ou arco-íris. Trabalha hipersensibilidade emocional e energética, integração de dons multidimensionais, propósito de missão de alma e desafios de viver em mundo 3D com consciência expandida.', 
                    beneficios: ['Compreensão e aceitação de diferenças', 'Integração de hipersensibilidade como dom', 'Desenvolvimento consciente de capacidades intuitivas', 'Proteção energética para empáticos', 'Ancoragem de missão de alma', 'Cura de sensação de não-pertencimento', 'Gestão de sobrecarga sensorial', 'Conexão com propósito de vida', 'Desenvolvimento de limites energéticos saudáveis', 'Empoweramento de dons únicos'], 
                    contraindicacoes: 'Não substitui tratamento psiquiátrico se necessário, Psicose aguda: tratar medicamente primeiro, Não alimentar delirios de grandeza, Sempre ancorar na realidade prática, Equilibrar espiritualidade com vida material', 
                    campos_formulario: [
                        {"label":"Nível de Hipersensibilidade Emocional","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Intensidade de emoções dos outros que você sente (1-10)?'. Observe: choro fácil, absorção de emoções alheias, exaustão em multidões.","dicas_observacao":"1-3: Sensível normal. 4-6: Sensível. 7-8: Muito sensível. 9-10: Hiper-empático, esponja emocional."},
                        {"label":"Capacidade de Proteção Energética","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Consegue se proteger de energias externas (1-10)?'. 10 = protege-se bem. 1 = sem proteção, absorve tudo. Teste: como se sente após sair de shopping/hospital?","dicas_observacao":"1-3: Vulnerável total. 4-6: Alguma proteção. 7-8: Boa proteção. 9-10: Campo forte e selado."},
                        {"label":"Clareza de Missão de Alma","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Clareza sobre por que veio à Terra (1-10)?'. Índigos geralmente SENTEM que têm missão, mas podem não saber qual.","dicas_observacao":"1-3: Sem ideia. 4-6: Sente que tem, mas não sabe. 7-8: Sabe qual é. 9-10: Missão ativa e consciente."},
                        {"label":"Nível de Desenvolvimento de Dons Intuitivos","tipo":"multipla_escolha","campo_associado":"Multidimensional","opcoes":["Latente (dons bloqueados)","Emergente (começando a aparecer)","Ativo (usa conscientemente)","Mestria (domínio completo)"],"instrucoes_praticas":"COMO AVALIAR: Investigue: clarividência, clariaudiência, cura, canalização. Pergante: 'Usa seus dons? Como?'. Observe: consciência e controle dos dons.","dicas_observacao":"Maioria está em 'Latente' ou 'Emergente'. Objetivo: levar a 'Ativo'."},
                        {"label":"Sensação de Pertencimento no Mundo","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Sente que pertence a este mundo/planeta (1-10)?'. Índigos frequentemente sentem que 'vieram de outro lugar'. 10 = pertence totalmente. 1 = alienígena total.","dicas_observacao":"1-3: Alien total, 'não sou daqui'. 4-6: Algum pertencimento. 7-8: Adaptado. 9-10: Ancorado e pertencente."}
                    ] 
                },
                { 
            id: '15', 
            nome: 'Ervas e Plantas Medicinais', 
            categoria: 'Físico',
            tipo_visualizacao_sugerido: 'area',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '60-90min', 
                    descricao: 'Fitoterapia quântica avançada utilizando o poder vibracional das plantas medicinais para harmonização energética, cura natural e reconexão com a sabedoria ancestral da natureza. Cada planta possui inteligência própria e frequência específica que interage com nosso campo bioenergético para promover cura em múltiplos níveis.', 
                    beneficios: ['Cura natural através da sabedoria ancestral das plantas', 'Fortalecimento profundo do sistema imunológico', 'Harmonização energética através de frequências vegetais', 'Desintoxicação suave e profunda do organismo', 'Equilíbrio hormonal natural sem efeitos colaterais', 'Alívio de dores e inflamações crônicas', 'Melhora da qualidade do sono naturalmente', 'Redução de ansiedade e estresse através de plantas adaptógenas', 'Regeneração celular e anti-aging natural', 'Conexão profunda com a natureza e ciclos sazonais', 'Suporte emocional através de plantas aliadas', 'Expansão da consciência via plantas sagradas (uso ritual)'], 
                    contraindicacoes: 'Gravidez: muitas ervas são contraindicadas - consultar especialista, Amamentação: algumas plantas passam para o leite, Crianças menores de 2 anos: uso muito restrito, Doenças hepáticas graves: cautela com ervas metabolizadas no fígado, Doenças renais: evitar ervas diuréticas fortes, Interação medicamentosa: SEMPRE verificar (ex: Ginkgo + anticoagulantes), Cirurgias programadas: suspender ervas anticoagulantes 2 semanas antes, Alergias específicas a plantas da mesma família, Não substituir medicamentos essenciais sem orientação médica', 
                    campos_formulario: [
                        {"label":"Queixa Principal Atual","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Qual o principal problema que te traz aqui hoje?'. Deixe falar livremente. Anote: sintomas, há quanto tempo, intensidade, o que piora/melhora. Identifique se é agudo ou crônico.","dicas_observacao":"Queixas comuns: dor (onde?), inflamação, insônia, ansiedade, digestão, imunidade baixa. Priorize o que mais incomoda. Questões crônicas requerem tratamento mais longo."},
                        {"label":"Sistema Corporal Mais Afetado","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Sistema Digestivo","Sistema Respiratório","Sistema Nervoso (ansiedade/insônia)","Sistema Imunológico","Sistema Hormonal","Sistema Circulatório","Sistema Urinário","Sistema Musculoesquelético (dores)"],"instrucoes_praticas":"COMO AVALIAR: Baseado na queixa principal, identifique qual sistema está mais comprometido. Isso guiará seleção de plantas específicas. Ex: Digestivo - espinheira-santa. Nervoso - valeriana, passiflora.","dicas_observacao":"Cada sistema tem plantas aliadas específicas. Digestivo: camomila, espinheira-santa. Respiratório: guaco, hortelã. Nervoso: melissa, valeriana. Imune: equinácea, própolis."},
                        {"label":"Nível de Vitalidade/Energia Atual","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'De 1 a 10, qual seu nível de energia no dia a dia?'. Observe: vitalidade no olhar, postura, ânimo ao falar. Baixa energia pode indicar necessidade de adaptógenos.","dicas_observacao":"1-3: Fadiga severa - considere Ginseng, Rhodiola, Maca. 4-6: Energia moderada - considere Astragalus. 7-8: Boa energia. 9-10: Vitalidade plena - manutenção preventiva."},
                        {"label":"Qualidade do Sono","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Como está seu sono? Dorme facilmente? Acorda durante a noite? Acorda cansado?'. Identifique: insônia inicial, intermediária ou despertar precoce.","dicas_observacao":"1-3: Insônia severa - Valeriana, Passiflora, Melissa, Maracujá. 4-6: Sono irregular - Camomila, Lavanda. 7-10: Sono bom. Tipo de insônia define planta ideal."},
                        {"label":"Medicamentos em Uso Atualmente","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Usa algum medicamento contínuo? Quais?'. ANOTE TODOS. CRUCIAL: Verifique interações antes de prescrever qualquer erva. Ex: Ginkgo + anticoagulantes = risco de sangramento.","dicas_observacao":"SEMPRE verificar interações medicamentosas. Hipertensão: cuidado com alcaçuz. Diabetes: cuidado com ervas hipoglicemiantes. Anticoagulantes: evitar Ginkgo, alho, gengibre."},
                        {"label":"Alergias Conhecidas (Plantas, Alimentos, Medicamentos)","tipo":"texto_curto","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Tem alergia a alguma planta, alimento ou medicamento?'. Atenção: alergia a uma planta pode indicar alergia a plantas da mesma família botânica.","dicas_observacao":"Alergia a Asteraceae (margarida): evitar camomila, calêndula, arnica. Alergia a aspirina: evitar salgueiro. Sempre fazer teste antes de dose completa."},
                        {"label":"Estado Emocional Predominante","tipo":"multipla_escolha","campo_associado":"Emocional","opcoes":["Ansiedade/nervosismo","Tristeza/depressão leve","Irritabilidade/raiva","Medo/insegurança","Estresse/sobrecarga","Equilíbrio emocional"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Como está emocionalmente?'. Observe linguagem corporal, tom de voz, expressão facial. Plantas têm afinidade com estados emocionais específicos.","dicas_observacao":"Ansiedade: Passiflora, Melissa, Valeriana. Tristeza: Hipérico (antidepressivo natural). Irritabilidade: Camomila, Melissa. Estresse: Adaptógenos (Rhodiola, Ashwagandha)."},
                        {"label":"Preferência de Forma de Uso","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Chá/Infusão (tradicional)","Tintura (mais potente, prática)","Cápsulas (sem sabor)","Uso tópico (pomadas, óleos)","Banhos terapêuticos"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Como prefere usar: chá, cápsulas, gotas?'. Considere: praticidade, paladar, absorção. Tinturas são mais concentradas. Chás exigem preparo diário mas criam ritual.","dicas_observacao":"Chá: ritual, mas requer disciplina. Tintura: prática, rápida absorção. Cápsulas: sem sabor, fácil posologia. Tópico: dores localizadas. Banhos: relaxamento, energético."}
                    ] 
                },
                                // ... (Terapias 1 a 15, como nas respostas anteriores) ...
                { 
            id: '16', 
            nome: 'Iridologia', 
            categoria: 'Físico',
            tipo_visualizacao_sugerido: 'bar',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '60-90min', 
                    descricao: 'Ciência diagnóstica ancestral que analisa os sinais, marcas, cores e padrões da íris ocular para avaliação completa do estado de saúde geral, identificação de predisposições genéticas, deficiências orgânicas, nível de toxemia e padrões constitucionais. A íris é um mapa completo do corpo humano refletido nos olhos, permitindo análise preventiva e holística.', 
                    beneficios: ['Identificação precoce de tendências patológicas antes dos sintomas', 'Avaliação profunda da constituição genética do indivíduo', 'Mapeamento completo de órgãos fragilizados e fortalecidos', 'Detecção de nível de toxemia e necessidade de desintoxicação', 'Avaliação da vitalidade e capacidade de regeneração', 'Identificação de deficiências nutricionais pela análise da íris', 'Compreensão de padrões familiares de doenças', 'Orientação preventiva personalizada e eficaz', 'Acompanhamento visual da evolução de tratamentos', 'Ferramenta educativa poderosa para o paciente', 'Integração com outras terapias para plano holístico', 'Análise do sistema nervoso e nível de estresse crônico'], 
                    contraindicacoes: 'NÃO substitui diagnóstico médico convencional - sempre complementar, NÃO é ferramenta de diagnóstico de doenças específicas, Sempre recomendar exames laboratoriais complementares, Não fazer diagnósticos absolutos ou prognósticos fatalistas, Evitar criar pânico ou medo desnecessário no paciente, Lentes de contato coloridas podem dificultar ou impossibilitar análise, Cirurgias oculares (catarata, transplante): avaliar viabilidade, Iridotomia ou cirurgias que alterem a íris: limitação da análise, Não usar iridologia isoladamente para decisões médicas graves', 
                    campos_formulario: [
                        {"label":"Constituição Básica Iridológica","tipo":"multipla_escolha","campo_associado":"Constitucional","opcoes":["Linfática (azul/cinza) - predisposição a inflamações","Hematogênica (marrom/âmbar) - predisposição a alterações sanguíneas","Mista (azul-marrom) - tendências combinadas"],"instrucoes_praticas":"COMO AVALIAR: Observe a cor base da íris na foto. Azul/cinza: linfática (tendência a processos inflamatórios, catarros, alergias). Marrom/âmbar: hematogênica (tendência a problemas circulatórios, hepáticos, digestivos). Mista: combinação.","dicas_observacao":"Linfática: pele clara, alergias, sinusites frequentes. Hematogênica: pele morena, questões digestivas, anemia. Mista: características intermediárias. Constituição define predisposições básicas."},
                        {"label":"Densidade da Íris (Nível de Vitalidade)","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Observe a trama da íris. Íris densa (fibras fechadas, compactas) = alta vitalidade (8-10). Íris média (fibras visíveis mas organizadas) = vitalidade boa (5-7). Íris frouxa (fibras abertas, lacunas) = vitalidade baixa (1-4).","dicas_observacao":"1-4: Baixa vitalidade, recuperação lenta, suscetível a doenças. 5-7: Vitalidade moderada, boa capacidade de recuperação. 8-10: Alta vitalidade, forte capacidade regenerativa, resistência a doenças."},
                        {"label":"Nível de Toxemia (Anel de Sódio, Anel Nervoso)","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Observe ao redor da íris. Anel branco/cinza ao redor = anel de sódio (colesterol, toxinas). Anel ao redor da pupila = anel nervoso (stress). Quanto mais visíveis e densos, maior o nível de toxemia (1-10).","dicas_observacao":"1-3: Toxemia mínima, boa eliminação. 4-7: Toxemia moderada, precisa desintoxicação. 8-10: Toxemia alta, urgente desintoxicação (dieta, hidratação, terapias detox). Anel nervoso: estresse crônico."},
                        {"label":"Órgãos/Sistemas com Sinais de Fragilidade","tipo":"checkbox","campo_associado":"Orgânico","opcoes":["Sistema Digestivo","Sistema Respiratório","Sistema Nervoso","Sistema Circulatório","Fígado","Rins","Tireoide","Sistema Reprodutor","Coluna/Articulações","Coração"],"instrucoes_praticas":"COMO AVALIAR: Use mapa iridológico. Identifique áreas com: lacunas (fraqueza), pigmentos escuros (congestão), raios (inflamação). Correlacione posição com mapa de órgãos. Marque todos os sistemas que apresentam sinais.","dicas_observacao": null},
                        {"label":"Capacidade de Eliminação/Detoxificação","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Observe borda externa da íris. Clara e definida = boa eliminação (7-10). Turva, cinza, manchada = má eliminação (1-6). Correlacione com: intestino preso? Suor? Urina concentrada? Pele opaca?","dicas_observacao":"1-4: Má eliminação - intestino preso, pouco suor, pele opaca. Requer: água, fibras, chás diuréticos, exercício. 5-7: Razoável. 8-10: Excelente capacidade de detox, intestino regular, pele limpa."},
                        {"label":"Sistema Nervoso - Nível de Estresse Acumulado","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Observe anel nervoso ao redor da pupila. Anel fino ou ausente = estresse baixo (1-3). Anel médio = estresse moderado (4-7). Anel grosso, escuro, fragmentado = estresse alto (8-10). Pergunte: dorme bem? Ansioso?","dicas_observacao":"1-3: Relaxado, dorme bem. 4-7: Estresse moderado, ansiedade ocasional. 8-10: Estresse crônico, ansiedade, insônia, nervosismo. Prescrever: adaptógenos, meditação, exercício, terapia."},
                        {"label":"Sinais de Inflamação Crônica (Raios Solares)","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Ausentes - sem inflamação","Poucos raios localizados - inflamação leve","Raios moderados espalhados - inflamação moderada","Muitos raios intensos - inflamação sistêmica severa"],"instrucoes_praticas":"COMO AVALIAR: Observe raios saindo da pupila como raios de sol. Poucos/finos = inflamação leve. Muitos/grossos = inflamação sistêmica. Correlacione com: dores? Inchaços? Sintomas inflamatórios?","dicas_observacao":"Ausentes: excelente, sem inflamações. Poucos: localizadas, tratar especificamente. Moderados: processo inflamatório em andamento. Muitos: inflamação crônica sistêmica - dieta anti-inflamatória urgente."},
                        {"label":"Observações Gerais e Correlação com Sintomas","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Anote TODAS as correlações entre sinais da íris e sintomas relatados pelo paciente. Ex: 'Lacuna em área digestiva correlaciona com gastrite relatada'. 'Pigmento em rim esquerdo e paciente tem histórico de pedra nos rins'. Seja detalhado.","dicas_observacao":"Sempre correlacionar sinais com realidade clínica. Sinais sem sintomas = predisposição ou questão latente. Sintomas sem sinais = pode ser recente ou funcional. Documentar tudo para comparação futura."}
                    ] 
                },
                { 
            id: '17', 
            nome: 'Constelação Sistêmica Familiar', 
            categoria: 'Sistêmico',
            tipo_visualizacao_sugerido: 'bar',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '90-180min', 
                    descricao: 'Terapia transgeneracional profunda desenvolvida por Bert Hellinger que revela dinâmicas ocultas no sistema familiar, identificando padrões transgeracionais de sofrimento, emaranhamentos sistêmicos, lealdades invisíveis e ordens do amor violadas. Através de representações espaciais, traz à luz questões inconscientes herdadas de ancestrais, permitindo reconciliação, liberação e reordenamento do sistema para que o amor volte a fluir.', 
                    beneficios: ['Revelação de dinâmicas familiares ocultas que causam sofrimento', 'Liberação de padrões transgeracionais de doença, pobreza e fracasso', 'Compreensão profunda de conflitos de relacionamento recorrentes', 'Reconciliação com pais, irmãos e ancestrais', 'Quebra de lealdades invisíveis que limitam a vida', 'Alívio de culpa e peso emocional herdado', 'Reorganização da hierarquia familiar (ordem)', 'Reconexão com a força dos ancestrais', 'Solução de sintomas físicos de origem sistêmica', 'Liberação de destinos trágicos repetidos na família', 'Permissão para ser feliz e bem-sucedido', 'Paz profunda com o passado familiar'], 
                    contraindicacoes: 'Transtornos psicóticos agudos sem estabilização medicamentosa, Esquizofrenia em crise - pode intensificar sintomas, Pacientes em crise suicida aguda - estabilizar primeiro, Crianças menores de 12 anos - trabalhar com os pais, Resistência extrema do cliente - requer abertura mínima, Luto muito recente (menos de 6 meses) - aguardar elaboração inicial, Sempre complementar, nunca substituir psicoterapia ou psiquiatria, Terapeuta deve estar preparado emocionalmente - não fazer se estiver em crise pessoal', 
                    campos_formulario: [
                        {"label":"Questão Principal a Ser Constelada","tipo":"texto_longo","campo_associado":"Sistêmico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Qual a questão que você quer trabalhar hoje?'. Deixe falar livremente. Depois refine: 'Se pudesse resumir em uma frase, qual é o sofrimento?'. Ex: 'Não consigo manter relacionamentos', 'Sinto que não mereço sucesso', 'Conflito intenso com minha mãe'.","dicas_observacao":"Questões comuns: relacionamentos, prosperidade, saúde, conflito com pais, luto, sensação de não pertencer. Questão clara = constelação focada. Questão vaga = explorar mais na anamnese."},
                        {"label":"Padrão Repetitivo Identificado","tipo":"multipla_escolha","campo_associado":"Sistêmico","opcoes":["Relacionamentos que terminam sempre igual","Dificuldade financeira crônica","Doenças recorrentes sem causa","Sensação de não merecer felicidade","Conflitos intensos com figura paterna/materna","Vícios e compulsões","Luto não elaborado","Segredo familiar pesado"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Isso já aconteceu antes na sua vida? E na vida de outros familiares?'. Identifique repetição transgeracional. Ex: 'Minha avó, minha mãe e eu - todas divorciadas'. Padrão repetido = possível emaranhamento sistêmico.","dicas_observacao":"Repetição = emaranhamento sistêmico. Se 3 gerações têm mesmo padrão = forte dinâmica transgeracional. Questão: quem na família viveu isso primeiro? Cliente está repetindo destino de quem?"},
                        {"label":"Eventos Traumáticos na Família (até 3 gerações)","tipo":"checkbox","campo_associado":"Transgeneracional","opcoes":["Mortes precoces ou trágicas","Abortos (espontâneos ou provocados)","Filhos fora do casamento ou dados para adoção","Suicídios","Guerras, exílios, migrações forçadas","Crimes ou prisões","Doenças graves ou loucura","Separações traumáticas","Segredos familiares pesados"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Na sua família (pais, avós, tios), houve mortes precoces? Abortos? Segredos? Tragédias?'. Anote TUDO. Eventos não falados geralmente são os mais relevantes. Observe desconforto ao falar de certos temas.","dicas_observacao":"Excluídos do sistema (abortos, filhos dados, 'ovelhas negras') costumam ser representados inconscientemente por alguém da geração seguinte. Mortes trágicas geram lealdade invisível. Segredos = peso sistêmico."},
                        {"label":"Relação com a Mãe (Escala)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'De 1 a 10, como é/era sua relação com sua mãe?'. 1 = péssima, muito conflituosa. 10 = excelente, amorosa. Observe: tom de voz ao falar dela, emoções que surgem, corpo se contrai?","dicas_observacao":"1-3: Conflito severo, rejeição, mágoa profunda. 4-6: Relação difícil, ambivalente. 7-8: Boa relação, pequenas questões. 9-10: Relação amorosa e saudável. Mãe = vida - bloqueio aqui afeta tudo."},
                        {"label":"Relação com o Pai (Escala)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'De 1 a 10, como é/era sua relação com seu pai?'. 1 = péssima, ausência total. 10 = excelente, presença amorosa. Observe: fala dele? Ausência de pai = vazio sistêmico.","dicas_observacao":"1-3: Pai ausente, rejeição, mágoa. 4-6: Relação distante ou conflituosa. 7-8: Boa relação. 9-10: Conexão forte e saudável. Pai = sucesso, prosperidade - bloqueio aqui dificulta prosperar na vida."},
                        {"label":"Ordem dos Irmãos na Família","tipo":"texto_curto","campo_associado":"Sistêmico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Você é o/a filho(a) número quanto? Tem irmãos? Quantos?'. Ex: 'Sou a 2ª de 4 irmãos'. Anote: abortos antes dele contam como primeiros. Ordem define papel sistêmico. Primogênito = responsabilidade. Caçula = liberdade.","dicas_observacao":"Primogênito: carrega família, responsável. Meio: mediador, às vezes invisível. Caçula: mais livre, mas pode carregar pais. Filho único: pode tentar substituir alguém excluído. Ordem violada = confusão de papéis."},
                        {"label":"Sensação Corporal/Emocional Predominante ao Falar da Questão","tipo":"multipla_escolha","campo_associado":"Emocional","opcoes":["Peso no peito ou ombros","Nó na garganta, dificuldade de falar","Tristeza profunda, vontade de chorar","Raiva, revolta","Vazio, sensação de falta","Culpa, sensação de dever algo","Medo, insegurança"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Quando você pensa nessa questão, o que sente no corpo? Onde sente?'. Observe: mão vai ao peito? Olhos lacrimejam? Punhos fecham? Corpo não mente - revela emaranhamento.","dicas_observacao":"Peso = carregando algo/alguém. Nó na garganta = algo não dito, segredo. Tristeza = luto não elaborado. Raiva = injustiça sentida. Vazio = alguém falta no sistema. Culpa = lealdade invisível."},
                        {"label":"Expectativa/Resistência para a Constelação","tipo":"multipla_escolha","campo_associado":"Mental","opcoes":["Totalmente aberto, confiante","Curioso mas com medo do que vai descobrir","Cético mas disposto a tentar","Resistente, vindo por insistência de alguém","Esperançoso de solução rápida e mágica"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Como você se sente em relação a fazer a constelação?'. Observe: abertura? Medo? Ceticismo? Resistência forte pode indicar lealdade sistêmica ao problema. Expectativa mágica = educar sobre processo.","dicas_observacao":"Aberto: melhor postura. Medo: normal, acolher. Cético: OK desde que haja abertura. Resistente: investigar se há lealdade ao sofrimento (não quer trair família). Expectativa mágica: ajustar - processo gradual."}
                    ] 
                },
                { 
            id: '18', 
            nome: 'Acupuntura Quântica', 
            categoria: 'Energético',
            tipo_visualizacao_sugerido: 'chakra_bar',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '60-90min', 
                    descricao: 'Técnica milenar chinesa profundamente adaptada para leitura e harmonização dos meridianos energéticos através de análise quântica do campo bioenergético. Combina agulhas finíssimas de acupuntura, moxabustão, ventosaterapia e pulsologia chinesa para restaurar o fluxo do Qi (energia vital), equilibrar Yin-Yang, fortalecer órgãos e sistemas. Visão holística: corpo, mente e espírito são um só sistema integrado de energia.', 
                    beneficios: ['Alívio rápido e duradouro de dores agudas e crônicas', 'Restauração do fluxo energético (Qi) nos meridianos', 'Equilíbrio profundo entre Yin e Yang', 'Fortalecimento do Wei Qi (energia defensiva/imunidade)', 'Regulação do sistema nervoso e redução de estresse', 'Melhora de insônia e qualidade do sono', 'Tratamento eficaz de enxaquecas e cefaleias', 'Alívio de sintomas digestivos (gastrite, intestino irritável)', 'Regulação hormonal e menstrual', 'Tratamento de ansiedade e depressão leve', 'Auxílio em processos de desintoxicação', 'Aumento de vitalidade e disposição geral'], 
                    contraindicacoes: 'Gravidez: evitar pontos que mobilizam útero (especialmente 1º trimestre), Marca-passo: cuidado com eletroacupuntura, Hemofilia ou uso de anticoagulantes: risco de sangramento, Infecções cutâneas locais: não agulhar sobre feridas, Câncer ativo: não agulhar diretamente sobre tumor, Epilepsia descontrolada: evitar pontos muito estimulantes, Paciente embriagado ou sob efeito de drogas: não aplicar, Fome extrema ou imediatamente após refeição pesada: aguardar, Extrema fadiga ou debilidade: usar menos agulhas, pontos tonificantes', 
                    campos_formulario: [
                        {"label":"Queixa Principal (Sintoma que mais incomoda)","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'O que mais te incomoda hoje? Onde dói? Há quanto tempo?'. Deixe descrever livremente. Anote: localização exata, tipo de dor (em pontada, peso, queimação), horário que piora/melhora, fatores que aliviam/agravam.","dicas_observacao":"Dor = estagnação de Qi e Sangue. Peso = Umidade. Queimação = Calor. Frio = Frio patogênico. Horário: manhã = Yang, noite = Yin. Localização define meridiano afetado."},
                        {"label":"Diagnóstico pela Língua","tipo":"multipla_escolha","campo_associado":"Energético","opcoes":["Língua pálida, úmida (Deficiência de Yang)","Língua vermelha, seca (Calor)","Língua roxa/escura (Estagnação de Sangue)","Língua com saburra branca espessa (Frio-Umidade)","Língua com saburra amarela (Calor-Umidade)","Língua normal rosada"],"instrucoes_praticas":"COMO AVALIAR: Peça: 'Mostre sua língua, bem para fora'. Observe: cor do corpo, umidade, saburra (camada), rachaduras, marcas dos dentes. Iluminação natural é ideal. Compare com atlas de línguas da MTC.","dicas_observacao":"Pálida = Deficiência de Qi/Sangue/Yang. Vermelha = Calor (Yin deficiente). Roxa = Estagnação. Saburra branca = Frio. Amarela = Calor. Marcas dentes = Deficiência de Baço, Umidade."},
                        {"label":"Diagnóstico pelo Pulso (Pulsologia Chinesa)","tipo":"multipla_escolha","campo_associado":"Energético","opcoes":["Pulso superficial, rápido (Calor externo)","Pulso profundo, lento (Frio, Deficiência)","Pulso em corda (Estagnação de Qi do Fígado)","Pulso escorregadio (Umidade, Fleuma)","Pulso fino, fraco (Deficiência de Qi e Sangue)","Pulso irregular (Estagnação de Sangue)"],"instrucoes_praticas":"COMO AVALIAR: Palpe artéria radial com 3 dedos (indicador, médio, anelar) em ambos os pulsos. Sinta: profundidade, velocidade, força, qualidade. Requer MUITA prática. 3 posições em cada pulso = 6 órgãos. Compare esquerdo/direito.","dicas_observacao":"Superficial = doença externa. Profundo = doença interna. Rápido (>90bpm) = Calor. Lento (<60bpm) = Frio. Corda = Fígado estagnado (stress). Escorregadio = Umidade. Fino = Deficiência."},
                        {"label":"Síndrome MTC Identificada","tipo":"multipla_escolha","campo_associado":"Energético","opcoes":["Deficiência de Qi","Deficiência de Yang","Deficiência de Yin","Deficiência de Sangue","Estagnação de Qi","Estagnação de Sangue","Calor (Excesso)","Frio (Excesso)","Umidade","Fleuma"],"instrucoes_praticas":"COMO AVALIAR: Baseado em toda anamnese (sintomas, língua, pulso), identifique síndrome principal conforme MTC. Deficiência = tonificar. Excesso = sedar/dispersar. Pode haver síndromes combinadas. Ex: Deficiência de Qi do Baço + Umidade.","dicas_observacao":"Deficiência Qi: fadiga, voz baixa. Def. Yang: frio, apatia. Def. Yin: calor à noite, suores noturnos. Def. Sangue: tontura, pele seca. Estagnação Qi: dor móvel, irritabilidade. Calor: sede, febre."},
                        {"label":"Órgão(s) Zang-Fu Mais Afetado(s)","tipo":"checkbox","campo_associado":"Orgânico","opcoes":["Pulmão (P)","Intestino Grosso (IG)","Estômago (E)","Baço-Pâncreas (BP)","Coração (C)","Intestino Delgado (ID)","Bexiga (B)","Rim (R)","Fígado (F)","Vesícula Biliar (VB)","Pericárdio (PC)","Triplo Aquecedor (TA)"],"instrucoes_praticas":"COMO AVALIAR: Correlacione sintomas com órgãos MTC. Pulmão: tosse, pele. Baço: digestão, preocupação. Fígado: irritabilidade, tendões. Rim: medo, ossos, reprodução. Coração: insônia, ansiedade. Use teoria 5 Elementos para relações.","dicas_observacao":"Cada órgão tem: emoção, tecido, sentido, estação. Pulmão: tristeza, pele, nariz, outono. Fígado: raiva, tendões, olhos, primavera. Rim: medo, ossos, ouvido, inverno. Sintomas guiam."},
                        {"label":"Equilíbrio Yin-Yang Atual","tipo":"multipla_escolha","campo_associado":"Vibracional","opcoes":["Excesso de Yang (agitação, calor, hiperatividade)","Excesso de Yin (apatia, frio, lentidão)","Deficiência de Yang (fadiga, frio, falta de vitalidade)","Deficiência de Yin (calor vazio, insônia, agitação à noite)","Yin-Yang equilibrado"],"instrucoes_praticas":"COMO AVALIAR: Observe: Yang = calor, movimento, dia, ativo, externo. Yin = frio, quietude, noite, passivo, interno. Pergunte: sente mais calor ou frio? Mais energia de manhã (Yang) ou noite (Yin)? Inquieto ou apático?","dicas_observacao":"Excesso Yang: calor, sede, agitação, insônia, febre. Excesso Yin: frio, apatia, edema, obesidade. Def. Yang: frio, fadiga, pálido. Def. Yin: calor vazio, suores noturnos, boca seca. Tratamento visa equilibrar."},
                        {"label":"Estado Emocional Predominante (MTC)","tipo":"multipla_escolha","campo_associado":"Emocional","opcoes":["Raiva/Irritação (Fígado)","Alegria excessiva/Ansiedade (Coração)","Preocupação excessiva (Baço)","Tristeza/Melancolia (Pulmão)","Medo (Rim)","Equilíbrio emocional"],"instrucoes_praticas":"COMO AVALIAR: Cada órgão na MTC está associado a uma emoção. Pergunte: 'Como está emocionalmente?'. Observe: irritado = Fígado. Preocupado = Baço. Triste = Pulmão. Medroso = Rim. Ansioso = Coração. Emoção desequilibrada afeta órgão e vice-versa.","dicas_observacao":"Raiva crônica = estagna Qi Fígado (dor, tensão). Preocupação = deficiência Baço (má digestão). Tristeza = deficiência Qi Pulmão (cansaço, resfriados). Medo = deficiência Rim (lombar, audição). Tratar órgão equilibra emoção."},
                        {"label":"Pontos de Acupuntura Selecionados para Esta Sessão","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Liste os pontos escolhidos baseado no diagnóstico. Ex: 'E36, BP6, F3, IG4, VG20'. Anote função de cada ponto. Ex: E36 (tonificar Qi geral), F3 (sedar Fígado, raiva), PC6 (acalmar mente). Máximo 12-15 pontos por sessão.","dicas_observacao":"Pontos comuns: E36 (tonificar tudo), IG4 (dor, cabeça), BP6 (hormônio, digestão), F3 (stress), VB20 (cefaleia), R3 (tonificar Rim), C7 (insônia, ansiedade). Combine pontos locais + distais."}
                    ] 
                },
                { 
            id: '19', 
            nome: 'Homeopatia Quântica', 
            categoria: 'Vibracional',
            tipo_visualizacao_sugerido: 'line',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '90-120min', 
                    descricao: 'Sistema terapêutico vibracional desenvolvido por Samuel Hahnemann baseado no princípio \'Similia similibus curantur\' (semelhante cura semelhante). Utiliza medicamentos homeopáticos ultradiluídos e florais de acordo com a leitura vibracional profunda do paciente, tratando através de frequências sutis que ressoam com o campo bioenergético individual. A cura acontece de dentro para fora, do mais profundo ao mais superficial.', 
                    beneficios: ['Tratamento profundo da causa raiz, não apenas sintomas', 'Cura de doenças crônicas resistentes a outros tratamentos', 'Fortalecimento profundo da força vital e imunidade', 'Ausência completa de efeitos colaterais ou toxicidade', 'Seguro para todas as idades (bebês, gestantes, idosos)', 'Tratamento individualizado conforme totalidade dos sintomas', 'Harmonização emocional, mental e física simultânea', 'Prevenção de doenças através de tratamento constitucional', 'Complementar a qualquer outro tratamento sem interações', 'Despertar da capacidade autocurativa do organismo', 'Tratamento de padrões hereditários (miasmas)', 'Transformação profunda e duradoura da saúde'], 
                    contraindicacoes: 'Não há contraindicações absolutas - medicamento homeopático é seguro, Emergências médicas (infarto, AVC, trauma grave): buscar emergência PRIMEIRO, Doenças graves agudas: complementar, não substituir tratamento médico, Homeopatia não substitui cirurgias necessárias ou medicamentos essenciais, Paciência necessária - tratamento profundo leva tempo (meses), Evitar substâncias que antidotam: café em excesso, menta, cânfora, perfumes fortes nas mãos, Alcoolismo ativo pode dificultar (alguns glóbulos contêm lactose, não álcool nas dinamizações altas)', 
                    campos_formulario: [
                        {"label":"Queixa Principal e História da Doença Atual","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'O que te traz aqui? Quando começou? Como evoluiu?'. Deixe falar livremente. Anote TUDO: sintomas, ordem de aparecimento, tratamentos anteriores, o que já foi feito. Busque: causa primeira (trauma, susto, vacina, medicamento).","dicas_observacao":"Homeopatia trata causa, não sintoma. Pergunte: 'O que aconteceu antes de adoecer? Algum trauma emocional, susto, perda?'. Causa primária é crucial. Ex: asma após morte de familiar = luto não elaborado."},
                        {"label":"Modalidades (O que Melhora / O que Piora os Sintomas)","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte para CADA sintoma: 'O que melhora? O que piora?'. Ex: dor piora com frio ou calor? À noite ou de dia? Movimento melhora ou piora? Deitado do lado direito ou esquerdo? Ar livre melhora? Modalidades definem medicamento.","dicas_observacao":"Modalidades são CRUCIAIS na homeopatia. Ex: Bryonia (piora movimento, melhora pressão). Pulsatilla (piora calor, melhora ar livre). Rhus tox (piora início movimento, melhora movimento contínuo). Anote todas!"},
                        {"label":"Sensações (Como o Sintoma é Sentido)","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Como você descreveria a dor/sensação? É pontada, peso, queimação, latejante, fisgada?'. Use linguagem do paciente. Sensação peculiar pode indicar medicamento. Ex: 'como se tivesse uma lasca de madeira na garganta' = Hepar sulph.","dicas_observacao":"Sensações características ajudam na prescrição. 'Queimação' = Arsenicum, Sulphur. 'Peso' = Sepia, Platina. 'Como se coração parasse' = Gelsemium. 'Pontada' = Bryonia. Anote EXATAMENTE como paciente descreve."},
                        {"label":"Estado Mental e Emocional (Essência da Pessoa)","tipo":"texto_longo","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Como você é emocionalmente? Ansioso? Irritado? Triste?'. Observe: fala rápido (Lachesis)? Devagar (Sepia)? Chora fácil (Pulsatilla)? Controlado (Natrum mur)? Estado mental DEFINE medicamento constitucional.","dicas_observacao":"Mental é MAIS importante que físico na homeopatia. Pulsatilla: chorosa, meiga, melhora com consolo. Natrum mur: fechada, não chora na frente dos outros, ressente-se. Arsenicum: ansiosa, perfeccionista, medo de morrer. Observe comportamento."},
                        {"label":"Medos e Ansiedades Específicas","tipo":"checkbox","campo_associado":"Emocional","opcoes":["Medo de morrer","Medo de doenças","Medo de altura","Medo de escuro","Medo de ficar sozinho","Medo de multidões","Ansiedade de saúde","Medo de perder controle","Medo de pobreza","Sem medos significativos"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Você tem algum medo específico? Do que você tem medo?'. Medos definem medicamentos. Arsenicum: medo morte, doenças. Phosphorus: medo escuro, trovão, sozinho. Argentum nit: medo altura, multidões. Anotador medos é CRUCIAL.","dicas_observacao":"Medos são sintomas mentais valiosos. Arsenicum: medo morte, ansiedade de saúde, inquieto. Phosphorus: medo de tempestade, escuro, precisa companhia. Calcarea: medo de enlouquecer, de ratos. Observe intensidade do medo."},
                        {"label":"Desejos e Aversões Alimentares","tipo":"texto_curto","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'O que você mais gosta de comer? O que não suporta?'. Ex: desejo de doces (Lycopodium, Argentum nit). Aversão a gordura (Pulsatilla). Desejo de sal (Natrum mur). Alimentos definem constituição.","dicas_observacao":"Desejos: Doce = Argentum nit, Lycopodium. Sal = Natrum mur, Phosphorus. Ácido = Sepia. Gordura = Nux vom. Aversões: Gordura = Pulsatilla, Carbo veg. Leite = Natrum carb. Anote intensidade do desejo/aversão."},
                        {"label":"Padrão de Sono e Sonhos","tipo":"texto_longo","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Como você dorme? Acorda que horas? Tem pesadelos? Sonha com o quê? Posição preferida para dormir?'. Sonhos repetitivos são importantes. Insônia de que horas? Acorda de madrugada (Arsenicum 2-3h, Nux vom 3-4h)?","dicas_observacao":"Sono revela muito. Arsenicum: insônia 1-3h, inquieto. Nux vom: insônia 3-4h, acorda cansado. Coffea: mente ativa, não desliga. Sonhos: morte = Arsenicum. Água = Phosphorus. Serpentes = Lachesis. Anote tudo."},
                        {"label":"Tipo Constitucional Homeopático Identificado","tipo":"multipla_escolha","campo_associado":"Constitucional","opcoes":["Pulsatilla - meiga, chorosa, melhora com afeto","Natrum muriaticum - fechada, guarda mágoas, aversão consolo","Arsenicum album - ansiosa, perfeccionista, inquieta","Nux vomica - irritada, workaholic, impaciente","Lycopodium - insegura, dominadora, desejo doces","Phosphorus - sociável, simpática, medo de escuro","Sepia - indiferente, depressiva, cansada","Sulphur - teórica, desleixada, calor","Calcarea carbonica - lenta, insegura, suor","Não identificado ainda"],"instrucoes_praticas":"COMO AVALIAR: Após anamnese completa, identifique tipo constitucional baseado na totalidade dos sintomas: físico, mental, emocional. Constitucional é a essência da pessoa. Medicamento constitucional trata de dentro para fora.","dicas_observacao":"Constitucional define tratamento profundo. Pulsatilla: melhora consolo, chora fácil, calor piora. Natrum mur: guarda mágoas, não chora, aversão consolo. Arsenicum: perfeccionista, ansiosa, inquieta 1-3h. Estude Matéria Médica profundamente."}
                    ] 
                },
                { 
            id: '20', 
            nome: 'Apometria Quântica', 
            categoria: 'Espiritual',
            tipo_visualizacao_sugerido: 'radar',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '90-120min', 
                    descricao: 'Técnica de desdobramento espiritual avançada para resgate e harmonização de fragmentos da alma dispersos em diferentes linhas temporais e dimensões. Desenvolvida no Brasil pelo Dr. José Lacerda de Azevedo, permite trabalho profundo de limpeza kármica, liberação de obsessões espirituais e reintegração da consciência fragmentada.', 
                    beneficios: ['Resgate de fragmentos de alma perdidos em traumas', 'Limpeza profunda de memórias kármicas densas', 'Liberação de vínculos energéticos prejudiciais', 'Remoção de energias densas e obsessões espirituais', 'Cura de traumas de vidas passadas', 'Harmonização de linhas temporais paralelas', 'Restauração da integridade energética completa', 'Alívio de fobias e medos sem causa aparente', 'Melhora de relacionamentos através da limpeza de cordões', 'Expansão da consciência e propósito de alma', 'Fechamento de portais energéticos negativos', 'Desprogramação de implantes energéticos'], 
                    contraindicacoes: 'Não recomendado para pessoas com transtornos psicóticos agudos sem acompanhamento psiquiátrico, Esquizofrenia requer acompanhamento médico simultâneo, Evitar em casos de instabilidade emocional severa sem preparo, Requer preparo espiritual e abertura do paciente, Não aplicar em gestantes sem consentimento e cuidados especiais, Pacientes com epilepsia: usar com cautela e baixa contagem, Sempre complementar, nunca substituir tratamento psiquiátrico ou psicológico', 
                    campos_formulario: [
                        {"label":"Sensação de Vazio ou Incompletude Interior","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Você sente que algo está faltando dentro de você, como se uma parte sua não estivesse aqui?' Observe: olhar distante, desconexão. Use pêndulo sobre chakra cardíaco para confirmar fragmentação.","dicas_observacao":"1-3: Integrado. 4-6: Fragmentação leve. 7-8: Fragmentação importante. 9-10: Fragmentação severa, múltiplos pedaços perdidos."},
                        {"label":"Intensidade de Vínculos Energéticos Prejudiciais","tipo":"escala_1_10","campo_associado":"Vibracional","instrucoes_praticas":"COMO AVALIAR: Pergunte sobre relacionamentos tóxicos recorrentes, sensação de 'estar preso' a alguém. Use pêndulo sobre foto ou menção do nome. Observe cordões no campo áurico (visão sutil).","dicas_observacao":"1-3: Poucos cordões. 4-6: Cordões moderados. 7-8: Múltiplos cordões densos. 9-10: Emaranhado severo de vínculos."},
                        {"label":"Presença de Obsessões ou Influências Espirituais Negativas","tipo":"multipla_escolha","campo_associado":"Espiritual","opcoes":["Nenhuma detectada","Influência leve ocasional","Influência moderada recorrente","Obsessão simples persistente","Obsessão complexa ou múltipla"],"instrucoes_praticas":"COMO AVALIAR: Pergunte sobre vozes internas negativas, impulsos autodestrutivos, mudanças bruscas de humor. Use pêndulo: 'Há influências espirituais negativas?' Observe aura (manchas escuras, buracos).","dicas_observacao":"Sinais: agressividade súbita, vício incontrolável, pensamentos suicidas inexplicáveis, olhar 'diferente' às vezes."},
                        {"label":"Nível de Traumas de Vidas Passadas Ativos","tipo":"escala_1_10","campo_associado":"Quântico","instrucoes_praticas":"COMO AVALIAR: Pergunte sobre medos irracionais, fobias sem causa, déjà vu intenso, sensação de 'já vivi isso'. Regressão rápida: 'Volte à origem desse medo'. Use pêndulo sobre fotos de lugares antigos.","dicas_observacao":"1-3: Poucos traumas ativos. 4-6: Alguns traumas influenciando. 7-8: Múltiplos traumas ativos. 9-10: Traumas severos dominando a vida atual."},
                        {"label":"Clareza sobre Propósito de Vida e Missão de Alma","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Você sabe para que está aqui? Sente que tem uma missão?' Observe: certeza interior, brilho nos olhos. Conecte com Eu Superior via meditação rápida.","dicas_observacao":"1-3: Totalmente perdido. 4-6: Intuições vagas. 7-8: Clareza parcial. 9-10: Clareza total e vivendo propósito."},
                        {"label":"Estado dos Chakras Principais (Desdobramento)","tipo":"texto_curto","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Durante desdobramento, observe cada chakra com visão sutil ou pêndulo. Anote: 'Coronário: aberto 70%. Frontal: bloqueado. Cardíaco: cordões densos.' Trabalhe na sessão.","dicas_observacao":"Chakras saudáveis: giram harmoniosamente. Bloqueados: paralisados. Cordões: ligações densas saindo."},
                        {"label":"Qualidade da Reintegração Pós-Sessão","tipo":"escala_1_10","campo_associado":"Quântico","instrucoes_praticas":"COMO AVALIAR: Após reintegração (contagem 1-7), pergunte: 'Como se sente? Mais inteiro?' Observe: olhar presente, cores do rosto, vitalidade. Use pêndulo: 'Reintegração completa?'","dicas_observacao":"1-3: Reintegração incompleta, repetir. 4-6: Parcial, sessão adicional. 7-8: Boa. 9-10: Completa e radiante."},
                        {"label":"Observações sobre Fragmentos Resgatados","tipo":"texto_longo","campo_associado":"Espiritual","instrucoes_praticas":"COMO DOCUMENTAR: Durante sessão, anote idade dos fragmentos resgatados, situação onde foram perdidos (ex: 'Fragmento de 7 anos, trauma escolar'), emoções liberadas. Fundamental para acompanhamento.","dicas_observacao":"Ex: 'Resgatado fragmento de 12 anos preso em acidente de carro. Muito medo. Reintegrado com amor. Paciente chorou.'"}
                    ] 
                },
                { 
            id: '21', 
            nome: 'Numerologia Terapêutica', 
            categoria: 'Mental',
            tipo_visualizacao_sugerido: 'bar',
            nivel_dificuldade: 'Intermediário',
                    duracao_media: '90-120min', 
                    descricao: 'Ciência milenar que estuda a vibração energética dos números e sua influência na jornada de vida, personalidade, talentos, desafios e propósito de alma. Cada número carrega frequência específica que revela aspectos profundos da consciência, ciclos de vida e potencialidades latentes. Utilizada como ferramenta terapêutica para autoconhecimento, orientação vocacional e compreensão de padrões de comportamento.', 
                    beneficios: ['Autoconhecimento profundo através dos números pessoais', 'Clareza sobre propósito de vida e missão de alma', 'Compreensão de talentos naturais e potencialidades', 'Identificação de desafios e lições desta encarnação', 'Orientação vocacional e profissional precisa', 'Entendimento de ciclos pessoais (anos, meses, dias)', 'Melhora de relacionamentos através de compatibilidade numérica', 'Tomada de decisões importantes com timing correto', 'Reconexão com essência e autenticidade', 'Planejamento estratégico de vida baseado em ciclos', 'Cura de padrões limitantes através da compreensão numérica', 'Expansão da consciência sobre arquétipos pessoais'], 
                    contraindicacoes: 'Não substitui orientação psicológica ou psiquiátrica, Não deve ser usada como única ferramenta decisória, Evitar abordagem determinista ou fatalista, Não criar dependência das leituras numerológicas, Respeitar livre-arbítrio e capacidade de escolha, Não usar para manipulação ou controle de terceiros, Pessoas muito sugestionáveis: usar com cuidado educativo', 
                    campos_formulario: [
                        {"label":"Número de Destino (Caminho de Vida)","tipo":"texto_curto","campo_associado":"Propósito","instrucoes_praticas":"COMO CALCULAR: Some todos os dígitos da data de nascimento. Ex: 15/03/1985 = 1+5+0+3+1+9+8+5 = 32 = 3+2 = 5. Anote o número final (1-9 ou 11, 22, 33 se aparecerem).","dicas_observacao":"Este é o número MAIS IMPORTANTE - revela a missão de vida e as lições principais desta encarnação."},
                        {"label":"Número de Expressão (Nome Completo)","tipo":"texto_curto","campo_associado":"Personalidade","instrucoes_praticas":"COMO CALCULAR: Converta cada letra do nome completo em número (A=1, B=2... I=9, J=1...). Some tudo. Ex: MARIA = 4+1+9+9+1 = 24 = 6. Use nome de registro.","dicas_observacao":"Revela talentos naturais, dons e como a pessoa se expressa no mundo externo."},
                        {"label":"Número da Alma (Vogais do Nome)","tipo":"texto_curto","campo_associado":"Espiritual","instrucoes_praticas":"COMO CALCULAR: Some APENAS as vogais do nome completo. Ex: MARIA = A+I+A = 1+9+1 = 11 (número mestre!). Revela desejos profundos e motivações internas.","dicas_observacao":"Este número mostra o que a alma verdadeiramente deseja e valoriza, muitas vezes oculto dos outros."},
                        {"label":"Número da Personalidade (Consoantes do Nome)","tipo":"texto_curto","campo_associado":"Comportamental","instrucoes_praticas":"COMO CALCULAR: Some APENAS as consoantes do nome. Ex: MARIA = M+R = 4+9 = 13 = 4. Mostra a 'máscara social', como os outros veem a pessoa.","dicas_observacao":"Representa a primeira impressão que causamos, a persona externa."},
                        {"label":"Ano Pessoal Atual","tipo":"texto_curto","campo_associado":"Vibracional","instrucoes_praticas":"COMO CALCULAR: Some dia + mês de nascimento + ano ATUAL. Ex: nascido 15/03, em 2024 = 15+3+2024 = 2042 = 8. Revela a energia do ano.","dicas_observacao":"Fundamental para timing! Cada ano tem vibração diferente: 1=novos começos, 5=mudanças, 9=finalizações."},
                        {"label":"Presença de Números Mestres (11, 22, 33)","tipo":"checkbox","campo_associado":"Espiritual","opcoes":["Número 11 - Iluminação","Número 22 - Construtor Mestre","Número 33 - Mestre Curador"],"instrucoes_praticas":"COMO IDENTIFICAR: Se durante cálculos aparecer 11, 22 ou 33, ANTES de reduzir, marque aqui. Ex: 29 = 2+9 = 11 (PARE! É mestre). Pessoas com números mestres têm potencial elevado mas desafios maiores.","dicas_observacao":"Números mestres indicam almas antigas com missões elevadas. Requerem trabalho espiritual intenso."},
                        {"label":"Ciclo de Vida Atual","tipo":"multipla_escolha","campo_associado":"Mental","opcoes":["1º Ciclo - Formação (0-27 anos)","2º Ciclo - Produtividade (28-54 anos)","3º Ciclo - Colheita (55+ anos)"],"instrucoes_praticas":"COMO IDENTIFICAR: Pela idade atual. Cada ciclo tem energia diferente. 1º: aprendizado. 2º: realização. 3º: sabedoria. Explique as características de cada fase.","dicas_observacao":"Transições entre ciclos (27-28, 54-55 anos) são momentos críticos de transformação profunda."},
                        {"label":"Principais Desafios Numerológicos Identificados","tipo":"texto_longo","campo_associado":"Mental","instrucoes_praticas":"COMO DOCUMENTAR: Anote os números ausentes no mapa ou números em excesso. Ex: 'Ausência do 7: dificuldade em introspecção. Excesso de 1: tende ao egoísmo.' Oriente sobre equilíbrio.","dicas_observacao":"Desafios são oportunidades de evolução. Números ausentes mostram o que precisa desenvolver nesta vida."},
                        {"label":"Compatibilidade Numerológica (se aplicável)","tipo":"texto_curto","campo_associado":"Comportamental","instrucoes_praticas":"COMO CALCULAR: Se paciente trouxer dúvida sobre relacionamento, calcule número de destino de ambos. Compare: números compatíveis (1+2, 3+5, 6+9) ou desafiadores (4+5, 8+8).","dicas_observacao":"Compatibilidade não é tudo! Livre-arbítrio e amor superam desafios numerológicos."},
                        {"label":"Orientações Práticas para Viver o Ano Pessoal","tipo":"texto_longo","campo_associado":"Propósito","instrucoes_praticas":"COMO ORIENTAR: Baseado no Ano Pessoal, dê dicas práticas. Ex: Ano 1: 'Inicie projetos, seja corajoso'. Ano 5: 'Aceite mudanças, viaje'. Ano 9: 'Finalize ciclos, doe o velho'.","dicas_observacao":"Essas orientações são OURO para o paciente! Ajudam a fluir com as energias do ano."}
                    ]
        },
        {
            id: '22',                                // ... (Terapias 1 a 21, como nas respostas anteriores) ...           id: '22', 
                    nome: 'Terapia Reencarnacionista', 
                    categoria: 'Espiritual',
                    tipo_visualizacao_sugerido: 'radar', 
                    nivel_dificuldade: 'Avançado', 
                    duracao_media: '120-180min', 
                    descricao: 'Abordagem terapêutica profunda baseada na filosofia reencarnacionista, que utiliza técnicas de regressão a vidas passadas, compreensão de ciclos evolutivos e eras da alma para tratar questões emocionais, traumas e padrões comportamentais que transcendem a vida atual. Permite acesso a memórias de outras encarnações, compreensão de lições kármicas e liberação de contratos e votos de vidas anteriores.', 
                    beneficios: ['Compreensão profunda de medos e fobias inexplicáveis', 'Cura de traumas que transcendem a vida atual', 'Liberação de padrões kármicos repetitivos', 'Ressignificação de relacionamentos complexos (almas conhecidas)', 'Cancelamento de votos e contratos limitantes de vidas passadas', 'Compreensão do propósito maior da alma', 'Reconciliação com eventos traumáticos através de visão ampliada', 'Cura de dores físicas de origem kármica', 'Entendimento de talentos e dons naturais', 'Paz profunda através da compreensão da jornada da alma', 'Acesso à sabedoria acumulada em múltiplas vidas', 'Superação do medo da morte'], 
                    contraindicacoes: 'Transtornos psicóticos agudos ou esquizofrenia não estabilizada, Pessoas com dificuldade de distinguir realidade de fantasia, Menores de 18 anos sem consentimento dos responsáveis, Pacientes em crise emocional aguda - estabilizar primeiro, Não recomendado para céticos extremos - requer abertura mínima, Evitar em casos de epilepsia não controlada, Sempre complementar, nunca substituir psicoterapia convencional, Terapeuta deve estar preparado para lidar com conteúdos intensos', 
                    campos_formulario: [
                        {"label":"Presença de Medos ou Fobias Inexplicáveis","tipo":"multipla_escolha","campo_associado":"Kármico","opcoes":["Nenhum medo inexplicável","Medo de afogamento sem causa","Medo de fogo ou queimaduras","Medo de alturas extremo","Medo de armas ou violência","Fobia de lugares específicos","Outro medo irracional intenso"],"instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Você tem medos muito intensos que não sabe de onde vêm?' Liste. Estes são portas de entrada para vidas passadas. Anote para trabalhar na regressão.","dicas_observacao":"Medos inexplicáveis frequentemente têm origem em mortes traumáticas de vidas passadas. Ex: medo de água = afogamento."},
                        {"label":"Frequência de Déjà Vu ou Memórias Espontâneas","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Com que frequência você sente que já viveu uma situação? Tem memórias de lugares que nunca visitou?' Observe: pessoa pode ter facilidade natural para acessar vidas passadas.","dicas_observacao":"1-3: Raro. 4-6: Ocasional. 7-8: Frequente, alma permeável. 9-10: Constante, véu muito fino."},
                        {"label":"Era ou Época Acessada na Regressão","tipo":"texto_curto","campo_associado":"Transgeneracional","instrucoes_praticas":"COMO DOCUMENTAR: Durante regressão, pergunte: 'Que ano é? Onde você está?' Anote: 'Idade Média, Europa, 1300' ou 'Egito Antigo' ou 'Século 18, França'. Importante para mapear ciclos evolutivos.","dicas_observacao":"Almas geralmente retornam a épocas específicas para continuar lições. Ex: muitas vidas na Idade Média = trabalhar servidão."},
                        {"label":"Tipo de Morte Experimentada na Vida Passada","tipo":"multipla_escolha","campo_associado":"Kármico","opcoes":["Morte natural/pacífica","Morte violenta (guerra, assassinato)","Acidente (afogamento, queda, fogo)","Doença grave ou epidemia","Suicídio","Execução ou martírio","Não chegou à morte nesta sessão"],"instrucoes_praticas":"COMO CONDUZIR: Na regressão, sempre leve até o momento da morte (crucial para liberação). Pergunte: 'Como você morreu?' Acompanhe com suavidade. Após morte, vá para 'luz' (entrelinha).","dicas_observacao":"Tipo de morte explica medos atuais. Mortes violentas causam traumas profundos que atravessam vidas."},
                        {"label":"Lição Kármica Principal Identificada","tipo":"texto_longo","campo_associado":"Kármico","instrucoes_praticas":"COMO IDENTIFICAR: Após regressão, pergunte (paciente ainda em transe leve): 'Qual a lição que essa vida trouxe para você aprender?' Ou pergunte aos guias espirituais na entrelinha. Anote.","dicas_observacao":"Ex: 'Aprender perdão', 'Desenvolver coragem', 'Soltar controle', 'Valorizar amor'. A lição explica padrões atuais."},
                        {"label":"Conexões com Pessoas da Vida Atual","tipo":"texto_curto","campo_associado":"Transgeneracional","instrucoes_praticas":"COMO IDENTIFICAR: Durante regressão, pergunte: 'Olhe para as pessoas ao seu redor. Alguém você reconhece da vida atual?' Paciente pode identificar cônjuge, mãe, filho de hoje. Anote papéis trocados.","dicas_observacao":"Almas reencarnam em grupos. Relacionamentos difíceis hoje podem ter origem em dívidas ou mágoas de outras vidas."},
                        {"label":"Votos ou Contratos de Vidas Passadas Ativos","tipo":"checkbox","campo_associado":"Kármico","opcoes":["Voto de pobreza","Voto de castidade","Voto de silêncio","Voto de obediência","Pacto de vingança","Promessa de sacrifício","Contrato de servidão","Outro voto limitante"],"instrucoes_praticas":"COMO IDENTIFICAR: Se pessoa tem bloqueios inexplicáveis (ex: não consegue prosperar), investigue votos. Na regressão, pergunte: 'Você fez algum voto ou promessa?' IMPORTANTE: fazer ritual de cancelamento.","dicas_observacao":"Votos de vidas passadas (ex: pobreza monástica) continuam ativos se não cancelados conscientemente. Bloqueia abundância hoje."},
                        {"label":"Nível de Integração da Experiência Regressiva","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"COMO AVALIAR: Após sessão (final ou retorno), pergunte: 'Isso fez sentido para você? Você compreendeu a conexão com sua vida atual?' Observe: clareza, emoção, aceitação.","dicas_observacao":"1-3: Confuso, não integrou. 4-6: Parcial. 7-8: Boa compreensão. 9-10: Insight profundo transformador."},
                        {"label":"Mensagens ou Orientações Recebidas dos Guias Espirituais","tipo":"texto_longo","campo_associado":"Espiritual","instrucoes_praticas":"COMO ACESSAR: Após morte na regressão, conduza à 'luz'/entrelinha. Pergunte: 'Seus guias ou mestres têm mensagens para você?' Deixe paciente receber. Anote textualmente se possível.","dicas_observacao":"Mensagens da entrelinha são profundamente sábias e transformadoras. Sempre grave (com permissão) ou anote."},
                        {"label":"Plano de Integração e Trabalho Pós-Regressão","tipo":"texto_longo","campo_associado":"Mental","instrucoes_praticas":"COMO ORIENTAR: Após sessão, crie plano: 'Esta semana, observe como esse padrão aparece. Quando sentir o medo, lembre da origem. Faça ritual de liberação (banho, oração).' Sessão de retorno em 2-4 semanas.","dicas_observacao":"Regressão é início, não fim! A transformação acontece na integração consciente das semanas seguintes."}
                    ]
        },
        {
            id: '23',
            nome: 'Shiatsu',
            categoria: 'Físico',
            tipo_visualizacao_sugerido: 'chakra_bar',
            nivel_dificuldade: 'Intermediário',
            duracao_media: '60-90min',
            descricao: 'Arte terapêutica japonesa milenar que utiliza pressão precisa dos dedos, palmas e polegares sobre pontos energéticos (tsubos) ao longo dos meridianos para restabelecer o fluxo equilibrado de Ki (energia vital). Combina princípios da Medicina Tradicional Chinesa com técnicas corporais japonesas para promover saúde física, emocional e energética profunda.',
            beneficios: ['Alívio profundo de dores musculares e tensões crônicas', 'Desbloqueio dos meridianos e restauração do fluxo de Ki', 'Redução significativa de estresse e ansiedade', 'Melhora da qualidade do sono e relaxamento profundo', 'Equilíbrio do sistema nervoso autônomo', 'Alívio de dores de cabeça e enxaquecas', 'Melhora da digestão e funcionamento intestinal', 'Fortalecimento do sistema imunológico', 'Correção postural e consciência corporal', 'Liberação emocional através do corpo físico', 'Aumento de vitalidade e energia vital', 'Harmonização de órgãos internos'],
            contraindicacoes: 'Febre alta ou infecções agudas, Fraturas ósseas recentes (menos de 6 semanas), Trombose venosa profunda ou varizes severas, Câncer em fase ativa (consultar oncologista), Gestação de risco (primeiro trimestre requer cuidados especiais), Osteoporose severa: pressão muito suave, Feridas abertas ou infecções de pele na área, Após cirurgia: aguardar 3 meses ou autorização médica, Pressão alta não controlada: evitar pontos específicos, Sempre consultar médico em casos de doenças crônicas graves',
            campos_formulario: [
                        {"label":"Nível de Tensão Muscular Geral","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Palpe ombros, trapézio, lombar. Pergunte: 'Nível de tensão no corpo (1-10)?' Observe postura rígida, respiração superficial, mandíbula travada.","dicas_observacao":"1-3: Relaxado. 4-6: Tensão moderada. 7-8: Muito tenso, contrações visíveis. 9-10: Corpo em alerta constante, rigidez extrema."},
                        {"label":"Intensidade de Dor em Região Específica","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte onde dói. Peça para apontar. Palpe a região. 'Intensidade da dor (1-10)?' Observe: paciente se encolhe ao toque? Área quente ou gelada?","dicas_observacao":"1-3: Leve desconforto. 4-6: Dor presente mas suportável. 7-8: Dor intensa, afeta atividades. 9-10: Dor incapacitante."},
                        {"label":"Estado dos Meridianos Principais","tipo":"texto_curto","campo_associado":"Energético","instrucoes_praticas":"COMO AVALIAR: Durante Hara (diagnóstico abdominal), palpe suavemente. Áreas duras = excesso (jitsu). Áreas vazias = deficiência (kyo). Anote: 'Fígado: jitsu. Rim: kyo.'","dicas_observacao":"Kyo (vazio): área fria, sem tônus, paciente não sente. Jitsu (cheio): área quente, tensa, dolorida ao toque."},
                        {"label":"Qualidade do Fluxo de Ki (Energia Vital)","tipo":"multipla_escolha","campo_associado":"Vibracional","opcoes":["Fluindo livremente","Levemente estagnado","Moderadamente bloqueado","Severamente bloqueado","Deficiente (vazio)"],"instrucoes_praticas":"COMO AVALIAR: Ao pressionar ao longo dos meridianos, sinta com as mãos. Ki fluindo: sensação de vida, calor sutil. Bloqueado: área densa, sem resposta. Deficiente: vazio, sem energia.","dicas_observacao":"Desenvolva sensibilidade sutil nas mãos através de prática diária de meditação e auto-Shiatsu."},
                        {"label":"Padrão de Respiração","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Respiração profunda e abdominal","Respiração média e torácica","Respiração superficial e curta","Respiração irregular ou presa"],"instrucoes_praticas":"COMO AVALIAR: Observe paciente deitado. Onde ele respira? Abdômen (ideal) ou peito (tensão)? Ritmo regular? Pergunte: 'Como está sua respiração normalmente?'","dicas_observacao":"Respiração abdominal = relaxado. Torácica = estresse. Superficial = ansiedade crônica. Durante sessão, ensinar respiração correta."},
                        {"label":"Desequilíbrio Postural Observado","tipo":"checkbox","campo_associado":"Postural","opcoes":["Ombros elevados e tensos","Cabeça projetada para frente","Hiperlordose lombar","Cifose torácica (corcunda)","Rotação de quadril","Assimetria geral","Postura equilibrada"],"instrucoes_praticas":"COMO AVALIAR: Observe paciente em pé antes da sessão. De frente, perfil e costas. Marque desequilíbrios. Durante Shiatsu, trabalhe áreas compensatórias.","dicas_observacao":"Postura revela padrões emocionais: ombros elevados = medo. Cabeça para frente = excesso mental. Peito fechado = proteção emocional."},
                        {"label":"Nível de Estresse Emocional Manifestado no Corpo","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Nível de estresse/ansiedade (1-10)?' Durante sessão, observe: paciente suspira muito? Chora? Treme? Corpo conta história que boca não diz.","dicas_observacao":"1-3: Calmo. 4-6: Estresse moderado. 7-8: Ansiedade alta. 9-10: Corpo em modo sobrevivência constante. Shiatsu libera emoções."},
                        {"label":"Órgão ou Sistema Mais Comprometido (MTC)","tipo":"multipla_escolha","campo_associado":"Energético","opcoes":["Pulmão (tristeza, pele)","Intestino Grosso (liberação)","Estômago (preocupação)","Baço-Pâncreas (pensamento)","Coração (alegria, ansiedade)","Intestino Delgado (clareza)","Bexiga (medo)","Rim (vitalidade, medo)","Pericárdio (proteção)","Triplo Aquecedor (regulação)","Vesícula Biliar (decisão)","Fígado (raiva, frustração)"],"instrucoes_praticas":"COMO IDENTIFICAR: Baseado em sintomas, emoções predominantes e diagnóstico Hara. Ex: raiva crônica + tensão lateral = Fígado/VB. Medo + lombar = Rim/Bexiga.","dicas_observacao":"Cada meridiano está associado a emoção: Fígado=raiva, Rim=medo, Pulmão=tristeza, Baço=preocupação. Trabalhe meridiano correspondente."},
                        {"label":"Resposta do Corpo Durante Pressão nos Tsubos","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Relaxamento e entrega","Tensão inicial depois relaxa","Resistência constante","Dor intensa (ponto muito bloqueado)","Liberação emocional (choro, tremor)"],"instrucoes_praticas":"COMO OBSERVAR: Durante pressão em pontos importantes, observe reação. Paciente resiste? Relaxa? Dói muito? Chora? Anote pontos críticos para trabalhar nas próximas sessões.","dicas_observacao":"Resistência = proteção emocional. Dor intensa = bloqueio antigo. Choro = liberação necessária (acolher com compaixão)."},
                        {"label":"Recomendações de Auto-Cuidado para Casa","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"COMO ORIENTAR: Ensine 2-3 pontos de auto-Shiatsu para o paciente fazer diariamente. Ex: 'Pressione IG4 (entre polegar e indicador) por 1 min quando tiver dor de cabeça.' Exercícios de respiração.","dicas_observacao":"Empoderar o paciente! Auto-Shiatsu potencializa resultados. Ensinar pontos simples: IG4 (cefaleia), E36 (energia), R1 (aterramento)."}
                    ] 
                },
                { 
            id: '24', 
            nome: 'Medicina Ortomolecular', 
            categoria: 'Físico',
            tipo_visualizacao_sugerido: 'area',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '60-90min', 
                    descricao: 'Abordagem terapêutica científica avançada que busca o equilíbrio bioquímico celular através da correção de deficiências nutricionais, desintoxicação de metais pesados, modulação hormonal e suplementação de vitaminas, minerais e antioxidantes em doses ideais. Criada pelo Dr. Linus Pauling (2x Prêmio Nobel), trata a raiz das doenças em nível molecular para restaurar saúde plena.', 
                    beneficios: ['Correção de deficiências nutricionais em nível celular', 'Aumento significativo de energia e vitalidade', 'Fortalecimento profundo do sistema imunológico', 'Desintoxicação de metais pesados (mercúrio, chumbo, alumínio)', 'Retardo do envelhecimento celular (anti-aging)', 'Melhora de função cognitiva e memória', 'Equilíbrio hormonal natural', 'Redução de inflamações crônicas', 'Prevenção de doenças degenerativas', 'Melhora da qualidade de pele, cabelo e unhas', 'Otimização do metabolismo e emagrecimento saudável', 'Tratamento de fadiga crônica e burnout'], 
                    contraindicacoes: 'Não há contraindicações absolutas quando bem prescrita, Gestantes: suplementação apenas com acompanhamento médico especializado, Pacientes com doenças renais graves: cuidado com doses de vitaminas, Interações medicamentosas: informar todos os medicamentos em uso, Suplementação de ferro: cuidado em casos de hemocromatose, Vitamina K: atenção em pacientes usando anticoagulantes, Sempre solicitar exames laboratoriais antes de prescrever, Não substituir tratamento médico em doenças graves', 
                    campos_formulario: [
                        {"label":"Nível de Energia e Vitalidade Geral","tipo":"escala_1_10","campo_associado":"Físico","instrucoes_praticas":"COMO AVALIAR: Pergunte: 'Nível de energia no dia-a-dia (1-10)?' 'Acorda cansado?' 'Precisa de café o dia todo?' Observe: olheiras, palidez, postura curvada indicam baixa energia.","dicas_observacao":"1-3: Fadiga severa, mal consegue funcionar. 4-6: Energia moderada mas cansa fácil. 7-8: Boa energia. 9-10: Vitalidade plena. Maioria dos pacientes chega entre 3-5."},
                        {"label":"Qualidade do Sono","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Sono profundo e reparador (acorda descansado)","Sono ok mas não reparador","Insônia leve (demora para dormir)","Insônia moderada (acorda várias vezes)","Insônia severa (quase não dorme)"],"instrucoes_praticas":"COMO AVALIAR: 'Como está seu sono?' 'Quantas horas dorme?' 'Acorda descansado?' Sono ruim pode indicar deficiência de magnésio, B6, melatonina.","dicas_observacao":"Insônia crônica: avaliar cortisol, magnésio, B-complex. Pesadelos: pode ser deficiência de B6. Despertar 3-4h: pico glicêmico ou cortisol."},
                        {"label":"Estado da Imunidade (Frequência de Doenças)","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Raramente fica doente (1-2x/ano)","Adoece ocasionalmente (3-4x/ano)","Adoece frequentemente (5-8x/ano)","Adoece constantemente (quase todo mês)","Infecções graves recorrentes"],"instrucoes_praticas":"COMO AVALIAR: 'Quantas vezes ficou doente no último ano?' 'Gripes, resfriados?' 'Infecções urinárias?' Imunidade baixa indica deficiência de vitamina D, C, zinco.","dicas_observacao":"Infecções recorrentes: checar vitamina D, zinco, selênio, vitamina C. Herpes labial frequente: baixa imunidade + estresse. Solicitar hemograma completo."},
                        {"label":"Níveis de Vitamina D no Sangue (ng/mL)","tipo":"texto_curto","campo_associado":"Nutricional","instrucoes_praticas":"COMO AVALIAR: Solicitar exame 25-OH-Vitamina D. Anotar valor exato. IDEAL: 50-80 ng/mL. DEFICIENTE: <30. INSUFICIENTE: 30-50. TÓXICO: >100.","dicas_observacao":"90% da população tem deficiência de vitamina D. Essencial para imunidade, ossos, humor. Suplementar conforme resultado: deficiência = 10.000 UI/dia por 60 dias."},
                        {"label":"Presença de Sintomas de Intoxicação por Metais Pesados","tipo":"checkbox","campo_associado":"Físico","opcoes":["Fadiga inexplicável","Dificuldade de concentração e 'névoa mental'","Dores de cabeça frequentes","Problemas digestivos","Alterações de humor e irritabilidade","Tremores ou formigamentos","Queda de cabelo","Nenhum sintoma"],"instrucoes_praticas":"COMO AVALIAR: Marque sintomas presentes. Pergunte: exposição ocupacional (dentista, pintor)? Mora perto de indústrias? Come muito peixe grande (atum, cação)? Se 3+ sintomas: solicitar mineralograma.","dicas_observacao":"Intoxicação por mercúrio: comum em quem tem amálgamas dentárias antigas ou come muito peixe. Alumínio: desodorantes, panelas. Chumbo: água contaminada, tintas antigas."},
                        {"label":"Avaliação de Estresse Oxidativo (Radicais Livres)","tipo":"multipla_escolha","campo_associado":"Celular","opcoes":["Baixo (vida saudável, alimentação rica em antioxidantes)","Moderado (estresse moderado, alimentação regular)","Alto (estresse crônico, poluição, tabagismo)","Muito alto (múltiplos fatores de risco)"],"instrucoes_praticas":"COMO AVALIAR: Fatores de risco: tabagismo, poluição, estresse crônico, exercício excessivo, alimentação pobre, exposição solar sem proteção. 3+ fatores = estresse oxidativo alto.","dicas_observacao":"Alto estresse oxidativo acelera envelhecimento. Prescrever antioxidantes: vitamina C, E, selênio, glutationa, resveratrol, coenzima Q10."},
                        {"label":"Estado Hormonal (Especialmente para Mulheres)","tipo":"multipla_escolha","campo_associado":"Físico","opcoes":["Hormônios equilibrados","TPM intensa","Menopausa/Climatério","Problemas de tireoide","SOP (Síndrome dos Ovários Policísticos)","Baixa libido","Não se aplica"],"instrucoes_praticas":"COMO AVALIAR: Para mulheres, perguntar sobre ciclo menstrual, TPM, menopausa. Solicitar: TSH, T3, T4, progesterona, estradiol, testosterona. Homens: testosterona total e livre.","dicas_observacao":"TPM severa: deficiência de magnésio, B6, progesterona baixa. Menopausa: fitoestrógenos, vitamina E. Tireoide: selênio, iodo, zinco essenciais."},
                        {"label":"Condição de Pele, Cabelo e Unhas","tipo":"checkbox","campo_associado":"Físico","opcoes":["Pele saudável e hidratada","Pele seca e áspera","Acne ou dermatite","Cabelo caindo excessivamente","Cabelo sem brilho e quebradiço","Unhas fracas e quebradiças","Tudo saudável"],"instrucoes_praticas":"COMO AVALIAR: Observe pele, cabelo, unhas durante consulta. Pergunte sobre mudanças recentes. Pele/cabelo/unhas são espelho da saúde interna. Deficiências aparecem aqui primeiro.","dicas_observacao":"Cabelo caindo: ferro, zinco, biotina, proteína. Unhas fracas: cálcio, silício, colágeno. Pele seca: ômega-3, vitamina A, E. Acne: zinco, vitamina A, probióticos."},
                        {"label":"Função Cognitiva e Clareza Mental","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"'Como está sua memória, concentração, raciocínio (1-10)?' 'Esquece coisas?' 'Névoa mental?' Deficiência de B12, ômega-3, magnésio afeta cognição.","dicas_observacao":"1-3: Déficit cognitivo sério. 4-6: Lapsos frequentes, dificuldade concentração. 7-8: Boa função. 9-10: Mente afiada. Névoa mental: B12, folato, ômega-3."},
                        {"label":"Prescrição Ortomolecular Personalizada","tipo":"texto_longo","campo_associado":"Nutricional","instrucoes_praticas":"DETALHAR: Liste TODOS os suplementos prescritos com dosagens exatas, horários e duração. Ex: 'Vitamina D3 10.000 UI - 1x/dia pela manhã - 60 dias. Magnésio Treonato 500mg - 1x/dia à noite - contínuo.'","dicas_observacao":"Prescrição SEMPRE baseada em exames. Dosagens individualizadas. Orientar: tomar com ou sem alimento? Manhã ou noite? Evitar o quê? Reavaliação obrigatória."}
                    ] 
                },
                { 
            id: '25', 
            nome: 'Hipnoterapia', 
            categoria: 'Mental',
            tipo_visualizacao_sugerido: 'bar',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '60-90min', 
                    descricao: 'Terapia profunda que utiliza o estado de transe hipnótico para acessar o subconsciente, reprogramar padrões limitantes, curar traumas emocionais profundos e instalar novos comportamentos positivos. Através do relaxamento profundo e sugestões terapêuticas direcionadas, permite mudanças rápidas e duradouras em nível inconsciente, onde residem 95% de nossos comportamentos automáticos.', 
                    beneficios: ['Acesso direto ao subconsciente para reprogramação profunda', 'Cura rápida de traumas emocionais (TEPT, fobias)', 'Eliminação de vícios e compulsões (tabaco, álcool, comida)', 'Controle efetivo de dor crônica sem medicação', 'Superação de medos e fobias paralisantes', 'Melhora significativa de autoestima e autoconfiança', 'Tratamento de ansiedade e ataques de pânico', 'Preparação mental para cirurgias e procedimentos', 'Melhora de performance (esportes, estudos, trabalho)', 'Regressão a vidas passadas para compreensão de padrões', 'Instalação de novos hábitos positivos', 'Tratamento de insônia e distúrbios do sono'], 
                    contraindicacoes: 'Esquizofrenia e transtornos psicóticos: contraindicação absoluta, Epilepsia não controlada: risco de crises durante transe, Transtorno dissociativo de identidade: pode agravar, Depressão psicótica com ideação suicida ativa, Pacientes sob efeito de álcool ou drogas, Pessoas extremamente céticas ou resistentes (não funcionará), Crianças menores de 7 anos: usar técnicas adaptadas, Gestantes: evitar regressões profundas, Pacientes com baixo QI: podem ter dificuldade de seguir induções, Sempre complementar, nunca substituir tratamento psiquiátrico', 
                    campos_formulario: [
                        {"label":"Nível de Sugestionabilidade Hipnótica","tipo":"multipla_escolha","campo_associado":"Mental","opcoes":["Muito sugestionável (entra facilmente em transe)","Moderadamente sugestionável","Pouco sugestionável (mais racional, resistente)","Teste não realizado"],"instrucoes_praticas":"COMO AVALIAR: Fazer teste simples - 'Feche os olhos, imagine limão na boca'. Salivou? Muito sugestionável. Ou teste das mãos: 'Mãos coladas'. Consegue separar? Se não, muito sugestionável.","dicas_observacao":"Pessoa criativa, imaginativa = mais sugestionável. Cético rígido = menos. TODOS podem ser hipnotizados em algum nível - ajustar técnica."},
                        {"label":"Profundidade do Transe Alcançado","tipo":"multipla_escolha","campo_associado":"Mental","opcoes":["Transe leve (relaxamento, consciente)","Transe médio (absorção, foco interno)","Transe profundo (sonambulismo, amnésia parcial)","Não entrou em transe"],"instrucoes_praticas":"COMO AVALIAR: Durante sessão, observe: olhos em REM? Músculo facial relaxado? Respiração profunda? Respostas lentas? Após sessão: 'Lembra do que conversamos?' Amnésia = profundo.","dicas_observacao":"Transe leve já é terapêutico! Profundo não é necessário para todos objetivos. Catalepsia (rigidez de membro) = transe profundo."},
                        {"label":"Objetivo Principal da Hipnoterapia","tipo":"multipla_escolha","campo_associado":"Emocional","opcoes":["Parar de fumar","Perder peso/controlar alimentação","Superar fobia específica","Tratar ansiedade/pânico","Curar trauma ou TEPT","Controlar dor crônica","Melhorar autoestima","Melhorar performance (esporte/estudo)","Regressão a vidas passadas","Outro"],"instrucoes_praticas":"COMO DEFINIR: Na anamnese, pergunte: 'O que você quer alcançar?' Objetivo deve ser específico, mensurável. Ex: 'Parar de fumar completamente' (bom) vs 'Me sentir melhor' (vago).","dicas_observacao":"Objetivo claro = resultado melhor. Foque numa questão por sessão. Não prometer cura milagrosa - hipnose é ferramenta poderosa mas requer comprometimento."},
                        {"label":"Evento ou Trauma Trabalhado na Regressão","tipo":"texto_longo","campo_associado":"Emocional","instrucoes_praticas":"COMO DOCUMENTAR: Se fez regressão, descreva o evento acessado. Ex: 'Regressão aos 5 anos - situação de humilhação na escola. Ressignificado com adulto interior protegendo criança.' SIGILO ABSOLUTO.","dicas_observacao":"Regressão é poderosa mas delicada. Acolher emoções que surgirem. Nunca 'implantar' memórias - deixar emergir naturalmente. Ressignificar, não reviver."},
                        {"label":"Sugestões Pós-Hipnóticas Instaladas","tipo":"texto_longo","campo_associado":"Subconsciente","instrucoes_praticas":"COMO PRESCREVER: Durante transe, instale sugestões diretas. Ex: 'Cada dia, cigarros se tornam cada vez menos atraentes para você. Você é não-fumante.' Anotar exatamente o que foi dito.","dicas_observacao":"Sugestões devem ser positivas ('Você é calmo') não negativas ('Você não é ansioso'). Subconsciente não processa negação. Repetição reforça."},
                        {"label":"Reações Emocionais Durante Sessão","tipo":"checkbox","campo_associado":"Emocional","opcoes":["Choro liberador","Riso de alívio","Tremores ou abalos","Catarse emocional intensa","Raiva emergindo","Paz profunda","Nenhuma reação emocional forte"],"instrucoes_praticas":"COMO MANEJAR: Emoções emergem durante hipnose - é terapêutico! Acolha com compaixão. 'Permita-se sentir, está seguro.' Não interromper catarse. Lenços de papel à mão.","dicas_observacao":"Choro = liberação (ótimo sinal). Tremor = sistema nervoso descarregando trauma. Após catarse, instalar calma e proteção antes de despertar."},
                        {"label":"Nível de Ansiedade/Medo Antes da Sessão","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Antes de começar, pergunte: 'Nível de ansiedade/medo agora (1-10)?' Anotar. Após sessão, perguntar novamente para medir eficácia imediata.","dicas_observacao":"1-3: Calmo. 4-6: Ansioso moderado. 7-8: Muito ansioso. 9-10: Pânico. Hipnose geralmente reduz em 50-80% após uma sessão."},
                        {"label":"Nível de Ansiedade/Medo Após a Sessão","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"COMO AVALIAR: Ao final, antes de paciente ir embora: 'E agora, nível de ansiedade (1-10)?' Comparar com antes. Documentar redução.","dicas_observacao":"Se reduziu 3+ pontos = sessão eficaz. Se não reduziu: talvez não entrou em transe adequado ou bloqueio secundário presente."},
                        {"label":"Resistências ou Bloqueios Observados","tipo":"texto_curto","campo_associado":"Mental","instrucoes_praticas":"COMO IDENTIFICAR: Paciente não relaxa? Fica analisando racionalmente? Ri nervosamente? Não segue induções? Anotar. Discutir resistências com empatia - há medo por trás.","dicas_observacao":"Resistência comum: medo de perder controle. Explicar que hipnose não é controle externo. Pessoa sempre pode 'acordar' se quiser. Construir confiança."},
                        {"label":"Auto-Hipnose Ensinada para Casa","tipo":"texto_curto","campo_associado":"Subconsciente","instrucoes_praticas":"COMO ENSINAR: Ao final, ensine técnica simples. Ex: 'Deite, respire 10x profundamente, conte 10-1, repita: Eu sou calmo e confiante. Ao contar 1-10, desperte.' Praticar 10 min/dia.","dicas_observacao":"Auto-hipnose potencializa resultados! Empoderar paciente. Gravar áudio da sessão (com autorização) para ele ouvir diariamente em casa."}
                    ] 
                },
                { 
            id: '26', 
            nome: 'Psicoterapia Infantil', 
            categoria: 'Emocional',
            tipo_visualizacao_sugerido: 'area',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '45-50min', 
                    descricao: 'Abordagem terapêutica especializada voltada para crianças (2-12 anos), utilizando linguagens lúdicas como jogos, desenhos, brinquedos e contação de histórias para acessar o mundo emocional infantil. Trabalha dificuldades emocionais, comportamentais, traumas e desenvolvimento saudável, sempre envolvendo a família no processo terapêutico. Respeita a singularidade de cada criança e seu ritmo de desenvolvimento.', 
                    beneficios: ['Resolução de dificuldades emocionais em linguagem acessível à criança', 'Desenvolvimento de inteligência emocional desde cedo', 'Superação de traumas de forma lúdica e segura', 'Melhora significativa de comportamento (agressividade, birras)', 'Fortalecimento de autoestima e autoconfiança', 'Desenvolvimento de habilidades sociais e empatia', 'Auxílio em transições difíceis (divórcio, mudanças, perdas)', 'Tratamento de ansiedade infantil e medos', 'Melhora de rendimento escolar e concentração', 'Prevenção de transtornos mais graves na adolescência', 'Fortalecimento do vínculo familiar', 'Orientação parental para manejo adequado'], 
                    contraindicacoes: 'Não há contraindicações para psicoterapia infantil bem conduzida, Autismo severo: requer abordagem especializada (ABA, TEACCH), Transtornos neurológicos graves: complementar a neurologista, Pais não participativos ou sabotadores: dificulta processo, Criança muito pequena (<2 anos): trabalhar principalmente com pais, Situação de risco iminente: acionar rede de proteção antes, Sempre complementar a pediatra, neurologista ou psiquiatra quando necessário', 
                    campos_formulario: [
                        {"label":"Idade da Criança","tipo":"texto_curto","campo_associado":"Desenvolvimento","instrucoes_praticas":"ANOTAR: Idade exata (anos e meses). IMPORTANTE: Cada fase tem características próprias. 2-3 anos: birras normais. 4-6: medos comuns. 7-12: questões sociais escolares.","dicas_observacao":"Considerar marcos de desenvolvimento esperados para idade. Atrasos significativos? Encaminhar para avaliação neurológica/pedagógica."},
                        {"label":"Queixa Principal dos Pais/Responsáveis","tipo":"texto_longo","campo_associado":"Comportamental","instrucoes_praticas":"COMO COLHER: Na primeira sessão com pais, perguntar: 'O que está preocupando vocês?' 'Desde quando?' 'O que já tentaram?' Anotar literalmente a fala dos pais.","dicas_observacao":"Queixa dos pais nem sempre é real problema. Observar criança. Ex: Pais dizem 'criança agressiva' mas na verdade ela só se defende de irmão mais velho."},
                        {"label":"Comportamentos Problemáticos Observados","tipo":"checkbox","campo_associado":"Comportamental","opcoes":["Agressividade física (bater, morder)","Birras intensas e frequentes","Desobediência e oposição","Timidez ou isolamento extremo","Medos excessivos","Choro frequente sem causa aparente","Regressão (chupar dedo, xixi na cama)","Dificuldade de sono","Dificuldade alimentar","Dificuldades escolares","Nenhum problema comportamental grave"],"instrucoes_praticas":"COMO AVALIAR: Marque os comportamentos presentes conforme relato dos pais E sua observação. Pergunte frequência e intensidade de cada um.","dicas_observacao":"Comportamento pode ser sintoma de sofrimento emocional. Criança agressiva pode estar assustada. Isolamento pode ser bullying. Investigar causas."},
                        {"label":"Desenvolvimento Emocional (Inteligência Emocional)","tipo":"multipla_escolha","campo_associado":"Emocional","opcoes":["Reconhece e nomeia emoções adequadamente","Dificuldade em reconhecer próprias emoções","Expressa emoções de forma inadequada (explosões)","Reprime/nega emoções","Desregulação emocional constante"],"instrucoes_praticas":"COMO AVALIAR: Durante sessões, observe. Peça: 'Me mostra uma carinha feliz, triste, brava'. Sabe identificar? Quando conta algo, expressa emoção ou fica neutra?","dicas_observacao":"Crianças pequenas ainda estão aprendendo a nomear emoções - é normal. Mas criança de 6+ anos que não identifica: trabalhar alfabetização emocional."},
                        {"label":"Dinâmica Familiar Observada","tipo":"multipla_escolha","campo_associado":"Social","opcoes":["Família estruturada e afetuosa","Pais divorciados/separados","Conflitos conjugais intensos","Limites inconsistentes ou ausentes","Autoritarismo excessivo","Superproteção","Negligência emocional","Novo irmão (ciúmes)","Outra configuração"],"instrucoes_praticas":"COMO AVALIAR: Conversar com pais. Observar como pais falam da criança (com afeto ou irritação?). Perguntar sobre rotina, quem cuida, regras, conflitos familiares.","dicas_observacao":"Sintoma da criança SEMPRE reflete dinâmica familiar. Não culpar pais, mas orientar. Trabalhar sistema, não só criança isoladamente."},
                        {"label":"Histórico de Trauma ou Eventos Significativos","tipo":"texto_longo","campo_associado":"Emocional","instrucoes_praticas":"INVESTIGAR: Perguntar aos pais: 'Algum evento marcante? Perdas? Acidentes? Mudanças? Hospitalização? Abuso?' SIGILO ABSOLUTO. Se suspeita de abuso: notificação compulsória.","dicas_observacao":"Trauma não verbalizado aparece no brincar. Ex: Criança representa acidente de carro repetidamente. Acolher, não forçar fala. Processar ludicamente."},
                        {"label":"Como a Criança Brinca (Observação Clínica)","tipo":"multipla_escolha","campo_associado":"Desenvolvimento","opcoes":["Brinca criativamente e de forma organizada","Brinca de forma repetitiva e rígida","Brinca agressivamente (bate bonecos, destrói)","Não consegue brincar sozinha (precisa direção constante)","Brinca adequadamente para idade"],"instrucoes_praticas":"COMO OBSERVAR: Nas sessões, deixe criança brincar livremente. Observe: escolhe o quê? Como brinca? Faz histórias? Expressa emoções? Brincar revela mundo interno.","dicas_observacao":"Brinca agressivo: pode estar expressando raiva reprimida. Brinca repetitivo: pode estar processando trauma. Não brinca: déficit desenvolvimento/criatividade."},
                        {"label":"Conteúdo Emocional dos Desenhos","tipo":"texto_curto","campo_associado":"Emocional","instrucoes_praticas":"COMO ANALISAR: Pedir 'Desenhe sua família', 'Desenhe você na escola'. Observar: cores usadas, tamanho das figuras, quem está perto/longe, detalhes. Anotar.","dicas_observacao":"Desenho é janela para inconsciente. Criança se desenha pequena = baixa autoestima. Pais longe/ausentes = sentimento de abandono. Muita raiva = cores fortes, riscos."},
                        {"label":"Interação Social com Pares (Escola/Amigos)","tipo":"multipla_escolha","campo_associado":"Social","opcoes":["Socializa bem, tem amigos","Tímida mas consegue interagir","Isolada, sem amigos","Rejeitada ou sofre bullying","Agressiva com colegas","Dificuldade de compartilhar/cooperar"],"instrucoes_praticas":"COMO AVALIAR: Perguntar aos pais e à criança. 'Tem amiguinhos na escola?' 'Brinca com quem?' 'Alguém te chateia?' Contatar escola se necessário (com autorização).","dicas_observacao":"Dificuldade social pode indicar TEA, TDAH ou simplesmente timidez. Bullying afeta profundamente. Trabalhar habilidades sociais através de jogos cooperativos."},
                        {"label":"Orientação Parental Fornecida","tipo":"texto_longo","campo_associado":"Comportamental","instrucoes_praticas":"DETALHAR: Ao final da sessão, orientar pais. Ex: 'Estabelecer rotina de sono. Dar atenção positiva 15min/dia exclusivos. Limites com afeto, não gritos.' Anotar orientações dadas.","dicas_observacao":"Pais são co-terapeutas! Mudança na criança requer mudança no sistema. Orientar sem julgar. Psicoeducação parental essencial para manutenção de ganhos."}
                    ] 
                },
                { 
            id: '27', 
            nome: 'Xamanismo', 
            categoria: 'Espiritual',
            tipo_visualizacao_sugerido: 'radar',
            nivel_dificuldade: 'Avançado',
                    duracao_media: '90-180min', 
                    descricao: 'Prática espiritual ancestral milenar presente em todas as culturas indígenas do mundo, que trabalha com estados ampliados de consciência para cura física, emocional, espiritual e da alma. O xamã atua como ponte entre o mundo ordinário e o mundo espiritual, acessando aliados espirituais (animais de poder, mestres ascensionados, elementais) para diagnóstico, extração de energias densas, recuperação de fragmentos de alma e restauração do equilíbrio sagrado do ser.', 
                    beneficios: ['Reconexão profunda com a essência da alma e propósito de vida', 'Cura de traumas ancestrais e feridas transgeracionais', 'Recuperação de fragmentos de alma perdidos em traumas', 'Extração de energias densas, obsessões e implantes espirituais', 'Restauração do poder pessoal e força vital', 'Conexão com animais de poder e guias espirituais', 'Limpeza e harmonização dos 4 corpos (físico, emocional, mental, espiritual)', 'Cura de doenças de fundo espiritual', 'Equilíbrio com as forças da natureza e elementos', 'Liberação de votos, pactos e contratos de vidas passadas', 'Honra e reconciliação com ancestrais', 'Despertar da visão espiritual e dons mediúnicos'], 
                    contraindicacoes: 'Transtornos psicóticos agudos não estabilizados (esquizofrenia em crise), Pacientes sem abertura ou preparo para vivências espirituais profundas, Uso de substâncias psicoativas sem orientação (pode potencializar), Gestantes: certas práticas xamânicas intensas devem ser evitadas, Crianças pequenas: adaptações necessárias, Pessoas com epilepsia: cuidado com tambores e sons repetitivos, Traumas recentes muito intensos: preparação psicológica primeiro, Sempre complementar, nunca substituir psicoterapia ou psiquiatria quando necessário', 
                    campos_formulario: [
                        {"label":"Intenção de Cura","tipo":"texto_longo","campo_associado":"Espiritual","instrucoes_praticas":"Pergunte ao paciente: 'Qual é sua intenção mais profunda para esta jornada de cura?' Registre com as palavras exatas do paciente. A intenção é a bússola da jornada xamânica.","dicas_observacao":"Observe se a intenção vem do ego (querer mudar outros) ou da alma (transformação pessoal). Uma boa intenção xamânica é específica, pessoal e vem do coração."},
                        {"label":"Conexão com a Natureza","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"Avalie o nível de conexão atual do paciente com a natureza, elementos e seres da terra. 1 = totalmente desconectado/urbano, 10 = profundamente conectado.","dicas_observacao":"A desconexão da natureza é raiz de muitos males espirituais. Pacientes muito desconectados podem precisar de reconexão gradual antes de trabalhos profundos."},
                        {"label":"Fragmentação da Alma","tipo":"escala_1_10","campo_associado":"Anímico","instrucoes_praticas":"Durante a varredura inicial, perceba o grau de integridade da alma. 1 = alma muito fragmentada, 10 = alma completa e íntegra. Sinais: olhar vazio, falta de vitalidade, dissociação.","dicas_observacao":"Fragmentação ocorre em traumas onde 'parte de nós' se vai. Abuso sexual, acidentes graves, mortes traumáticas, guerras, cirurgias são causas comuns."},
                        {"label":"Peso Ancestral","tipo":"escala_1_10","campo_associado":"Transgeneracional","instrucoes_praticas":"Avalie quanto o paciente carrega de feridas não curadas da linhagem familiar. 1 = leve, 10 = peso ancestral extremo. Pergunte sobre padrões familiares de doença, pobreza, violência.","dicas_observacao":"Sinais de peso ancestral: sentir que 'não é seu', padrões que se repetem há gerações, sensação de 'dívida kármica' familiar."},
                        {"label":"Intrusões Espirituais","tipo":"escala_1_10","campo_associado":"Energético","instrucoes_praticas":"Durante diagnóstico, identifique presença de energias estranhas no campo: larvas astrais, implantes, obsessores, cordões. 1 = limpo, 10 = muitas intrusões.","dicas_observacao":"Intrusões aparecem como áreas frias, densas, escuras no campo. Paciente pode sentir como 'algo que não sou eu', pensamentos estranhos, mudanças súbitas de humor."},
                        {"label":"Conexão com Animal de Poder","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"Avalie se o paciente tem animal de poder presente ou está desprotegido. 1 = sem animal de poder, 10 = forte conexão com aliado animal.","dicas_observacao":"Perda do animal de poder deixa a pessoa vulnerável, sem proteção natural. Sinais: azar constante, acidentes repetidos, sensação de estar 'à deriva'."},
                        {"label":"Abertura para o Sagrado","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"Avalie o grau de abertura e confiança do paciente para vivências espirituais profundas. 1 = muito cético/fechado, 10 = totalmente aberto e confiante.","dicas_observacao":"Pacientes muito céticos podem ter dificuldade em entrar em estado alterado. Trabalhe primeiro com explicações científicas (ondas theta, neuroplasticidade)."},
                        {"label":"Visões e Símbolos Recebidos","tipo":"texto_longo","campo_associado":"Espiritual","instrucoes_praticas":"Registre TODAS as visões, símbolos, mensagens, animais e seres que apareceram durante a jornada xamânica. Seja o mais detalhado possível.","dicas_observacao":"O inconsciente fala em símbolos. Anote tudo, mesmo o que parecer sem sentido. O significado pode se revelar depois. Animais têm medicinas específicas."},
                        {"label":"Fragmentos de Alma Recuperados","tipo":"texto_curto","campo_associado":"Anímico","instrucoes_praticas":"Se houve recuperação de alma, descreva: que fragmentos voltaram? De que idade/trauma? Que qualidades retornaram? Ex: 'Fragmento da criança de 7 anos - alegria e inocência'","dicas_observacao":"Após recuperação de alma, o paciente pode sentir desorientação temporária enquanto reintegra. É normal e passa em 24-48h."},
                        {"label":"Mensagens dos Guias Espirituais","tipo":"texto_longo","campo_associado":"Espiritual","instrucoes_praticas":"Registre todas as mensagens, orientações e ensinamentos recebidos dos guias espirituais durante a jornada. Use as palavras exatas recebidas quando possível.","dicas_observacao":"Mensagens verdadeiras trazem paz, clareza e amor. Mensagens do ego trazem medo, confusão ou superioridade. Discernimento é essencial."},
                        {"label":"Mudanças Imediatas Observadas","tipo":"texto_longo","campo_associado":"Físico","instrucoes_praticas":"Documente mudanças visíveis no paciente imediatamente após a sessão: brilho nos olhos, cor da pele, postura, expressão facial, voz.","dicas_observacao":"Curas xamânicas profundas mudam a pessoa visivelmente. Olhos ganham vida, rosto relaxa, postura se endireita. É evidência de cura real."},
                        {"label":"Orientações Pós-Jornada","tipo":"texto_longo","campo_associado":"Espiritual","instrucoes_praticas":"Registre todas as orientações dadas ao paciente: oferendas a fazer, práticas diárias, mudanças de vida, cristais para usar, banhos de erva, etc.","dicas_observacao":"As orientações geralmente vêm dos próprios guias espirituais durante a jornada. Não invente, transmita o que foi recebido."}
                    ] 
        },
        {
            id: '28',
            nome: 'Barras de Access',
            categoria: 'Mental',
            tipo_visualizacao_sugerido: 'bar',
            nivel_dificuldade: 'Iniciante',
            duracao_media: '60-90min',
            descricao: 'Terapia energética que utiliza 32 pontos na cabeça para liberar bloqueios eletromagnéticos, pensamentos limitantes e cargas emocionais armazenadas.',
            beneficios: ['Redução de estresse e ansiedade', 'Melhora na qualidade do sono', 'Liberação de padrões mentais limitantes', 'Aumento da clareza mental', 'Relaxamento profundo', 'Desbloqueio de crenças limitantes', 'Harmonização energética', 'Maior capacidade de receber'],
            contraindicacoes: 'Feridas abertas na cabeça, Cirurgia craniana recente (menos de 6 meses)',
            campos_formulario: [
                        {"label":"Nível de Ansiedade (antes)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"Pergunte ao paciente: 'De 1 a 10, qual o nível de ansiedade que você está sentindo neste momento?'","dicas_observacao":"Observe sinais físicos de ansiedade: respiração acelerada, inquietação, tensão muscular."},
                        {"label":"Nível de Ansiedade (depois)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"Após a sessão, pergunte novamente sobre o nível de ansiedade.","dicas_observacao":"Compare com o valor inicial. Geralmente há redução significativa."},
                        {"label":"Clareza Mental (antes)","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"Pergunte: 'Como você avalia sua clareza mental neste momento?'","dicas_observacao":"Clareza mental baixa indica confusão, pensamentos acelerados ou 'névoa mental'."},
                        {"label":"Clareza Mental (depois)","tipo":"escala_1_10","campo_associado":"Mental","instrucoes_praticas":"Reavalie após a sessão.","dicas_observacao":"Pacientes frequentemente relatam 'mente mais leve' ou 'pensamentos mais organizados'."},
                        {"label":"Sensação de Leveza Energética","tipo":"escala_1_10","campo_associado":"Espiritual","instrucoes_praticas":"Após a sessão, pergunte: 'Como você se sente energeticamente? Sente leveza?'","dicas_observacao":"Leveza indica liberação de cargas emocionais e energéticas."},
                        {"label":"Qualidade do Sono (antes)","tipo":"escala_1_10","campo_associado":"Emocional","instrucoes_praticas":"Pergunte sobre a qualidade do sono nos últimos dias.","dicas_observacao":"Problemas de sono estão frequentemente ligados a sobrecarga mental."},
                        {"label":"Sensações Durante a Sessão","tipo":"multipla_escolha","campo_associado":"Espiritual","opcoes":["Formigamento","Calor","Frio","Cores","Relaxamento Profundo","Sono","Nenhuma"],"instrucoes_praticas":"Pergunte: 'O que você sentiu durante a sessão?'","dicas_observacao":"Todas as sensações são válidas. Ausência de sensação também é normal."},
                        {"label":"Principais Bloqueios Identificados","tipo":"texto_longo","campo_associado":"Mental","instrucoes_praticas":"Anote as principais crenças limitantes ou bloqueios que o paciente mencionou.","dicas_observacao":"Exemplos: 'Não sou bom o suficiente', 'Dinheiro é difícil', 'Não mereço amor'."}
         ]
        }
    ],
    get: async (id) => {
        const lista = await Terapia.list();
        return lista.find(t => t.id === id) || null;
    }
};
    
// Sistema de Sessões com Firebase Firestore
export const Sessao = {
    filter: async (params, order) => {
        // SEMPRE buscar do Firestore - sem fallback silencioso
        const filters = [];
        
        // Aplicar filtro se houver paciente_id
        if (params && params.paciente_id) {
            filters.push({ field: 'paciente_id', operator: '==', value: params.paciente_id });
        }
        
        // Firestore requer índice composto para filtro + ordenação
        // Vamos buscar sem ordenação e ordenar em memória para evitar necessidade de criar índice
        const sessoes = await queryDocuments('sessoes', filters, null, 'asc');
        console.log(`✅ ${sessoes.length} sessão(ões) encontrada(s) no Firestore`);
        
        // Converter timestamps do Firestore para strings ISO
        let sessoesProcessadas = sessoes.map(s => ({
            ...s,
            data_sessao: s.data_sessao?.toDate?.()?.toISOString() || s.data_sessao,
            created_at: s.created_at?.toDate?.()?.toISOString() || s.created_at,
            updated_at: s.updated_at?.toDate?.()?.toISOString() || s.updated_at
        }));
        
        // Ordenar em memória se necessário
        if (order === '-data_sessao') {
            sessoesProcessadas = sessoesProcessadas.sort((a, b) => {
                const dateA = new Date(a.data_sessao || 0);
                const dateB = new Date(b.data_sessao || 0);
                return dateB.getTime() - dateA.getTime(); // Ordem descendente (mais recente primeiro)
            });
        }
        
        return sessoesProcessadas;
    },
    
    create: async (data) => {
        if (!data.paciente_id) {
            throw new Error('ERRO: paciente_id é obrigatório. Não é possível salvar sessão sem paciente associado.');
        }
        
        console.log('💾 Salvando sessão no Firestore (permanente)...');
        console.log('🔗 Paciente ID:', data.paciente_id);
        
        // Buscar dados do paciente para obter o terapeuta_id
        const pacienteData = await getDocument('pacientes', data.paciente_id);
        if (!pacienteData) {
            throw new Error('ERRO: Paciente não encontrado. Não é possível criar sessão para um paciente inexistente.');
        }
        
        // Obter terapeuta_id do paciente
        const terapeuta_id = pacienteData.terapeuta_id;
        if (!terapeuta_id) {
            throw new Error('ERRO: Paciente não possui terapeuta_id associado. Verifique os dados do paciente.');
        }
        
        console.log('👤 Terapeuta ID obtido do paciente:', terapeuta_id);
        
        // Preparar dados para salvamento, convertendo data_sessao para Timestamp se necessário
        const { Timestamp } = await import('firebase/firestore');
        const dataToSave = { 
            ...data,
            terapeuta_id: terapeuta_id // Adicionar terapeuta_id obrigatório para as regras do Firestore
        };
        
        // Se data_sessao é uma string ISO, converter para Timestamp do Firestore
        if (dataToSave.data_sessao && typeof dataToSave.data_sessao === 'string') {
            dataToSave.data_sessao = Timestamp.fromDate(new Date(dataToSave.data_sessao));
            console.log('📅 data_sessao convertida para Timestamp:', dataToSave.data_sessao);
        }
        
        // SEMPRE criar no Firestore PRIMEIRO - se falhar, erro explícito
        const sessao = await createDocument('sessoes', dataToSave);
        console.log('✅ Sessão criada PERMANENTEMENTE no Firestore:', sessao.id);
        
        // Converter Timestamp de volta para ISO string no retorno para manter consistência
        const sessaoRetorno = {
            ...sessao,
            data_sessao: data.data_sessao // Manter formato original (string ISO) no retorno
        };
        
        // Cache local (não crítico)
        try {
            const savedSessions = localStorage.getItem('5d_sessoes');
            const sessoes = savedSessions ? JSON.parse(savedSessions) : [];
            sessoes.push(sessaoRetorno);
            localStorage.setItem('5d_sessoes', JSON.stringify(sessoes));
            console.log('💾 Cache local atualizado (backup secundário)');
        } catch (localError) {
            console.warn('⚠️ Erro ao atualizar cache local (não crítico):', localError);
        }
        
        return sessaoRetorno;
    },
    
    update: async (id, data) => {
        if (!id) {
            throw new Error('ERRO: ID da sessão é obrigatório para atualização.');
        }
        
        console.log('💾 Atualizando sessão no Firestore (permanente)...', id);
        
        // SEMPRE atualizar no Firestore PRIMEIRO - se falhar, erro explícito
        await updateDocument('sessoes', id, data);
        console.log('✅ Sessão atualizada PERMANENTEMENTE no Firestore:', id);
        
        // Cache local (não crítico)
        try {
            const savedSessions = localStorage.getItem('5d_sessoes');
            if (savedSessions) {
                const sessoes = JSON.parse(savedSessions);
                const index = sessoes.findIndex(s => s.id === id);
                if (index !== -1) {
                    sessoes[index] = { ...sessoes[index], ...data, updated_at: new Date().toISOString() };
                    localStorage.setItem('5d_sessoes', JSON.stringify(sessoes));
                    console.log('💾 Cache local atualizado (backup secundário)');
                }
            }
        } catch (localError) {
            console.warn('⚠️ Erro ao atualizar cache local (não crítico):', localError);
        }
        
        return { id, ...data };
    },
    
    get: async (id) => {
        if (!id) {
            throw new Error('ERRO: ID da sessão é obrigatório.');
        }
        
        // SEMPRE buscar do Firestore - sem fallback
        const sessao = await getDocument('sessoes', id);
        if (!sessao) {
            console.warn(`⚠️ Sessão ${id} não encontrada no Firestore`);
            return null;
        }
        
        console.log('✅ Sessão encontrada no Firestore:', id);
        return {
            ...sessao,
            data_sessao: sessao.data_sessao?.toDate?.()?.toISOString() || sessao.data_sessao,
            created_at: sessao.created_at?.toDate?.()?.toISOString() || sessao.created_at,
            updated_at: sessao.updated_at?.toDate?.()?.toISOString() || sessao.updated_at
        };
    },
    
    delete: async (id) => {
        if (!id) {
            throw new Error('ERRO: ID da sessão é obrigatório para exclusão.');
        }
        
        console.log('🗑️ Deletando sessão PERMANENTEMENTE do Firestore:', id);
        
        // SEMPRE deletar do Firestore - se falhar, erro explícito
        await deleteDocument('sessoes', id);
        console.log('✅ Sessão deletada PERMANENTEMENTE do Firestore:', id);
        
        // Cache local (não crítico)
        try {
            const savedSessions = localStorage.getItem('5d_sessoes');
            if (savedSessions) {
                const sessoes = JSON.parse(savedSessions);
                const sessoesAtualizadas = sessoes.filter(s => s.id !== id);
                localStorage.setItem('5d_sessoes', JSON.stringify(sessoesAtualizadas));
                console.log('💾 Cache local atualizado (backup secundário)');
            }
        } catch (localError) {
            console.warn('⚠️ Erro ao atualizar cache local (não crítico):', localError);
        }
    }
};

// Sistema de Práticas Recomendadas com Firebase Firestore
export const PraticaRecomendada = {
    filter: async (params, order) => {
        try {
            const filters = [];
            
            // Aplicar filtros
            if (params && params.paciente_id) {
                filters.push({ field: 'paciente_id', operator: '==', value: params.paciente_id });
            }
            if (params && params.terapeuta_id) {
                filters.push({ field: 'terapeuta_id', operator: '==', value: params.terapeuta_id });
            }
            if (params && params.ativa !== undefined) {
                filters.push({ field: 'ativa', operator: '==', value: params.ativa });
            }
            
            // Aplicar ordenação
            const orderByField = order === '-data_recomendacao' ? 'data_recomendacao' : null;
            const orderDirection = order === '-data_recomendacao' ? 'desc' : 'asc';
            
            const recomendacoes = await queryDocuments('praticas_recomendadas', filters, orderByField, orderDirection);
            
            // Converter timestamps do Firestore para strings ISO
            return recomendacoes.map(r => ({
                ...r,
                data_recomendacao: r.data_recomendacao?.toDate?.()?.toISOString() || r.data_recomendacao,
                created_at: r.created_at?.toDate?.()?.toISOString() || r.created_at,
                updated_at: r.updated_at?.toDate?.()?.toISOString() || r.updated_at
            }));
        } catch (error) {
            console.error('Erro ao buscar práticas recomendadas:', error);
            return [];
        }
    },
    
    create: async (data) => {
        try {
            const recomendacao = await createDocument('praticas_recomendadas', {
                ...data,
                data_recomendacao: new Date().toISOString(),
                ativa: data.ativa !== undefined ? data.ativa : true
            });
            return recomendacao;
        } catch (error) {
            console.error('Erro ao criar prática recomendada:', error);
            throw error;
        }
    },
    
    update: async (id, data) => {
        try {
            const recomendacao = await updateDocument('praticas_recomendadas', id, data);
            return { id, ...data };
        } catch (error) {
            console.error('Erro ao atualizar prática recomendada:', error);
            throw error;
        }
    },
    
    get: async (id) => {
        try {
            const recomendacao = await getDocument('praticas_recomendadas', id);
            if (recomendacao) {
                return {
                    ...recomendacao,
                    data_recomendacao: recomendacao.data_recomendacao?.toDate?.()?.toISOString() || recomendacao.data_recomendacao
                };
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar prática recomendada:', error);
            return null;
        }
    },
    
    delete: async (id) => {
        try {
            await deleteDocument('praticas_recomendadas', id);
        } catch (error) {
            console.error('Erro ao deletar prática recomendada:', error);
            throw error;
        }
    }
};

export const PraticaQuantica = {
    list: async () => [
        {
            id: '1',
            titulo: 'Meditação de Consciência Plena',
            descricao_curta: 'Técnica de mindfulness para presença no momento presente',
            categoria: 'Meditação',
            conteudo_detalhado: `A meditação de consciência plena é uma prática milenar que treina a mente para focar no momento presente, sem julgamentos. Esta técnica ajuda a reduzir ansiedade, melhorar concentração e aumentar a clareza mental.

**Como Praticar:**
1. Sente-se confortavelmente com a coluna ereta
2. Feche os olhos suavemente
3. Respire naturalmente, sem forçar
4. Observe cada inspiração e expiração
5. Quando a mente divagar, gentilmente traga de volta ao foco na respiração

**Benefícios Científicos:**
- Reduz níveis de cortisol (hormônio do estresse)
- Aumenta matéria cinza no cérebro
- Melhora a função imunológica
- Diminui atividade na amígdala (centro do medo)`
        },
        {
            id: '2',
            titulo: 'Respiração Pranayama - 4-7-8',
            descricao_curta: 'Técnica de respiração para relaxamento profundo e equilíbrio energético',
            categoria: 'Respiração',
            conteudo_detalhado: `A técnica 4-7-8 é um padrão respiratório que ativa o sistema nervoso parassimpático, promovendo relaxamento imediato. Desenvolvida pelo Dr. Andrew Weil, combina práticas yoguis milenares com ciência moderna.

**Passo a Passo:**
1. Inspire pelo nariz contando até 4
2. Segure a respiração contando até 7
3. Expire pela boca contando até 8
4. Repita 4 ciclos completos

**Indicações Terapêuticas:**
- Insônia e distúrbios do sono
- Ansiedade e ataques de pânico
- Hipertensão leve
- Stress pós-traumático
- Preparação para procedimentos médicos

**Contraindicações:**
- Hipertensão severa não controlada
- Asma ativa
- Gestantes: diminuir para 4-4-6 (ritmo mais suave)`
        },
        {
            id: '3',
            titulo: 'Técnica de Ancoragem Mental',
            descricao_curta: 'Método para conectar com o presente durante ansiedade ou dissociação',
            categoria: 'Psicoterapia',
            conteudo_detalhado: `A ancoragem é uma técnica de primeiros socorros psicológicos usada para interromper dissociação, ataques de pânico e flashbacks traumáticos. Traz a consciência de volta ao corpo e ao momento presente.

**Técnica 5-4-3-2-1:**
Nomear em voz alta:
- 5 coisas que você pode VER
- 4 coisas que você pode TOCAR
- 3 coisas que você pode OUVIR
- 2 coisas que você pode CHEIRAR
- 1 coisa que você pode SABOREAR

**Técnica de Respiração Consciente:**
1. Concentre-se na sensação do ar entrando pelas narinas
2. Observe o calor do ar ao sair
3. Conte as respirações até 10 e recomece

**Quando Usar:**
- Antes de exames ou apresentações
- Durante ataques de ansiedade
- Após experiências traumáticas
- Estados dissociativos
- Insônia por ruminação mental`
        },
        {
            id: '4',
            titulo: 'Visualização Guiada para Cura',
            descricao_curta: 'Usando imagens mentais para promover cura física e emocional',
            categoria: 'Visualização',
            conteudo_detalhado: `A visualização guiada é uma ferramenta poderosa que usa a imaginação para influenciar processos fisiológicos. Estudos mostram que o cérebro não diferencia completamente entre imagens vívidas e experiências reais.

**Protocolo de Cura com Luz:**
1. Feche os olhos e respire profundamente
2. Imagine uma luz dourada entrando pelo topo da cabeça
3. Esta luz percorre cada parte do corpo que precisa de cura
4. Visualize a área sendo banhada por luz dourada/corada
5. Sinta calor e formigamento na região
6. Imagine células se regenerando, tecidos se fortalecendo

**Para Dores Crônicas:**
- Visualize a dor como uma cor densa (preto/marrom)
- Imagens uma luz brilhante dissolvendo esta cor
- Veja o local ficando claro e radiante
- Sinta a tensão se soltando

**Para Processos Emocionais:**
- Visualize feridas emocionais cicatrizando
- Veja mágoas se transformando em sabedoria
- Imagine cordões energéticos negativos sendo cortados
- Crie imagens de paz interior expandindo`
        },
        {
            id: '5',
            titulo: 'Constelação Interna dos Chakras',
            descricao_curta: 'Técnica para mapear e harmonizar os sete centros energéticos principais',
            categoria: 'Energia',
            conteudo_detalhado: `Os chakras são vórtices energéticos que governam diferentes aspectos da nossa experiência. Através desta prática, mapeamos o estado de cada chakra e trabalhamos conscientemente para reequilibrar.

**Mapeamento Chakra por Chakra:**

**1. Chakra Raiz (Vermelho)** - Base da coluna
*Bloqueado quando:* Medo, insegurança financeira, sentimento de não-pertencimento
*Equilíbrio:* Visualize raízes firmes crescendo para a Terra. Cor vermelha brilhante girando

**2. Chakra Sacral (Laranja)** - Abdome inferior
*Bloqueado quando:* Culpa sexual, criatividade reprimida, prazer negado
*Equilíbrio:* Movimentos pélvicos suaves. Cor laranja fluindo. Dança

**3. Plexo Solar (Amarelo)** - Estômago
*Bloqueado quando:* Baixa autoestima, impotência, controle excessivo
*Equilíbrio:* Postura de poder. Cor amarela forte pulsando. Autoafirmações

**4. Chakra Cardíaco (Verde/Rosa)** - Peito
*Bloqueado quando:* Medo de amar, mágoas não curadas, isolamento emocional
*Equilíbrio:* Respiração profunda no peito. Cor verde amoroso expandindo. Gratidão

**5. Laríngeo (Azul)** - Garganta
*Bloqueado quando:* Dificuldade em se expressar, mentira, medo de falar a verdade
*Equilíbrio:* Canto, vocalização. Cor azul clara. Escrita livre. Comunicação honesta

**6. Terceiro Olho (Índigo)** - Testa
*Bloqueado quando:* Medo de intuição, vivência apenas no concreto, desconfiança
*Equilíbrio:* Meditação com foco na glândula pineal. Cor índigo profunda. Confiar em insights

**7. Chakra Coronário (Violeta/Branco)** - Topo da cabeça
*Bloqueado quando:* Desconexão espiritual, cinismo extremo, falta de propósito
*Equilíbrio:* Conectar com divino. Cor violeta/branco descendo do alto. Propósito de vida

**Prática Diária:** 15 minutos ao acordar e antes de dormir`
        },
        {
            id: '6',
            titulo: 'Técnica de Liberação Emocional (EFT Tapping)',
            descricao_curta: 'Método de acupressão psicológica para liberar traumas e emoções negativas',
            categoria: 'Trauma',
            conteudo_detalhado: `O EFT (Emotional Freedom Techniques) é uma forma de acupressão psicológica que combina elementos da acupuntura com psicoterapia moderna. É especialmente eficaz para traumas, fobias e memórias dolorosas.

**Protocolo Básico:**

**Setup Statement:**
*Mesmo tendo [problema] completamente e profundamente, amo e aceito a mim mesmo*

Enquanto repete 3x, toque suavemente os seguintes pontos em sequência:

**Sequência de Pontos:**
1. **Topo da cabeça** (Chakra coronário)
2. **Lado do olho** (início da sobrancelha)
3. **Sob o olho** (osso infraorbital)
4. **Sob o nariz** (espaço entre nariz e lábio)
5. **No queixo** (centro do queixo)
6. **Depressão clavicular** (início do peito)
7. **Sob o braço** (costelas laterais)
8. **No peito do pé** (acima do osso)

**Aplicação Prática:**

**Para Raiva:**
"Mesmo tendo toda esta raiva em mim, eu me aceito profundamente"
[Toque os pontos]
"Estou liberando toda esta raiva de forma segura"
[Continue batendo]

**Para Medo:**
"Mesmo tendo este medo paralisante, eu me amo completamente"
[Toque os pontos]
"Meu medo está diminuindo, me sinto mais seguro"
[Continue até sentir alívio]

**Para Traumas:**
"Mesmo tendo passado por [evento], eu continuo vivo e forte"
[Toque enquanto respira profundamente]
"O evento passou, eu estou aqui e agora seguro"
[Pause e observe mudanças]

**Ciclos:** 3-5 rodadas normalmente trazem alívio significativo`
        },
        {
            id: '7',
            titulo: 'Ressignificação de Crenças Limitantes',
            descricao_curta: 'Processo consciente de identificar e transformar pensamentos autossabotadores',
            categoria: 'Reprogramação Mental',
            conteudo_detalhado: `As crenças limitantes operam no subconsciente e criam padrões repetitivos de fracasso e sofrimento. Através do reconhecimento consciente, podemos reprogramar estas estruturas mentais profundas.

**Identificando Crenças Limitantes:**

**Perguntas de Auto-diagnóstico:**
- O que eu acredito sobre mim mesmo que me limita?
- O que meus pais me disseram sobre dinheiro/sucesso/amor que eu aceitei como verdade?
- Qual é o pior pensamento que tenho sobre minha capacidade?
- O que me impede de alcançar meus objetivos?

**Técnicas de Ressignificação:**

**1. Investigação Direta (Byron Katie):**
Toda crença limitante deve passar por estas 4 perguntas:
1. "Isso é verdade?"
2. "Posso saber com certeza absoluta que é verdade?"
3. "Como me sinto quando acredito nesse pensamento?"
4. "Quem eu seria sem esse pensamento?"

Então, inverte a crença:
- Original: "Sou incapaz de ser bem-sucedido"
- Invertido: "Sou capaz de ser bem-sucedido"
- Invertido para outro: "Outros são incapazes de ser bem-sucedidos"
- Invertido para si: "Não sou incapaz - mas não me dediquei ainda"

**2. Ancoragem de Nova Crença:**
Encontre evidências que DESPROVAM a crença antiga:
- Crença: "Não mereço amor"
- Evidência contrária: "Pessoa X me amou incondicionalmente"
- Nova crença: "Sim, mereço amor verdadeiro"

**3. Técnica de Pontes (Hypnotherapy):**
"Ahora eu acreditava que [crença antiga], mas agora eu sei que [nova verdade]"

**Meditação de Reprogramação:**
20 minutos diários repetindo a nova crença durante estado de relaxamento profundo (ondas alfa/theta)

**Transformações Comuns:**

**Dinheiro:**
- Velho: "Dinheiro é ruim, causa problemas"
- Novo: "Dinheiro é energia neutra que amplifica o que já sou"

**Relacionamentos:**
- Velho: "Não posso confiar em ninguém"
- Novo: "Posso confiar em mim para escolher pessoas confiáveis"

**Identidade:**
- Velho: "Sou um fracasso"
- Novo: "Tenho experiências que me ensinaram muito"`

        },
        {
            id: '8',
            titulo: 'Proteção Energética e Limpeza Aurica',
            descricao_curta: 'Técnicas para proteger e limpar seu campo energético de influências negativas',
            categoria: 'Proteção',
            conteudo_detalhado: `Nosso campo áurico pode acumular energias densas de ambientes, pessoas e situações traumáticas. Proteger e limpar este campo é essencial para manter saúde mental, emocional e física.

**Técnicas de Limpeza:**

**1. Corte de Cordões Energéticos:**
Visualize cordões de energia conectando você a:
- Pessoas tóxicas do passado
- Situações traumáticas antigas
- Encoragens negativas recebidas

Imagine uma espada dourada cortando estes fios:
"Eu corto todos os cordões negativos com amor e perdão"

**2. Banho de Sal Grosso:**
- Adicione 1 punhado de sal grosso na água do banho
- Fique 20 minutos
- Imagine energias densas sendo dissolvidas pelo sal
- Ao sair, mentalize: "Me libero de toda energia que não me pertence"

**3. Visualização de Cápsula Dourada:**
- Imagine uma cápsula de luz dourada ao seu redor
- Ela é impenetrável e permite apenas amor entrar e sair
- Mantenha esta imagem forte por 5 minutos
- Recarregue toda manhã

**Técnicas de Proteção:**

**Ancoragem Terrestre:**
"Tenho raízes profundas na Terra que me protegem de qualquer desequilíbrio energético"

**Proteção Cósmica:**
"Estou envolvido por uma luz violeta que transmuta qualquer negatividade"

**Aura Dourada:**
"Meu campo áurico brilha dourado e repele energias densas automaticamente"

**Rotina Diária de Proteção (3 minutos):**
1. Pela manhã: visualize escudo de luz dourada
2. Antes de sair: corte cordões de pessoas tóxicas
3. Ao voltar: banho de sal ou visualização de limpeza
4. À noite: grata ao Universo pela proteção`

        },
        {
            id: '9',
            titulo: 'Comunicação Consciente e Não-Violenta',
            descricao_curta: 'Marco Rosenberg - método para comunicação empática e assertiva',
            categoria: 'Comunicação',
            conteudo_detalhado: `A Comunicação Não-Violenta (CNV) é um processo desenvolvido por Marshall Rosenberg que melhora relacionamentos através de comunicação honesta e empática.

**Estrutura da CNV - 4 Componentes:**

**1. OBSERVAÇÃO (sem julgamento)**
❌ Julgamento: "Você nunca faz o que eu peço"
✅ Observação: "Nas últimas 3 vezes que pedi [específico], você não fez"

**2. SENTIMENTO**
❌ Pseudo-sentimento: "Me sinto rejeitado" (na verdade é pensamento)
✅ Sentimento real: "Me sinto triste/frustrado/magoado"

**3. NECESSIDADE**
❌ Necessidade do outro: "Preciso que você me ouça" (exigência)
✅ Necessidade real: "Preciso me sentir ouvido e compreendido"

**4. PEDIDO CLARO**
❌ Pedido vago: "Quero que você seja mais presente"
✅ Pedido específico: "Quero que você me dedique 20 minutos de atenção por dia"

**Exemplo Prático:**

Quando [comportamento específico] acontece,
Eu me sinto [emoção real]
Porque preciso de [necessidade universal - segurança/amor/autonomia]
Gostaria que você [ação concreta e específica]
Você se sentiria confortável em [confirmar pedido]?

**Auto-empatia:**
Antes de reagir ao outro, pratique auto-empatia:
"Quando [situação], eu sinto [emoção], porque preciso [necessidade não atendida]"

**Benefícios Terapêuticos:**
- Reduz conflitos em 80%
- Melhora intimidade emocional
- Expressa sentimentos sem criar defesas
- Cria conexão humana profunda`

        },
        {
            id: '10',
            titulo: 'Integração de Estados de Consciência Alfa/Theta',
            descricao_curta: 'Técnicas para acessar ondas cerebrais de alta capacidade de cura e reprogramação',
            categoria: 'Neurociência',
            conteudo_detalhado: `Cada estado de consciência corresponde a diferentes frequências de ondas cerebrais. Aprendendo a induzir estados Alfa e Theta conscientemente, você pode acessar o subconsciente para cura profunda.

**Estados de Consciência por Frequência:**

**Beta (14-30Hz) - Estado Normal Acordado**
- Vigília, foco externo, análise lógica
- Estado da vida cotidiana

**Alfa (8-13Hz) - Relaxamento Profundo**
- Calma, criatividade, aprendizagem acelerada
- **MELHOR ESTADO PARA PROGRAMAÇÃO POSITIVA**
- Acesso ao subconsciente consciente

**Theta (4-7Hz) - Estado Profundo de Cura**
- Cura física, insight profundo, expansão espiritual
- **ESTADO DO HORARDO DE CURA**
- Acesso a memórias antigas e capacidades extraordinárias
- Produção de óleos de reparo (beta-endorfinas)

**Delta (0.5-3Hz) - Sono Profundo**
- Recuperação celular, regeneração
- Conexão com inteligência universal

**Técnicas de Indução:**

**Para Estado Alpha:**
1. Respiração 4-4-8 (4s inspirar, 4s segurar, 8s expirar)
2. Foco em uma cor mental (azul/rosa)
3. Contagem regressiva 10-1 com relaxamento progressivo
4. Escaneamento corporal (topo → dedos → topo)

Tempo: Atinge Alfa em 5-10 minutos

**Para Estado Theta:**
1. Primeiro atingir Alfa completo (10 min)
2. Mergulhe mais fundo visualizando descida em elevador
3. Degrau por degrau, conte de 10 a 1 lentamente
4. Sensação de flutuar ou mergulhar

Tempo: Atinge Theta em 15-20 minutos de prática

**O Que Fazer em Theta:**
- Instalar novas crenças positivas
- Visualizar cura de doenças
- Perdoar traumas profundos
- Acessar intuição pura
- Reprogramar hábitos

**Ferramenta:**
Apps: Brain.fm, Endel (sons binaurais para indução)

**Contraindicações:**
- Epilepsia: usar sons monaurais apenas
- Psicose ativa: evitar estado Theta profundo
- Gravidez: 2º trimestre+ mais seguro`

        },
        {
            id: '11',
            titulo: 'Protocolo de Autoperdão e Reconciliação Interna',
            descricao_curta: 'Liberando culpa, vergonha e auto-condenação através do perdão',
            categoria: 'Cura Emocional',
            conteudo_detalhado: `O perdão a si mesmo é muitas vezes mais difícil que perdoar outros. Carregamos culpa por atos, omissões, decisões e padrões repetitivos. Este protocolo libera essas correntes emocionais.

**Fases do Autoperdão:**

**FASE 1: RECONHECIMENTO**
Liste tudo que você precisa se perdoar (em papel):
- Erros passados específicos
- Oportunidades perdidas
- Pessoas que magoou
- Promessas não cumpridas (a você mesmo)
- Autossabotagens repetidas

**FASE 2: ENTENDIMENTO**
Para cada item, pergunte:
- O que eu sabia naquele momento?
- Que recursos emocionais eu tinha disponíveis?
- Estava traumatizado/sem recursos naquele momento?
- Faria diferente com o conhecimento atual?

**FASE 3: COMPAIXÃO**
Escreva uma carta para o "você do passado":
"Caro [nome] aos [idade],
Eu entendo por que você [ação/omissão]. Você estava [situação/recursos].
Eu me perdoo completamente. Você estava fazendo o melhor que sabia."

**FASE 4: RITUAL DE LIBERAÇÃO**
- Queime a lista (com segurança)
- Águas: jogue a lista em um rio/oceano
- Ritual com cristais: coloque obsidiana sobre o papel, medite, enterre

**FASE 5: NOVA IDENTIDADE**
"Eu era [quem era], mas AGORA eu sou quem escolho ser:
- Compassivo comigo mesmo
- Responsável mas não culpado
- Que aprendeu com os erros
- Que merece perdão"

**Mantras de Autoperdão:**
- "Eu me perdoo completamente"
- "Eu estava fazendo o melhor que sabia"
- "Meus erros não definem quem sou"
- "Sou humano, mereço compaixão"
- "Meu passado me ensinou, não me condenou"

**Prática de 21 Dias:**
Por 21 dias, ao acordar e antes de dormir:
Repita: "Eu me perdoo completamente por toda mágoa, culpa e vergonha que carreguei. Sou liberto destas correntes. Minha vida agora é leve."

**Quando Culpa Irrompe Novamente:**
Respire profundamente → Diga "Stop" → Execute autoperdão consciente novamente

**Terapias Complementares:**
- Constelação Familiar (para culpas transgeracionais)
- EFT Tapping (para traumas específicos)
- Hipnoterapia (para estados profundos)
- Shiatsu (libera culpa do corpo físico)`

        }
    ],
    get: async (id) => {
        const lista = await PraticaQuantica.list();
        return lista.find(p => p.id === id) || null;
    }
};
    
    export const DiarioBemEstar = {
        filter: async () => [],
        create: async () => ({ id: 'new' })
    };
    
    export const Agendamento = {
        filter: async () => [],
        create: async () => ({ id: 'new' })
    };
    
export const OleoEssencial = {
    list: async () => [
        {
            id: '1',
            nome: 'Lavanda',
            nome_cientifico: 'Lavandula angustifolia',
            familia_botanica: 'Lamiaceae',
            origem_geografica: ['França', 'Bulgária', 'Mediterrâneo'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Flores',
            aroma_descricao: 'Floral, herbáceo, suave, limpo, canforado leve',
            cor: 'Incolor a amarelo pálido',
            viscosidade: 'Leve',
            componentes_principais: ['Acetato de linalila (30-55%)', 'Linalol (25-45%)', 'Cânfora (traços)'],
            propriedades_aromaticas: ['Calmante', 'Relaxante', 'Equilibrante', 'Cicatrizante', 'Ansiolítico', 'Antisséptico'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Tegumentar (Pele)', 'Sistema Respiratório'],
            nota_aromatica: 'Nota de Coração',
            frequencia_energetica: '118 MHz',
            chakras: ['Coronário', 'Terceiro Olho', 'Laríngeo'],
            emocoes_positivas: ['Paz', 'Calma', 'Tranquilidade', 'Aceitação', 'Aconchego'],
            emocoes_negativas: ['Ansiedade', 'Insônia', 'Estresse', 'Agitação mental', 'Medo'],
            indicacoes_fisicas: ['Queimaduras', 'Picadas de inseto', 'Insônia', 'Dores de cabeça tensionais', 'Acne', 'Ansiedade'],
            indicacoes_psicologicas: ['Estresse', 'Síndrome do pânico', 'Agitação', 'Irritabilidade'],
            usos_espirituais: ['Limpeza áurica', 'Meditação', 'Conexão espiritual', 'Harmonização'],
            contraindicacoes: ['Pressão baixa (usar com cautela)', 'Evitar primeiro trimestre de gestação por precaução'],
            sinergias: ['Camomila', 'Laranja', 'Sálvia Esclaréia', 'Gerânio', 'Bergamota'],
            dosagem_recomendada: '2-5%',
            formas_uso: ['Difusão', 'Massagem', 'Banho', 'Uso tópico (puro em pequenas áreas)'],
            validade: '3-4 anos',
            preco_mercado: 'R$ 40-80 por 10ml',
            curiosidades_historicas: 'Usada pelos romanos em banhos (origem do nome "lavare"). Considerado o "canivete suíço" da aromaterapia pela sua versatilidade.',
            uso_terapeutico: 'Aromaterapia, relaxamento, insônia'
        },
        {
            id: '2',
            nome: 'Eucalipto',
            nome_cientifico: 'Eucalyptus globulus',
            familia_botanica: 'Myrtaceae',
            origem_geografica: ['Austrália', 'Portugal', 'Espanha', 'China'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Folhas e galhos',
            aroma_descricao: 'Canforado, medicinal, fresco, penetrante, limpo',
            cor: 'Incolor a amarelo pálido',
            viscosidade: 'Leve',
            componentes_principais: ['1,8-Cineol (Eucaliptol) (70-85%)', 'Alfa-pineno'],
            propriedades_aromaticas: ['Descongestionante', 'Expectorante', 'Antisséptico', 'Estimulante mental', 'Antiviral', 'Refrescante'],
            sistemas_afetados: ['Sistema Respiratório', 'Sistema Musculoesquelético'],
            nota_aromatica: 'Nota de Topo',
            frequencia_energetica: '75 MHz',
            chakras: ['Laríngeo', 'Frontal (Terceiro Olho)'],
            emocoes_positivas: ['Clareza mental', 'Foco', 'Respiração livre', 'Sensação de limpeza', 'Disposição'],
            emocoes_negativas: ['Confusão mental', 'Sensação de "preso"', 'Letargia mental', 'Apatia'],
            indicacoes_fisicas: ['Gripe', 'Resfriado', 'Sinusite', 'Bronquite', 'Dores musculares', 'Febre (refrescante)'],
            indicacoes_psicologicas: ['Falta de foco', 'Cansaço mental', 'Clareza de ideias'],
            usos_espirituais: ['Limpeza energética de ambientes', 'Purificação', 'Abertura de caminhos', 'Proteção respiratória'],
            contraindicacoes: ['Crianças menores de 6 anos (neurotóxico)', 'Asma (pode desencadear crise em alguns)', 'Gestantes', 'Epilepsia'],
            sinergias: ['Hortelã-pimenta', 'Lavanda', 'Limão', 'Tea Tree', 'Alecrim'],
            dosagem_recomendada: '1-3% (uso tópico)',
            formas_uso: ['Difusão', 'Inalação a vapor', 'Sauna', 'Massagem (diluído em peito e costas)'],
            validade: '2-3 anos',
            preco_mercado: 'R$ 20-40 por 10ml',
            curiosidades_historicas: 'Usado por aborígenes australianos para curar feridas e infecções. O E. Globulus é o mais medicinal.',
            uso_terapeutico: 'Sistema respiratório'
        },
        {
            id: '3',
            nome: 'Tea Tree',
            nome_cientifico: 'Melaleuca alternifolia',
            familia_botanica: 'Myrtaceae',
            origem_geografica: ['Austrália'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Folhas',
            aroma_descricao: 'Medicinal, fresco, canforado, pungente',
            cor: 'Incolor a amarelo pálido',
            viscosidade: 'Leve',
            componentes_principais: ['Terpinen-4-ol (30-45%)', 'Gama-terpineno', 'Alfa-terpineno'],
            propriedades_aromaticas: ['Antibacteriano (largo espectro)', 'Antifúngico', 'Antiviral', 'Imunoestimulante', 'Cicatrizante'],
            sistemas_afetados: ['Sistema Imunológico', 'Sistema Tegumentar (Pele)', 'Sistema Respiratório'],
            nota_aromatica: 'Nota de Topo',
            frequencia_energetica: '78 MHz',
            chakras: ['Raiz', 'Laríngeo'],
            emocoes_positivas: ['Força', 'Resiliência', 'Purificação', 'Proteção'],
            emocoes_negativas: ['Vulnerabilidade', 'Sensação de "contaminação"', 'Fraqueza imunológica'],
            indicacoes_fisicas: ['Acne', 'Micoses (unha, pele)', 'Candidíase', 'Caspa', 'Verrugas', 'Gengivite', 'Herpes'],
            indicacoes_psicologicas: ['Hipersensibilidade a críticas', 'Mente confusa por influências externas'],
            usos_espirituais: ['Limpeza energética profunda', 'Proteção contra energias densas', 'Purificação de ambientes'],
            contraindicacoes: ['Pele sensível (diluir sempre)', 'Evitar em gatos (tóxico para felinos)', 'Primeiro trimestre de gestação'],
            sinergias: ['Lavanda', 'Limão', 'Eucalipto', 'Orégano (potencializa antifúngico)'],
            dosagem_recomendada: '1-5% (uso tópico)',
            formas_uso: ['Uso tópico (diluído ou puro em acne/verruga)', 'Bochechos (diluído)', 'Difusão', 'Produtos de limpeza'],
            validade: '2-3 anos',
            preco_mercado: 'R$ 30-60 por 10ml',
            curiosidades_historicas: 'Usado pelo Capitão Cook como "chá" (daí o nome). Usado como antisséptico por soldados australianos na 2ª Guerra.',
            uso_terapeutico: 'Acnes, imunidade, fungos'
        },
        {
            id: '4',
            nome: 'Bergamota',
            nome_cientifico: 'Citrus bergamia',
            familia_botanica: 'Rutaceae',
            origem_geografica: ['Itália (Calábria)', 'Costa do Marfim'],
            metodo_extraccao: 'Prensagem a frio',
            parte_utilizada: 'Casca do fruto',
            aroma_descricao: 'Cítrico floral, sofisticado, doce-amargo, refrescante',
            cor: 'Verde oliva a amarelo esverdeado',
            viscosidade: 'Leve',
            componentes_principais: ['Limoneno (c. 40%)', 'Acetato de linalila (c. 30%)', 'Linalol', 'Bergapteno'],
            propriedades_aromaticas: ['Antidepressivo potente', 'Ansiolítico', 'Antisséptico', 'Cicatrizante', 'Equilibrador emocional', 'Digestivo'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Tegumentar (Pele)', 'Sistema Digestivo'],
            nota_aromatica: 'Nota de Topo',
            frequencia_energetica: '180 MHz',
            chakras: ['Plexo Solar', 'Cardíaco'],
            emocoes_positivas: ['Alegria', 'Leveza', 'Confiança', 'Otimismo', 'Relaxamento alerta'],
            emocoes_negativas: ['Depressão', 'Ansiedade', 'Estresse', 'Tensão', 'Insônia por ansiedade', 'Baixa autoestima'],
            indicacoes_fisicas: ['Acne', 'Pele oleosa', 'Herpes', 'Infecções urinárias', 'Má digestão', 'Perda de apetite'],
            indicacoes_psicologicas: ['Depressão', 'Ansiedade generalizada', 'Insônia por preocupação', 'Tristeza'],
            usos_espirituais: ['Alegria interior', 'Leveza de espírito', 'Confiança', 'Abertura do coração'],
            contraindicacoes: ['FOTOSSENSIBILIZANTE EXTREMO: não expor ao sol por 12-24h', 'Gestação: usar com cautela'],
            sinergias: ['Lavanda', 'Ylang Ylang', 'Gerânio', 'Jasmim', 'Neroli'],
            dosagem_recomendada: '1-2% (atenção à fotossensibilidade)',
            formas_uso: ['Difusão', 'Banho', 'Perfumaria', 'Massagem (sem exposição solar)'],
            validade: '1-2 anos (oxida rápido)',
            preco_mercado: 'R$ 50-100 por 10ml',
            curiosidades_historicas: 'Ingrediente principal do chá Earl Grey. 99% da produção mundial vem da Calábria, Itália. Estudos mostram redução de cortisol.',
            uso_terapeutico: 'Ansiedade, digestão, depressão'
        },
        {
            id: '5',
            nome: 'Sândalo',
            nome_cientifico: 'Santalum album',
            familia_botanica: 'Santalaceae',
            origem_geografica: ['Índia (Mysore)', 'Austrália (S. spicatum)'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Cerne da madeira (árvores com +30 anos)',
            aroma_descricao: 'Amadeirado, doce, balsâmico, exótico, profundo, sagrado',
            cor: 'Amarelo pálido a âmbar escuro',
            viscosidade: 'Alta (espesso)',
            componentes_principais: ['Alfa-santalol (c. 40-50%)', 'Beta-santalol (c. 20%)'],
            propriedades_aromaticas: ['Sedativo', 'Afrodisíaco', 'Espiritual', 'Meditativo', 'Anti-inflamatório', 'Tônico cutâneo'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Geniturinário', 'Pele'],
            nota_aromatica: 'Nota de Base',
            frequencia_energetica: '96 MHz',
            chakras: ['Sacral', 'Cardíaco', 'Coronário'],
            emocoes_positivas: ['Paz interior', 'Centramento', 'Devoção', 'Sensualidade', 'Conexão espiritual'],
            emocoes_negativas: ['Mente dispersa', 'Ansiedade', 'Desconexão espiritual', 'Medo'],
            indicacoes_fisicas: ['Pele seca/madura', 'Cistite', 'Bronquite', 'Tosse seca', 'Impotência/Frigidez'],
            indicacoes_psicologicas: ['Ansiedade', 'Insônia', 'Meditação', 'Depressão'],
            usos_espirituais: ['Meditação profunda', 'Rituais sagrados', 'Ancoramento', 'Conexão com o divino'],
            contraindicacoes: ['Nenhuma conhecida (usar com moderação)', 'Risco de adulteração (alto custo)', 'Evitar em problemas renais graves'],
            sinergias: ['Rosa', 'Jasmim', 'Vetiver', 'Patchouli', 'Olíbano'],
            dosagem_recomendada: '1-3%',
            formas_uso: ['Difusão', 'Massagem', 'Perfumaria (fixador)', 'Cuidados com a pele'],
            validade: '6-8 anos (melhora com o tempo)',
            preco_mercado: 'R$ 200-400 por 5ml (S. album)',
            curiosidades_historicas: 'Usado há milênios na Índia para meditação e rituais. Árvore em risco de extinção (S. album).',
            uso_terapeutico: 'Meditação, libido, pele'
        },
        {
            id: '6',
            nome: 'Jasmim',
            nome_cientifico: 'Jasminum grandiflorum / Jasminum officinale',
            familia_botanica: 'Oleaceae',
            origem_geografica: ['Índia', 'Egito', 'Marrocos', 'França'],
            metodo_extraccao: 'Extração por solvente (Absoluto)',
            parte_utilizada: 'Flores (colhidas à noite)',
            aroma_descricao: 'Floral intenso, doce, exótico, quente, sedutor',
            cor: 'Laranja escuro a marrom avermelhado',
            viscosidade: 'Média a alta',
            componentes_principais: ['Acetato de benzila', 'Linalol', 'Indol (traços)', 'Jasmona'],
            propriedades_aromaticas: ['Afrodisíaco', 'Antidepressivo', 'Eufórico', 'Sedativo', 'Parturiente (auxilia no parto)'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Reprodutor'],
            nota_aromatica: 'Nota de Coração/Base',
            frequencia_energetica: '105 MHz',
            chakras: ['Cardíaco', 'Sacral'],
            emocoes_positivas: ['Confiança', 'Otimismo', 'Sensualidade', 'Euforia', 'Amor'],
            emocoes_negativas: ['Depressão', 'Apatia', 'Insegurança', 'Frigidez', 'Medo'],
            indicacoes_fisicas: ['Dores de parto (facilita)', 'Frigidez', 'Impotência', 'Pele seca'],
            indicacoes_psicologicas: ['Depressão (especialmente pós-parto)', 'Baixa autoestima', 'Bloqueios sexuais'],
            usos_espirituais: ['Amor próprio', 'Conexão com o sagrado feminino', 'Rituais de amor'],
            contraindicacoes: ['Gravidez (evitar até o trabalho de parto)', 'Usar em baixa concentração (muito intenso)'],
            sinergias: ['Rosa', 'Sândalo', 'Bergamota', 'Laranja'],
            dosagem_recomendada: '0.5 - 1% (muito concentrado)',
            formas_uso: ['Perfumaria', 'Massagem (muito diluído)', 'Difusão (1 gota)'],
            validade: '4-5 anos',
            preco_mercado: 'R$ 300-500 por 5ml (Absoluto)',
            curiosidades_historicas: '"Rei das Flores". São necessárias milhões de flores para 1kg de absoluto. O Indol, em alta concentração, cheira a fezes, mas em traços dá profundidade ao aroma.',
            uso_terapeutico: 'Libido, depressão, autoestima'
        },
        {
            id: '7',
            nome: 'Rosa',
            nome_cientifico: 'Rosa damascena',
            familia_botanica: 'Rosaceae',
            origem_geografica: ['Bulgária', 'Turquia', 'Marrocos'],
            metodo_extraccao: 'Destilação a vapor (Otto) / Solvente (Absoluto)',
            parte_utilizada: 'Pétalas (colhidas ao amanhecer)',
            aroma_descricao: 'Floral profundo, doce, rico, complexo, feminino',
            cor: 'Amarelo pálido (Otto) / Vermelho-alaranjado (Absoluto)',
            viscosidade: 'Leve (Otto, mas solidifica no frio)',
            componentes_principais: ['Citronelol', 'Geraniol', 'Nerol', 'Eugenol'],
            propriedades_aromaticas: ['Afrodisíaco', 'Antidepressivo', 'Tônico (cardíaco, uterino)', 'Adstringente', 'Equilibrador hormonal'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Reprodutor Feminino', 'Pele'],
            nota_aromatica: 'Nota de Coração (profunda)',
            frequencia_energetica: '320 MHz (a mais alta)',
            chakras: ['Cardíaco', 'Sacral', 'Coronário'],
            emocoes_positivas: ['Amor incondicional', 'Compaixão', 'Autoestima', 'Alegria', 'Cuidado'],
            emocoes_negativas: ['Luto', 'Mágoa', 'Coração partido', 'Depressão', 'Baixa autoestima', 'Ciúmes'],
            indicacoes_fisicas: ['Pele madura/seca', 'TPM', 'Menopausa', 'Frigidez', 'Palpitações (nervosas)'],
            indicacoes_psicologicas: ['Luto', 'Depressão', 'Trauma emocional', 'Ansiedade'],
            usos_espirituais: ['Abertura do chakra cardíaco', 'Cura emocional profunda', 'Conexão com o amor divino'],
            contraindicacoes: ['Nenhuma conhecida (seguro)', 'Evitar primeiro trimestre de gestação por precaução'],
            sinergias: ['Sândalo', 'Jasmim', 'Gerânio', 'Patchouli', 'Bergamota'],
            dosagem_recomendada: '0.5 - 1% (muito potente)',
            formas_uso: ['Cuidados com a pele', 'Massagem', 'Perfumaria', 'Difusão (1 gota)'],
            validade: '5+ anos (melhora com o tempo)',
            preco_mercado: 'R$ 400-700 por 5ml (Otto)',
            curiosidades_historicas: '"Rainha das Flores". São necessárias 4-5 toneladas de pétalas para 1kg de óleo (Otto). Vibração energética mais alta entre os óleos.',
            uso_terapeutico: 'Pele, emoções, cura do luto'
        },
        {
            id: '8',
            nome: 'Ylang Ylang',
            nome_cientifico: 'Cananga odorata',
            familia_botanica: 'Annonaceae',
            origem_geografica: ['Madagascar', 'Comores', 'Filipinas'],
            metodo_extraccao: 'Destilação a vapor (fracionada)',
            parte_utilizada: 'Flores',
            aroma_descricao: 'Floral intenso, doce, exótico, balsâmico, narcótico',
            cor: 'Incolor a amarelo pálido',
            viscosidade: 'Leve',
            componentes_principais: ['Germacreno-D', 'Acetato de geranila', 'Linalol', 'Farneseno'],
            propriedades_aromaticas: ['Afrodisíaco', 'Sedativo', 'Antidepressivo', 'Hipotensor (baixa pressão)', 'Eufórico'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Circulatório', 'Sistema Reprodutor'],
            nota_aromatica: 'Nota de Base/Coração',
            frequencia_energetica: '85 MHz',
            chakras: ['Sacral', 'Cardíaco'],
            emocoes_positivas: ['Sensualidade', 'Relaxamento', 'Alegria', 'Euforia', 'Autoaceitação'],
            emocoes_negativas: ['Raiva', 'Frustração', 'Estresse', 'Ansiedade', 'Frigidez', 'Medo'],
            indicacoes_fisicas: ['Pressão alta (hipertensão)', 'Taquicardia (nervosa)', 'Frigidez', 'Impotência', 'Pele oleosa/cabelo'],
            indicacoes_psicologicas: ['Ansiedade', 'Insônia', 'Estresse severo', 'Depressão'],
            usos_espirituais: ['Liberação de raiva', 'Conexão com a criança interior', 'Sensualidade sagrada'],
            contraindicacoes: ['Pressão baixa (hipotensão) - pode baixar mais', 'Usar em baixa concentração (pode dar dor de cabeça ou náusea)'],
            sinergias: ['Bergamota', 'Laranja', 'Sândalo', 'Vetiver'],
            dosagem_recomendada: '0.5 - 1.5%',
            formas_uso: ['Difusão (baixa dose)', 'Massagem', 'Banho', 'Perfumaria'],
            validade: '4-5 anos',
            preco_mercado: 'R$ 60-100 por 10ml (Completo)',
            curiosidades_historicas: '"Flor das flores". Na Indonésia, as flores são espalhadas na cama dos recém-casados. A destilação é fracionada (Extra, I, II, III e Completo).',
            uso_terapeutico: 'Sexualidade, ansiedade, pressão alta'
        },
        {
            id: '9',
            nome: 'Manjericão',
            nome_cientifico: 'Ocimum basilicum ct. Linalol / ct. Estragol',
            familia_botanica: 'Lamiaceae',
            origem_geografica: ['Índia', 'Egito', 'Vietnã'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Folhas e flores',
            aroma_descricao: 'Herbáceo, doce, levemente anisado (Estragol) ou floral (Linalol)',
            cor: 'Amarelo pálido',
            viscosidade: 'Leve',
            componentes_principais: ['Linalol (Manjericão Doce)', 'Metil-chavicol (Estragol) (Manjericão Exótico)'],
            propriedades_aromaticas: ['Estimulante mental', 'Digestivo', 'Antiespasmódico', 'Revigorante', 'Expectorante'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Digestivo', 'Sistema Muscular'],
            nota_aromatica: 'Nota de Topo',
            frequencia_energetica: '52 MHz',
            chakras: ['Plexo Solar', 'Frontal (Terceiro Olho)'],
            emocoes_positivas: ['Foco', 'Energia', 'Clareza', 'Coragem', 'Vitalidade'],
            emocoes_negativas: ['Fadiga mental', 'Indecisão', 'Esgotamento nervoso', 'Medo'],
            indicacoes_fisicas: ['Fadiga adrenal', 'Dores musculares', 'Cólicas menstruais', 'Má digestão', 'Enxaqueca (tensional)'],
            indicacoes_psicologicas: ['Cansaço mental', 'Dificuldade de concentração', 'Burnout'],
            usos_espirituais: ['Proteção', 'Abertura da mente', 'Clareza para decisões'],
            contraindicacoes: ['Gravidez', 'Epilepsia', 'Pele sensível', 'Crianças (especialmente QT Estragol)'],
            sinergias: ['Limão', 'Alecrim', 'Gerânio', 'Hortelã-pimenta'],
            dosagem_recomendada: '1-2%',
            formas_uso: ['Difusão (para estudo)', 'Massagem (diluído)', 'Inalação'],
            validade: '2-3 anos',
            preco_mercado: 'R$ 40-70 por 10ml',
            curiosidades_historicas: '"Erva real" (do grego "Basileus" = Rei). Na Índia, é sagrado (Tulsi, O. sanctum, é outra variedade).',
            uso_terapeutico: 'Energia, digestão, foco mental'
        },
        {
            id: '10',
            nome: 'Hortelã Pimenta',
            nome_cientifico: 'Mentha piperita',
            familia_botanica: 'Lamiaceae',
            origem_geografica: ['EUA', 'Índia', 'Europa'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Folhas e flores',
            aroma_descricao: 'Mentolado, fresco, penetrante, forte, herbal',
            cor: 'Incolor a verde pálido',
            viscosidade: 'Leve',
            componentes_principais: ['Mentol (35-50%)', 'Mentona (15-30%)'],
            propriedades_aromaticas: ['Analgésico', 'Antiemético (anti-náusea)', 'Digestivo', 'Estimulante mental', 'Refrescante', 'Antisséptico'],
            sistemas_afetados: ['Sistema Digestivo', 'Sistema Nervoso', 'Sistema Respiratório'],
            nota_aromatica: 'Nota de Topo',
            frequencia_energetica: '78 MHz',
            chakras: ['Plexo Solar', 'Frontal (Terceiro Olho)', 'Laríngeo'],
            emocoes_positivas: ['Foco', 'Alerta', 'Clareza', 'Energia', 'Alívio'],
            emocoes_negativas: ['Letargia', 'Confusão mental', 'Náusea', 'Dor de cabeça', 'Apatia'],
            indicacoes_fisicas: ['Dor de cabeça/Enxaqueca', 'Náusea/Enjoo', 'Má digestão', 'Síndrome do intestino irritável', 'Dores musculares'],
            indicacoes_psicologicas: ['Fadiga mental', 'Falta de foco', 'Desmaio (inalação)'],
            usos_espirituais: ['Purificação', 'Despertar da consciência', 'Limpeza mental'],
            contraindicacoes: ['Crianças menores de 5 anos (risco de espasmo)', 'Gestantes', 'Lactantes (pode secar o leite)', 'Não usar com homeopatia (antidota)'],
            sinergias: ['Eucalipto', 'Lavanda', 'Limão', 'Alecrim'],
            dosagem_recomendada: '1-2%',
            formas_uso: ['Inalação (direta ou difusor)', 'Uso tópico (têmporas, nuca)', 'Massagem (diluído)'],
            validade: '3-4 anos',
            preco_mercado: 'R$ 30-50 por 10ml',
            curiosidades_historicas: 'Híbrido natural de Mentha aquatica e Mentha spicata. Usado há séculos para "limpar a cabeça" e ajudar na digestão.',
            uso_terapeutico: 'Dor, náusea, digestão, foco'
        },
        {
            id: '11',
            nome: 'Gerânio',
            nome_cientifico: 'Pelargonium graveolens',
            familia_botanica: 'Geraniaceae',
            origem_geografica: ['Egito', 'China', 'África do Sul', 'Ilha Reunião'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Folhas e flores',
            aroma_descricao: 'Floral, rosáceo, adocicado, levemente mentolado',
            cor: 'Verde pálido a âmbar',
            viscosidade: 'Leve',
            componentes_principais: ['Citronelol (c. 30%)', 'Geraniol (c. 20%)', 'Linalol'],
            propriedades_aromaticas: ['Equilibrador hormonal (feminino)', 'Adstringente', 'Hemostático (para sangramento)', 'Cicatrizante', 'Equilibrador emocional'],
            sistemas_afetados: ['Sistema Endócrino (Hormonal)', 'Pele', 'Sistema Nervoso'],
            nota_aromatica: 'Nota de Coração',
            frequencia_energetica: '105 MHz',
            chakras: ['Cardíaco', 'Sacral', 'Plexo Solar'],
            emocoes_positivas: ['Equilíbrio', 'Estabilidade', 'Cuidado', 'Conforto', 'Autoaceitação'],
            emocoes_negativas: ['Instabilidade emocional', 'TPM', 'Ansiedade', 'Estresse', 'Perfeccionismo'],
            indicacoes_fisicas: ['TPM', 'Sintomas da menopausa', 'Pele oleosa/acne', 'Pele seca/madura (equilibra)', 'Cortes/feridas (para sangramento)'],
            indicacoes_psicologicas: ['Ansiedade', 'Estresse', 'Mudanças de humor', 'Perfeccionismo excessivo'],
            usos_espirituais: ['Equilíbrio do sagrado feminino', 'Cura do coração', 'Proteção'],
            contraindicacoes: ['Evitar primeiro trimestre de gestação', 'Usar com cautela em pele muito sensível'],
            sinergias: ['Lavanda', 'Rosa', 'Bergamota', 'Sálvia Esclaréia'],
            dosagem_recomendada: '1-3%',
            formas_uso: ['Massagem (abdômen para TPM)', 'Cuidados com a pele', 'Difusão', 'Banho'],
            validade: '4-5 anos',
            preco_mercado: 'R$ 70-110 por 10ml',
            curiosidades_historicas: 'Considerado o "óleo da mulher". Frequentemente usado para adulterar o óleo de Rosa (mais caro) por ter aroma similar.',
            uso_terapeutico: 'Hormônios, pele, equilíbrio emocional'
        },
        {
            id: '12',
            nome: 'Limão',
            nome_cientifico: 'Citrus limon',
            familia_botanica: 'Rutaceae',
            origem_geografica: ['Itália', 'Espanha', 'Brasil', 'EUA'],
            metodo_extraccao: 'Prensagem a frio',
            parte_utilizada: 'Casca do fruto',
            aroma_descricao: 'Cítrico, fresco, limpo, azedo, leve',
            cor: 'Amarelo claro a verde',
            viscosidade: 'Leve',
            componentes_principais: ['Limoneno (60-75%)', 'Gama-terpineno', 'Beta-pineno'],
            propriedades_aromaticas: ['Antisséptico', 'Desintoxicante', 'Adstringente', 'Imunoestimulante', 'Digestivo (lipolítico)'],
            sistemas_afetados: ['Sistema Imunológico', 'Sistema Digestivo', 'Sistema Circulatório'],
            nota_aromatica: 'Nota de Topo',
            frequencia_energetica: '72 MHz',
            chakras: ['Plexo Solar', 'Laríngeo'],
            emocoes_positivas: ['Clareza', 'Foco', 'Limpeza', 'Otimismo', 'Energia'],
            emocoes_negativas: ['Confusão', 'Apatia', 'Letargia', 'Sobrecarga mental'],
            indicacoes_fisicas: ['Gripe/Resfriado (prevenção)', 'Má digestão', 'Gordura localizada', 'Celulite', 'Pele oleosa', 'Limpeza'],
            indicacoes_psicologicas: ['Falta de foco', 'Cansaço mental', 'Tomada de decisões'],
            usos_espirituais: ['Limpeza de ambientes (remove energias paradas)', 'Purificação', 'Clareza mental para estudo'],
            contraindicacoes: ['FOTOSSENSIBILIZANTE: não expor ao sol por 12h após uso tópico', 'Pele sensível (diluir)'],
            sinergias: ['Lavanda', 'Eucalipto', 'Tea Tree', 'Alecrim'],
            dosagem_recomendada: '1-3%',
            formas_uso: ['Difusão', 'Produtos de limpeza', 'Massagem (sem exposição solar)', 'Água aromatizada (1 gota)'],
            validade: '1-2 anos (oxida muito rápido)',
            preco_mercado: 'R$ 25-45 por 10ml',
            curiosidades_historicas: 'Usado para purificar água e como antisséptico geral. Marinheiros britânicos usavam para prevenir escorbuto (Vitamina C).',
            uso_terapeutico: 'Imunidade, digestão, limpeza'
        },
        {
            id: '13',
            nome: 'Alfazema',
            nome_cientifico: 'Lavandula latifolia (Spike Lavender)',
            familia_botanica: 'Lamiaceae',
            origem_geografica: ['Espanha', 'Portugal', 'França'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Flores',
            aroma_descricao: 'Canforado, herbáceo, mais penetrante que L. angustifolia',
            cor: 'Incolor a amarelo pálido',
            viscosidade: 'Leve',
            componentes_principais: ['Linalol (c. 40%)', '1,8-Cineol (c. 30%)', 'Cânfora (c. 15%)'],
            propriedades_aromaticas: ['Analgésico (potente)', 'Expectorante', 'Antisséptico', 'Cicatrizante (queimaduras)', 'Estimulante leve'],
            sistemas_afetados: ['Sistema Respiratório', 'Sistema Musculoesquelético', 'Pele'],
            nota_aromatica: 'Nota de Topo/Coração',
            frequencia_energetica: '100 MHz',
            chakras: ['Laríngeo', 'Frontal (Terceiro Olho)'],
            emocoes_positivas: ['Alívio', 'Clareza', 'Coragem', 'Expressão'],
            emocoes_negativas: ['Dor', 'Confusão', 'Medo de falar', 'Congestão'],
            indicacoes_fisicas: ['Queimaduras (excelente)', 'Picadas de vespa/aranha', 'Dores musculares', 'Bronquite', 'Sinusite'],
            indicacoes_psicologicas: ['Fadiga mental', 'Falta de expressão'],
            usos_espirituais: ['Limpeza', 'Abertura da comunicação (Laríngeo)'],
            contraindicacoes: ['Gestantes', 'Crianças pequenas', 'Epilepsia (devido à cânfora)'],
            sinergias: ['Alecrim', 'Eucalipto', 'Hortelã-pimenta', 'Lavanda (Angustifolia)'],
            dosagem_recomendada: '2-5%',
            formas_uso: ['Uso tópico (queimaduras)', 'Massagem (dores)', 'Inalação'],
            validade: '3-4 anos',
            preco_mercado: 'R$ 50-80 por 10ml',
            curiosidades_historicas: 'É a "Lavanda Macho", mais canforada e menos relaxante que a "Fêmea" (Angustifolia). Mais usada para fins físicos (dor, queimadura) do que emocionais.',
            uso_terapeutico: 'Dor, respiração, queimaduras'
        },
        {
            id: '14',
            nome: 'Patchouli',
            nome_cientifico: 'Pogostemon cablin',
            familia_botanica: 'Lamiaceae',
            origem_geografica: ['Indonésia', 'Filipinas', 'Índia'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Folhas (secas e fermentadas)',
            aroma_descricao: 'Terroso, amadeirado, doce, balsâmico, exótico (aroma "hippie")',
            cor: 'Âmbar escuro a marrom-avermelhado',
            viscosidade: 'Alta (muito espesso)',
            componentes_principais: ['Patchulol (c. 30-40%)', 'Alfa-bulneseno', 'Alfa-guaieno'],
            propriedades_aromaticas: ['Afrodisíaco (em baixas doses)', 'Adstringente', 'Cicatrizante', 'Regenerador celular', 'Anti-inflamatório', 'Fungicida'],
            sistemas_afetados: ['Pele', 'Sistema Nervoso', 'Sistema Circulatório (venoso)'],
            nota_aromatica: 'Nota de Base',
            frequencia_energetica: '80 MHz',
            chakras: ['Sacral', 'Raiz'],
            emocoes_positivas: ['Centramento', 'Ancoramento (Grounded)', 'Sensualidade', 'Aceitação do corpo'],
            emocoes_negativas: ['Mente "aérea"', 'Desconexão', 'Ansiedade', 'Obsessão mental'],
            indicacoes_fisicas: ['Pele madura/rachada', 'Acne', 'Dermatite', 'Caspa', 'Hemorroidas', 'Varizes'],
            indicacoes_psicologicas: ['Ansiedade', 'Mente obsessiva', 'Falta de aterramento'],
            usos_espirituais: ['Aterramento (Grounded)', 'Meditação', 'Conexão com o corpo', 'Prosperidade'],
            contraindicacoes: ['Nenhuma conhecida (seguro)', 'Aroma pode ser desagradável para alguns'],
            sinergias: ['Vetiver', 'Sândalo', 'Rosa', 'Laranja', 'Gerânio'],
            dosagem_recomendada: '1-3%',
            formas_uso: ['Perfumaria (fixador)', 'Massagem', 'Cuidados com a pele', 'Difusão (baixa dose)'],
            validade: '10+ anos (melhora muito com o tempo)',
            preco_mercado: 'R$ 60-90 por 10ml',
            curiosidades_historicas: 'Famoso nos anos 60/70 (movimento hippie). Usado em tecidos indianos (como caxemira) para protegê-los de traças durante o transporte.',
            uso_terapeutico: 'Libido, pele, aterramento'
        },
        {
            id: '15',
            nome: 'Vetiver',
            nome_cientifico: 'Vetiveria zizanioides (ou Chrysopogon zizanioides)',
            familia_botanica: 'Poaceae (Gramíneas)',
            origem_geografica: ['Índia', 'Haiti', 'Java', 'Brasil'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Raízes (lavadas e secas)',
            aroma_descricao: 'Terroso profundo, amadeirado, enfumaçado, doce, rico',
            cor: 'Âmbar escuro a marrom-esverdeado',
            viscosidade: 'Extremamente alta (muito espesso, quase sólido)',
            componentes_principais: ['Khusimol', 'Vetiverol', 'Ácido zizanóico'],
            propriedades_aromaticas: ['Sedativo (profundo)', 'Ancoramento (Grounded)', 'Tônico circulatório', 'Imunoestimulante', 'Afrodisíaco'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Imunológico', 'Sistema Circulatório'],
            nota_aromatica: 'Nota de Base (profunda)',
            frequencia_energetica: '70 MHz',
            chakras: ['Raiz', 'Plexo Solar'],
            emocoes_positivas: ['Calma profunda', 'Centramento', 'Estabilidade', 'Segurança', 'Pés no chão'],
            emocoes_negativas: ['Ansiedade crônica', 'Insônia', 'Mente "aérea"', 'Desconexão', 'Insegurança'],
            indicacoes_fisicas: ['Insônia severa', 'Ansiedade', 'TDAH (ajuda no foco)', 'Dores musculares', 'Artrite', 'Pele seca'],
            indicacoes_psicologicas: ['Estresse crônico', 'Burnout', 'Trauma', 'Pânico', 'Falta de aterramento'],
            usos_espirituais: ['Aterramento profundo', 'Meditação', 'Conexão com a Terra', 'Proteção psíquica'],
            contraindicacoes: ['Nenhuma conhecida (muito seguro)', 'Evitar primeiro trimestre de gestação por precaução'],
            sinergias: ['Sândalo', 'Patchouli', 'Lavanda', 'Ylang Ylang', 'Rosa'],
            dosagem_recomendada: '1-2% (aroma muito forte)',
            formas_uso: ['Massagem (nos pés para aterrar)', 'Difusão (1 gota)', 'Perfumaria (fixador)', 'Banho'],
            validade: '10+ anos (melhora com o tempo)',
            preco_mercado: 'R$ 90-150 por 10ml',
            curiosidades_historicas: '"Óleo da tranquilidade". As raízes são usadas para prevenir erosão do solo, pois crescem profundamente na terra.',
            uso_terapeutico: 'Grounded, ansiedade, insônia profunda'
        },
        {
            id: '16',
            nome: 'Neroli',
            nome_cientifico: 'Citrus aurantium var. amara (Flor)',
            familia_botanica: 'Rutaceae',
            origem_geografica: ['Tunísia', 'Marrocos', 'França', 'Egito'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Flores da Laranjeira Amarga',
            aroma_descricao: 'Floral requintado, cítrico, doce, levemente amargo',
            cor: 'Amarelo pálido a âmbar',
            viscosidade: 'Leve',
            componentes_principais: ['Linalol', 'Acetato de linalila', 'Limoneno', 'Nerolidol'],
            propriedades_aromaticas: ['Antidepressivo', 'Ansiolítico (potente)', 'Sedativo', 'Afrodisíaco', 'Regenerador celular (pele)'],
            sistemas_afetados: ['Sistema Nervoso', 'Pele'],
            nota_aromatica: 'Nota de Coração (mas com topo cítrico)',
            frequencia_energetica: '105 MHz',
            chakras: ['Cardíaco', 'Sacral', 'Coronário'],
            emocoes_positivas: ['Paz', 'Calma', 'Alegria', 'Pureza', 'Conforto'],
            emocoes_negativas: ['Choque', 'Trauma', 'Pânico', 'Ansiedade severa', 'Depressão'],
            indicacoes_fisicas: ['Pele madura/sensível', 'Estrias (prevenção)', 'Palpitações', 'Insônia (nervosa)', 'Choque nervoso'],
            indicacoes_psicologicas: ['Ansiedade', 'Depressão', 'Síndrome do pânico', 'Trauma emocional'],
            usos_espirituais: ['Pureza', 'Cura de traumas da alma', 'Casamento sagrado (interno)'],
            contraindicacoes: ['Nenhuma conhecida (muito seguro)', 'Alto custo'],
            sinergias: ['Rosa', 'Jasmim', 'Sândalo', 'Todos os cítricos'],
            dosagem_recomendada: '0.5 - 2%',
            formas_uso: ['Cuidados com a pele', 'Perfumaria', 'Massagem', 'Difusão', 'Água de flores (Hidrolato)'],
            validade: '3-4 anos',
            preco_mercado: 'R$ 500-800 por 5ml',
            curiosidades_historicas: 'Nomeado por uma princesa italiana (Princesa de Nerola) que o usava para perfumar luvas. Associado à pureza (usado em buquês de noiva).',
            uso_terapeutico: 'Ansiedade, depressão, pele'
        },
        {
            id: '17',
            nome: 'Cedarwood',
            nome_cientifico: 'Cedrus atlantica (Cedro do Atlas) / Juniperus virginiana (Cedro da Virgínia)',
            familia_botanica: 'Pinaceae (Atlas) / Cupressaceae (Virgínia)',
            origem_geografica: ['Marrocos (Atlas)', 'EUA (Virgínia)'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Madeira',
            aroma_descricao: 'Amadeirado, doce, balsâmico, quente (Atlas) / Seco, "lápis apontado" (Virgínia)',
            cor: 'Amarelo a âmbar',
            viscosidade: 'Média a alta',
            componentes_principais: ['Himachalenos (Atlas)', 'Cedrol, Thujopseno (Virgínia)'],
            propriedades_aromaticas: ['Sedativo', 'Expectorante', 'Adstringente', 'Tônico (linfático)', 'Antisséptico'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Respiratório', 'Pele'],
            nota_aromatica: 'Nota de Base',
            frequencia_energetica: '80 MHz',
            chakras: ['Raiz', 'Coronário'],
            emocoes_positivas: ['Estabilidade', 'Força', 'Centramento', 'Perseverança', 'Calma'],
            emocoes_negativas: ['Insegurança', 'Ansiedade', 'Mente dispersa', 'Fraqueza'],
            indicacoes_fisicas: ['Pele oleosa/Acne', 'Caspa', 'Queda de cabelo', 'Tosse/Bronquite', 'Celulite (tônico linfático)'],
            indicacoes_psicologicas: ['Ansiedade', 'Insônia', 'Meditação', 'TDAH (aterramento)'],
            usos_espirituais: ['Meditação', 'Aterramento (Grounded)', 'Força interior', 'Conexão ancestral'],
            contraindicacoes: ['Gravidez (ambos, especialmente Atlas)', 'Usar com cautela em pele sensível'],
            sinergias: ['Laranja', 'Vetiver', 'Sândalo', 'Lavanda'],
            dosagem_recomendada: '1-3%',
            formas_uso: ['Difusão', 'Massagem', 'Shampoos', 'Perfumaria'],
            validade: '6-8 anos',
            preco_mercado: 'R$ 30-50 por 10ml',
            curiosidades_historicas: 'Usado pelos egípcios para embalsamar. A madeira é extremamente durável e resistente a insetos.',
            uso_terapeutico: 'Grounded, respiração, pele'
        },
        {
            id: '18',
            nome: 'Frankincense',
            nome_cientifico: 'Boswellia carterii / Boswellia sacra',
            familia_botanica: 'Burseraceae',
            origem_geografica: ['Somália', 'Omã', 'Etiópia', 'Iêmen'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Resina',
            aroma_descricao: 'Balsâmico, resinoso, levemente cítrico, profundo, sagrado, meditativo',
            cor: 'Amarelo pálido a âmbar claro',
            viscosidade: 'Média',
            componentes_principais: ['Alfa-pineno (c. 40-60%)', 'Limoneno', 'Mirceno', 'Sabineno'],
            propriedades_aromaticas: ['Espiritual', 'Meditativo', 'Regenerador celular (pele)', 'Sedativo (do SN)', 'Anti-inflamatório', 'Imunoestimulante'],
            sistemas_afetados: ['Sistema Nervoso', 'Sistema Respiratório', 'Pele', 'Sistema Imunológico'],
            nota_aromatica: 'Nota de Base',
            frequencia_energetica: '147 MHz',
            chakras: ['Coronário', 'Frontal (Terceiro Olho)'],
            emocoes_positivas: ['Conexão divina', 'Paz', 'Proteção espiritual', 'Centramento', 'Aceitação'],
            emocoes_negativas: ['Medo da morte', 'Desconexão espiritual', 'Ansiedade existencial', 'Pensamentos obsessivos'],
            indicacoes_fisicas: ['Pele madura (rugas)', 'Asma', 'Bronquite', 'Inflamação', 'Cicatrizes', 'Fortalecimento imunológico'],
            indicacoes_psicologicas: ['Ansiedade', 'Depressão', 'Meditação', 'Mente agitada'],
            usos_espirituais: ['Meditação profunda', 'Oração', 'Conexão com o Eu Superior', 'Limpeza de traumas passados'],
            contraindicacoes: ['Nenhuma conhecida (muito seguro)'],
            sinergias: ['Sândalo', 'Mirra', 'Lavanda', 'Laranja', 'Vetiver'],
            dosagem_recomendada: '1-3%',
            formas_uso: ['Difusão (para meditação)', 'Cuidados com a pele', 'Massagem', 'Inalação'],
            validade: '5-7 anos',
            preco_mercado: 'R$ 100-150 por 10ml',
            curiosidades_historicas: 'Um dos presentes dos Três Reis Magos (junto com Mirra e Ouro). Usado há milênios para rituais sagrados e embalsamamento no Egito.',
            uso_terapeutico: 'Meditação, regeneração (pele), espiritual'
        },
        {
            id: '19',
            nome: 'Lemongrass',
            nome_cientifico: 'Cymbopogon citratus / Cymbopogon flexuosus',
            familia_botanica: 'Poaceae (Gramíneas)',
            origem_geografica: ['Índia', 'Brasil', 'Guatemala', 'Tailândia'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Capim (folhas)',
            aroma_descricao: 'Cítrico intenso (limão), herbáceo, forte, fresco',
            cor: 'Amarelo a âmbar',
            viscosidade: 'Leve',
            componentes_principais: ['Citral (Geranial + Neral) (65-85%)', 'Mirceno'],
            propriedades_aromaticas: ['Antimicrobiano', 'Antifúngico', 'Anti-inflamatório', 'Tônico', 'Repelente de insetos', 'Vasodilatador'],
            sistemas_afetados: ['Sistema Musculoesquelético', 'Sistema Imunológico', 'Pele'],
            nota_aromatica: 'Nota de Topo',
            frequencia_energetica: '75 MHz',
            chakras: ['Plexo Solar', 'Laríngeo'],
            emocoes_positivas: ['Energia', 'Vitalidade', 'Purificação', 'Otimismo'],
            emocoes_negativas: ['Esgotamento', 'Letargia', 'Pensamentos negativos', 'Estagnação'],
            indicacoes_fisicas: ['Dores musculares', 'Tendinite', 'Pé de atleta', 'Má circulação', 'Febre', 'Repelente'],
            indicacoes_psicologicas: ['Cansaço mental', 'Falta de energia', 'Revigorante'],
            usos_espirituais: ['Limpeza energética', 'Remoção de obstáculos', 'Energização'],
            contraindicacoes: ['Pele sensível (Dermocáustico - diluir sempre, máx 1%)', 'Gravidez', 'Crianças pequenas', 'Glaucoma'],
            sinergias: ['Eucalipto', 'Gerânio', 'Lavanda', 'Tea Tree'],
            dosagem_recomendada: '0.5 - 1% (muito baixo)',
            formas_uso: ['Massagem (dores musculares, bem diluído)', 'Difusão', 'Repelentes', 'Produtos de limpeza'],
            validade: '2-3 anos',
            preco_mercado: 'R$ 25-45 por 10ml',
            curiosidades_historicas: 'Também conhecido como Capim-Limão. Muito usado na culinária asiática. Diferente da Citronela (Cymbopogon nardus).',
            uso_terapeutico: 'Dores musculares, energia, repelente'
        },
        {
            id: '20',
            nome: 'Clary Sage',
            nome_cientifico: 'Salvia sclarea',
            familia_botanica: 'Lamiaceae',
            origem_geografica: ['França', 'Rússia', 'Mediterrâneo'],
            metodo_extraccao: 'Destilação a vapor',
            parte_utilizada: 'Flores e folhas',
            aroma_descricao: 'Herbáceo, doce, floral, levemente amendoado, "vinho"',
            cor: 'Incolor a amarelo pálido',
            viscosidade: 'Leve',
            componentes_principais: ['Acetato de linalila (c. 50-70%)', 'Linalol', 'Esclareol'],
            propriedades_aromaticas: ['Equilibrador hormonal (estrogênio-like)', 'Antidepressivo', 'Relaxante muscular', 'Sedativo', 'Eufórico'],
            sistemas_afetados: ['Sistema Endócrino (Hormonal)', 'Sistema Nervoso', 'Sistema Muscular'],
            nota_aromatica: 'Nota de Coração/Base',
            frequencia_energetica: '90 MHz',
            chakras: ['Sacral', 'Cardíaco', 'Frontal (Terceiro Olho)'],
            emocoes_positivas: ['Intuição', 'Relaxamento', 'Euforia', 'Criatividade', 'Sonhos lúcidos'],
            emocoes_negativas: ['Tensão', 'Estresse', 'TPM', 'Medo', 'Bloqueio criativo'],
            indicacoes_fisicas: ['TPM', 'Cólicas menstruais', 'Sintomas da menopausa', 'Dores musculares', 'Insônia'],
            indicacoes_psicologicas: ['Ansiedade', 'Estresse', 'Depressão', 'Bloqueio criativo'],
            usos_espirituais: ['Aumento da intuição', 'Sonhos lúcidos', 'Meditação', 'Liberação de bloqueios'],
            contraindicacoes: ['Gravidez (pode induzir parto)', 'Não usar junto com álcool (potencializa efeito narcótico)', 'Casos de endometriose ou câncer estrógeno-dependente (cautela)'],
            sinergias: ['Gerânio', 'Lavanda', 'Sândalo', 'Laranja'],
            dosagem_recomendada: '1-3%',
            formas_uso: ['Massagem (abdômen para cólicas)', 'Difusão', 'Banho'],
            validade: '3-4 anos',
            preco_mercado: 'R$ 80-120 por 10ml',
            curiosidades_historicas: 'Usada na Idade Média para "clarear os olhos" (daí o nome "clary" de "clear"). Usada para substituir o lúpulo na cerveja, causando euforia extra.',
            uso_terapeutico: 'Hormônios, TPM, dor, intuição'
        }
    ],
    get: async (id) => {
        const lista = await OleoEssencial.list();
        return lista.find(t => t.id === id) || null;
    }
};
    
export const Cristal = {
    list: async () => [
        { 
            id: '1', 
            nome: 'Ametista', 
            nome_cientifico: 'SiO₂ + Fe³⁺', 
            cor_principal: 'Violeta/Roxo', 
            cores_var: ['Roxo profundo', 'Violeta claro', 'Rosa-lavanda'],
            translucencia: 'Transparente a translúcido',
            dureza: 7,
            estrutura: 'Trigonal',
            chakras_principais: ['Coronário', 'Terceiro Olho'], 
            elementos: ['Água', 'Éter'],
            signos_astrologicos: ['Peixes', 'Aquário', 'Capricórnio'],
            propriedades_energeticas: ['Transmutação', 'Espiritualidade', 'Proteção psíquica', 'Elevação da consciência', 'Conexão divina'], 
            emocoes_tratadas: ['Acalma ansiedade', 'Alivia estresse', 'Promove paz interior', 'Ajuda em vícios', 'Equilibra oscilações de humor'],
            usos_espirituais: ['Abertura do terceiro olho', 'Desenvolvimento da intuição', 'Proteção durante sono', 'Conexão com guias espirituais', 'Meditação profunda'],
            indicacoes_fisicas: ['Dores de cabeça', 'Insônia', 'Tensão muscular', 'Sistema endócrino', 'Desintoxicação'],
            indicacoes_psicologicas: ['Ansiedade e estresse', 'Vícios (álcool, drogas)', 'Insônia', 'Desenvolvimento espiritual', 'Proteção energética'],
            formas_uso: ['Usar como joia', 'Meditar segurando', 'Colocar sob travesseiro', 'Grid de cristais', 'Elixir'],
            origem: 'Brasil, Uruguai, Madagascar',
            curiosidades_historicas: 'Nome vem do grego "amethystos" (não embriagado). Acreditava-se que protegia contra embriaguez. Usada por bispos católicos. Leonardo da Vinci escreveu que dissipa pensamentos ruins e aguça inteligência. Pedra nacional do Uruguai. Geodos gigantes podem pesar toneladas. A cor violeta vem de irradiação natural de ferro. Desaparece com aquecimento acima de 300°C.',
            forma_limpeza: 'Água corrente, fumaça de sálvia, luz da lua, drusa de quartzo. EVITAR sol direto (desbota)',
            contraindicacoes: ['Não expor ao sol', 'Pode desbotar com luz intensa', 'Limpar regularmente'],
            sinergias: ['Quartzo Clear', 'Selenita', 'Lepidolita', 'Fluorita'],
            uso_terapeutico: 'Despertar espiritual, proteção, meditação' 
        },
        { 
            id: '2', 
            nome: 'Quartzo Rosa', 
            nome_cientifico: 'SiO₂ + Ti, Fe, Mn (traços)',
            cor_principal: 'Rosa',
            cores_var: ['Rosa claro', 'Rosa médio', 'Rosa pêssego'],
            translucencia: 'Translúcido',
            dureza: 7,
            estrutura: 'Trigonal',
            chakras_principais: ['Cardíaco'],
            elementos: 'Água',
            signos_astrologicos: ['Touro', 'Libra'],
            propriedades_energeticas: ['Amor incondicional', 'Compaixão', 'Perdão', 'Autoestima', 'Cura emocional profunda'],
            emocoes_tratadas: ['Cura mágoas', 'Perdão', 'Amor-próprio', 'Aceitação', 'Paz emocional', 'Fim de ressentimentos'],
            usos_espirituais: ['Conexão com amor divino', 'Cura de feridas de alma', 'Abertura do coração'],
            indicacoes_fisicas: ['Sistema circulatório', 'Coração físico', 'Pele (rejuvenescimento)', 'Fertilidade'],
            indicacoes_psicologicas: ['Mágoas e ressentimentos', 'Falta de amor-próprio', 'Dificuldade em relacionamentos', 'Trauma de abandono', 'Solidão'],
            formas_uso: ['Usar sobre o coração', 'Meditação de perdão', 'Banho de imersão', 'Colocar no quarto', 'Elixir facial'],
            origem: 'Brasil, Madagascar, África do Sul, Namíbia',
            curiosidades_historicas: 'Pedra de Afrodite e Adônis. Conta-se que Afrodite se cortou em espinhos ao salvar Adônis, tingindo quartzo branco de rosa. Egípcios usavam em máscaras faciais anti-idade. Considerada a pedra do amor. Dakota do Sul (EUA) designou como pedra oficial do estado. Pode exibir efeito "estrela" quando lapidada.',
            forma_limpeza: 'Água corrente, lua cheia, terra, drusa. Pode usar sol suave (manhã)',
            contraindicacoes: ['Pode desbotar com sol intenso', 'Frágil a impactos'],
            sinergias: ['Ródocrosita', 'Kunzita', 'Rodonita', 'Quartzo Clear'],
            uso_terapeutico: 'Alinhamento cardíaco, amor incondicional' 
        },
        { 
            id: '3', 
            nome: 'Quartzo Clear', 
            nome_cientifico: 'SiO₂ puro',
            cor_principal: 'Transparente',
            cores_var: ['Transparente', 'Levemente leitoso'],
            translucencia: 'Transparente',
            dureza: 7,
            estrutura: 'Trigonal',
            chakras_principais: ['Todos os chakras', 'Especialmente Coronário'],
            elementos: 'Todos os elementos',
            signos_astrologicos: ['Todos os signos'],
            propriedades_energeticas: ['Amplificação', 'Programação', 'Limpeza', 'Clareza', 'Foco', 'Transmissão de energia'],
            emocoes_tratadas: ['Clareza mental', 'Foco', 'Organização de pensamentos', 'Equilíbrio'],
            usos_espirituais: ['Conexão universal', 'Canalização', 'Amplifica intenções', 'Pureza espiritual'],
            indicacoes_fisicas: ['Fortalece aura', 'Energiza corpo físico', 'Equilíbrio geral'],
            indicacoes_psicologicas: ['Falta de clareza', 'Baixa energia', 'Programação de intenções', 'Amplificar outros cristais', 'Meditação'],
            formas_uso: ['Meditar segurando', 'Programar intenções', 'Grid central', 'Usar como joia', 'Elixir'],
            origem: 'Brasil, Madagascar, Arkansas (EUA), Alpes Suíços',
            curiosidades_historicas: 'Antigos acreditavam ser gelo eterno. Bolas de cristal usadas para vidência. Caveiras de cristal encontradas em civilizações antigas. Usado em tecnologia moderna (relógios, eletrônicos). É um dos minerais mais abundantes da Terra. Possui propriedades piezoelétricas (gera eletricidade sob pressão). Usado em tecnologia. Pode ser programado com intenções.',
            forma_limpeza: 'Água corrente, sol, lua, terra, fumaça, som. Aceita todos os métodos',
            contraindicacoes: ['Muito resistente', 'Pode arranhar outras pedras mais macias'],
            sinergias: ['Potencializa TODOS os outros cristais'],
            uso_terapeutico: 'Amplificação energética, programação' 
        },
        { 
            id: '4', 
            nome: 'Turmalina Negra', 
            nome_cientifico: 'NaFe₃Al₆(BO₃)₃Si₆O₁₈(OH)₄',
            cor_principal: 'Preto',
            cores_var: ['Preto opaco', 'Preto brilhante'],
            translucencia: 'Opaco',
            dureza: 7.5,
            estrutura: 'Trigonal',
            chakras_principais: ['Raiz', 'Base'],
            elementos: 'Terra',
            signos_astrologicos: ['Capricórnio', 'Escorpião'],
            propriedades_energeticas: ['Proteção máxima', 'Aterramento', 'Transmutação de energias negativas', 'Escudo psíquico', 'Absorção de radiação'],
            emocoes_tratadas: ['Segurança', 'Estabilidade', 'Proteção contra negatividade', 'Confiança'],
            usos_espirituais: ['Corte de cordões negativos', 'Proteção psíquica', 'Limpeza áurica'],
            indicacoes_fisicas: ['Proteção contra radiação eletromagnética', 'Fortalece sistema imunológico', 'Desintoxicação'],
            indicacoes_psicologicas: ['Ambientes com muita eletrônica', 'Proteção energética', 'Pessoas sensíveis', 'Locais com energia pesada'],
            formas_uso: ['Carregar no bolso', 'Colocar perto de eletrônicos', 'Grid de proteção em casa', 'Usar como joia'],
            origem: 'Brasil, Paquistão, África, EUA',
            curiosidades_historicas: 'Magos africanos usavam como amuleto de proteção. Xamãs usavam em rituais de proteção. Considerada "pedra do feiticeiro" por deflexir magias. Única pedra com propriedades piro e piezoelétricas naturais. Gera campo elétrico quando aquecida ou pressionada. Usada para proteger contra radiação de celulares e computadores.',
            forma_limpeza: 'Água corrente com sal, terra, fumaça. Recarregar ao sol ou quartzo clear',
            contraindicacoes: ['Limpar frequentemente (absorve muita energia)', 'Não emprestar'],
            sinergias: ['Obsidiana', 'Hematita', 'Ônix', 'Quartzo Fumê'],
            uso_terapeutico: 'Proteção, aterramento, limpeza energética' 
        },
        { 
            id: '5', 
            nome: 'Citrino', 
            nome_cientifico: 'SiO₂ + Fe (ferro)',
            cor_principal: 'Amarelo dourado',
            cores_var: ['Amarelo claro', 'Dourado', 'Âmbar'],
            translucencia: 'Transparente a translúcido',
            dureza: 7,
            estrutura: 'Trigonal',
            chakras_principais: ['Plexo Solar', 'Umbilical'],
            elementos: 'Fogo',
            signos_astrologicos: ['Leão', 'Gêmeos', 'Áries', 'Libra'],
            propriedades_energeticas: ['Prosperidade', 'Abundância', 'Manifestação', 'Poder pessoal', 'Criatividade', 'Alegria'],
            emocoes_tratadas: ['Autoconfiança', 'Otimismo', 'Alegria de viver', 'Motivação', 'Autoestima'],
            usos_espirituais: ['Lei da Atração', 'Manifestação de desejos', 'Poder criador'],
            indicacoes_fisicas: ['Sistema digestivo', 'Metabolismo', 'Energia física', 'Desintoxicação'],
            indicacoes_psicologicas: ['Falta de prosperidade', 'Baixa autoestima', 'Depressão', 'Falta de motivação', 'Negócios'],
            formas_uso: ['Carregar na carteira', 'Caixa registradora (comércio)', 'Meditar com intenções', 'Usar como joia'],
            origem: 'Brasil, Madagascar, Rússia, França',
            curiosidades_historicas: 'Chamada de "Pedra do Mercador". Comerciantes mantinham na caixa registradora para atrair prosperidade. Romanos usavam em joias. Nome vem de "citrus" pela cor. Citrino natural é raro. Maioria no mercado é ametista aquecida. Única pedra que não absorve energia negativa, apenas transmuta. Não precisa de limpeza energética (mas é bom fazer mesmo assim).',
            forma_limpeza: 'Água corrente, sol (adora sol!), drusa, terra',
            contraindicacoes: ['Resistente', 'Não desbota ao sol'],
            sinergias: ['Pirita', 'Olho de Tigre', 'Quartzo Clear', 'Aventurina Verde'],
            uso_terapeutico: 'Prosperidade, abundância, manifestação' 
        },
        { 
            id: '6', 
            nome: 'Obsidiana Negra', 
            nome_cientifico: 'SiO₂ (vidro vulcânico)',
            cor_principal: 'Preto profundo',
            cores_var: ['Preto puro'],
            translucencia: 'Opaco',
            dureza: 5.5,
            estrutura: 'Amorfo',
            chakras_principais: ['Raiz'],
            elementos: 'Terra + Fogo',
            signos_astrologicos: ['Escorpião', 'Capricórnio'],
            propriedades_energeticas: ['Proteção máxima', 'Espelho da alma', 'Corte de cordões'],
            emocoes_tratadas: ['Confronto com sombras', 'Verdade interior'],
            usos_espirituais: ['Trabalho de sombra', 'Viagem xamânica'],
            indicacoes_fisicas: ['Proteção energética', 'Desintoxicação'],
            indicacoes_psicologicas: ['Trabalho de sombra', 'Terapia profunda', 'Proteção máxima'],
            formas_uso: ['Meditação', 'Proteção pessoal', 'Escudo energético'],
            origem: 'México, Islândia, Estados Unidos',
            curiosidades_historicas: 'Usada por astecas para espelhos e armas. Xamãs usam para viagem espiritual. Afiada o suficiente para cirurgias. Não é tecnicamente um mineral (é vidro).',
            forma_limpeza: 'Terra, sal, fumaça. NÃO usar água',
            contraindicacoes: ['FRÁGIL - quebra facilmente', 'Arestas afiadas'],
            sinergias: ['Turmalina Negra', 'Hematita', 'Ônix'],
            uso_terapeutico: 'Proteção máxima, limpeza, aterramento' 
        },
        { 
            id: '7', 
            nome: 'Selenita', 
            nome_cientifico: 'CaSO₄·2H₂O',
            cor_principal: 'Branco translúcido',
            cores_var: ['Branco', 'Incolor', 'Pêssego'],
            translucencia: 'Translúcido',
            dureza: 2,
            estrutura: 'Monoclínico',
            chakras_principais: ['Coronário', 'Todos'],
            elementos: 'Éter',
            signos_astrologicos: ['Touro', 'Câncer'],
            propriedades_energeticas: ['Limpeza profunda', 'Conexão angélica', 'Paz suprema'],
            emocoes_tratadas: ['Paz mental', 'Clareza', 'Perdão'],
            usos_espirituais: ['Conexão com anjos', 'Elevação espiritual'],
            indicacoes_fisicas: ['Flexibilidade da coluna'],
            indicacoes_psicologicas: ['Limpeza energética', 'Meditação profunda', 'Conexão angélica'],
            formas_uso: ['Varinha de limpeza áurica', 'Torre no ambiente'],
            origem: 'México, Marrocos, Estados Unidos',
            curiosidades_historicas: 'Nome vem de Selene (deusa da lua). Usada em janelas na Roma antiga. Caverna dos Cristais no México tem selenitas de 11 metros! Única pedra autolimpante.',
            forma_limpeza: 'NÃO PRECISA (autolimpante). NÃO usar ÁGUA nem SOL',
            contraindicacoes: ['MUITO FRÁGIL', 'NUNCA água', 'NUNCA sol'],
            sinergias: ['Ametista', 'Quartzo Clear', 'Angelita'],
            uso_terapeutico: 'Limpeza energética profunda' 
        },
        { 
            id: '8', 
            nome: 'Lápis-Lazúli', 
            nome_cientifico: 'Na₃Ca(Si₃Al₃)O₁₂S',
            cor_principal: 'Azul profundo',
            cores_var: ['Azul royal', 'Azul com dourado'],
            translucencia: 'Opaco',
            dureza: 5.5,
            estrutura: 'Cúbico',
            chakras_principais: ['Terceiro Olho', 'Laríngeo'],
            elementos: 'Água + Éter',
            signos_astrologicos: ['Sagitário', 'Aquário'],
            propriedades_energeticas: ['Visão psíquica', 'Verdade', 'Sabedoria'],
            emocoes_tratadas: ['Confiança para falar verdade', 'Autenticidade'],
            usos_espirituais: ['Despertar do terceiro olho', 'Visão espiritual'],
            indicacoes_fisicas: ['Garganta', 'Tireoide', 'Enxaquecas'],
            indicacoes_psicologicas: ['Bloqueio de comunicação', 'Medo de falar'],
            formas_uso: ['Usar no pescoço', 'Terceiro olho em meditação'],
            origem: 'Afeganistão, Chile, Rússia',
            curiosidades_historicas: 'Pedra dos faraós (máscara de Tutancâmon). Pigmento mais caro que ouro. Cleopatra usava pó como sombra. Sumérios acreditavam conter alma dos deuses.',
            forma_limpeza: 'Água rápida, terra, fumaça. EVITAR sol prolongado',
            contraindicacoes: ['Poroso - absorve óleos', 'Não usar em elixir direto'],
            sinergias: ['Ametista', 'Sodalita', 'Quartzo Clear'],
            uso_terapeutico: 'Despertar terceiro olho, intuição, comunicação' 
        },
        { 
            id: '9', 
            nome: 'Pedra da Lua', 
            nome_cientifico: 'KAlSi₃O₈',
            cor_principal: 'Branco leitoso',
            cores_var: ['Branco', 'Pêssego', 'Arco-íris', 'Cinza'],
            translucencia: 'Translúcido',
            dureza: 6,
            estrutura: 'Monoclínico',
            chakras_principais: ['Sacral', 'Terceiro Olho', 'Coronário'],
            elementos: 'Água',
            signos_astrologicos: ['Câncer', 'Peixes', 'Escorpião'],
            propriedades_energeticas: ['Feminino sagrado', 'Intuição', 'Ciclos', 'Fertilidade'],
            emocoes_tratadas: ['Equilíbrio emocional', 'Calma', 'Sensibilidade'],
            usos_espirituais: ['Conexão com deusa', 'Intuição feminina', 'Sonhos proféticos'],
            indicacoes_fisicas: ['Ciclo menstrual', 'Fertilidade', 'Gravidez', 'Parto'],
            indicacoes_psicologicas: ['TPM', 'Menopausa', 'Fertilidade', 'Desenvolvimento intuitivo'],
            formas_uso: ['Usar sobre útero', 'Meditação lunar', 'Sob travesseiro'],
            origem: 'Índia, Sri Lanka, Madagascar',
            curiosidades_historicas: 'Dedicada a Diana (Roma) e Selene (Grécia). Amuleto de viajantes noturnos. Brilho muda com ângulo de visão (adularescência). Usada por grávidas há milênios.',
            forma_limpeza: 'Lua cheia (ideal). Água, sal. EVITAR sol direto',
            contraindicacoes: ['Relativamente frágil', 'Evitar pancadas'],
            sinergias: ['Quartzo Rosa', 'Ametista', 'Labradorita'],
            uso_terapeutico: 'Feminilidade, intuição, fertilidade' 
        },
        { 
            id: '10', 
            nome: 'Labradorita', 
            nome_cientifico: '(Ca,Na)(Al,Si)₄O₈',
            cor_principal: 'Cinza com reflexos',
            cores_var: ['Azul', 'Verde', 'Dourado', 'Arco-íris'],
            translucencia: 'Opaco a translúcido',
            dureza: 6.5,
            estrutura: 'Triclínico',
            chakras_principais: ['Terceiro Olho', 'Coronário', 'Laríngeo'],
            elementos: 'Ar + Fogo',
            signos_astrologicos: ['Leão', 'Sagitário', 'Escorpião'],
            propriedades_energeticas: ['Magia', 'Proteção psíquica', 'Transformação', 'Despertar'],
            emocoes_tratadas: ['Força interior', 'Autoconfiança', 'Perseverança'],
            usos_espirituais: ['Despertar de dons', 'Viagem astral', 'Magia natural'],
            indicacoes_fisicas: ['Olhos', 'Cérebro', 'Metabolismo'],
            indicacoes_psicologicas: ['Desenvolvimento mediúnico', 'Proteção de terapeutas', 'Transformação'],
            formas_uso: ['Usar em meditação', 'Proteção psíquica', 'Ritual'],
            origem: 'Canadá (Labrador), Madagascar, Finlândia',
            curiosidades_historicas: 'Lenda Inuit: aurora boreal aprisionada na pedra. Guerreiros usavam como proteção. Reflexos mudam conforme movimento. Descoberta no Labrador (Canadá) em 1770.',
            forma_limpeza: 'Lua, água corrente, fumaça. Sol moderado',
            contraindicacoes: ['Proteger de arranhões'],
            sinergias: ['Ametista', 'Moldavita', 'Lápis-Lazúli'],
            uso_terapeutico: 'Magia, transformação, proteção psíquica' 
        },
        { 
            id: '11', 
            nome: 'Malaquita', 
            nome_cientifico: 'Cu₂CO₃(OH)₂',
            cor_principal: 'Verde intenso',
            cores_var: ['Verde claro', 'Verde escuro', 'Faixas'],
            translucencia: 'Opaco',
            dureza: 3.5,
            estrutura: 'Monoclínico',
            chakras_principais: ['Cardíaco', 'Plexo Solar'],
            elementos: 'Fogo + Terra',
            signos_astrologicos: ['Escorpião', 'Capricórnio'],
            propriedades_energeticas: ['Transformação profunda', 'Proteção', 'Cura emocional'],
            emocoes_tratadas: ['Quebra de padrões', 'Confronto com traumas', 'Liberação'],
            usos_espirituais: ['Quebra de votos', 'Limpeza de karma', 'Renovação'],
            indicacoes_fisicas: ['Cólicas', 'TPM', 'Parto', 'Artrite'],
            indicacoes_psicologicas: ['Traumas profundos', 'Padrões repetitivos', 'Transformação de vida'],
            formas_uso: ['Meditação transformacional', 'Uso tópico', 'Elixir indireto'],
            origem: 'Congo, Rússia, Austrália',
            curiosidades_historicas: 'Egípcios moíam para sombra. Cleópatra usava. Amuleto de crianças na Idade Média. Tóxica por conter cobre. Usada como pigmento por 3000 anos. Padrões únicos como impressão digital.',
            forma_limpeza: 'Terra, sal seco. NÃO usar água (tóxica). NUNCA sol direto',
            contraindicacoes: ['TÓXICA se ingerida', 'NÃO fazer elixir direto', 'Usar polida'],
            sinergias: ['Azurita', 'Crisocola', 'Turquesa'],
            uso_terapeutico: 'Transformação, proteção, cura emocional profunda' 
        },
        { 
            id: '12', 
            nome: 'Sodalita', 
            nome_cientifico: 'Na₈(Al₆Si₆O₂₄)Cl₂',
            cor_principal: 'Azul royal',
            cores_var: ['Azul', 'Azul com branco', 'Cinza'],
            translucencia: 'Opaco a translúcido',
            dureza: 5.5,
            estrutura: 'Cúbico',
            chakras_principais: ['Terceiro Olho', 'Laríngeo'],
            elementos: 'Água + Ar',
            signos_astrologicos: ['Sagitário', 'Virgem'],
            propriedades_energeticas: ['Lógica', 'Comunicação clara', 'Verdade', 'Calma mental'],
            emocoes_tratadas: ['Confiança', 'Autoestima', 'Expressão'],
            usos_espirituais: ['Visão espiritual racional', 'Integração lógica/intuitiva'],
            indicacoes_fisicas: ['Garganta', 'Laringe', 'Pressão arterial', 'Metabolismo'],
            indicacoes_psicologicas: ['Falar em público', 'Exames', 'Comunicação difícil'],
            formas_uso: ['Usar no pescoço', 'Meditação', 'Estudo'],
            origem: 'Brasil, Canadá, Namíbia',
            curiosidades_historicas: 'Descoberta em 1811 na Groenlândia. Nome significa "pedra de sódio". Confundida com Lápis-Lazúli. Fluorescente sob luz UV. Usada em joalheria moderna.',
            forma_limpeza: 'Água corrente, terra, lua. Evitar sol prolongado',
            contraindicacoes: ['Pode desbotar com sol excessivo'],
            sinergias: ['Lápis-Lazúli', 'Azurita', 'Calcita Azul'],
            uso_terapeutico: 'Comunicação, lógica, verdade' 
        },
        { 
            id: '13', 
            nome: 'Pirita', 
            nome_cientifico: 'FeS₂',
            cor_principal: 'Dourado metálico',
            cores_var: ['Dourado', 'Amarelo metálico'],
            translucencia: 'Opaco',
            dureza: 6,
            estrutura: 'Cúbico',
            chakras_principais: ['Plexo Solar', 'Raiz'],
            elementos: 'Fogo + Terra',
            signos_astrologicos: ['Leão', 'Áries'],
            propriedades_energeticas: ['Prosperidade', 'Manifestação', 'Poder pessoal', 'Proteção'],
            emocoes_tratadas: ['Confiança', 'Assertividade', 'Ação'],
            usos_espirituais: ['Manifestação de sonhos', 'Alquimia interna'],
            indicacoes_fisicas: ['Sistema digestivo', 'Metabolismo'],
            indicacoes_psicologicas: ['Prosperidade', 'Negócios', 'Manifestação de metas'],
            formas_uso: ['Escritório', 'Carteira', 'Altar de prosperidade'],
            origem: 'Peru, Espanha, Estados Unidos',
            curiosidades_historicas: 'Nome vem de "pyr" (fogo) - fazia faíscas. Confundida com ouro ("ouro dos tolos"). Usada para fazer fogo na pré-história. Formas cúbicas perfeitas. Contém enxofre.',
            forma_limpeza: 'Terra, fumaça. NÃO usar água (oxida)',
            contraindicacoes: ['NÃO molhar (oxida)', 'Pode soltar enxofre'],
            sinergias: ['Citrino', 'Quartzo Clear', 'Pedra do Sol'],
            uso_terapeutico: 'Prosperidade, abundância, manifestação' 
        },
        { 
            id: '14', 
            nome: 'Turmalina Melancia', 
            nome_cientifico: 'Silicato de Boro e Alumínio',
            cor_principal: 'Verde e rosa',
            cores_var: ['Rosa no centro, verde na borda'],
            translucencia: 'Transparente a translúcido',
            dureza: 7,
            estrutura: 'Trigonal',
            chakras_principais: ['Cardíaco'],
            elementos: 'Água',
            signos_astrologicos: ['Gêmeos', 'Virgem', 'Capricórnio'],
            propriedades_energeticas: ['Equilíbrio', 'Amor incondicional', 'Alegria', 'Harmonização'],
            emocoes_tratadas: ['União de opostos', 'Equilíbrio masculino/feminino', 'Compaixão'],
            usos_espirituais: ['Ativação do coração', 'União de polaridades'],
            indicacoes_fisicas: ['Coração', 'Sistema nervoso', 'Equilíbrio hormonal'],
            indicacoes_psicologicas: ['Relacionamentos', 'Autoamor', 'Equilíbrio emocional'],
            formas_uso: ['Usar no coração', 'Meditação', 'Sono'],
            origem: 'Brasil, África, Estados Unidos',
            curiosidades_historicas: 'Rara e valiosa. Descoberta no século 20 no Brasil. Padrão natural parece fatia de melancia! Altamente valorizada. Cada peça é única.',
            forma_limpeza: 'Água, lua, terra, sol suave',
            contraindicacoes: ['Evitar produtos químicos'],
            sinergias: ['Quartzo Rosa', 'Rodocrosita', 'Kunzita'],
            uso_terapeutico: 'Amor equilibrado, harmonização' 
        },
        { 
            id: '15', 
            nome: 'Jaspe Vermelho', 
            nome_cientifico: 'SiO₂',
            cor_principal: 'Vermelho tijolo',
            cores_var: ['Vermelho', 'Marrom avermelhado'],
            translucencia: 'Opaco',
            dureza: 7,
            estrutura: 'Trigonal',
            chakras_principais: ['Raiz', 'Sacral'],
            elementos: 'Terra + Fogo',
            signos_astrologicos: ['Áries', 'Escorpião'],
            propriedades_energeticas: ['Aterramento', 'Força vital', 'Coragem', 'Estamina'],
            emocoes_tratadas: ['Coragem', 'Estabilidade', 'Força'],
            usos_espirituais: ['Conexão com Terra', 'Sobrevivência', 'Força primordial'],
            indicacoes_fisicas: ['Circulação', 'Sistema digestivo', 'Órgãos reprodutores'],
            indicacoes_psicologicas: ['Falta de energia', 'Desaterramento', 'Medo', 'Fraqueza'],
            formas_uso: ['Usar no bolso', 'Meditação de aterramento', 'Chakra raiz'],
            origem: 'Brasil, Índia, Rússia, Estados Unidos',
            curiosidades_historicas: 'Usada por xamãs para força. Pedra de Marte (guerra, coragem). Egípcios usavam em proteção. Contém ferro oxidado (hematita).',
            forma_limpeza: 'Terra, sol, água corrente',
            contraindicacoes: ['Resistente', 'Muito estável'],
            sinergias: ['Hematita', 'Jade', 'Granada'],
            uso_terapeutico: 'Força, coragem, aterramento' 
        },
        { 
            id: '16', 
            nome: 'Aventurina Verde', 
            nome_cientifico: 'SiO₂ + Mica',
            cor_principal: 'Verde',
            cores_var: ['Verde claro', 'Verde escuro', 'Verde com brilho'],
            translucencia: 'Opaco a translúcido',
            dureza: 6.5,
            estrutura: 'Trigonal',
            chakras_principais: ['Cardíaco'],
            elementos: 'Terra',
            signos_astrologicos: ['Virgem', 'Touro'],
            propriedades_energeticas: ['Fortuna', 'Oportunidade', 'Alegria', 'Equilíbrio'],
            emocoes_tratadas: ['Otimismo', 'Paciência', 'Equilíbrio emocional'],
            usos_espirituais: ['Fortuna e oportunidade', 'Cura do coração'],
            indicacoes_fisicas: ['Sistema circulatório', 'Pele', 'Coração'],
            indicacoes_psicologicas: ['Falta de esperança', 'Melancolia', 'Necessita equilíbrio'],
            formas_uso: ['Usar no pulso', 'Joia', 'Grid'],
            origem: 'Índia, Brasil, Rússia',
            curiosidades_historicas: 'Nome vem de "avventura" (acaso). Usada por jardineiros na Antiga Roma. Os brilhos são inclusões de mica (fuchsite). Consagrada à deusa Fortuna.',
            forma_limpeza: 'Água, sol, terra',
            contraindicacoes: ['Resistente', 'Cuidado com impacto'],
            sinergias: ['Quartzo Rosa', 'Jade', 'Água-Marinha'],
            uso_terapeutico: 'Fortuna, equilíbrio emocional, cura cardíaca' 
        },
        { 
            id: '17', 
            nome: 'Água-Marinha', 
            nome_cientifico: 'Be₃Al₂Si₆O₁₈',
            cor_principal: 'Azul claro',
            cores_var: ['Azul claro', 'Azul médio', 'Azul esverdeado'],
            translucencia: 'Transparente a translúcido',
            dureza: 7.5,
            estrutura: 'Hexagonal',
            chakras_principais: ['Laríngeo', 'Cardíaco'],
            elementos: 'Água',
            signos_astrologicos: ['Peixes', 'Gêmeos', 'Aquário'],
            propriedades_energeticas: ['Comunicação', 'Expressão', 'Calma', 'Intuição'],
            emocoes_tratadas: ['Expressão honesta', 'Calma', 'Confiança'],
            usos_espirituais: ['Conexão com divino', 'Comunicação espiritual', 'Meditação aquática'],
            indicacoes_fisicas: ['Garganta', 'Tireoide', 'Coração'],
            indicacoes_psicologicas: ['Medo de falar', 'Bloqueio de comunicação', 'Timidez'],
            formas_uso: ['Usar no pescoço', 'Joia', 'Elixir'],
            origem: 'Brasil, Madagascar, Moçambique',
            curiosidades_historicas: 'Pedra do marinheiro (proteção no mar). Usada por egípcios para conectar com divindades aquáticas. Maior cristal: 10kgs em Madagascar. Família do berilo (Esmeralda, Morganita).',
            forma_limpeza: 'Água corrente, lua, sol suave',
            contraindicacoes: ['Delicada', 'Cuidado com impacto'],
            sinergias: ['Crisocola', 'Sodalita', 'Quartzo Rosa'],
            uso_terapeutico: 'Comunicação, expressão, calma' 
        },
        { 
            id: '18', 
            nome: 'Olho de Tigre', 
            nome_cientifico: 'SiO₂',
            cor_principal: 'Dourado/Acaju',
            cores_var: ['Amarelo dourado', 'Marrom-avermelhado', 'Azul'],
            translucencia: 'Opaco',
            dureza: 6.5,
            estrutura: 'Trigonal',
            chakras_principais: ['Plexo Solar', 'Raiz'],
            elementos: 'Terra + Fogo',
            signos_astrologicos: ['Leão', 'Capricórnio', 'Áries'],
            propriedades_energeticas: ['Proteção', 'Coragem', 'Poder pessoal', 'Foco'],
            emocoes_tratadas: ['Coragem', 'Confiança', 'Poder pessoal'],
            usos_espirituais: ['Proteção psíquica', 'Coragem para decisões', 'Ancoramento'],
            indicacoes_fisicas: ['Vista', 'Plexo solar', 'Sistema nervoso'],
            indicacoes_psicologicas: ['Medo', 'Indecisão', 'Falta de coragem'],
            formas_uso: ['Usar como joia', 'Carregar no bolso', 'Altar'],
            origem: 'África do Sul, Austrália, Índia',
            curiosidades_historicas: 'Usada por soldados romanos para proteção em batalha. Efeito "chatoyance" (brilho de gato). A versão azul é lavada pelo sol.',
            forma_limpeza: 'Sol, terra, fumaça',
            contraindicacoes: ['Resistente', 'Evitar produtos químicos'],
            sinergias: ['Citrino', 'Hematita', 'Granada'],
            uso_terapeutico: 'Proteção, coragem, foco' 
        },
        { 
            id: '19', 
            nome: 'Opala', 
            nome_cientifico: 'SiO₂·nH₂O',
            cor_principal: 'Arco-íris',
            cores_var: ['Branco', 'Fogo', 'Preto', 'Cristal'],
            translucencia: 'Transparente a translúcido',
            dureza: 5.5,
            estrutura: 'Amorfo',
            chakras_principais: ['Todos'],
            elementos: 'Água',
            signos_astrologicos: ['Escorpião', 'Libra'],
            propriedades_energeticas: ['Magia', 'Luz', 'Transformação', 'Criatividade'],
            emocoes_tratadas: ['Alegria', 'Criatividade', 'Inspiração'],
            usos_espirituais: ['Conexão com arco-íris', 'Magia de transformação', 'Inspiração divina'],
            indicacoes_fisicas: ['Olhos', 'Cabeça', 'Sistema nervoso'],
            indicacoes_psicologicas: ['Bloqueio criativo', 'Falta de inspiração', 'Medo de mudança'],
            formas_uso: ['Joia', 'Meditação', 'Altar'],
            origem: 'Austrália, Brasil, Etiópia',
            curiosidades_historicas: 'Pedra nacional da Austrália. Opala negra mais rara. Padrões únicos como impressão digital. Nova fonte na Etiópia descoberta em 2008.',
            forma_limpeza: 'Água morna, lua. EVITAR sol intenso e produtos químicos',
            contraindicacoes: ['FRÁGIL', 'Pode rachar em mudanças de temperatura', 'Absorve óleos'],
            sinergias: ['Quartzo Clear', 'Labradorita', 'Moldavita'],
            uso_terapeutico: 'Magia, luz, transformação, criatividade' 
        },
        { 
            id: '20', 
            nome: 'Hematita', 
            nome_cientifico: 'Fe₂O₃',
            cor_principal: 'Cinza metal',
            cores_var: ['Cinza', 'Preto metálico', 'Vermelho (terra)'],
            translucencia: 'Opaco',
            dureza: 5.5,
            estrutura: 'Trigonal',
            chakras_principais: ['Raiz'],
            elementos: 'Terra',
            signos_astrologicos: ['Capricórnio', 'Escorpião'],
            propriedades_energeticas: ['Grounded', 'Proteção', 'Coragem ancestral', 'Foco'],
            emocoes_tratadas: ['Centramento', 'Estabilidade', 'Força interior'],
            usos_espirituais: ['Conexão com ancestrais', 'Aterramento profundo', 'Proteção'],
            indicacoes_fisicas: ['Circulação', 'Anemia', 'Sistema ósseo'],
            indicacoes_psicologicas: ['Falta de foco', 'Desaterramento', 'Medo'],
            formas_uso: ['Usar como joia', 'Carregar no bolso', 'Grid de aterramento'],
            origem: 'Brasil, Austrália, Estados Unidos',
            curiosidades_historicas: 'Nome vem de "haema" (sangue) - solta pó vermelho. Usada por nativos americanos em guerra. Primeiro minério de ferro usado pela humanidade. Magnetita é variante magnética.',
            forma_limpeza: 'Terra, sal seco. NÃO usar água (oxida)',
            contraindicacoes: ['NÃO molhar (oxida)', 'Frágil', 'Evitar contato com água'],
            sinergias: ['Obsidiana', 'Turmalina Negra', 'Jadeite Negro'],
            uso_terapeutico: 'Grounded, foco, proteção ancestral' 
        }
    ],
        get: async (id) => {
            const lista = await Cristal.list(); // Corrigido: deve ser Cristal.list()
            return lista.find(t => t.id === id) || null;
        }
    };
    
export const ErvaPlanta = {
    list: async () => [
        { 
            id: '1', 
            nome_popular: 'Camomila', 
            nome_cientifico: 'Matricaria chamomilla',
            familia: 'Asteraceae',
            nomes_populares: ['Camomila-alemã', 'Maçanilha', 'Camomila-verdadeira'],
            origem: ['Europa', 'Ásia'],
            habitat: 'Regiões temperadas, campos abertos',
            partes_usadas: ['Flores (capítulos florais)'],
            principios_ativos: ['Apigenina', 'Bisabolol', 'Camazuleno', 'Flavonoides', 'Cumarinas'],
            propriedades_medicinais: ['Calmante', 'Antiespasmódico', 'Anti-inflamatório', 'Cicatrizante', 'Digestivo', 'Ansiolítico suave'],
            sistemas_corpo: ['Sistema Nervoso', 'Sistema Digestivo', 'Sistema Tegumentar'],
            indicacoes_fisicas: ['Insônia', 'Ansiedade', 'Cólicas', 'Gastrite', 'Conjuntivite', 'Irritações de pele'],
            estudos_cientificos: 'Distúrbios de ansiedade leve a moderada. Insônia. Síndrome do intestino irritável.',
            propriedades_energeticas: ['Paz', 'Serenidade', 'Conforto emocional', 'Proteção infantil'],
            chakras: ['Plexo Solar', 'Cardíaco'],
            elemento: 'Água',
            planeta: 'Sol',
            signos: ['Câncer', 'Virgem'],
            formas_uso: ['Chá (infusão)', 'Compressa', 'Banho', 'Tintura', 'Óleo infuso'],
            dosagem: 'Chá: 1 colher de sopa de flores por xícara, 3-4x ao dia. Seguro para crianças (dosagem reduzida)',
            duracao_tratamento: 'Uso seguro prolongado',
            contraindicacoes: ['Alergia a Asteraceae', 'Gravidez (doses altas)', 'Raríssimas reações alérgicas'],
            efeitos_colaterais: ['Muito raros: reação alérgica cutânea'],
            interacoes_medicamentosas: ['Anticoagulantes (cuidado)', 'Sedativos (potencializa)'],
            sinergias: ['Melissa', 'Lavanda', 'Valeriana', 'Passiflora'],
            cultivo: 'Sol pleno a meia sombra, solo rico, regas regulares',
            colheita_conservacao: 'Colher flores recém-abertas. Secar rapidamente. Armazenar em vidro escuro',
            usos_espirituais: 'Prosperidade, purificação, sono tranquilo, proteção de crianças',
            historia_folclore: 'Egípcios dedicavam ao deus Sol. "Peter Rabbit" de Beatrix Potter toma chá de camomila. Considerada planta das fadas. Nome vem de "maçã da terra" pelo aroma. Bebida herbal mais popular do mundo. Considerada "médico das plantas" (recupera plantas doentes próximas).',
            curiosidades_historicas: 'Usada desde o Egito Antigo, considerada erva sagrada dedicada ao deus sol Rá. ',
            uso_terapeutico: 'Ansiedade, indigestão',
            origem_geografica: 'Europa' 
        },
        { 
            id: '2', 
            nome_popular: 'Gengibre', 
            nome_cientifico: 'Zingiber officinale',
            familia: 'Zingiberaceae',
            nomes_populares: [],
            origem: ['Sudeste Asiático'],
            habitat: 'Clima tropical',
            partes_usadas: ['Rizoma'],
            principios_ativos: ['Gingerol', 'Shogaol', 'Zingibereno'],
            propriedades_medicinais: ['Anti-inflamatória', 'Antináusea', 'Termogênica', 'Digestiva'],
            sistemas_corpo: ['Digestivo', 'Imunológico', 'Circulatório'],
            indicacoes_fisicas: ['Náuseas', 'Enjoo', 'Má digestão', 'Gripes e resfriados'],
            estudos_cientificos: 'Mais de 2000 estudos comprovam eficácia contra náuseas, inclusive quimioterapia.',
            propriedades_energeticas: [],
            chakras: [],
            elemento: null,
            planeta: null,
            signos: [],
            formas_uso: ['Chá', 'Decocção', 'In natura', 'Tintura'],
            dosagem: null,
            duracao_tratamento: null,
            contraindicacoes: ['Cálculos biliares', 'Úlceras gástricas ativas'],
            efeitos_colaterais: [],
            interacoes_medicamentosas: [],
            sinergias: [],
            cultivo: null,
            colheita_conservacao: null,
            usos_espirituais: null,
            historia_folclore: null,
            curiosidades_historicas: null,
            uso_terapeutico: 'Náusea, digestão, gripe',
            origem_geografica: 'Ásia' 
        },
        { 
            id: '18', 
            nome_popular: 'Alecrim', 
            nome_cientifico: 'Rosmarinus officinalis',
            familia: 'Lamiaceae',
            nomes_populares: ['Rosmaninho', 'Alecrim-de-jardim', 'Rosmarino'],
            origem: ['Mediterrâneo', 'Europa'],
            habitat: 'Clima temperado, solos bem drenados, sol pleno',
            partes_usadas: ['Folhas', 'Flores', 'Ramos'],
            principios_ativos: ['Ácido rosmarínico', 'Carnosol', 'Cineol', 'Cânfora', 'Pineno', 'Borneol'],
            propriedades_medicinais: ['Antioxidante potente', 'Estimulante circulatório', 'Digestivo', 'Anti-inflamatório', 'Antimicrobiano', 'Neuroprotetor', 'Hepatoprotetor'],
            sistemas_corpo: ['Sistema Nervoso', 'Sistema Circulatório', 'Sistema Digestivo', 'Sistema Tegumentar'],
            indicacoes_fisicas: ['Má digestão', 'Dores de cabeça', 'Queda de cabelo', 'Fadiga mental', 'Problemas de memória', 'Má circulação'],
            estudos_cientificos: 'Melhora cognitiva comprovada. Prevenção de Alzheimer. Antioxidante. Anti-câncer (estudos preliminares). Estudo de 2012: aroma melhora memória em 75%.',
            propriedades_energeticas: ['Proteção', 'Limpeza', 'Clareza mental', 'Força vital'],
            chakras: ['Coronário', 'Terceiro Olho', 'Plexo Solar'],
            elemento: 'Fogo',
            planeta: 'Sol',
            signos: ['Áries', 'Leão'],
            formas_uso: ['Chá (infusão)', 'Tintura', 'Óleo essencial', 'Banho', 'Defumação', 'Compressa'],
            dosagem: 'Chá: 1 colher de sopa para 1 xícara, 3x ao dia. Tintura: 20-40 gotas 3x ao dia',
            duracao_tratamento: 'Mínimo 30 dias para efeitos cognitivos',
            contraindicacoes: ['Hipertensão severa', 'Epilepsia', 'Gestação (doses altas)', 'Uso prolongado sem orientação'],
            efeitos_colaterais: ['Raros: irritação gástrica em doses muito altas'],
            interacoes_medicamentosas: ['Anticoagulantes (potencializa)', 'Diuréticos'],
            sinergias: ['Sálvia', 'Ginkgo', 'Hortelã', 'Lavanda'],
            cultivo: 'Pleno sol, solo bem drenado, pouca água (resistente à seca)',
            colheita_conservacao: 'Colher antes da floração (manhã). Secar na sombra. Armazenar em vidro escuro',
            usos_espirituais: 'Limpeza energética, proteção, purificação, rituais de memória',
            historia_folclore: 'Romanos queimavam em funerais. Na Idade Média, queimavam contra peste. Símbolo de memória e fidelidade. Shakespeare citou em Hamlet. Planta sagrada para gregos e romanos. Acredita-se que Maria secou roupas de Jesus em alecrim, dando flores azuis. Usado em receitas culinárias mediterrâneas.',
            curiosidades_historicas: 'Símbolo de memória e fidelidade, usado em casamentos e funerais na Antiguidade.',
            uso_terapeutico: 'Energia, memória',
            origem_geografica: 'Mediterrâneo' 
        },
        { 
            id: '9', 
            nome_popular: 'Hortelã-Pimenta', 
            nome_cientifico: 'Mentha piperita',
            familia: 'Lamiaceae',
            nomes_populares: ['Hortelã-pimenta', 'Menta'],
            origem: ['Europa', 'Ásia'],
            habitat: 'Locais úmidos, cresce facilmente',
            partes_usadas: ['Folhas'],
            principios_ativos: ['Mentol (40-50%)', 'Mentona', 'Mentofurano', 'Limoneno', 'Carvona'],
            propriedades_medicinais: ['Digestivo', 'Antiespasmódico', 'Analgésico', 'Refrescante', 'Descongestionante', 'Carminativo'],
            sistemas_corpo: ['Sistema Digestivo', 'Sistema Respiratório', 'Sistema Nervoso'],
            indicacoes_fisicas: ['Náuseas', 'Indigestão', 'Cólicas intestinais', 'Dores de cabeça', 'Resfriados'],
            estudos_cientificos: 'Óleo de hortelã-pimenta comprovadamente eficaz para SII. Estudos mostram efeito em cefaleia tensional.',
            propriedades_energeticas: ['Renovação', 'Frescor', 'Clareza', 'Prosperidade'],
            chakras: ['Plexo Solar', 'Laríngeo'],
            elemento: 'Ar',
            planeta: 'Mercúrio',
            signos: ['Gêmeos', 'Virgem'],
            formas_uso: ['Chá (infusão)', 'Inalação', 'Cataplasma', 'Tintura', 'Óleo essencial'],
            dosagem: 'Chá: 1 colher de sopa por xícara, após refeições. Óleo essencial: 1-2 gotas diluídas',
            duracao_tratamento: 'Uso seguro prolongado',
            contraindicacoes: ['Refluxo gastroesofágico', 'Bebês e crianças pequenas', 'Gestação (doses altas)'],
            efeitos_colaterais: ['Raros: azia em pessoas sensíveis'],
            interacoes_medicamentosas: ['Medicamentos para ácido gástrico', 'Pode interferir com absorção de ferro'],
            sinergias: ['Gengibre', 'Camomila', 'Erva-cidreira'],
            cultivo: 'Meia sombra, solo úmido, cresce vigorosamente (invasiva)',
            colheita_conservacao: 'Colher folhas antes da floração. Secar rapidamente. Armazenar em vidro',
            usos_espirituais: 'Prosperidade financeira, cura, proteção, purificação',
            historia_folclore: 'Grego usava para coroar vencedores. Romanos perfumavam salas com hortelã. Símbolo de hospitalidade. Na mitologia grega, Menta era uma ninfa transformada em planta por Perséfone.',
            curiosidades_historicas: 'Existem mais de 25 espécies de hortelã. Abelhas adoram! Usada em produtos de higiene bucal. Repelente natural de insetos.',
            uso_terapeutico: 'Digestão, náusea',
            origem_geografica: 'Europa' 
        },
        { 
            id: '20', 
            nome_popular: 'Sálvia', 
            nome_cientifico: 'Salvia officinalis',
            familia: 'Lamiaceae',
            nomes_populares: ['Salva', 'Sálvia-comum', 'Erva-sagrada'],
            origem: ['Mediterrâneo'],
            habitat: 'Clima temperado, solos calcários, sol pleno',
            partes_usadas: ['Folhas'],
            principios_ativos: ['Tujona', 'Cineol', 'Borneol', 'Ácido rosmarínico', 'Salvina'],
            propriedades_medicinais: ['Adstringente', 'Antisséptico', 'Anti-sudorífico', 'Estrogênico suave', 'Antioxidante', 'Neuroprotetor'],
            sistemas_corpo: ['Sistema Endócrino', 'Sistema Nervoso', 'Sistema Digestivo', 'Sistema Respiratório'],
            indicacoes_fisicas: ['Sudorese excessiva', 'Menopausa', 'Gengivite', 'Faringite', 'Problemas de memória'],
            estudos_cientificos: 'Fogachos da menopausa. Melhora cognitiva. Hiperhidrose. Estudos mostram melhora de memória. Eficaz em sintomas de menopausa. Efeito antioxidante comprovado.',
            propriedades_energeticas: ['Sabedoria', 'Purificação', 'Proteção', 'Longevidade'],
            chakras: ['Terceiro Olho', 'Coronário'],
            elemento: 'Ar',
            planeta: 'Júpiter',
            signos: ['Sagitário'],
            formas_uso: ['Chá (infusão)', 'Gargarejos', 'Tintura', 'Defumação', 'Banho'],
            dosagem: 'Chá: 1 colher de chá por xícara, 2-3x ao dia. Não ultrapassar 15 dias contínuos',
            duracao_tratamento: 'Uso curto (máximo 15 dias seguidos) - fazer pausas',
            contraindicacoes: ['Gestação e amamentação', 'Epilepsia', 'Hipertensão', 'Uso prolongado sem orientação'],
            efeitos_colaterais: ['Uso excessivo: tontura, convulsões (pela tujona)'],
            interacoes_medicamentosas: ['Anticonvulsivantes', 'Sedativos', 'Antidiabéticos'],
            sinergias: ['Alecrim', 'Lavanda', 'Tomilho'],
            cultivo: 'Pleno sol, solo bem drenado, pouca água',
            colheita_conservacao: 'Colher antes da floração. Secar em ambiente ventilado. Vidro escuro',
            usos_espirituais: 'Purificação de ambientes, sabedoria, proteção, longevidade, limpeza de casas',
            historia_folclore: 'Nome de "salvare" (salvar). Ditado medieval: "Por que morreria o homem que tem sálvia no jardim?". Nativos americanos usam sálvia branca em rituais. Considerada sagrada por muitas culturas. Queimada para limpeza espiritual (smudging). Existem mais de 900 espécies de Salvia no mundo.',
            curiosidades_historicas: null,
            uso_terapeutico: 'Garganta, digestão',
            origem_geografica: 'Mediterrâneo' 
        },
        { 
            id: '7', 
            nome_popular: 'Boldo', 
            nome_cientifico: 'Peumus boldus',
            familia: 'Monimiaceae',
            nomes_populares: ['Boldo-do-Chile', 'Boldoa'],
            origem: ['Chile'],
            habitat: 'Clima mediterrâneo, solos bem drenados',
            partes_usadas: ['Folhas'],
            principios_ativos: ['Boldina', 'Ascaridol', 'Eucaliptol', 'Cineol', 'Flavonoides'],
            propriedades_medicinais: ['Colagogo (estimula vesícula)', 'Digestivo', 'Hepatoprotetor', 'Diurético suave', 'Antiespasmódico'],
            sistemas_corpo: ['Sistema Digestivo', 'Fígado', 'Vesícula Biliar'],
            indicacoes_fisicas: ['Má digestão', 'Gases', 'Problemas hepáticos', 'Ressaca', 'Prisão de ventre'],
            estudos_cientificos: 'Dispepsia funcional. Estimulação da bile. Boldina comprovadamente estimula secreção biliar. Efeito hepatoprotetor demonstrado em estudos.',
            propriedades_energeticas: ['Limpeza', 'Desintoxicação', 'Coragem'],
            chakras: ['Plexo Solar'],
            elemento: 'Fogo',
            planeta: 'Marte',
            signos: ['Áries'],
            formas_uso: ['Chá (infusão leve)', 'Tintura'],
            dosagem: 'Chá: 1 folha por xícara, após refeições pesadas. Não ultrapassar 3 xícaras/dia',
            duracao_tratamento: 'Uso pontual ou curto (máximo 4 semanas seguidas)',
            contraindicacoes: ['Obstrução de vias biliares', 'Cálculos biliares grandes', 'Gravidez', 'Amamentação', 'Doenças hepáticas graves'],
            efeitos_colaterais: ['Uso excessivo: diarreia, irritação gástrica'],
            interacoes_medicamentosas: ['Anticoagulantes', 'Diuréticos'],
            sinergias: ['Alcachofra', 'Cardo-mariano'],
            cultivo: 'Clima mediterrâneo, difícil cultivo fora do Chile',
            colheita_conservacao: 'Folhas maduras. Secar na sombra. Armazenar em local fresco e seco',
            usos_espirituais: 'Proteção, coragem, limpeza energética',
            historia_folclore: 'Usada por povos indígenas do Chile há séculos. Pastor chileno descobriu vendo ovelhas comerem após refeições pesadas. Descoberto pelos Mapuches no Chile, exportado para o mundo no séc. XIX.',
            curiosidades_historicas: 'Planta nacional do Chile. Folhas são muito amargas. Nome vem de Boldo, naturalista espanhol. Amplamente usado no Brasil para "ressaca".',
            uso_terapeutico: 'Fígado, digestão',
            origem_geografica: 'Chile' 
        },
        { 
            id: '8', 
            nome_popular: 'Cúrcuma', 
            nome_cientifico: 'Curcuma longa',
            familia: 'Zingiberaceae',
            nomes_populares: ['Açafrão', 'Tumérico', 'Gengibre-amarelo'],
            origem: ['Índia', 'Sudeste Asiático'],
            habitat: 'Clima tropical úmido',
            partes_usadas: ['Rizoma'],
            principios_ativos: ['Curcumina', 'Turmerona', 'Zingibereno'],
            propriedades_medicinais: ['Anti-inflamatório potente', 'Antioxidante', 'Hepatoprotetor', 'Anticancerígeno', 'Antidepressivo natural', 'Digestivo'],
            sistemas_corpo: ['Sistema Digestivo', 'Sistema Hepático', 'Sistema Imunológico', 'Sistema Nervoso'],
            indicacoes_fisicas: ['Inflamações', 'Artrite', 'Problemas hepáticos', 'Má digestão', 'Feridas'],
            estudos_cientificos: 'Mais de 10.000 estudos. Eficácia comprovada em inflamação. Absorção melhora 2000% com pimenta preta (piperina). Artrite reumatoide, colesterol alto, Alzheimer (prevenção), depressão, síndrome do intestino irritável.',
            propriedades_energeticas: ['Purificação', 'Proteção', 'Prosperidade', 'Força vital'],
            chakras: ['Plexo Solar', 'Sacral'],
            elemento: 'Fogo',
            planeta: 'Sol',
            signos: ['Leão', 'Áries'],
            formas_uso: ['Chá', 'Golden Milk', 'Culinária', 'Cápsulas', 'Pasta (uso tópico)'],
            dosagem: '1-3g de pó por dia. 400-600mg de extrato padronizado 3x/dia',
            duracao_tratamento: 'Mínimo 8 semanas para efeitos anti-inflamatórios completos',
            contraindicacoes: ['Obstrução biliar', 'Úlcera gástrica ativa', 'Gestação (altas doses)', 'Uso com anticoagulantes'],
            efeitos_colaterais: ['Raramente: irritação gástrica leve'],
            interacoes_medicamentosas: ['Anticoagulantes (potencializa)', 'Antiácidos (reduz absorção)'],
            sinergias: ['Pimenta preta (aumenta absorção em 2000%!)', 'Gengibre', 'Canela'],
            cultivo: 'Rizoma plantado em solo rico e úmido. Colheita após 9-10 meses',
            colheita_conservacao: 'Colher rizomas, lavar, secar ao sol. Armazenar em pó em local seco',
            usos_espirituais: 'Purificação, proteção contra energias negativas, atração de prosperidade',
            historia_folclore: 'Usada há 4000 anos na Índia. Marco Polo descreveu em 1280. Sagrada no hinduísmo.',
            curiosidades_historicas: 'Pigmento usado em rituais hindus. Mancha roupas permanentemente! Combate Alzheimer. Anticancerígeno natural mais estudado.',
            uso_terapeutico: 'Inflamações, artrite, digestão',
            origem_geografica: 'Índia' 
        },
        { 
            id: '9', 
            nome_popular: 'Guaco', 
            nome_cientifico: 'Mikania glomerata',
            familia: 'Asteraceae',
            nomes_populares: ['Erva-de-cobra', 'Cipó-catinga'],
            origem: ['Brasil', 'América do Sul'],
            habitat: 'Matas úmidas brasileiras',
            partes_usadas: ['Folhas'],
            principios_ativos: ['Cumarina', 'Ácido caurenóico', 'Guacosídeo'],
            propriedades_medicinais: ['Broncodilatador', 'Expectorante', 'Anti-inflamatório respiratório', 'Antitussígeno'],
            sistemas_corpo: ['Sistema Respiratório'],
            indicacoes_fisicas: ['Tosse', 'Bronquite', 'Asma', 'Gripe', 'Rouquidão'],
            estudos_cientificos: 'ANVISA aprovou uso para afecções respiratórias. Estudos confirmam ação broncodilatadora. Bronquite crônica, tosse produtiva, asma (complementar).',
            propriedades_energeticas: ['Respiração livre', 'Expressão', 'Liberação'],
            chakras: ['Laríngeo', 'Cardíaco'],
            elemento: 'Ar',
            planeta: null,
            signos: [],
            formas_uso: ['Xarope', 'Chá', 'Tintura'],
            dosagem: 'Chá: 1 colher de sopa de folhas em 1 xícara de água. 3x ao dia. Xarope: 1 colher de sopa 3-4x/dia',
            duracao_tratamento: 'Até melhora dos sintomas respiratórios (geralmente 7-14 dias)',
            contraindicacoes: ['Uso com anticoagulantes (cumarina)', 'Gestação', 'Lactação', 'Doenças hepáticas graves'],
            efeitos_colaterais: ['Raramente: náuseas, vômitos'],
            interacoes_medicamentosas: ['Anticoagulantes (CUIDADO - potencializa muito!)', 'Vitamina K'],
            sinergias: ['Hortelã', 'Eucalipto', 'Gengibre', 'Mel'],
            cultivo: 'Trepadeira de rápido crescimento. Solo úmido e sombreado',
            colheita_conservacao: 'Colher folhas maduras. Secar à sombra. Armazenar em local seco',
            usos_espirituais: null,
            historia_folclore: 'Indígenas brasileiros usavam contra picadas de cobra (daí o nome erva-de-cobra)',
            curiosidades_historicas: 'Planta brasileira mais usada para problemas respiratórios! Xarope caseiro muito eficaz. Nome vem dos índios Guaicurus.',
            uso_terapeutico: 'Tosse, bronquite, asma',
            origem_geografica: 'Brasil' 
        },
        { 
            id: '10', 
            nome_popular: 'Espinheira-Santa', 
            nome_cientifico: 'Maytenus ilicifolia',
            familia: 'Celastraceae',
            nomes_populares: ['Cancorosa', 'Sombra-de-touro'],
            origem: ['Sul do Brasil', 'Argentina', 'Paraguai'],
            habitat: 'Mata Atlântica',
            partes_usadas: ['Folhas'],
            principios_ativos: ['Maitensina', 'Flavonoides', 'Taninos', 'Triterpenos'],
            propriedades_medicinais: ['Antiácido', 'Cicatrizante gástrico', 'Antiespasmódico', 'Anti-inflamatório', 'Protetor gástrico'],
            sistemas_corpo: ['Sistema Digestivo'],
            indicacoes_fisicas: ['Gastrite', 'Úlcera gástrica', 'Má digestão', 'Azia'],
            estudos_cientificos: 'ANVISA aprovou uso para gastrite e úlcera. Estudos comprovam ação cicatrizante gástrica. Eficácia comparável a omeprazol em alguns estudos. Gastrite crônica, úlcera péptica, dispepsia funcional.',
            propriedades_energeticas: ['Proteção', 'Cura interior', 'Conforto'],
            chakras: ['Plexo Solar'],
            elemento: 'Terra',
            planeta: null,
            signos: [],
            formas_uso: ['Chá', 'Tintura', 'Cápsulas'],
            dosagem: 'Chá: 1 colher de sopa de folhas em 1 xícara de água. 3x ao dia antes das refeições. Cápsulas: 300-500mg 3x/dia',
            duracao_tratamento: 'Mínimo 4-6 semanas para cicatrização de úlceras',
            contraindicacoes: ['Gestação (propriedades abortivas)', 'Lactação', 'Crianças menores de 6 anos'],
            efeitos_colaterais: ['Raramente: boca seca, náuseas'],
            interacoes_medicamentosas: ['Antiácidos (pode reduzir absorção de outros medicamentos)'],
            sinergias: ['Camomila', 'Melissa', 'Funcho'],
            cultivo: 'Arbusto de crescimento lento. Solo bem drenado',
            colheita_conservacao: 'Colher folhas maduras. Secar à sombra. Proteger da luz',
            usos_espirituais: null,
            historia_folclore: 'Usada por jesuítas no sul do Brasil. Populações tradicionais a chamam de "remédio para o estômago"',
            curiosidades_historicas: 'Planta oficialmente reconhecida pela medicina brasileira! Ameaçada de extinção - prefira cultivada. Nome "espinheira" por folhas espinhosas como azevinho.',
            uso_terapeutico: 'Gastrite, úlceras',
            origem_geografica: 'Brasil' 
        },
        { 
            id: '11', 
            nome_popular: 'Cavalinha', 
            nome_cientifico: 'Equisetum arvense',
            familia: 'Equisetaceae',
            nomes_populares: ['Rabo-de-cavalo', 'Erva-carnudinha'],
            origem: ['Europa', 'Ásia', 'América do Norte'],
            habitat: 'Áreas úmidas, margens de rios',
            partes_usadas: ['Partes aéreas'],
            principios_ativos: ['Sílica (5-10%)', 'Flavonoides', 'Saponinas', 'Minerais'],
            propriedades_medicinais: ['Diurético', 'Remineralizante', 'Cicatrizante', 'Hemostático', 'Fortalecedor de tecidos'],
            sistemas_corpo: ['Sistema Urinário', 'Sistema Ósseo', 'Sistema Tegumentar'],
            indicacoes_fisicas: ['Retenção de líquidos', 'Infecções urinárias', 'Unhas fracas', 'Queda de cabelo', 'Osteoporose'],
            estudos_cientificos: 'Ação diurética comprovada. Rico em sílica biodisponível. Estudos mostram melhora em osteoporose. Edema, cistite, fortalecimento de tecido conjuntivo, osteopenia.',
            propriedades_energeticas: ['Força', 'Estrutura', 'Flexibilidade', 'Resiliência'],
            chakras: ['Raiz'],
            elemento: 'Terra + Água',
            planeta: null,
            signos: [],
            formas_uso: ['Chá', 'Decocção', 'Tintura', 'Compressa', 'Banho capilar'],
            dosagem: 'Chá: 2-3 colheres de sopa em 1L de água. Beber ao longo do dia. Máximo 6 semanas contínuas',
            duracao_tratamento: 'Ciclos de 6 semanas com 2 semanas de pausa',
            contraindicacoes: ['Insuficiência cardíaca', 'Insuficiência renal', 'Gestação', 'Uso prolongado (mais de 6 semanas)', 'Crianças'],
            efeitos_colaterais: ['Depleção de tiamina (vitamina B1) com uso prolongado', 'Desequilíbrio eletrolítico'],
            interacoes_medicamentosas: ['Diuréticos (potencializa)', 'Lítio (aumenta níveis)', 'Digitálicos'],
            sinergias: ['Urtiga', 'Chapéu-de-couro', 'Quebra-pedra'],
            cultivo: 'Perene de fácil cultivo. Pode ser invasiva! Gosta de umidade',
            colheita_conservacao: 'Colher partes aéreas no verão. Secar bem. Armazenar protegido da umidade',
            usos_espirituais: null,
            historia_folclore: 'Planta pré-histórica (350 milhões de anos!). Romanos usavam para polir metal. Gregos para estancar hemorragias.',
            curiosidades_historicas: 'Dinossauros comiam cavalinha gigante! Contém mais sílica que qualquer planta. Usada para polir panelas antigamente. "Fóssil vivo"!',
            uso_terapeutico: 'Retenção líquidos, unhas, cabelo',
            origem_geografica: 'Europa' 
        },
        { 
            id: '12', 
            nome_popular: 'Hibisco', 
            nome_cientifico: 'Hibiscus sabdariffa',
            familia: 'Malvaceae',
            nomes_populares: ['Vinagreira', 'Rosela', 'Flor-da-jamaica'],
            origem: ['África', 'Sudeste Asiático'],
            habitat: 'Clima tropical e subtropical',
            partes_usadas: ['Cálices das flores'],
            principios_ativos: ['Antocianinas', 'Ácidos orgânicos', 'Flavonoides', 'Mucilagens'],
            propriedades_medicinais: ['Hipotensor', 'Antioxidante potente', 'Diurético leve', 'Hipolipemiante', 'Termogênico leve'],
            sistemas_corpo: ['Sistema Cardiovascular', 'Sistema Urinário', 'Sistema Metabólico'],
            indicacoes_fisicas: ['Hipertensão', 'Colesterol alto', 'Emagrecimento', 'Retenção de líquidos'],
            estudos_cientificos: 'Estudos comprovam redução de pressão arterial (10-15mmHg). Eficácia similar a captopril em alguns estudos. Antioxidante potente. Hipertensão leve a moderada, dislipidemia, obesidade (coadjuvante), proteção cardiovascular.',
            propriedades_energeticas: ['Paixão', 'Amor', 'Beleza', 'Sensualidade'],
            chakras: ['Cardíaco', 'Sacral'],
            elemento: 'Água',
            planeta: null,
            signos: ['Libra', 'Touro'],
            formas_uso: ['Chá gelado', 'Infusão', 'Suco'],
            dosagem: '1-2 colheres de sopa de cálices secos em 1L de água fria. Deixar de molho 8h ou ferver. 2-3 xícaras ao dia',
            duracao_tratamento: 'Mínimo 6 semanas para efeito hipotensor. Uso contínuo seguro',
            contraindicacoes: ['Hipotensão', 'Gestação (pode estimular menstruação)', 'Uso com anti-hipertensivos (monitorar)'],
            efeitos_colaterais: ['Raramente: tontura (se pressão cair muito)', 'Efeito diurético leve'],
            interacoes_medicamentosas: ['Anti-hipertensivos (potencializa)', 'Paracetamol (altera metabolismo)', 'Clorequina (reduz absorção)'],
            sinergias: ['Chá verde', 'Gengibre', 'Canela', 'Limão'],
            cultivo: 'Planta de fácil cultivo. Sol pleno. Ciclo anual',
            colheita_conservacao: 'Colher cálices após flores murcharem. Secar ao sol. Armazenar em local seco',
            usos_espirituais: 'Amor, paixão, beleza, adivinhação. Usado em feitiços de amor',
            historia_folclore: 'Bebida tradicional no Egito (Karkadé). Popular no Caribe e México. Faraós bebiam hibisco',
            curiosidades_historicas: 'Corante natural vermelho intenso! Bebida nacional do Senegal. Fica mais vermelho em pH ácido (adicione limão). Chá emagrecedor mais estudado!',
            uso_terapeutico: 'Hipertensão, colesterol, emagrecimento',
            origem_geografica: 'África' 
        },
        { id: '13', nome_popular: 'Calêndula', nome_cientifico: 'Calendula officinalis', familia: 'Asteraceae', nomes_populares: [], origem: ['Mediterrâneo'], habitat: null, partes_usadas: ['Flores'], principios_ativos: ['Flavonoides', 'Carotenoides', 'Triterpenoides'], propriedades_medicinais: ['Cicatrizante', 'Anti-inflamatória', 'Antimicrobiana'], sistemas_corpo: ['Imunológico'], indicacoes_fisicas: ['Feridas', 'Queimaduras', 'Dermatites', 'Úlceras'], estudos_cientificos: 'Chamada de "ouro de Maria", associada à Virgem Maria na Idade Média.', propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Pomada', 'Óleo', 'Compressa', 'Chá'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Gravidez', 'Alergia a Asteraceae'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: 'Chamada de "ouro de Maria", associada à Virgem Maria na Idade Média.', curiosidades_historicas: null, uso_terapeutico: 'Feridas, pele', origem_geografica: 'Europa' },
        { id: '14', nome_popular: 'Valeriana', nome_cientifico: 'Valeriana officinalis', familia: 'Valerianaceae', nomes_populares: [], origem: ['Europa', 'Ásia'], habitat: null, partes_usadas: ['Raiz'], principios_ativos: ['Ácido valerênico', 'Valepotratos'], propriedades_medicinais: ['Sedativa', 'Ansiolítica', 'Relaxante muscular'], sistemas_corpo: ['Nervoso'], indicacoes_fisicas: ['Insônia', 'Ansiedade', 'Nervosismo', 'Tensão muscular'], estudos_cientificos: 'Usada desde Hipócrates (séc. V a.C.) para tratar insônia.', propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Chá', 'Tintura', 'Cápsulas'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Gravidez', 'Lactação', 'Uso com álcool ou sedativos'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: 'Usada desde Hipócrates (séc. V a.C.) para tratar insônia.', curiosidades_historicas: null, uso_terapeutico: 'Insônia, ansiedade', origem_geografica: 'Europa' },
        { id: '15', nome_popular: 'Equinácea', nome_cientifico: 'Echinacea purpurea', familia: 'Asteraceae', nomes_populares: [], origem: ['América do Norte'], habitat: null, partes_usadas: ['Raiz', 'Flores', 'Folhas'], principios_ativos: ['Equinacosídeos', 'Polissacarídeos'], propriedades_medicinais: ['Imunoestimulante', 'Anti-inflamatória', 'Antiviral'], sistemas_corpo: ['Imunológico', 'Respiratório'], indicacoes_fisicas: ['Gripes', 'Resfriados', 'Infecções respiratórias'], estudos_cientificos: 'Reduz duração de resfriados em até 1,4 dias segundo meta-análises.', propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Chá', 'Tintura', 'Cápsulas'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Doenças autoimunes', 'HIV', 'Tuberculose'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: null, curiosidades_historicas: null, uso_terapeutico: 'Gripes, imunidade', origem_geografica: 'América do Norte' },
        { id: '16', nome_popular: 'Erva Cidreira', nome_cientifico: 'Melissa officinalis', familia: 'Lamiaceae', nomes_populares: [], origem: ['Mediterrâneo', 'Ásia'], habitat: null, partes_usadas: ['Folhas'], principios_ativos: ['Citral', 'Citronelal', 'Ácido rosmarínico'], propriedades_medicinais: ['Calmante', 'Antiespasmódica', 'Antiviral', 'Digestiva'], sistemas_corpo: ['Nervoso', 'Digestivo'], indicacoes_fisicas: ['Ansiedade', 'Insônia', 'Palpitações', 'Cólicas'], estudos_cientificos: 'Chamada de "erva da alegria" pelos árabes medievais.', propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Chá', 'Tintura', 'Óleo essencial'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Hipotireoidismo'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: 'Chamada de "erva da alegria" pelos árabes medievais.', curiosidades_historicas: null, uso_terapeutico: 'Ansiedade, insônia', origem_geografica: 'Europa' },
        { id: '17', nome_popular: 'Passiflora', nome_cientifico: 'Passiflora incarnata', familia: 'Passifloraceae', nomes_populares: [], origem: ['Américas'], habitat: null, partes_usadas: ['Folhas', 'Flores'], principios_ativos: ['Flavonoides', 'Alcaloides harmala'], propriedades_medicinais: ['Sedativa', 'Ansiolítica', 'Antiespasmódica'], sistemas_corpo: ['Nervoso'], indicacoes_fisicas: ['Ansiedade', 'Insônia', 'Nervosismo', 'Hiperatividade'], estudos_cientificos: 'Jesuítas a chamaram de "flor da paixão" por verem símbolos da crucificação.', propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Chá', 'Tintura', 'Cápsulas'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Gravidez', 'Uso com sedativos'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: 'Jesuítas a chamaram de "flor da paixão" por verem símbolos da crucificação.', curiosidades_historicas: null, uso_terapeutico: 'Ansiedade, insônia', origem_geografica: 'América' },
        { id: '18', nome_popular: 'Alcachofra', nome_cientifico: 'Cynara scolymus', familia: 'Asteraceae', nomes_populares: [], origem: ['Mediterrâneo'], habitat: null, partes_usadas: ['Folhas'], principios_ativos: ['Cinarina', 'Ácido clorogênico'], propriedades_medicinais: ['Hepatoprotetora', 'Colagoga', 'Hipocolesterolemiante'], sistemas_corpo: ['Digestivo', 'Circulatório'], indicacoes_fisicas: ['Problemas hepáticos', 'Colesterol alto', 'Má digestão'], estudos_cientificos: 'Reduz colesterol LDL em até 18% segundo estudos clínicos.', propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Chá', 'Cápsulas', 'Tintura'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Obstrução das vias biliares', 'Cálculos biliares'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: null, curiosidades_historicas: null, uso_terapeutico: 'Hepático, colesterol', origem_geografica: 'Mediterrâneo' },
        { id: '19', nome_popular: 'Ginkgo Biloba', nome_cientifico: 'Ginkgo biloba', familia: 'Ginkgoaceae', nomes_populares: [], origem: ['China'], habitat: null, partes_usadas: ['Folhas'], principios_ativos: ['Flavonoides', 'Terpenolactonas'], propriedades_medicinais: ['Neuroprotetora', 'Vasodilatadora', 'Antioxidante'], sistemas_corpo: ['Nervoso', 'Circulatório'], indicacoes_fisicas: ['Perda de memória', 'Má circulação cerebral', 'Zumbido no ouvido'], estudos_cientificos: 'Árvore mais antiga do mundo, sobreviveu à bomba atômica de Hiroshima.', propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Cápsulas', 'Tintura', 'Chá'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Uso com anticoagulantes', 'Cirurgias próximas'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: 'Árvore mais antiga do mundo, sobreviveu à bomba atômica de Hiroshima.', curiosidades_historicas: null, uso_terapeutico: 'Memória, circulação', origem_geografica: 'China' },
        { id: '20', nome_popular: 'Unha de Gato', nome_cientifico: 'Uncaria tomentosa', familia: 'Rubiaceae', nomes_populares: [], origem: ['Amazônia'], habitat: null, partes_usadas: ['Casca', 'Raiz'], principios_ativos: ['Alcaloides oxindólicos', 'Quinóvicos'], propriedades_medicinais: ['Imunomoduladora', 'Anti-inflamatória', 'Antioxidante'], sistemas_corpo: ['Imunológico'], indicacoes_fisicas: ['Inflamações', 'Artrite', 'Imunidade baixa'], estudos_cientificos: null, propriedades_energeticas: [], chakras: [], elemento: null, planeta: null, signos: [], formas_uso: ['Chá', 'Cápsulas', 'Tintura'], dosagem: null, duracao_tratamento: null, contraindicacoes: ['Gravidez', 'Transplantes', 'Doenças autoimunes'], efeitos_colaterais: [], interacoes_medicamentosas: [], sinergias: [], cultivo: null, colheita_conservacao: null, usos_espirituais: null, historia_folclore: null, curiosidades_historicas: null, uso_terapeutico: 'Imunidade, inflamação', origem_geografica: 'Amazônia' }
        ],
        get: async (id) => {
            const lista = await ErvaPlanta.list(); // Corrigido: deve ser ErvaPlanta.list()
            return lista.find(t => t.id === id) || null;
        }
    };
    
    // Auth - Sistema real com Firebase
    // getCurrentUser, onAuthChange já importados no topo do arquivo
    // getDocument, createDocument, updateDocument também já importados no topo

    export const User = {
        me: async () => {
            // Verificar usuário autenticado no Firebase
            const firebaseUser = getCurrentUser();
            
            if (!firebaseUser) {
                console.log('⚠️ Nenhum usuário autenticado');
                return null; // Sem usuário demo - exige autenticação real
            }
            
            try {
                // Buscar perfil do terapeuta no Firestore
                const terapeutaDoc = await getDocument('terapeutas', firebaseUser.uid);
                
                if (terapeutaDoc) {
                    console.log('👤 Perfil de terapeuta encontrado:', terapeutaDoc);
                    return terapeutaDoc;
                }
                
                // Se não existe perfil, criar automaticamente como terapeuta
                console.log('📝 Criando perfil de terapeuta para novo usuário...');
                const newTerapeutaProfile = {
                    id: firebaseUser.uid,
                    full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Terapeuta',
                    email: firebaseUser.email,
                    profile_picture_url: firebaseUser.photoURL || null,
                    especialidade: '',
                    registro: '',
                    formacao: '',
                    bio: '',
                    is_terapeuta: true, // Sempre é terapeuta
                    created_at: new Date().toISOString()
                };
                
                await createDocument('terapeutas', newTerapeutaProfile, firebaseUser.uid);
                console.log('✅ Novo terapeuta criado automaticamente');
                
                return newTerapeutaProfile;
            } catch (error) {
                console.error('❌ Erro ao buscar/criar perfil:', error);
                throw error;
            }
        },
        login: async () => {
            // Esta função não faz login diretamente - o login é feito via Welcome.jsx com loginWithGoogle
            // Aqui apenas verifica se está autenticado
            const firebaseUser = getCurrentUser();
            if (!firebaseUser) {
                throw new Error('Usuário não autenticado. Faça login primeiro.');
            }
            return { id: firebaseUser.uid };
        },
        updateMe: async (data) => {
            const firebaseUser = getCurrentUser();
            if (!firebaseUser) {
                throw new Error('Usuário não autenticado');
            }
            
            try {
                // Atualizar perfil no Firestore
                await updateDocument('terapeutas', firebaseUser.uid, {
                    ...data,
                    updated_at: new Date().toISOString()
                });
                
                console.log('💾 Perfil atualizado no Firestore');
                return { success: true };
            } catch (error) {
                console.error('❌ Erro ao atualizar perfil:', error);
                throw error;
            }
        },
        updatePassword: async (newPassword) => {
            const { changePassword } = await import('./firebaseAuth');
            return await changePassword(newPassword);
        }
    };