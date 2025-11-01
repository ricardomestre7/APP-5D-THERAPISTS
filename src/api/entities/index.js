/**
 * Entities Module - Reexportação para compatibilidade retroativa
 * 
 * Este arquivo mantém a compatibilidade com imports existentes:
 * import { Paciente, Terapia } from '@/api/entities'
 * 
 * As entidades estão sendo gradualmente movidas para arquivos separados
 * na pasta entities/ para melhor organização e manutenibilidade.
 */

// Reexportar do arquivo original (temporário até migração completa)
export {
    Paciente,
    Terapia,
    Sessao,
    PraticaRecomendada,
    PraticaQuantica,
    OleoEssencial,
    Cristal,
    ErvaPlanta,
    User
} from '../entities.js';

