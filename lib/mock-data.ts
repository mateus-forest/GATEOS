import type {
  User,
  Socio,
  Cliente,
  Contrato,
  Parcela,
  Patrimonio,
  Equipamento,
  Manutencao,
  Lancamento,
  Documento,
  DashboardMetrics,
  Notificacao,
} from './types'

// ==================== USUÁRIO ATUAL ====================
export const currentUser: User & { name: string } = {
  id: '1',
  nome: 'Carlos Silva',
  name: 'Carlos Silva',
  email: 'carlos@gatetech.com.br',
  avatar: '/avatars/carlos.jpg',
  cargo: 'Diretor Executivo',
  role: 'admin',
  ativo: true,
}

// ==================== SÓCIOS ====================
export const socios: Socio[] = [
  {
    id: '1',
    nome: 'Carlos Alberto Silva',
    cpf: '123.456.789-00',
    email: 'carlos@gatetech.com.br',
    telefone: '(11) 99999-1111',
    participacao: 40,
    dataEntrada: '2018-01-15',
    ativo: true,
  },
  {
    id: '2',
    nome: 'Renan Linhares',
    cpf: '234.567.890-11',
    email: 'renan@gatetech.com.br',
    telefone: '(11) 99999-2222',
    participacao: 35,
    dataEntrada: '2018-01-15',
    ativo: true,
  },
  {
    id: '3',
    nome: 'Mateus Forest',
    cpf: '345.678.901-22',
    email: 'mateus@gatetech.com.br',
    telefone: '(11) 99999-3333',
    participacao: 25,
    dataEntrada: '2020-06-01',
    ativo: true,
  },
]

// ==================== CLIENTES ====================
export const clientes: Cliente[] = [
  {
    id: '1',
    razaoSocial: 'Fribal Comercio de Alimentos Ltda',
    nomeFantasia: 'Fribal',
    cnpj: '12.345.678/0001-90',
    inscricaoEstadual: '123.456.789.012',
    email: 'contato@techsolutions.com.br',
    telefone: '(11) 3333-1111',
    endereco: {
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'Sala 1501',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
    },
    contato: {
      nome: 'João Pedro',
      cargo: 'Gerente de TI',
      email: 'joao@techsolutions.com.br',
      telefone: '(11) 99888-1111',
    },
    dataCadastro: '2022-03-15',
    ativo: true,
    segmento: 'Tecnologia',
  },
  {
    id: '2',
    razaoSocial: 'Estacio Itapipoca Educacional Ltda',
    nomeFantasia: 'Estacio Itapipoca',
    cnpj: '23.456.789/0001-01',
    email: 'contato@abcindustrial.com.br',
    telefone: '(11) 3333-2222',
    endereco: {
      logradouro: 'Rua Industrial',
      numero: '500',
      bairro: 'Distrito Industrial',
      cidade: 'Guarulhos',
      estado: 'SP',
      cep: '07220-000',
    },
    contato: {
      nome: 'Maria Clara',
      cargo: 'Diretora Administrativa',
      email: 'maria@abcindustrial.com.br',
      telefone: '(11) 99888-2222',
    },
    dataCadastro: '2021-08-20',
    ativo: true,
    segmento: 'Indústria',
  },
  {
    id: '3',
    razaoSocial: 'Fortaleza Iguatemi Operacoes Ltda',
    nomeFantasia: 'Fortaleza Iguatemi',
    cnpj: '34.567.890/0001-12',
    email: 'contato@deltastore.com.br',
    telefone: '(11) 3333-3333',
    endereco: {
      logradouro: 'Rua Comercial',
      numero: '250',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01020-000',
    },
    contato: {
      nome: 'Pedro Santos',
      cargo: 'Proprietário',
      email: 'pedro@deltastore.com.br',
      telefone: '(11) 99888-3333',
    },
    dataCadastro: '2023-01-10',
    ativo: true,
    segmento: 'Comércio',
  },
  {
    id: '4',
    razaoSocial: 'Rio de Janeiro Tecnologia e Servicos Ltda',
    nomeFantasia: 'Rio de Janeiro',
    cnpj: '45.678.901/0001-23',
    email: 'ti@saolucas.com.br',
    telefone: '(11) 3333-4444',
    endereco: {
      logradouro: 'Av. da Saúde',
      numero: '1500',
      bairro: 'Vila Mariana',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04116-000',
    },
    contato: {
      nome: 'Ana Paula',
      cargo: 'Coordenadora de TI',
      email: 'ana@saolucas.com.br',
      telefone: '(11) 99888-4444',
    },
    dataCadastro: '2020-05-01',
    ativo: true,
    segmento: 'Saúde',
  },
  {
    id: '5',
    razaoSocial: 'Intech Tecnologia Ltda',
    nomeFantasia: 'Intech',
    cnpj: '56.789.012/0001-34',
    email: 'contato@martinsadv.com.br',
    telefone: '(11) 3333-5555',
    endereco: {
      logradouro: 'Rua Augusta',
      numero: '2000',
      complemento: '12º andar',
      bairro: 'Consolação',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01305-100',
    },
    contato: {
      nome: 'Dr. Marcos Martins',
      cargo: 'Sócio',
      email: 'marcos@martinsadv.com.br',
      telefone: '(11) 99888-5555',
    },
    dataCadastro: '2022-11-15',
    ativo: true,
    segmento: 'Jurídico',
  },
]

// ==================== EQUIPAMENTOS ====================
export const equipamentos: Equipamento[] = [
  {
    id: '1',
    codigo: 'EQ-001',
    nome: 'Servidor Dell PowerEdge R750',
    descricao: 'Servidor rack de alto desempenho',
    categoria: 'servidor',
    status: 'locado',
    marca: 'Dell',
    modelo: 'PowerEdge R750',
    numeroSerie: 'DELL-R750-001',
    valorCompra: 45000,
    valorLocacao: 2500,
    dataCompra: '2023-01-15',
    garantiaAte: '2026-01-15',
    clienteAtual: '1',
    contratoAtual: '1',
    ultimaManutencao: '2024-06-15',
    proximaManutencao: '2024-12-15',
  },
  {
    id: '2',
    codigo: 'EQ-002',
    nome: 'Workstation HP Z8',
    descricao: 'Estação de trabalho para alta performance',
    categoria: 'computador',
    status: 'locado',
    marca: 'HP',
    modelo: 'Z8 G5',
    numeroSerie: 'HP-Z8-002',
    valorCompra: 25000,
    valorLocacao: 1500,
    dataCompra: '2023-03-20',
    garantiaAte: '2026-03-20',
    clienteAtual: '2',
    contratoAtual: '2',
    ultimaManutencao: '2024-05-10',
    proximaManutencao: '2024-11-10',
  },
  {
    id: '3',
    codigo: 'EQ-003',
    nome: 'Impressora Xerox VersaLink',
    descricao: 'Impressora multifuncional empresarial',
    categoria: 'impressora',
    status: 'disponivel',
    marca: 'Xerox',
    modelo: 'VersaLink C7030',
    numeroSerie: 'XRX-VL-003',
    valorCompra: 18000,
    valorLocacao: 800,
    dataCompra: '2022-08-10',
    garantiaAte: '2025-08-10',
    ultimaManutencao: '2024-04-20',
    proximaManutencao: '2024-10-20',
  },
  {
    id: '4',
    codigo: 'EQ-004',
    nome: 'Switch Cisco Catalyst',
    descricao: 'Switch gerenciável 48 portas',
    categoria: 'rede',
    status: 'locado',
    marca: 'Cisco',
    modelo: 'Catalyst 9300',
    numeroSerie: 'CISCO-CAT-004',
    valorCompra: 12000,
    valorLocacao: 600,
    dataCompra: '2023-05-01',
    garantiaAte: '2028-05-01',
    clienteAtual: '4',
    contratoAtual: '4',
    ultimaManutencao: '2024-03-15',
    proximaManutencao: '2024-09-15',
  },
  {
    id: '5',
    codigo: 'EQ-005',
    nome: 'Nobreak APC Smart-UPS',
    descricao: 'Nobreak 3000VA para servidores',
    categoria: 'rede',
    status: 'em_manutencao',
    marca: 'APC',
    modelo: 'Smart-UPS 3000',
    numeroSerie: 'APC-SU-005',
    valorCompra: 8500,
    valorLocacao: 400,
    dataCompra: '2022-11-20',
    garantiaAte: '2024-11-20',
    ultimaManutencao: '2024-07-01',
  },
  {
    id: '6',
    codigo: 'EQ-006',
    nome: 'Servidor HPE ProLiant',
    descricao: 'Servidor torre para PMEs',
    categoria: 'servidor',
    status: 'disponivel',
    marca: 'HPE',
    modelo: 'ProLiant ML350',
    numeroSerie: 'HPE-ML-006',
    valorCompra: 32000,
    valorLocacao: 1800,
    dataCompra: '2024-02-10',
    garantiaAte: '2027-02-10',
  },
  {
    id: '7',
    codigo: 'EQ-007',
    nome: 'Central Telefônica Intelbras',
    descricao: 'PABX IP para até 100 ramais',
    categoria: 'telefonia',
    status: 'locado',
    marca: 'Intelbras',
    modelo: 'Impacta 140',
    numeroSerie: 'INT-IMP-007',
    valorCompra: 6500,
    valorLocacao: 350,
    dataCompra: '2023-07-15',
    garantiaAte: '2025-07-15',
    clienteAtual: '5',
    contratoAtual: '5',
  },
  {
    id: '8',
    codigo: 'EQ-008',
    nome: 'Câmera IP Hikvision',
    descricao: 'Câmera de segurança 4K',
    categoria: 'seguranca',
    status: 'disponivel',
    marca: 'Hikvision',
    modelo: 'DS-2CD2T85G1',
    numeroSerie: 'HIK-CAM-008',
    valorCompra: 1200,
    valorLocacao: 80,
    dataCompra: '2024-01-20',
    garantiaAte: '2027-01-20',
  },
]

// ==================== CONTRATOS ====================
export const contratos: Contrato[] = [
  {
    id: '1',
    numero: 'CT-2024-001',
    clienteId: '1',
    tipo: 'locacao',
    status: 'ativo',
    dataInicio: '2024-01-01',
    dataFim: '2024-12-31',
    valorMensal: 2500,
    valorTotal: 30000,
    descricao: 'Locação de servidor Dell PowerEdge R750',
    equipamentos: [{ equipamentoId: '1', quantidade: 1, valorUnitario: 2500 }],
    parcelas: [],
    documentos: [],
    dataCriacao: '2023-12-15',
    dataAtualizacao: '2024-01-01',
  },
  {
    id: '2',
    numero: 'CT-2024-002',
    clienteId: '2',
    tipo: 'locacao',
    status: 'ativo',
    dataInicio: '2024-02-01',
    dataFim: '2025-01-31',
    valorMensal: 4500,
    valorTotal: 54000,
    descricao: 'Locação de workstations HP Z8 (3 unidades)',
    equipamentos: [{ equipamentoId: '2', quantidade: 3, valorUnitario: 1500 }],
    parcelas: [],
    documentos: [],
    dataCriacao: '2024-01-20',
    dataAtualizacao: '2024-02-01',
  },
  {
    id: '3',
    numero: 'CT-2024-003',
    clienteId: '3',
    tipo: 'manutencao',
    status: 'ativo',
    dataInicio: '2024-03-01',
    valorMensal: 1200,
    valorTotal: 14400,
    descricao: 'Contrato de manutenção preventiva mensal',
    equipamentos: [],
    parcelas: [],
    documentos: [],
    dataCriacao: '2024-02-15',
    dataAtualizacao: '2024-03-01',
  },
  {
    id: '4',
    numero: 'CT-2024-004',
    clienteId: '4',
    tipo: 'locacao',
    status: 'ativo',
    dataInicio: '2024-01-15',
    dataFim: '2025-01-14',
    valorMensal: 3200,
    valorTotal: 38400,
    descricao: 'Locação de infraestrutura de rede',
    equipamentos: [
      { equipamentoId: '4', quantidade: 2, valorUnitario: 600 },
      { equipamentoId: '5', quantidade: 4, valorUnitario: 400 },
    ],
    parcelas: [],
    documentos: [],
    dataCriacao: '2024-01-10',
    dataAtualizacao: '2024-01-15',
  },
  {
    id: '5',
    numero: 'CT-2024-005',
    clienteId: '5',
    tipo: 'locacao',
    status: 'pendente',
    dataInicio: '2024-08-01',
    dataFim: '2025-07-31',
    valorMensal: 850,
    valorTotal: 10200,
    descricao: 'Locação de central telefônica e telefones IP',
    equipamentos: [{ equipamentoId: '7', quantidade: 1, valorUnitario: 350 }],
    parcelas: [],
    documentos: [],
    dataCriacao: '2024-07-15',
    dataAtualizacao: '2024-07-15',
  },
]

// ==================== PARCELAS ====================
const parcelasBase: Parcela[] = [
  { id: '1', contratoId: '1', numero: 1, valor: 2500, dataVencimento: '2024-01-10', dataPagamento: '2024-01-08', status: 'pago', formaPagamento: 'PIX' },
  { id: '2', contratoId: '1', numero: 2, valor: 2500, dataVencimento: '2024-02-10', dataPagamento: '2024-02-10', status: 'pago', formaPagamento: 'Boleto' },
  { id: '3', contratoId: '1', numero: 3, valor: 2500, dataVencimento: '2024-03-10', dataPagamento: '2024-03-12', status: 'pago', formaPagamento: 'PIX' },
  { id: '4', contratoId: '1', numero: 4, valor: 2500, dataVencimento: '2024-04-10', dataPagamento: '2024-04-09', status: 'pago', formaPagamento: 'PIX' },
  { id: '5', contratoId: '1', numero: 5, valor: 2500, dataVencimento: '2024-05-10', dataPagamento: '2024-05-10', status: 'pago', formaPagamento: 'Boleto' },
  { id: '6', contratoId: '1', numero: 6, valor: 2500, dataVencimento: '2024-06-10', dataPagamento: '2024-06-08', status: 'pago', formaPagamento: 'PIX' },
  { id: '7', contratoId: '1', numero: 7, valor: 2500, dataVencimento: '2024-07-10', status: 'atrasado' },
  { id: '8', contratoId: '1', numero: 8, valor: 2500, dataVencimento: '2024-08-10', status: 'pendente' },
  { id: '9', contratoId: '2', numero: 1, valor: 4500, dataVencimento: '2024-02-15', dataPagamento: '2024-02-14', status: 'pago', formaPagamento: 'TED' },
  { id: '10', contratoId: '2', numero: 2, valor: 4500, dataVencimento: '2024-03-15', dataPagamento: '2024-03-15', status: 'pago', formaPagamento: 'TED' },
  { id: '11', contratoId: '2', numero: 3, valor: 4500, dataVencimento: '2024-04-15', dataPagamento: '2024-04-18', status: 'pago', formaPagamento: 'Boleto' },
  { id: '12', contratoId: '2', numero: 4, valor: 4500, dataVencimento: '2024-05-15', dataPagamento: '2024-05-15', status: 'pago', formaPagamento: 'TED' },
  { id: '13', contratoId: '2', numero: 5, valor: 4500, dataVencimento: '2024-06-15', dataPagamento: '2024-06-14', status: 'pago', formaPagamento: 'PIX' },
  { id: '14', contratoId: '2', numero: 6, valor: 4500, dataVencimento: '2024-07-15', status: 'pendente' },
  { id: '15', contratoId: '3', numero: 1, valor: 1200, dataVencimento: '2024-03-05', dataPagamento: '2024-03-05', status: 'pago', formaPagamento: 'PIX' },
  { id: '16', contratoId: '3', numero: 2, valor: 1200, dataVencimento: '2024-04-05', dataPagamento: '2024-04-04', status: 'pago', formaPagamento: 'PIX' },
  { id: '17', contratoId: '3', numero: 3, valor: 1200, dataVencimento: '2024-05-05', dataPagamento: '2024-05-06', status: 'pago', formaPagamento: 'Boleto' },
  { id: '18', contratoId: '3', numero: 4, valor: 1200, dataVencimento: '2024-06-05', status: 'atrasado' },
  { id: '19', contratoId: '3', numero: 5, valor: 1200, dataVencimento: '2024-07-05', status: 'pendente' },
  { id: '20', contratoId: '4', numero: 1, valor: 3200, dataVencimento: '2024-02-15', dataPagamento: '2024-02-15', status: 'pago', formaPagamento: 'TED' },
  { id: '21', contratoId: '4', numero: 2, valor: 3200, dataVencimento: '2024-03-15', dataPagamento: '2024-03-14', status: 'pago', formaPagamento: 'TED' },
  { id: '22', contratoId: '4', numero: 3, valor: 3200, dataVencimento: '2024-04-15', dataPagamento: '2024-04-15', status: 'pago', formaPagamento: 'PIX' },
  { id: '23', contratoId: '4', numero: 4, valor: 3200, dataVencimento: '2024-05-15', dataPagamento: '2024-05-17', status: 'pago', formaPagamento: 'Boleto' },
  { id: '24', contratoId: '4', numero: 5, valor: 3200, dataVencimento: '2024-06-15', dataPagamento: '2024-06-15', status: 'pago', formaPagamento: 'TED' },
  { id: '25', contratoId: '4', numero: 6, valor: 3200, dataVencimento: '2024-07-15', status: 'pendente' },
]

// ==================== PATRIMÔNIO ====================
export const parcelas = parcelasBase.map((parcela) => {
  const contrato = contratos.find((item) => item.id === parcela.contratoId)
  const cliente = contrato
    ? clientes.find((item) => item.id === contrato.clienteId)
    : undefined

  return {
    ...parcela,
    number: parcela.numero,
    totalParcelas: parcelasBase.filter((item) => item.contratoId === parcela.contratoId).length,
    contractNumber: contrato?.numero ?? parcela.contratoId,
    clientName: cliente?.nomeFantasia ?? contrato?.clienteId ?? parcela.contratoId,
    amount: parcela.valor,
    dueDate: parcela.dataVencimento,
    paymentDate: parcela.dataPagamento,
    status:
      parcela.status === 'pago'
        ? 'paid'
        : parcela.status === 'atrasado'
          ? 'overdue'
          : parcela.status === 'pendente'
            ? 'pending'
            : 'cancelled',
  }
})

export const patrimonios: Patrimonio[] = [
  {
    id: '1',
    codigo: 'PAT-001',
    nome: 'Sede Administrativa',
    descricao: 'Imóvel comercial - sede da empresa',
    categoria: 'imovel',
    status: 'ativo',
    valorAquisicao: 1500000,
    dataAquisicao: '2018-06-15',
    valorAtual: 1800000,
    depreciacao: 0,
    localizacao: 'Av. Paulista, 1000 - São Paulo',
    responsavel: 'Carlos Silva',
    observacoes: 'Imóvel próprio, escriturado',
  },
  {
    id: '2',
    codigo: 'PAT-002',
    nome: 'Veículo Fiorino',
    descricao: 'Veículo utilitário para entregas',
    categoria: 'veiculo',
    status: 'ativo',
    valorAquisicao: 85000,
    dataAquisicao: '2022-03-10',
    valorAtual: 68000,
    depreciacao: 20,
    localizacao: 'Garagem sede',
    responsavel: 'Roberto Lima',
    notaFiscal: 'NF-2022-0451',
  },
  {
    id: '3',
    codigo: 'PAT-003',
    nome: 'Mobiliário Escritório',
    descricao: 'Conjunto de mesas e cadeiras executivas',
    categoria: 'mobiliario',
    status: 'ativo',
    valorAquisicao: 45000,
    dataAquisicao: '2021-01-20',
    valorAtual: 36000,
    depreciacao: 20,
    localizacao: 'Sede - todos os andares',
    responsavel: 'Marina Costa',
    notaFiscal: 'NF-2021-0089',
  },
  {
    id: '4',
    codigo: 'PAT-004',
    nome: 'Software ERP',
    descricao: 'Licença perpétua sistema ERP',
    categoria: 'software',
    status: 'ativo',
    valorAquisicao: 120000,
    dataAquisicao: '2020-08-01',
    valorAtual: 72000,
    depreciacao: 40,
    localizacao: 'N/A',
    responsavel: 'Carlos Silva',
    notaFiscal: 'NF-2020-1234',
  },
]

// ==================== MANUTENÇÕES ====================
export const manutencoes: Manutencao[] = [
  {
    id: '1',
    equipamentoId: '1',
    tipo: 'preventiva',
    status: 'concluida',
    prioridade: 'media',
    descricao: 'Manutenção preventiva semestral - limpeza e verificação',
    dataAgendada: '2024-06-15',
    dataInicio: '2024-06-15',
    dataConclusao: '2024-06-15',
    tecnico: 'José Técnico',
    custo: 450,
    pecas: [],
    observacoes: 'Equipamento em perfeitas condições',
  },
  {
    id: '2',
    equipamentoId: '5',
    tipo: 'corretiva',
    status: 'em_andamento',
    prioridade: 'alta',
    descricao: 'Troca de baterias do nobreak',
    dataAgendada: '2024-07-01',
    dataInicio: '2024-07-01',
    tecnico: 'Pedro Manutenção',
    custo: 2800,
    pecas: [
      { nome: 'Bateria 12V 7Ah', quantidade: 8, valorUnitario: 280 },
    ],
    observacoes: 'Aguardando chegada das baterias',
  },
  {
    id: '3',
    equipamentoId: '2',
    tipo: 'preventiva',
    status: 'agendada',
    prioridade: 'baixa',
    descricao: 'Manutenção preventiva - limpeza e atualização',
    dataAgendada: '2024-08-10',
    tecnico: 'José Técnico',
    custo: 300,
    pecas: [],
  },
  {
    id: '4',
    equipamentoId: '3',
    tipo: 'upgrade',
    status: 'agendada',
    prioridade: 'media',
    descricao: 'Upgrade de memória RAM',
    dataAgendada: '2024-08-15',
    tecnico: 'Pedro Manutenção',
    custo: 1200,
    pecas: [
      { nome: 'Memória RAM DDR4 16GB', quantidade: 2, valorUnitario: 450 },
    ],
  },
]

// ==================== LANÇAMENTOS FINANCEIROS ====================
export const lancamentos: Lancamento[] = [
  // Receitas
  { id: '1', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-001 - Janeiro', valor: 2500, dataLancamento: '2024-01-08', dataCompetencia: '2024-01-01', status: 'confirmado', contratoId: '1', clienteId: '1' },
  { id: '2', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-001 - Fevereiro', valor: 2500, dataLancamento: '2024-02-10', dataCompetencia: '2024-02-01', status: 'confirmado', contratoId: '1', clienteId: '1' },
  { id: '3', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-001 - Março', valor: 2500, dataLancamento: '2024-03-12', dataCompetencia: '2024-03-01', status: 'confirmado', contratoId: '1', clienteId: '1' },
  { id: '4', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-001 - Abril', valor: 2500, dataLancamento: '2024-04-09', dataCompetencia: '2024-04-01', status: 'confirmado', contratoId: '1', clienteId: '1' },
  { id: '5', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-001 - Maio', valor: 2500, dataLancamento: '2024-05-10', dataCompetencia: '2024-05-01', status: 'confirmado', contratoId: '1', clienteId: '1' },
  { id: '6', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-001 - Junho', valor: 2500, dataLancamento: '2024-06-08', dataCompetencia: '2024-06-01', status: 'confirmado', contratoId: '1', clienteId: '1' },
  { id: '7', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-002 - Fevereiro', valor: 4500, dataLancamento: '2024-02-14', dataCompetencia: '2024-02-01', status: 'confirmado', contratoId: '2', clienteId: '2' },
  { id: '8', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-002 - Março', valor: 4500, dataLancamento: '2024-03-15', dataCompetencia: '2024-03-01', status: 'confirmado', contratoId: '2', clienteId: '2' },
  { id: '9', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-002 - Abril', valor: 4500, dataLancamento: '2024-04-18', dataCompetencia: '2024-04-01', status: 'confirmado', contratoId: '2', clienteId: '2' },
  { id: '10', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-002 - Maio', valor: 4500, dataLancamento: '2024-05-15', dataCompetencia: '2024-05-01', status: 'confirmado', contratoId: '2', clienteId: '2' },
  { id: '11', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-002 - Junho', valor: 4500, dataLancamento: '2024-06-14', dataCompetencia: '2024-06-01', status: 'confirmado', contratoId: '2', clienteId: '2' },
  { id: '12', tipo: 'receita', categoria: 'servico', descricao: 'Manutenção CT-2024-003 - Março', valor: 1200, dataLancamento: '2024-03-05', dataCompetencia: '2024-03-01', status: 'confirmado', contratoId: '3', clienteId: '3' },
  { id: '13', tipo: 'receita', categoria: 'servico', descricao: 'Manutenção CT-2024-003 - Abril', valor: 1200, dataLancamento: '2024-04-04', dataCompetencia: '2024-04-01', status: 'confirmado', contratoId: '3', clienteId: '3' },
  { id: '14', tipo: 'receita', categoria: 'servico', descricao: 'Manutenção CT-2024-003 - Maio', valor: 1200, dataLancamento: '2024-05-06', dataCompetencia: '2024-05-01', status: 'confirmado', contratoId: '3', clienteId: '3' },
  { id: '15', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-004 - Fevereiro', valor: 3200, dataLancamento: '2024-02-15', dataCompetencia: '2024-02-01', status: 'confirmado', contratoId: '4', clienteId: '4' },
  { id: '16', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-004 - Março', valor: 3200, dataLancamento: '2024-03-14', dataCompetencia: '2024-03-01', status: 'confirmado', contratoId: '4', clienteId: '4' },
  { id: '17', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-004 - Abril', valor: 3200, dataLancamento: '2024-04-15', dataCompetencia: '2024-04-01', status: 'confirmado', contratoId: '4', clienteId: '4' },
  { id: '18', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-004 - Maio', valor: 3200, dataLancamento: '2024-05-17', dataCompetencia: '2024-05-01', status: 'confirmado', contratoId: '4', clienteId: '4' },
  { id: '19', tipo: 'receita', categoria: 'locacao', descricao: 'Locação CT-2024-004 - Junho', valor: 3200, dataLancamento: '2024-06-15', dataCompetencia: '2024-06-01', status: 'confirmado', contratoId: '4', clienteId: '4' },
  // Despesas
  { id: '20', tipo: 'despesa', categoria: 'salario', descricao: 'Folha de pagamento - Janeiro', valor: 28000, dataLancamento: '2024-01-05', dataCompetencia: '2024-01-01', status: 'confirmado' },
  { id: '21', tipo: 'despesa', categoria: 'salario', descricao: 'Folha de pagamento - Fevereiro', valor: 28000, dataLancamento: '2024-02-05', dataCompetencia: '2024-02-01', status: 'confirmado' },
  { id: '22', tipo: 'despesa', categoria: 'salario', descricao: 'Folha de pagamento - Março', valor: 28000, dataLancamento: '2024-03-05', dataCompetencia: '2024-03-01', status: 'confirmado' },
  { id: '23', tipo: 'despesa', categoria: 'salario', descricao: 'Folha de pagamento - Abril', valor: 28000, dataLancamento: '2024-04-05', dataCompetencia: '2024-04-01', status: 'confirmado' },
  { id: '24', tipo: 'despesa', categoria: 'salario', descricao: 'Folha de pagamento - Maio', valor: 28000, dataLancamento: '2024-05-05', dataCompetencia: '2024-05-01', status: 'confirmado' },
  { id: '25', tipo: 'despesa', categoria: 'salario', descricao: 'Folha de pagamento - Junho', valor: 28000, dataLancamento: '2024-06-05', dataCompetencia: '2024-06-01', status: 'confirmado' },
  { id: '26', tipo: 'despesa', categoria: 'aluguel', descricao: 'Aluguel depósito - Janeiro', valor: 3500, dataLancamento: '2024-01-10', dataCompetencia: '2024-01-01', status: 'confirmado' },
  { id: '27', tipo: 'despesa', categoria: 'aluguel', descricao: 'Aluguel depósito - Fevereiro', valor: 3500, dataLancamento: '2024-02-10', dataCompetencia: '2024-02-01', status: 'confirmado' },
  { id: '28', tipo: 'despesa', categoria: 'aluguel', descricao: 'Aluguel depósito - Março', valor: 3500, dataLancamento: '2024-03-10', dataCompetencia: '2024-03-01', status: 'confirmado' },
  { id: '29', tipo: 'despesa', categoria: 'aluguel', descricao: 'Aluguel depósito - Abril', valor: 3500, dataLancamento: '2024-04-10', dataCompetencia: '2024-04-01', status: 'confirmado' },
  { id: '30', tipo: 'despesa', categoria: 'aluguel', descricao: 'Aluguel depósito - Maio', valor: 3500, dataLancamento: '2024-05-10', dataCompetencia: '2024-05-01', status: 'confirmado' },
  { id: '31', tipo: 'despesa', categoria: 'aluguel', descricao: 'Aluguel depósito - Junho', valor: 3500, dataLancamento: '2024-06-10', dataCompetencia: '2024-06-01', status: 'confirmado' },
  { id: '32', tipo: 'despesa', categoria: 'energia', descricao: 'Energia elétrica - Janeiro', valor: 1800, dataLancamento: '2024-01-15', dataCompetencia: '2024-01-01', status: 'confirmado' },
  { id: '33', tipo: 'despesa', categoria: 'energia', descricao: 'Energia elétrica - Fevereiro', valor: 1950, dataLancamento: '2024-02-15', dataCompetencia: '2024-02-01', status: 'confirmado' },
  { id: '34', tipo: 'despesa', categoria: 'energia', descricao: 'Energia elétrica - Março', valor: 1720, dataLancamento: '2024-03-15', dataCompetencia: '2024-03-01', status: 'confirmado' },
  { id: '35', tipo: 'despesa', categoria: 'energia', descricao: 'Energia elétrica - Abril', valor: 1680, dataLancamento: '2024-04-15', dataCompetencia: '2024-04-01', status: 'confirmado' },
  { id: '36', tipo: 'despesa', categoria: 'energia', descricao: 'Energia elétrica - Maio', valor: 1890, dataLancamento: '2024-05-15', dataCompetencia: '2024-05-01', status: 'confirmado' },
  { id: '37', tipo: 'despesa', categoria: 'energia', descricao: 'Energia elétrica - Junho', valor: 2100, dataLancamento: '2024-06-15', dataCompetencia: '2024-06-01', status: 'confirmado' },
  { id: '38', tipo: 'despesa', categoria: 'internet', descricao: 'Internet fibra - Mensal', valor: 450, dataLancamento: '2024-01-20', dataCompetencia: '2024-01-01', status: 'confirmado' },
  { id: '39', tipo: 'despesa', categoria: 'internet', descricao: 'Internet fibra - Mensal', valor: 450, dataLancamento: '2024-02-20', dataCompetencia: '2024-02-01', status: 'confirmado' },
  { id: '40', tipo: 'despesa', categoria: 'internet', descricao: 'Internet fibra - Mensal', valor: 450, dataLancamento: '2024-03-20', dataCompetencia: '2024-03-01', status: 'confirmado' },
  { id: '41', tipo: 'despesa', categoria: 'internet', descricao: 'Internet fibra - Mensal', valor: 450, dataLancamento: '2024-04-20', dataCompetencia: '2024-04-01', status: 'confirmado' },
  { id: '42', tipo: 'despesa', categoria: 'internet', descricao: 'Internet fibra - Mensal', valor: 450, dataLancamento: '2024-05-20', dataCompetencia: '2024-05-01', status: 'confirmado' },
  { id: '43', tipo: 'despesa', categoria: 'internet', descricao: 'Internet fibra - Mensal', valor: 450, dataLancamento: '2024-06-20', dataCompetencia: '2024-06-01', status: 'confirmado' },
  { id: '44', tipo: 'despesa', categoria: 'imposto', descricao: 'Impostos - 1º Trimestre', valor: 8500, dataLancamento: '2024-04-15', dataCompetencia: '2024-04-01', status: 'confirmado' },
  { id: '45', tipo: 'despesa', categoria: 'manutencao', descricao: 'Manutenção preventiva equipamentos', valor: 450, dataLancamento: '2024-06-15', dataCompetencia: '2024-06-01', status: 'confirmado' },
  { id: '46', tipo: 'despesa', categoria: 'manutencao', descricao: 'Troca baterias nobreak', valor: 2800, dataLancamento: '2024-07-01', dataCompetencia: '2024-07-01', status: 'pendente' },
]

// ==================== DOCUMENTOS ====================
export const documentos: Documento[] = [
  { id: '1', nome: 'Contrato CT-2024-001', tipo: 'contrato', arquivo: '/docs/ct-2024-001.pdf', tamanho: 245000, dataUpload: '2023-12-15', uploadPor: 'Carlos Silva', entidadeId: '1', entidadeTipo: 'contrato' },
  { id: '2', nome: 'NF Servidor Dell', tipo: 'nota_fiscal', arquivo: '/docs/nf-dell-001.pdf', tamanho: 128000, dataUpload: '2023-01-15', uploadPor: 'Marina Costa', entidadeId: '1', entidadeTipo: 'equipamento' },
  { id: '3', nome: 'Contrato CT-2024-002', tipo: 'contrato', arquivo: '/docs/ct-2024-002.pdf', tamanho: 312000, dataUpload: '2024-01-20', uploadPor: 'Carlos Silva', entidadeId: '2', entidadeTipo: 'contrato' },
  { id: '4', nome: 'Laudo Técnico Manutenção', tipo: 'laudo', arquivo: '/docs/laudo-001.pdf', tamanho: 89000, dataUpload: '2024-06-15', uploadPor: 'José Técnico', entidadeId: '1', entidadeTipo: 'manutencao' },
]

// ==================== MÉTRICAS DO DASHBOARD ====================
export const dashboardMetrics: DashboardMetrics = {
  receitaMensal: 13900,
  receitaMensalVariacao: 8.5,
  despesaMensal: 36300,
  despesaMensalVariacao: -2.3,
  lucroMensal: -22400,
  lucroMensalVariacao: -15.2,
  contratosAtivos: 4,
  contratosAtivosVariacao: 0,
  equipamentosLocados: 5,
  equipamentosLocadosVariacao: 25,
  clientesAtivos: 5,
  clientesAtivosVariacao: 0,
  parcelasVencidas: 2,
  parcelasVencer30Dias: 5,
  manutencoesPendentes: 2,
  taxaInadimplencia: 8.3,
}

// ==================== NOTIFICAÇÕES ====================
export const notificacoes: Notificacao[] = [
  { id: '1', tipo: 'alerta', titulo: 'Parcela vencida', mensagem: 'CT-2024-001 parcela 7 venceu há 5 dias', lida: false, data: '2024-07-15', link: '/parcelas' },
  { id: '2', tipo: 'alerta', titulo: 'Parcela vencida', mensagem: 'CT-2024-003 parcela 4 venceu há 10 dias', lida: false, data: '2024-07-15', link: '/parcelas' },
  { id: '3', tipo: 'info', titulo: 'Manutenção agendada', mensagem: 'Workstation HP Z8 - manutenção preventiva em 10/08', lida: false, data: '2024-07-14', link: '/manutencoes' },
  { id: '4', tipo: 'info', titulo: 'Contrato próximo ao fim', mensagem: 'CT-2024-001 encerra em 31/12/2024', lida: true, data: '2024-07-10', link: '/contratos/1' },
  { id: '5', tipo: 'sucesso', titulo: 'Pagamento confirmado', mensagem: 'CT-2024-002 parcela 5 paga em 14/06', lida: true, data: '2024-06-14', link: '/parcelas' },
]

// ==================== DADOS PARA GRÁFICOS ====================
export const notifications = notificacoes.map((notificacao) => ({
  ...notificacao,
  title: notificacao.titulo,
  message: notificacao.mensagem,
  read: notificacao.lida,
  time: notificacao.data,
}))

export const receitaMensalChart = [
  { name: 'Jan', receita: 2500, despesa: 33750 },
  { name: 'Fev', receita: 10200, despesa: 33900 },
  { name: 'Mar', receita: 11400, despesa: 33670 },
  { name: 'Abr', receita: 10200, despesa: 42130 },
  { name: 'Mai', receita: 11400, despesa: 33790 },
  { name: 'Jun', receita: 13900, despesa: 36300 },
]

export const receitaPorCategoriaChart = [
  { name: 'Locação', value: 72000, fill: 'var(--chart-1)' },
  { name: 'Manutenção', value: 3600, fill: 'var(--chart-2)' },
  { name: 'Venda', value: 0, fill: 'var(--chart-3)' },
  { name: 'Suporte', value: 0, fill: 'var(--chart-4)' },
]

export const equipamentosPorStatusChart = [
  { name: 'Locados', value: 5, fill: 'var(--chart-1)' },
  { name: 'Disponíveis', value: 2, fill: 'var(--chart-2)' },
  { name: 'Manutenção', value: 1, fill: 'var(--chart-3)' },
]

export const inadimplenciaChart = [
  { name: 'Jan', taxa: 0 },
  { name: 'Fev', taxa: 0 },
  { name: 'Mar', taxa: 0 },
  { name: 'Abr', taxa: 0 },
  { name: 'Mai', taxa: 0 },
  { name: 'Jun', taxa: 8.3 },
]

// ==================== DADOS PARA O DASHBOARD ====================
export const revenueData = [
  { month: 'Jan', revenue: 42000, target: 45000 },
  { month: 'Fev', revenue: 48000, target: 45000 },
  { month: 'Mar', revenue: 51000, target: 50000 },
  { month: 'Abr', revenue: 55000, target: 50000 },
  { month: 'Mai', revenue: 53000, target: 55000 },
  { month: 'Jun', revenue: 62000, target: 55000 },
  { month: 'Jul', revenue: 58000, target: 60000 },
  { month: 'Ago', revenue: 67000, target: 60000 },
  { month: 'Set', revenue: 72000, target: 65000 },
  { month: 'Out', revenue: 78000, target: 70000 },
  { month: 'Nov', revenue: 82000, target: 75000 },
  { month: 'Dez', revenue: 89500, target: 80000 },
]

export const contractsByStatus = [
  { name: 'Ativos', value: 24 },
  { name: 'Pendentes', value: 8 },
  { name: 'Em Renovação', value: 5 },
  { name: 'Encerrados', value: 3 },
]

export const recentActivities = [
  { id: '1', type: 'payment' as const, title: 'Pagamento recebido', description: 'Fribal - CT-2024-001 parcela 7', time: '2 min', status: 'success' as const },
  { id: '2', type: 'contract' as const, title: 'Contrato renovado', description: 'Estacio Itapipoca - CT-2024-002 renovado por 12 meses', time: '1h', status: 'success' as const },
  { id: '3', type: 'maintenance' as const, title: 'Manutenção agendada', description: 'Servidor Dell PowerEdge - preventiva', time: '3h', status: 'warning' as const },
  { id: '4', type: 'client' as const, title: 'Novo cliente', description: 'Rio de Janeiro cadastrado', time: '5h', status: 'info' as const },
  { id: '5', type: 'payment' as const, title: 'Pagamento atrasado', description: 'Fortaleza Iguatemi - CT-2024-003 parcela 4', time: '1d', status: 'error' as const },
]

export const upcomingPayments = [
  { id: '1', client: 'Fribal', amount: 2500, dueDate: '10/07', status: 'pending' as const },
  { id: '2', client: 'Estacio Itapipoca', amount: 4500, dueDate: '15/07', status: 'pending' as const },
  { id: '3', client: 'Rio de Janeiro', amount: 3200, dueDate: '15/07', status: 'pending' as const },
  { id: '4', client: 'Fortaleza Iguatemi', amount: 1200, dueDate: '05/07', status: 'overdue' as const },
  { id: '5', client: 'Intech', amount: 850, dueDate: '01/08', status: 'pending' as const },
]

export const clients = clientes.map((cliente) => ({
  ...cliente,
  name: cliente.nomeFantasia,
  companyName: cliente.razaoSocial,
  document: cliente.cnpj,
  phone: cliente.telefone,
  segment: cliente.segmento,
  type: 'pj',
  address: `${cliente.endereco.logradouro}, ${cliente.endereco.numero} - ${cliente.endereco.cidade}/${cliente.endereco.estado}`,
  status: cliente.ativo ? 'active' : 'inactive',
  contractsCount: contratos.filter((contrato) => contrato.clienteId === cliente.id).length,
  monthlyRevenue: contratos
    .filter((contrato) => contrato.clienteId === cliente.id && contrato.status === 'ativo')
    .reduce((sum, contrato) => sum + contrato.valorMensal, 0),
}))

export const contracts = contratos.map((contrato) => ({
  ...contrato,
  number: contrato.numero,
  client: clientes.find((cliente) => cliente.id === contrato.clienteId)?.nomeFantasia ?? contrato.clienteId,
  clientName: clientes.find((cliente) => cliente.id === contrato.clienteId)?.nomeFantasia ?? contrato.clienteId,
  type: contrato.tipo,
  status:
    contrato.status === 'ativo'
      ? 'active'
      : contrato.status === 'pendente'
        ? 'pending'
        : contrato.status === 'encerrado'
          ? 'completed'
          : contrato.status,
  startDate: contrato.dataInicio,
  endDate: contrato.dataFim ?? contrato.dataInicio,
  monthlyValue: contrato.valorMensal,
  totalValue: contrato.valorTotal,
  description: contrato.descricao,
}))

export const equipments = equipamentos.map((equipamento) => ({
  ...equipamento,
  name: equipamento.nome,
  code: equipamento.codigo,
  description: equipamento.descricao,
  type: equipamento.categoria,
  brand: equipamento.marca,
  model: equipamento.modelo,
  serialNumber: equipamento.numeroSerie,
  clientName: equipamento.clienteAtual
    ? clientes.find((cliente) => cliente.id === equipamento.clienteAtual)?.nomeFantasia ?? equipamento.clienteAtual
    : 'Estoque',
  location: equipamento.clienteAtual
    ? clientes.find((cliente) => cliente.id === equipamento.clienteAtual)?.nomeFantasia ?? 'Cliente'
    : 'Estoque',
  contractNumber: equipamento.contratoAtual
    ? contratos.find((contrato) => contrato.id === equipamento.contratoAtual)?.numero ?? equipamento.contratoAtual
    : 'Sem contrato',
  value: equipamento.valorCompra,
  rentalValue: equipamento.valorLocacao,
  purchaseDate: equipamento.dataCompra,
  warrantyUntil: equipamento.garantiaAte,
  status:
    equipamento.status === 'disponivel'
      ? 'available'
      : equipamento.status === 'locado'
        ? 'active'
        : equipamento.status === 'em_manutencao'
          ? 'maintenance'
          : equipamento.status,
}))

export const maintenances = manutencoes.map((manutencao) => ({
  ...manutencao,
  equipment: equipamentos.find((equipamento) => equipamento.id === manutencao.equipamentoId)?.nome ?? manutencao.equipamentoId,
  equipmentName: equipamentos.find((equipamento) => equipamento.id === manutencao.equipamentoId)?.nome ?? manutencao.equipamentoId,
  clientName: equipamentos.find((equipamento) => equipamento.id === manutencao.equipamentoId)?.clienteAtual
    ? clientes.find((cliente) => cliente.id === equipamentos.find((equipamento) => equipamento.id === manutencao.equipamentoId)?.clienteAtual)?.nomeFantasia ?? 'Cliente'
    : 'Estoque',
  ticketNumber: `MAN-${manutencao.id.padStart(4, '0')}`,
  type: manutencao.tipo,
  status:
    manutencao.status === 'agendada'
      ? 'open'
      : manutencao.status === 'em_andamento'
        ? 'in_progress'
        : manutencao.status === 'concluida'
          ? 'completed'
          : manutencao.status,
  priority:
    manutencao.prioridade === 'alta' || manutencao.prioridade === 'critica'
      ? 'high'
      : manutencao.prioridade === 'media'
        ? 'medium'
        : 'low',
  description: manutencao.descricao,
  scheduledDate: manutencao.dataAgendada,
  startDate: manutencao.dataInicio,
  completedDate: manutencao.dataConclusao,
  technician: manutencao.tecnico,
  cost: manutencao.custo,
}))

export const partners = socios.map((socio) => ({
  ...socio,
  name: socio.nome,
  document: socio.cpf,
  phone: socio.telefone,
  share: socio.participacao,
  entryDate: socio.dataEntrada,
  status: socio.ativo ? 'active' : 'inactive',
  capitalValue: socio.participacao * 10000,
  monthlyDistribution: socio.participacao * 500,
}))

export const assets = patrimonios.map((patrimonio) => ({
  ...patrimonio,
  name: patrimonio.nome,
  code: patrimonio.codigo,
  description: patrimonio.descricao,
  acquisitionValue: patrimonio.valorAquisicao,
  currentValue: patrimonio.valorAtual,
  acquisitionDate: patrimonio.dataAquisicao,
  location: patrimonio.localizacao,
  responsible: patrimonio.responsavel,
  status: patrimonio.status === 'em_manutencao' ? 'maintenance' : patrimonio.status,
}))

export const transactions = lancamentos.map((lancamento) => ({
  ...lancamento,
  type: lancamento.tipo === 'receita' ? 'income' : 'expense',
  category: lancamento.categoria,
  description: lancamento.descricao,
  amount: lancamento.valor,
  date: lancamento.dataLancamento,
  status:
    lancamento.status === 'confirmado'
      ? 'completed'
      : lancamento.status === 'pendente'
        ? 'pending'
        : 'cancelled',
}))

export const cashFlowData = receitaMensalChart.map((item, index) => ({
  date: item.name,
  balance: receitaMensalChart
    .slice(0, index + 1)
    .reduce((sum, current) => sum + current.receita - current.despesa, 0),
}))

export const dreData = {
  receitas: receitaPorCategoriaChart.map((item) => ({ name: item.name, value: item.value })),
  custos: [
    { name: 'Equipamentos', value: 136000 },
    { name: 'Manutencao', value: 42000 },
  ],
  despesas: [
    { name: 'Salarios', value: 168000 },
    { name: 'Aluguel', value: 21000 },
    { name: 'Energia', value: 11340 },
    { name: 'Internet', value: 2700 },
    { name: 'Impostos', value: 8500 },
  ],
}

export const dreCategories = [
  ...dreData.receitas,
  ...dreData.custos,
  ...dreData.despesas,
]
