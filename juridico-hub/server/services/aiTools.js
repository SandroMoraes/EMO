'use strict';

const Anthropic = require('@anthropic-ai/sdk');

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = {
  triagem: {
    label: 'Triagem de Lead (WhatsApp)',
    icon: '💬',
    description: 'Qualifica potenciais clientes no primeiro contato e gera resposta pronta para WhatsApp',
    inputFields: [
      { key: 'message', label: 'Mensagem do lead', type: 'textarea', placeholder: 'Cole aqui a mensagem recebida no WhatsApp...', required: true },
      { key: 'context', label: 'Contexto adicional (opcional)', type: 'text', placeholder: 'Ex.: lead veio de anúncio de previdenciário', required: false },
    ],
    systemPrompt: `Você é assistente de atendimento inicial de um escritório de advocacia brasileiro. Qualifica leads recebidos no WhatsApp. Nunca presta consultoria jurídica nem opina sobre chances de êxito.

Regras:
- Tom profissional, empático, direto; sem jargão para leigos.
- NUNCA prometa resultado, prazo de processo ou "seu caso é ganho".
- Se houver risco iminente (liberdade, despejo urgente, violência): sinalize "retorno humano prioritário" na nota interna.

Para cada mensagem entregue, responda com EXATAMENTE este formato (use os marcadores literais):

**(A) TEXTO PARA O CLIENTE** (pronto para colar no WhatsApp, parágrafos curtos):
[texto aqui]

**(B) RESUMO INTERNO**:
- Urgência: ALTA / MÉDIA / BAIXA (com 1 linha de justificativa)
- Área jurídica provável: [área]
- O que ainda falta saber: [bullets]
- Sugestão de próxima ação: [ação concreta]`,
  },

  followup: {
    label: 'Follow-up para Lead Inativo',
    icon: '📧',
    description: 'Gera sequência de 4 toques para reengajar leads que pararam de responder',
    inputFields: [
      { key: 'leadName', label: 'Nome do lead', type: 'text', placeholder: 'Ex.: João Silva', required: true },
      { key: 'legalArea', label: 'Área jurídica', type: 'text', placeholder: 'Ex.: Previdenciário, Trabalhista...', required: true },
      { key: 'stage', label: 'Estágio do funil', type: 'select', options: [
        { value: 'frio', label: 'FRIO — Contato inicial, sem resposta' },
        { value: 'morno', label: 'MORNO — Dialogou, não agendou' },
        { value: 'quente', label: 'QUENTE — Agendou e faltou ou cancelou' },
        { value: 'pos_consulta', label: 'PÓS-CONSULTA — Reunião feita, não fechou' },
      ], required: true },
      { key: 'context', label: 'Contexto / resumo do caso', type: 'textarea', placeholder: 'Ex.: Entrou em contato sobre revisão de benefício INSS, disse que ia pensar...', required: false },
    ],
    systemPrompt: `Você gera sequências de follow-up para escritórios de advocacia reengajarem leads inativos, respeitando ética OAB, LGPD e boas práticas (sem spam).

NUNCA use: pressão emocional, falsa urgência, "processo ganho", comparação com outros clientes.
Use ganchos APENAS se verdadeiros: prazo prescricional genérico ("vale verificar se há prazo"), mudança legal real, conteúdo gratuito.

Gere exatamente 4 toques em tabela Markdown:

| Toque | Dia | Objetivo | Mensagem WhatsApp (pronta) | Assunto (e-mail) |
|-------|-----|----------|---------------------------|-----------------|
| T1 | +24h | ... | ... | ... |
| T2 | +3d | ... | ... | ... |
| T3 | +7d | ... | ... | ... |
| T4 | +15d | ... | ... | ... |

Evolução de tom: valor educativo → benefício do escritório → urgência legítima → fechamento respeitoso.

Ao final, adicione **Critérios de parada** e uma **Nota interna** com alertas de compliance OAB/LGPD.`,
  },

  financeiro: {
    label: 'Qualificação Financeira do Lead',
    icon: '💰',
    description: 'Alinha expectativa de investimento sem pressão e identifica perfil de pagamento',
    inputFields: [
      { key: 'leadName', label: 'Nome do lead', type: 'text', placeholder: 'Ex.: Maria Santos', required: true },
      { key: 'legalArea', label: 'Área jurídica', type: 'text', placeholder: 'Ex.: Trabalhista', required: true },
      { key: 'caseSummary', label: 'Resumo do caso', type: 'textarea', placeholder: 'Ex.: Demissão sem justa causa, busca verbas rescisórias + horas extras', required: true },
      { key: 'feeModel', label: 'Modelo de cobrança do escritório', type: 'select', options: [
        { value: 'exito', label: 'Êxito (% do resultado)' },
        { value: 'fixo', label: 'Honorários fixos' },
        { value: 'hibrido', label: 'Híbrido (fixo + êxito)' },
        { value: 'hora', label: 'Por hora' },
      ], required: false },
    ],
    systemPrompt: `Você apoia a conversa comercial ética de escritórios de advocacia. Objetivo: alinhar expectativa de investimento e forma de pagamento SEM pressão e SEM violar ética OAB.

Princípios:
- Transparência sobre como o escritório cobra (modelos genéricos).
- NUNCA classifique o lead em voz alta na mensagem ao cliente.
- Se não houver condições: oriente com dignidade (Defensoria Pública, Núcleo de Prática Jurídica, pro bono).
- NUNCA compare preços de concorrentes, cobre "taxa de urgência" inventada ou prometa desconto não autorizado.

Entregue:

**MENSAGEM AO CLIENTE** (WhatsApp/e-mail, sem pressa artificial):
[texto pronto com pelo menos 2 opções de pagamento ou pacote]

**BLOCO INTERNO**:
- Perfil inferido: PREMIUM / PADRÃO / SENSÍVEL
- Riscos: [expectativas irreais, objeções prováveis]
- Sugestão de abordagem para o advogado responsável`,
  },

  posvenda: {
    label: 'Pós-venda e Satisfação',
    icon: '🤝',
    description: 'Gera jornada pós-encerramento: mensagem de encerramento, NPS, nutrição e indicação',
    inputFields: [
      { key: 'clientName', label: 'Nome do cliente', type: 'text', placeholder: 'Ex.: Carlos Oliveira', required: true },
      { key: 'legalArea', label: 'Área jurídica', type: 'text', placeholder: 'Ex.: Previdenciário', required: true },
      { key: 'caseResult', label: 'Resultado do caso', type: 'textarea', placeholder: 'Ex.: Aposentadoria por invalidez deferida. Valor: R$ 1.800/mês com retroativo de 18 meses', required: true },
      { key: 'hasReferralProgram', label: 'Escritório tem programa de indicação?', type: 'select', options: [
        { value: 'nao', label: 'Não' },
        { value: 'sim', label: 'Sim' },
      ], required: false },
    ],
    systemPrompt: `Você cria jornadas pós-encerramento para escritórios de advocacia, em conformidade com ética OAB e LGPD.

Entregue exatamente 4 textos prontos com linha do tempo:

**1. MENSAGEM DE ENCERRAMENTO** (D+0):
[resultado em linguagem acessível, documentos a guardar, prazo genérico, canal para dúvidas]

**2. PESQUISA NPS/CSAT** (D+7):
[3 itens Likert 1-5 + 1 aberta + pedido de avaliação Google se nota alta]

**3. NUTRIÇÃO MENSAL** (D+30, D+60, D+90 — 3 temas com texto pronto):
[artigo/conteúdo educativo, alerta legal com fonte, lembrete de revisão periódica]

**4. MENSAGEM DE INDICAÇÃO** (D+90):
[convite educado, benefício se houver programa, modelo de agradecimento a quem indicou]

Ao final: **Checklist antes de enviar** (revisão pelo advogado: linguagem, dados corretos, consentimento LGPD).

NUNCA prometa acompanhamento de serviços não contratados.`,
  },

  jurisprudencia: {
    label: 'Pesquisa Jurisprudencial',
    icon: '🔍',
    description: 'Estrutura roteiro de busca e mapa argumentativo com teses, tendências e strings de pesquisa',
    inputFields: [
      { key: 'tese', label: 'Tese ou pedido principal', type: 'text', placeholder: 'Ex.: Revisão de benefício previdenciário por erro no PBC', required: true },
      { key: 'area', label: 'Área do direito', type: 'text', placeholder: 'Ex.: Previdenciário, Trabalhista, Consumidor', required: true },
      { key: 'tribunal', label: 'Tribunal competente', type: 'text', placeholder: 'Ex.: TRF 3ª Região, TRT 2ª Região, TJSP', required: true },
      { key: 'facts', label: 'Fatos relevantes (5–10 linhas)', type: 'textarea', placeholder: 'Descreva os fatos principais do caso...', required: true },
      { key: 'peca', label: 'Tipo de peça', type: 'select', options: [
        { value: 'inicial', label: 'Petição inicial' },
        { value: 'contestacao', label: 'Contestação' },
        { value: 'recurso', label: 'Recurso' },
        { value: 'agravo', label: 'Agravo de instrumento' },
        { value: 'memoriais', label: 'Memoriais' },
      ], required: false },
      { key: 'anoMinimo', label: 'Ano mínimo dos precedentes', type: 'text', placeholder: 'Ex.: 2020', required: false },
    ],
    systemPrompt: `Você estrutura roteiros de pesquisa jurisprudencial e mapas argumentativos para advogados.

IMPORTANTE: Sintetize conhecimento geral sobre teses e tendências. NÃO invente números de processo ou citações específicas. Instrua sempre a validar em fontes oficiais.

**1. MAPEAMENTO INICIAL**
- Teses a favor (bullets)
- Teses contra (bullets)
- Hierarquia: STF/STJ → TJ/TRT/TRE conforme matéria
- Âncoras: súmulas, OJs, IRDR, Temas repetitivos aplicáveis (mencionar "confirmar vigência")

**2. ESTRATÉGIA DE BUSCA** (entregue ao advogado)
- 5–8 strings de busca com operadores booleanos (E/OU/aspas/exclusão)
- Plataformas: JusBrasil, Escavador, site do tribunal
- Filtros recomendados: período, câmara/órgão, tipo de recurso

**3. MAPA DE TESES** (até 5 principais — tabela Markdown)
| Tese | Resumo | Argumentos centrais | Tendência | Contra-argumentos | O que o juiz olha |

**4. RELATÓRIO FINAL**
- Panorama em 1 parágrafo
- Estratégia sugerida (ordem de argumentos e pedidos subsidiários)
- Precedentes-chave: Tribunal | Órgão | Tema (SEM número se não tiver certeza)
- Probabilidade qualitativa (alta/média/baixa) com fatores

⚠️ Aviso: pesquisa auxiliar — validar em fonte oficial antes de peticionar.`,
  },

  legislacao: {
    label: 'Análise de Legislação / Compliance',
    icon: '📋',
    description: 'Mapeia normas aplicáveis e gera checklist P0/P1/P2 de conformidade regulatória',
    inputFields: [
      { key: 'setor', label: 'Setor / atividade', type: 'text', placeholder: 'Ex.: Clínica médica, Fintech de crédito, Loja virtual', required: true },
      { key: 'uf', label: 'Estado (UF)', type: 'text', placeholder: 'Ex.: SP, RJ, MG — ou "Nacional"', required: false },
      { key: 'tipoEntidade', label: 'Tipo de entidade', type: 'select', options: [
        { value: 'pj', label: 'Pessoa jurídica (empresa)' },
        { value: 'pf', label: 'Pessoa física (autônomo / profissional liberal)' },
        { value: 'startup', label: 'Startup / empresa digital' },
        { value: 'ong', label: 'ONG / associação' },
      ], required: false },
      { key: 'descricao', label: 'Descrição da atividade ou problema', type: 'textarea', placeholder: 'Ex.: App que coleta dados de saúde e processa pagamentos online...', required: true },
      { key: 'agencias', label: 'Agências reguladoras relevantes (se souber)', type: 'text', placeholder: 'Ex.: ANVISA, Bacen, ANPD, CVM', required: false },
    ],
    systemPrompt: `Você mapeia normas e requisitos de compliance para atividades e setores no Brasil. Sempre indique que artigos e decretos devem ser verificados em Planalto.gov.br e Diários Oficiais.

**1. MAPA NORMATIVO** (tabela Markdown):
| Norma + dispositivos | Obrigações | Vedações | Prazos/renovações | Sanções | Risco | Status |
(risco: alto/médio/baixo; status: "confirmar vigência")

**2. CHECKLIST OPERACIONAL**

🔴 **P0 — Bloqueiam operação:**
[itens críticos]

🟡 **P1 — Multa relevante se descumprido:**
[itens importantes]

🟢 **P2 — Melhoria / boas práticas:**
[itens recomendados]

Para cada checklist: documento a manter | prova de cumprimento | responsável sugerido (área, não pessoa)

**3. NORMAS EM TRAMITAÇÃO**
[PLs ou MPs relevantes com ressalva "tramitação sujeita a mudança"]

**4. PRÓXIMOS PASSOS** de pesquisa em fonte primária

Se tema envolver saúde, financeiro ou dados pessoais: reforçar que parecer específico pode exigir advogado regulatório.`,
  },

  risco: {
    label: 'Análise de Risco da Causa',
    icon: '⚖️',
    description: 'Produz memorial de risco com mérito, provas, cenários e recomendação de litigar/negociar',
    inputFields: [
      { key: 'area', label: 'Área e tipo de ação', type: 'text', placeholder: 'Ex.: Ação trabalhista por horas extras não pagas', required: true },
      { key: 'valorCausa', label: 'Valor da causa estimado', type: 'text', placeholder: 'Ex.: R$ 50.000', required: false },
      { key: 'fase', label: 'Fase processual', type: 'select', options: [
        { value: 'pre', label: 'Pré-processual (ainda não ajuizou)' },
        { value: '1grau', label: '1º Grau' },
        { value: '2grau', label: '2º Grau / Recurso' },
        { value: 'superior', label: 'Tribunais Superiores' },
      ], required: false },
      { key: 'facts', label: 'Fatos em ordem cronológica (versão do cliente vs. narrativa adversa)', type: 'textarea', placeholder: 'Descreva os fatos, incluindo a possível versão da parte contrária...', required: true },
      { key: 'provas', label: 'Provas disponíveis', type: 'textarea', placeholder: 'Ex.: Contrato de trabalho, contracheques, e-mails, 2 testemunhas', required: false },
      { key: 'parteContraria', label: 'Perfil da parte contrária', type: 'select', options: [
        { value: 'pf', label: 'Pessoa física' },
        { value: 'pj', label: 'Empresa privada' },
        { value: 'fazenda', label: 'Fazenda Pública / INSS' },
        { value: 'banco', label: 'Banco / instituição financeira' },
      ], required: false },
    ],
    systemPrompt: `Você produz memoriais de risco jurídico para advogados e clientes. Probabilidades são QUALITATIVAS salvo se explicitamente pedido modelo numérico com ressalva de incerteza. NUNCA prometa resultado.

**1. ANÁLISE DE MÉRITO**
- Tese principal: força (alta/média/baixa) + 3 bullets de fundamentação
- Teses subsidiárias e ordem de arguição
- Jurisprudência e súmulas: indicar "pesquisar e validar" com tribunal/ano
- Vulnerabilidades e mitigação

**2. PROVAS**
| Item | Situação | Importância | Ônus provável | Risco |

**3. FINANCEIRO E TEMPO**
- Faixa estimada: custas, honorários sucumbenciais, perícia, diligências
- Horizonte indicativo: 1º grau e recursos (com ressalva de pauta judiciária)
- Valor esperado ILUSTRATIVO com suposições explícitas

**4. MATRIZ DE CENÁRIOS** (tabela Markdown):
| Cenário | Prob. indicativa | Resultado econômico estimado | Observações |
| Êxito total | | | |
| Êxito parcial | | | |
| Acordo | | | |
| Improcedência | | | |

**5. RECOMENDAÇÃO**
- Litigar / Negociar / Não ingressar — com bullets de razão
- Perguntas que o cliente deve responder antes de decidir

⚠️ Modelo hipotético — não constitui garantia de resultado.`,
  },

  contratos: {
    label: 'Revisão de Contratos',
    icon: '📄',
    description: 'Analisa cláusulas, classifica riscos CRÍTICO/ATENÇÃO/ADEQUADA e sugere redações alternativas',
    inputFields: [
      { key: 'contractType', label: 'Tipo de contrato', type: 'text', placeholder: 'Ex.: Prestação de serviços, NDA, Locação, Compra e venda', required: true },
      { key: 'clientRole', label: 'Papel do cliente no contrato', type: 'text', placeholder: 'Ex.: Contratante, Fornecedor, Locatário, Cedente', required: true },
      { key: 'contractText', label: 'Texto do contrato ou cláusulas a analisar', type: 'textarea', placeholder: 'Cole aqui o texto completo ou as cláusulas mais relevantes...', required: true },
      { key: 'lei', label: 'Lei aplicável e foro (se indicado no contrato)', type: 'text', placeholder: 'Ex.: Lei brasileira, Foro São Paulo/SP', required: false },
      { key: 'context', label: 'Contexto adicional (aditivos, acordos paralelos)', type: 'textarea', placeholder: 'Ex.: Há aditivou que modifica a cláusula 5ª...', required: false },
    ],
    systemPrompt: `Você apoia a revisão contratual de advogados: mapeia riscos, sugere ajustes e prioriza negociação. NÃO substitui parecer formal assinado.

**1. IDENTIFICAÇÃO**
Partes | Objeto | Natureza | Lei aplicável

**2. ANÁLISE DE CLÁUSULAS** (tabela Markdown):
| Cláusula | Classificação | Problema | Redação sugerida | Fundamento | Ponto a validar |

Classificação:
- 🔴 CRÍTICO: ilegal, nula provável, abusiva (CDC se B2C), exposição patrimonial grave
- 🟡 ATENÇÃO: ambígua, desequilibrada ou litigiosa
- 🟢 ADEQUADA: padrão de mercado

Verificar sempre: preço/reajuste, prazo/rescisão, obrigações recíprocas/SLA, PI/confidencialidade, LGPD, foro/arbitragem.

**3. RESUMO EXECUTIVO** (8–12 linhas):
- Top 3 riscos
- Top 3 ações imediatas

**4. SCORE DE RISCO: X/10** com critério explícito

**5. CHECKLIST DE NEGOCIAÇÃO**: o que pedir à contraparte antes de assinar

⚠️ Análise de suporte — conferir atualização legislativa e jurisprudência no momento da assinatura.`,
  },
};

// ─── Run a tool ───────────────────────────────────────────────────────────────

async function runTool(toolKey, inputData) {
  const tool = TOOLS[toolKey];
  if (!tool) throw new Error('Ferramenta não encontrada');

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY não configurada. Configure a variável de ambiente para usar as ferramentas de IA.');
  }

  const userMessage = tool.inputFields
    .filter((f) => inputData[f.key])
    .map((f) => {
      let value = inputData[f.key];
      if (f.type === 'select') {
        const opt = f.options?.find((o) => o.value === value);
        if (opt) value = opt.label;
      }
      return `**${f.label}**: ${value}`;
    })
    .join('\n\n');

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: tool.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return {
    tool: toolKey,
    label: tool.label,
    result: message.content[0].text,
    inputData,
  };
}

module.exports = { TOOLS, runTool };
