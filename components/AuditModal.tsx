
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, History, ArrowRight, User, Clock, Tag, Trash2 } from 'lucide-react';
import { AuditRecord } from '../types';
import { formatCurrency } from '../utils/normalization';
import { BRANDING } from '../config/branding';

interface AuditModalProps {
  despesaId: string;
  descricaoOriginal: string;
  onClose: () => void;
}

const AuditModal: React.FC<AuditModalProps> = ({ despesaId, descricaoOriginal, onClose }) => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('despesas_audit')
          .select('*')
          .eq('despesa_id', despesaId)
          .order('changed_at', { ascending: false });

        if (error) throw error;
        setRecords(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar auditoria:', err);
        alert('Não foi possível carregar o histórico de alterações.');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [despesaId]);

  const renderDiff = (oldData: any, newData: any, field: string, label: string, isCurrency = false) => {
    const oldVal = oldData ? oldData[field] : null;
    const newVal = newData ? newData[field] : null;

    if (oldVal === newVal) return null;

    return (
      <div className="grid grid-cols-12 gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
        <div className="col-span-3 font-bold text-gray-400 uppercase tracking-tighter">{label}</div>
        <div className="col-span-4 text-gray-500 truncate line-through decoration-red-300">
          {isCurrency ? formatCurrency(oldVal || 0) : oldVal || '-'}
        </div>
        <div className="col-span-1 flex justify-center text-gray-300">
          <ArrowRight size={12} />
        </div>
        <div className="col-span-4 text-gray-800 font-medium truncate">
          {isCurrency ? formatCurrency(newVal || 0) : newVal || '-'}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] p-0 sm:p-4 overflow-hidden">
      <div className="mobile-modal bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">Histórico de Alterações</h3>
              <p className="text-xs text-gray-500 font-medium truncate max-w-[300px]">{descricaoOriginal}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mobile-modal-content flex-1 p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium">Buscando registros...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <History size={32} className="text-gray-200" />
              </div>
              <p className="font-medium italic">Nenhum histórico disponível para este registro.</p>
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="relative pl-8 border-l-2 border-gray-100 pb-2 last:pb-0">
                {/* Dot indicator */}
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                  record.action === 'INSERT' ? 'bg-green-500' : 
                  record.action === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                        record.action === 'INSERT' ? 'bg-green-100 text-green-700' : 
                        record.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {record.action === 'INSERT' ? 'Criação' : 
                         record.action === 'UPDATE' ? 'Edição' : 'Exclusão'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Clock size={14} />
                        {new Date(record.changed_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold bg-gray-50 px-3 py-1 rounded-full">
                      <User size={14} className="text-gray-400" />
                      {record.changed_by || 'Sistema'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {record.action === 'UPDATE' ? (
                      <>
                        {renderDiff(record.old_data, record.new_data, 'descricao_original', 'Descrição')}
                        {renderDiff(record.old_data, record.new_data, 'quantidade', 'Qtd')}
                        {renderDiff(record.old_data, record.new_data, 'valor_unitario', 'V. Unit', true)}
                        {renderDiff(record.old_data, record.new_data, 'valor', 'Total', true)}
                        {renderDiff(record.old_data, record.new_data, 'categoria_id', 'Categoria')}
                        {renderDiff(record.old_data, record.new_data, 'observacao', 'Obs')}
                      </>
                    ) : record.action === 'INSERT' ? (
                      <div className="text-xs text-gray-600 bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                        <p className="font-bold mb-1 flex items-center gap-1"><Tag size={12} className="text-green-500" /> Dados Iniciais:</p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <li><span className="text-gray-400">Desc:</span> {record.new_data?.descricao_original}</li>
                          <li><span className="text-gray-400">Valor:</span> {formatCurrency(record.new_data?.valor || 0)}</li>
                          <li><span className="text-gray-400">Qtd:</span> {record.new_data?.quantidade}</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                        <p className="font-bold mb-1 flex items-center gap-1 text-red-700"><Trash2 size={12} /> Dados Removidos:</p>
                        <p className="italic">O registro de <span className="font-black">"{record.old_data?.descricao_original}"</span> no valor de {formatCurrency(record.old_data?.valor || 0)} foi removido permanentemente.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50/50 flex flex-col gap-1 items-center">
          <p className="text-[10px] text-gray-400 font-medium">Sistema {BRANDING.appName}</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm shadow-sm"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditModal;
