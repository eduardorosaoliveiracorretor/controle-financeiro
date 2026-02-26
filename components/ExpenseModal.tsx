
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, AlertCircle, Calculator, Loader2, Info } from 'lucide-react';
import { CategoriaDespesa, Despesa } from '../types';
import { normalizeDescription, formatCurrency } from '../utils/normalization';

interface ExpenseModalProps {
  casaId: string;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  initialData?: Despesa;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ casaId, onClose, onSuccess, mode = 'create', initialData }) => {
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDuplication, setConfirmDuplication] = useState(false);

  const [formData, setFormData] = useState({
    descricao_original: '',
    quantidade: 1,
    valor_unitario: 0,
    observacao: '',
    categoria_id: '',
    nota_fiscal_url: '',
    data_da_compra: new Date().toISOString().slice(0, 10),
    responsavel_id: ''
  });

  const [displayValorUnitario, setDisplayValorUnitario] = useState(formatCurrency(0));

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('categorias_despesa')
        .select('*')
        .order('nome');

      if (error) console.error(error);
      setCategorias(data || []);
    };
    fetchData();

    if (mode === 'edit' && initialData) {
      setFormData({
        descricao_original: initialData.descricao_original,
        quantidade: initialData.quantidade,
        valor_unitario: initialData.valor_unitario,
        observacao: initialData.observacao || '',
        categoria_id: initialData.categoria_id,
        nota_fiscal_url: initialData.nota_fiscal_url || '',
        data_da_compra: initialData.data_da_compra || initialData.data_lancamento?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        responsavel_id: initialData.responsavel_id || initialData.user_id || ''
      });
      setDisplayValorUnitario(formatCurrency(initialData.valor_unitario));
    }
  }, [mode, initialData]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = Number(rawValue) / 100;
    
    setFormData({ ...formData, valor_unitario: numericValue });
    setDisplayValorUnitario(formatCurrency(numericValue));
  };

  const totalValue = formData.quantidade * formData.valor_unitario;
  const isValid = formData.quantidade > 0 && formData.valor_unitario > 0 && formData.descricao_original.trim() !== '' && formData.categoria_id !== '' && formData.data_da_compra !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isValid) return;

    const normalized = normalizeDescription(formData.descricao_original);
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const responsavelId = session?.user?.id;

    if (!responsavelId) {
      alert('Usuário não autenticado.');
      setLoading(false);
      return;
    }

    if (!confirmDuplication) {
      let query = supabase
        .from('despesas')
        .select('id')
        .eq('casa_id', casaId)
        .eq('descricao_normalizada', normalized);

      if (mode === 'edit' && initialData) {
        query = query.neq('id', initialData.id);
      }

      const { data: existing, error: checkError } = await query;

      if (checkError) {
        console.error(checkError);
      } else if (existing && existing.length > 0) {
        setConfirmDuplication(true);
        setLoading(false);
        return;
      }
    }

    const payload = {
      user_id: responsavelId,
      casa_id: casaId,
      categoria_id: formData.categoria_id,
      descricao_original: formData.descricao_original,
      descricao_normalizada: normalized,
      quantidade: formData.quantidade,
      valor_unitario: formData.valor_unitario,
      valor: totalValue,
      observacao: formData.observacao,
      nota_fiscal_url: formData.nota_fiscal_url,
      data_da_compra: formData.data_da_compra,
      responsavel_id: responsavelId,
    };

    let result;
    if (mode === 'edit' && initialData) {
      result = await supabase
        .from('despesas')
        .update(payload)
        .eq('id', initialData.id);
    } else {
      result = await supabase
        .from('despesas')
        .insert([{ ...payload, data_lancamento: new Date().toISOString() }]);
    }

    if (result.error) {
      alert(`Erro ao salvar despesa: ${result.error.message}`);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[120] p-0 sm:p-4 overflow-hidden">
      <div className="mobile-modal bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-black text-gray-800">
              {mode === 'edit' ? 'Editar Registro' : 'Novo Lançamento'}
            </h3>
            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-0.5">Informe os detalhes da despesa</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mobile-modal-content p-4 sm:p-6 space-y-6">
          {confirmDuplication && (
            <div className="p-5 bg-orange-50 border-2 border-orange-200 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-orange-800 font-black text-sm">Item já cadastrado nesta unidade</p>
                  <p className="text-orange-700 text-xs mt-1 leading-relaxed">Já existe uma despesa com esta descrição. Deseja prosseguir?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-100 transition-all active:scale-95"
                >
                  Confirmar Duplicação
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDuplication(false)}
                  className="flex-1 py-3 bg-white border-2 border-orange-200 text-orange-700 rounded-xl text-xs font-black transition-all active:scale-95"
                >
                  Revisar Dados
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Descrição do Material ou Serviço</label>
              <input
                type="text"
                required
                value={formData.descricao_original}
                onChange={(e) => setFormData({ ...formData, descricao_original: e.target.value })}
                className="mobile-form-control px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-bold text-sm transition-all"
                placeholder="Ex: Cimento CP II 50kg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Quantidade / Volume</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 0 })}
                  className="mobile-form-control px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Preço Unitário</label>
                <input
                  type="text"
                  required
                  value={displayValorUnitario}
                  onChange={handleCurrencyChange}
                  className="mobile-form-control px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm transition-all"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Data da Compra</label>
                <input
                  type="date"
                  required
                  value={formData.data_da_compra}
                  onChange={(e) => setFormData({ ...formData, data_da_compra: e.target.value })}
                  className="mobile-form-control px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Responsável</label>
                <input
                  type="text"
                  value="Usuário autenticado"
                  readOnly
                  className="mobile-form-control px-5 py-3.5 bg-gray-100 border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm text-gray-500"
                />
              </div>
            </div>

            <div className="bg-orange-500 p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-orange-100 ring-4 ring-orange-50 border-2 border-orange-400">
              <div className="flex items-center gap-3 text-white">
                <Calculator size={22} className="opacity-80" />
                <span className="font-black text-xs uppercase tracking-widest">Total do Lançamento:</span>
              </div>
              <span className="text-2xl font-black text-white">
                {formatCurrency(totalValue)}
              </span>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Categoria de Despesa</label>
              <select
                required
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                className="mobile-form-control px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm transition-all appearance-none"
              >
                <option value="">Selecione uma categoria...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Nota Fiscal / Comprovante (URL)</label>
              <div className="relative group">
                <input
                  type="url"
                  value={formData.nota_fiscal_url}
                  onChange={(e) => setFormData({ ...formData, nota_fiscal_url: e.target.value })}
                  className="mobile-form-control px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm transition-all"
                  placeholder="https://sua-nuvem.com/nota-fiscal.pdf"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-400">
                  <Info size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Anotações Adicionais (Opcional)</label>
              <textarea
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                className="mobile-form-control px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none resize-none h-28 font-medium text-sm transition-all"
                placeholder="Ex: Material comprado p/ fundação do muro frontal..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 text-gray-500 font-black text-sm hover:bg-gray-100 rounded-2xl transition-all active:scale-95 order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || confirmDuplication || !isValid}
              className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvando...
                </>
              ) : mode === 'edit' ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </div>
          <div className="h-4 sm:hidden"></div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
