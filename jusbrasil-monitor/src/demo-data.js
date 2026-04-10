'use strict';

/**
 * Dados simulados realistas para demonstração/testes offline.
 * Refletem o tipo de conteúdo publicado no JusBrasil.
 */
const DEMO_RESULTS = [
  {
    title: 'Banco cobrou taxa de manutenção indevida por 3 anos — cliente recupera R$ 4.200',
    url: 'https://www.jusbrasil.com.br/artigos/banco-cobrou-taxa-indevida/000001',
    author: 'Dra. Ana Paula Ferreira',
    city: 'São Paulo - SP',
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
    snippet:
      'Cliente do Banco Itaú em São Paulo - SP entrou com ação após identificar ' +
      'cobrança mensal de R$ 117 sem contratação. Sentença determinou devolução ' +
      'em dobro (R$ 4.212) mais danos morais de R$ 3.000.',
    sourceKeyword: 'banco cobrou taxa indevida',
  },
  {
    title: 'INSS negou aposentadoria por invalidez — TRF reforma decisão e concede benefício',
    url: 'https://www.jusbrasil.com.br/jurisprudencia/trf/inss-negou-aposentadoria/000002',
    author: 'Dr. Carlos Eduardo Lima',
    city: 'Belo Horizonte - MG',
    date: new Date(Date.now() - 5 * 3600000).toISOString(),
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
    snippet:
      'Trabalhador rural de 62 anos teve aposentadoria por invalidez negada pelo INSS. ' +
      'O TRF da 1ª Região reformou a decisão após laudo médico atestar incapacidade ' +
      'permanente para atividade laborativa.',
    sourceKeyword: 'INSS negou aposentadoria',
  },
  {
    title: 'Plano de saúde negou cirurgia de emergência — liminar garante procedimento em 24h',
    url: 'https://www.jusbrasil.com.br/noticias/plano-saude-negou-cirurgia/000003',
    author: 'Dra. Fernanda Oliveira',
    city: 'Curitiba - PR',
    date: new Date(Date.now() - 8 * 3600000).toISOString(),
    caseType: 'Negativa de Cobertura Médica',
    area: 'Direito do Consumidor / Saúde',
    snippet:
      'A Amil negou cobertura para cirurgia cardíaca de urgência alegando carência. ' +
      'Liminar concedida pelo TJPR obrigou a operadora a autorizar o procedimento ' +
      'em até 24 horas, sob pena de multa diária de R$ 5.000.',
    sourceKeyword: 'plano de saúde negou cirurgia',
  },
  {
    title: 'Banco Bradesco cobrou IOF indevido em empréstimo consignado — devolução em dobro',
    url: 'https://www.jusbrasil.com.br/artigos/bradesco-iof-indevido/000004',
    author: 'Dr. Rodrigo Santos Alves',
    city: 'Recife - PE',
    date: new Date(Date.now() - 12 * 3600000).toISOString(),
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
    snippet:
      'Aposentado contratou empréstimo consignado e identificou IOF cobrado ' +
      'acima da alíquota legal. TJPE condenou o Bradesco à devolução em dobro ' +
      'de R$ 1.840 e danos morais de R$ 2.000.',
    sourceKeyword: 'banco cobrou taxa indevida',
  },
  {
    title: 'INSS indeferiu auxílio por incapacidade temporária — perícia judicial reverte',
    url: 'https://www.jusbrasil.com.br/jurisprudencia/inss-auxilio-incapacidade/000005',
    author: 'Dra. Juliana Costa',
    city: 'Porto Alegre - RS',
    date: new Date(Date.now() - 18 * 3600000).toISOString(),
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
    snippet:
      'Trabalhadora diagnosticada com síndrome de burnout teve auxílio por ' +
      'incapacidade negado pelo INSS. Perícia judicial reconheceu a incapacidade ' +
      'e o TJES determinou concessão do benefício retroativo a 14 meses.',
    sourceKeyword: 'INSS negou aposentadoria',
  },
  {
    title: 'Unimed nega cobertura para quimioterapia — decisão judicial impõe tratamento',
    url: 'https://www.jusbrasil.com.br/noticias/unimed-quimioterapia/000006',
    author: 'Dr. Marcelo Pereira',
    city: 'Fortaleza - CE',
    date: new Date(Date.now() - 24 * 3600000).toISOString(),
    caseType: 'Negativa de Cobertura Médica',
    area: 'Direito do Consumidor / Saúde',
    snippet:
      'Paciente oncológica teve protocolo de quimioterapia negado pela Unimed ' +
      'sob alegação de medicamento fora da lista ANS. Juízo de Fortaleza - CE ' +
      'determinou autorização imediata sob multa de R$ 10.000/dia.',
    sourceKeyword: 'plano de saúde negou cirurgia',
  },
  {
    title: 'Caixa Econômica cobra tarifa de cadastro inexistente — ação coletiva beneficia 300 clientes',
    url: 'https://www.jusbrasil.com.br/artigos/caixa-tarifa-cadastro/000007',
    author: 'Dra. Patricia Mendes',
    city: 'Manaus - AM',
    date: new Date(Date.now() - 30 * 3600000).toISOString(),
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
    snippet:
      'Ação civil pública movida pelo Procon de Manaus - AM identificou ' +
      'cobrança ilegal de "tarifa de cadastro" em contratos de financiamento. ' +
      'Decisão beneficia cerca de 300 consumidores com restituição média de R$ 890.',
    sourceKeyword: 'banco cobrou taxa indevida',
  },
  {
    title: 'INSS nega pensão por morte a viúva — TJ reconhece união estável e concede benefício',
    url: 'https://www.jusbrasil.com.br/jurisprudencia/inss-pensao-morte-viuva/000008',
    author: 'Dr. Thiago Barbosa',
    city: 'Salvador - BA',
    date: new Date(Date.now() - 36 * 3600000).toISOString(),
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
    snippet:
      'INSS negou pensão por morte alegando ausência de casamento formal. ' +
      'TJBA reconheceu união estável de 18 anos com base em testemunhas e ' +
      'documentos, determinando pagamento retroativo com juros e correção.',
    sourceKeyword: 'INSS negou aposentadoria',
  },
  {
    title: 'Hapvida se recusa a cobrir internação UTI — liminar garante leito em hospital referenciado',
    url: 'https://www.jusbrasil.com.br/noticias/hapvida-internacao-uti/000009',
    author: 'Dra. Camila Rocha',
    city: 'Goiânia - GO',
    date: new Date(Date.now() - 40 * 3600000).toISOString(),
    caseType: 'Negativa de Cobertura Médica',
    area: 'Direito do Consumidor / Saúde',
    snippet:
      'Hapvida negou internação em UTI ao segurado, indicando hospital sem ' +
      'capacidade para o caso. Liminar garantiu vaga no hospital referenciado ' +
      'em Goiânia - GO, com custo integral arcado pelo plano.',
    sourceKeyword: 'plano de saúde negou cirurgia',
  },
  {
    title: 'Santander aplica juros abusivos em crédito rotativo — devolver R$ 6.500 ao consumidor',
    url: 'https://www.jusbrasil.com.br/artigos/santander-juros-abusivos/000010',
    author: 'Dr. Paulo Henrique Souza',
    city: 'Campinas - SP',
    date: new Date(Date.now() - 48 * 3600000).toISOString(),
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
    snippet:
      'Consumidora de Campinas - SP identificou juros de 14,5% a.m. no cartão ' +
      'de crédito, acima da média de mercado. Perito nomeado pelo juízo apurou ' +
      'excesso de R$ 6.512, com condenação à devolução em dobro.',
    sourceKeyword: 'banco cobrou taxa indevida',
  },
  {
    title: 'INSS recusa aposentadoria especial a trabalhador com exposição a agentes químicos',
    url: 'https://www.jusbrasil.com.br/jurisprudencia/inss-aposentadoria-especial/000011',
    author: 'Dra. Luciana Freitas',
    city: 'São Luís - MA',
    date: new Date(Date.now() - 52 * 3600000).toISOString(),
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
    snippet:
      'Trabalhador da indústria química com 25 anos de exposição a benzeno ' +
      'teve aposentadoria especial negada pelo INSS. TRF reconheceu atividade ' +
      'insalubre e determinou concessão com DIB na data do requerimento administrativo.',
    sourceKeyword: 'INSS negou aposentadoria',
  },
  {
    title: 'SulAmérica nega transplante de medula — decisão judicial obriga autorização imediata',
    url: 'https://www.jusbrasil.com.br/noticias/sulamerica-transplante-medula/000012',
    author: 'Dr. Eduardo Cavalcanti',
    city: 'Natal - RN',
    date: new Date(Date.now() - 60 * 3600000).toISOString(),
    caseType: 'Negativa de Cobertura Médica',
    area: 'Direito do Consumidor / Saúde',
    snippet:
      'SulAmérica negou transplante de medula óssea em paciente com leucemia ' +
      'mieloide aguda sob pretexto de "procedimento experimental". TJRN rejeitou ' +
      'a justificativa e concedeu tutela de urgência para realização imediata em Natal - RN.',
    sourceKeyword: 'plano de saúde negou cirurgia',
  },
  {
    title: 'Nubank cobra pelo cancelamento de assinatura — consumidor obtém restituição',
    url: 'https://www.jusbrasil.com.br/artigos/nubank-cancelamento-assinatura/000013',
    author: 'Dra. Renata Gomes',
    city: 'Belém - PA',
    date: new Date(Date.now() - 66 * 3600000).toISOString(),
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
    snippet:
      'Nubank cobrou taxa de R$ 120 por cancelamento antecipado de serviço ' +
      'sem previsão contratual. TJPA considerou abusiva a cláusula e determinou ' +
      'devolução em dobro mais indenização por danos morais de R$ 1.500.',
    sourceKeyword: 'banco cobrou taxa indevida',
  },
  {
    title: 'INSS nega BPC a pessoa com deficiência — laudo atualizado reverte decisão',
    url: 'https://www.jusbrasil.com.br/jurisprudencia/inss-bpc-deficiencia/000014',
    author: 'Dr. Alessandro Martins',
    city: 'Maceió - AL',
    date: new Date(Date.now() - 72 * 3600000).toISOString(),
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
    snippet:
      'INSS negou Benefício de Prestação Continuada a criança com paralisia ' +
      'cerebral, questionando grau da deficiência. Novo laudo pericial atestou ' +
      'impedimento de longo prazo e juízo de Maceió - AL concedeu o benefício.',
    sourceKeyword: 'INSS negou aposentadoria',
  },
  {
    title: 'NotreDame Intermédica recusa cobertura de prótese ortopédica pós-cirurgia',
    url: 'https://www.jusbrasil.com.br/noticias/notredame-protese-ortopedica/000015',
    author: 'Dra. Monica Tavares',
    city: 'João Pessoa - PB',
    date: new Date(Date.now() - 78 * 3600000).toISOString(),
    caseType: 'Negativa de Cobertura Médica',
    area: 'Direito do Consumidor / Saúde',
    snippet:
      'NotreDame Intermédica negou cobertura para prótese de quadril após ' +
      'fratura por osteoporose, alegando exclusão contratual. TJPB ' +
      'considerou a cláusula nula e condenou o plano ao custeio integral em João Pessoa - PB.',
    sourceKeyword: 'plano de saúde negou cirurgia',
  },
  {
    title: 'Banco Inter cobra tarifa por TED sem aviso — cliente recupera valores com correção',
    url: 'https://www.jusbrasil.com.br/artigos/banco-inter-tarifa-ted/000016',
    author: 'Dr. Gabriel Nascimento',
    city: 'Vitória - ES',
    date: new Date(Date.now() - 84 * 3600000).toISOString(),
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
    snippet:
      'Banco Inter passou a cobrar tarifa de R$ 4,90 por TED sem notificação ' +
      'prévia ao correntista. Juízo de Vitória - ES determinou devolução de ' +
      'todas as tarifas cobradas no período com juros de 1% ao mês.',
    sourceKeyword: 'banco cobrou taxa indevida',
  },
  {
    title: 'INSS cancela aposentadoria por suspeita de fraude — ação garante restabelecimento',
    url: 'https://www.jusbrasil.com.br/jurisprudencia/inss-cancelamento-aposentadoria/000017',
    author: 'Dra. Isadora Prado',
    city: 'Aracaju - SE',
    date: new Date(Date.now() - 90 * 3600000).toISOString(),
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
    snippet:
      'INSS cancelou aposentadoria por tempo de contribuição de 68 anos ' +
      'baseado em cruzamento de dados sem notificar o beneficiário. ' +
      'TRF determinou restabelecimento imediato e indenização por danos morais em Aracaju - SE.',
    sourceKeyword: 'INSS negou aposentadoria',
  },
  {
    title: 'Bradesco Saúde nega internação psiquiátrica voluntária — juiz obriga autorização',
    url: 'https://www.jusbrasil.com.br/noticias/bradesco-saude-psiquiatra/000018',
    author: 'Dr. Leandro Farias',
    city: 'Cuiabá - MT',
    date: new Date(Date.now() - 96 * 3600000).toISOString(),
    caseType: 'Negativa de Cobertura Médica',
    area: 'Direito do Consumidor / Saúde',
    snippet:
      'Bradesco Saúde recusou internação voluntária em clínica psiquiátrica ' +
      'alegando limite de dias já atingido. TJMT concedeu liminar assegurando ' +
      'continuidade do tratamento em Cuiabá - MT pelo tempo médico necessário.',
    sourceKeyword: 'plano de saúde negou cirurgia',
  },
  {
    title: 'C6 Bank aplica cobrança duplicada em fatura — PROCON autua e consumidor é ressarcido',
    url: 'https://www.jusbrasil.com.br/artigos/c6bank-cobranca-duplicada/000019',
    author: 'Dra. Bianca Lopes',
    city: 'Porto Velho - RO',
    date: new Date(Date.now() - 100 * 3600000).toISOString(),
    caseType: 'Cobrança Indevida Bancária',
    area: 'Direito do Consumidor / Bancário',
    snippet:
      'C6 Bank lançou a mesma compra duas vezes na fatura de cliente em Porto Velho - RO. ' +
      'Após acionamento do PROCON e ação no JEC, banco foi condenado a restituir ' +
      'o valor em dobro (R$ 1.340) e pagar R$ 2.000 de danos morais.',
    sourceKeyword: 'banco cobrou taxa indevida',
  },
  {
    title: 'INSS nega aposentadoria rural — STJ reafirma validade de prova testemunhal',
    url: 'https://www.jusbrasil.com.br/jurisprudencia/stj-inss-rural-testemunha/000020',
    author: 'Dr. Tiago Brandão',
    city: 'Palmas - TO',
    date: new Date(Date.now() - 110 * 3600000).toISOString(),
    caseType: 'Negativa de Aposentadoria pelo INSS',
    area: 'Direito Previdenciário',
    snippet:
      'INSS negou aposentadoria rural a trabalhadora de 60 anos por ausência ' +
      'de documentação formal de atividade. STJ reiterou jurisprudência ' +
      'admitindo prova testemunhal como início de prova material em Palmas - TO.',
    sourceKeyword: 'INSS negou aposentadoria',
  },
];

module.exports = { DEMO_RESULTS };
