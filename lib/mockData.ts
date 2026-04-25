export const MOCK_CATEGORIAS = [
  { id: '1', nome: 'Alimentação', cor: '#ef4444', ativo: true },
  { id: '2', nome: 'Moradia', cor: '#3b82f6', ativo: true },
  { id: '3', nome: 'Lazer', cor: '#f59e0b', ativo: true },
  { id: '4', nome: 'Transporte', cor: '#10b981', ativo: true },
  { id: '5', nome: 'Saúde', cor: '#8b5cf6', ativo: true },
];

export const MOCK_CONTATOS = [
  { id: '1', nome: 'Supermercado Silva', email: 'contato@silva.com', tipo_predominante: 'SAIDA' },
  { id: '2', nome: 'Imobiliária Central', email: 'aluguel@central.com', tipo_predominante: 'SAIDA' },
  { id: '3', nome: 'Empresa X (Salário)', email: 'rh@empresax.com', tipo_predominante: 'ENTRADA' },
  { id: '4', nome: 'Netflix', email: 'billing@netflix.com', tipo_predominante: 'SAIDA' },
];

export const MOCK_OCORRENCIAS = [
  {
    id: '1',
    nome: 'Salário Mensal',
    valor: 5000,
    natureza: 'ENTRADA',
    data_vencimento: new Date().toISOString(),
    status_pago: true,
    data_pagamento: new Date().toISOString(),
    categoria: MOCK_CATEGORIAS[3],
    contato: MOCK_CONTATOS[2],
  },
  {
    id: '2',
    nome: 'Aluguel',
    valor: 1500,
    natureza: 'SAIDA',
    data_vencimento: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    status_pago: false,
    categoria: MOCK_CATEGORIAS[1],
    contato: MOCK_CONTATOS[1],
  },
  {
    id: '3',
    nome: 'Supermercado',
    valor: 450.50,
    natureza: 'SAIDA',
    data_vencimento: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    status_pago: false,
    categoria: MOCK_CATEGORIAS[0],
    contato: MOCK_CONTATOS[0],
  },
  {
    id: '4',
    nome: 'Venda de Freelance',
    valor: 1200,
    natureza: 'ENTRADA',
    data_vencimento: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString(),
    status_pago: false,
    categoria: MOCK_CATEGORIAS[2],
  },
];
