import { create } from 'zustand';

type ModalTipo = 'BAIXAR' | 'DESBAIXAR' | 'CANCELAR' | 'EXCLUIR_LANCAMENTO' | 'EDITAR_LANCAMENTO' | 'DUPLICAR_LANCAMENTO' | 'CRIAR_LANCAMENTO' | 'CRIAR_CATEGORIA' | 'EDITAR_CATEGORIA' | 'CRIAR_CONTATO' | 'EDITAR_CONTATO' | 'CRIAR_LOCAL_PAGAMENTO' | 'EDITAR_LOCAL_PAGAMENTO' | 'CONFIRMAR_ESCOPO' | 'DETALHES_MES_CONTATO' | 'DETALHES_PAGOS_CONTATO' | 'DETALHES_PENDENTES_CONTATO';

interface Filtros {
  natureza: 'ENTRADA' | 'SAIDA' | 'TODAS';
  status: 'PENDENTE' | 'BAIXADA' | 'ATRASADA' | 'TODAS';
  categoria_id?: string;
  contato_id?: string;
  busca: string;
}

interface UIStore {
  mesAtivo: string; // Formato "YYYY-MM"
  filtrosAtivos: Filtros;
  modalAberto: ModalTipo | null;
  idSelecionado: string | null;
  setMesAtivo: (mes: string) => void;
  setFiltros: (f: Partial<Filtros>) => void;
  abrirModal: (tipo: ModalTipo, id?: string | null) => void;
  fecharModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  mesAtivo: new Date().toISOString().slice(0, 7),
  filtrosAtivos: {
    natureza: 'TODAS',
    status: 'TODAS',
    busca: '',
  },
  modalAberto: null,
  idSelecionado: null,
  setMesAtivo: (mes) => set({ mesAtivo: mes }),
  setFiltros: (f) => set((state) => ({ 
    filtrosAtivos: { ...state.filtrosAtivos, ...f } 
  })),
  abrirModal: (tipo, id = null) => set({ modalAberto: tipo, idSelecionado: id }),
  fecharModal: () => set({ modalAberto: null, idSelecionado: null }),
}));
