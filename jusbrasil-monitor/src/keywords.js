'use strict';

/**
 * Mapeamento de palavras-chave para tipo de caso jurídico.
 * Cada entrada contém:
 *   - query    : string de busca enviada ao JusBrasil
 *   - caseType : classificação jurídica do caso
 *   - area     : área do direito
 */
const KEYWORDS = [
  {
    query: 'banco cobrou taxa indevida',
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
  },
  {
    query: 'INSS negou aposentadoria',
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
  },
  {
    query: 'plano de saúde negou cirurgia',
    caseType: 'Negativa de Cobertura Médica',
    area: 'Direito do Consumidor / Saúde',
  },
];

/**
 * Infere o tipo de caso a partir da palavra-chave de origem e/ou do título/snippet.
 * Usado para enriquecer resultados quando o match não é exato.
 *
 * @param {string} sourceKeyword  — keyword que gerou o resultado
 * @param {string} title
 * @param {string} snippet
 * @returns {{ caseType: string, area: string }}
 */
function inferCaseType(sourceKeyword, title = '', snippet = '') {
  // 1. Tenta mapear pela keyword de origem
  const kwEntry = KEYWORDS.find(
    (k) => k.query.toLowerCase() === sourceKeyword.toLowerCase()
  );
  if (kwEntry) return { caseType: kwEntry.caseType, area: kwEntry.area };

  // 2. Heurística por palavras no título + snippet
  const text = `${title} ${snippet}`.toLowerCase();

  if (/banco|tarifa|anuidade|taxa.*indevida|crédito.*indevido/.test(text))
    return { caseType: 'Cobrança Indevida Bancária', area: 'Direito do Consumidor / Bancário' };

  if (/inss|aposentadoria|benefício.*previdenci|auxílio-doença|pensão.*morte/.test(text))
    return { caseType: 'Benefício Previdenciário', area: 'Direito Previdenciário' };

  if (/plano.*saúde|seguro.*saúde|cirurgia.*negou|negou.*cirurgia|cobertura.*médica/.test(text))
    return { caseType: 'Negativa de Cobertura Médica', area: 'Direito do Consumidor / Saúde' };

  if (/multa.*trânsito|multa.*indevida|habilitação|cnh/.test(text))
    return { caseType: 'Infração de Trânsito', area: 'Direito Administrativo' };

  if (/rescisão|demissão|fgts|horas.*extras|salário/.test(text))
    return { caseType: 'Conflito Trabalhista', area: 'Direito Trabalhista' };

  if (/locação|aluguel|despejo|condomínio/.test(text))
    return { caseType: 'Conflito Imobiliário', area: 'Direito Civil' };

  return { caseType: 'Caso Jurídico Geral', area: 'Direito Geral' };
}

module.exports = { KEYWORDS, inferCaseType };
