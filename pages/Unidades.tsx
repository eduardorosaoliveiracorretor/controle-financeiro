
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Casa, Setor } from '../types';
import { Plus, Search, MapPin, Calendar, CheckCircle, ChevronRight, Home, Settings2, Loader2, X, CheckCircle2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectorModal from '../components/SectorModal';
import { formatCurrency } from '../utils/normalization';

const Unidades: React.FC = () => {
  const navigate = useNavigate();
  const [casas, setCasas] = useState<Casa[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  
  // Status edit state
  const [statusEditingCasa, setStatusEditingCasa] = useState<Casa | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [casaToDelete, setCasaToDelete] = useState<Casa | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nome_casa: '',
    setor_id: '',
    orcamento_previsto: '',
    data_inicio_obra: '',
    status: 'Planejamento'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [casasRes, setoresRes] = await Promise.all([
      supabase.from('casas').select('*, setores(*)').order('data_criacao', { ascending: false }),
      supabase.from('setores').select('*').order('nome')
    ]);

    if (casasRes.error) console.error(casasRes.error);
    if (setoresRes.error) console.error(setoresRes.error);

    setCasas(casasRes.data || []);
    setSetores(setoresRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Você precisa estar logado.');
      return;
    }

    const { error } = await supabase.from('casas').insert([{
      user_id: user.id,
      nome_casa: formData.nome_casa,
      setor_id: formData.setor_id,
      orcamento_previsto: parseFloat(formData.orcamento_previsto),
      data_inicio_obra: formData.data_inicio_obra,
      status: formData.status
    }]);

    if (error) {
      alert(`Erro ao cadastrar unidade: ${error.message}`);
    } else {
      setShowModal(false);
      fetchData();
      setFormData({ nome_casa: '', setor_id: '', orcamento_previsto: '', data_inicio_obra: '', status: 'Planejamento' });
    }
  };

  const handleUpdateStatus = async (casa: Casa, novoStatus: Casa['status']) => {
    setStatusLoading(true);
    const { error } = await supabase
      .from('casas')
      .update({ status: novoStatus })
      .eq('id', casa.id);

    if (error) {
      alert(`Erro ao atualizar status: ${error.message}`);
    } else {
      setCasas(casas.map(c => c.id === casa.id ? { ...c, status: novoStatus } : c));
      setStatusEditingCasa(null);
    }
    setStatusLoading(false);
  };


  const handleDeleteCasa = async () => {
    if (!casaToDelete || deleteLoading) return;

    setDeleteLoading(true);
    const { error } = await supabase
      .from('casas')
      .delete()
      .eq('id', casaToDelete.id);

    if (error) {
      alert(`Erro ao excluir unidade: ${error.message}`);
      setDeleteLoading(false);
      return;
    }

    setCasas((prev) => prev.filter((c) => c.id !== casaToDelete.id));
    setCasaToDelete(null);
    setDeleteLoading(false);
  };

  const handleNewSectorSuccess = (id: string) => {
    supabase.from('setores').select('*').order('nome').then(({ data }) => {
      setSetores(data || []);
      setFormData(prev => ({ ...prev, setor_id: id }));
    });
  };

  const getStatusBadgeClass = (status: Casa['status']) => {
    switch (status) {
      case 'Planejamento': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Em Obra': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Pausada': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Finalizado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Vendido': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Unidades</h2>
          <p className="text-gray-500">Gerencie seu portfólio de imóveis e obras.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nova Unidade
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Carregando unidades...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {casas.map((casa) => (
            <div 
              key={casa.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
            >
              <div className="p-6 cursor-pointer" onClick={() => navigate(`/unidade/${casa.id}`)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                    <Home size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusEditingCasa(casa);
                      }}
                      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all hover:scale-105 active:scale-95 ${getStatusBadgeClass(casa.status)}`}
                    >
                      {casa.status}
                      <Settings2 size={10} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCasaToDelete(casa);
                      }}
                      className="p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-all active:scale-95"
                      title="Excluir unidade"
                      aria-label="Excluir unidade"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{casa.nome_casa}</h3>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <MapPin size={14} /> {casa.setores?.nome}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar size={14} /> Início: {new Date(casa.data_inicio_obra).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div 
                className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between cursor-pointer"
                onClick={() => navigate(`/unidade/${casa.id}`)}
              >
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Orçamento</p>
                  <p className="text-sm font-bold text-gray-700">{formatCurrency(casa.orcamento_previsto)}</p>
                </div>
                <div className="text-orange-500 transform group-hover:translate-x-1 transition-transform">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))}
          
          {casas.length === 0 && (
            <div className="col-span-full py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center">
              <p className="text-gray-400">Nenhuma unidade cadastrada ainda.</p>
              <button onClick={() => setShowModal(true)} className="text-orange-500 font-bold mt-2">Clique aqui para começar</button>
            </div>
          )}
        </div>
      )}

      {/* Quick Status Modal */}
      {statusEditingCasa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Alterar Status</h3>
                <p className="text-xs text-gray-500">{statusEditingCasa.nome_casa}</p>
              </div>
              <button onClick={() => setStatusEditingCasa(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3">
              {(['Planejamento', 'Em Obra', 'Pausada', 'Finalizado', 'Vendido'] as Casa['status'][]).map((st) => (
                <button
                  key={st}
                  disabled={statusLoading}
                  onClick={() => handleUpdateStatus(statusEditingCasa, st)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all hover:shadow-md ${
                    statusEditingCasa.status === st 
                      ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getStatusBadgeClass(st).split(' ')[0]}`}></span>
                    {st}
                  </div>
                  {statusEditingCasa.status === st && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
            {statusLoading && (
              <div className="p-4 bg-orange-50 flex items-center justify-center gap-2 text-orange-600 text-sm font-bold animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                Atualizando...
              </div>
            )}
          </div>
        </div>
      )}


      {casaToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[120] p-0 sm:p-4 overflow-hidden">
          <div className="mobile-modal bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-5 mx-auto">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg font-black text-gray-800 text-center mb-2">Excluir unidade?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Esta ação removerá a unidade <span className="font-bold text-gray-800">"{casaToDelete.nome_casa}"</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={deleteLoading}
                onClick={() => setCasaToDelete(null)}
                className="w-full py-3.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleDeleteCasa}
                className="w-full py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[120] p-0 md:p-4 overflow-hidden">
          <div className="mobile-modal bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-[min(94vw,520px)] md:max-w-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="flex items-center justify-between p-4 md:p-6 border-b shrink-0 bg-white">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 truncate">Cadastrar Nova Unidade</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mobile-modal-content p-4 md:p-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 white-space-normal leading-tight">Nome da Unidade / Casa</label>
                  <input
                    type="text"
                    required
                    value={formData.nome_casa}
                    onChange={(e) => setFormData({...formData, nome_casa: e.target.value})}
                    placeholder="Ex: Casa Jardim das Tulipas"
                    className="mobile-form-control px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm md:text-base"
                  />
                </div>

                <div className="md:col-span-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                    <label className="text-sm font-bold text-gray-700 leading-tight">Setor / Localização</label>
                    <button 
                      type="button" 
                      onClick={() => setShowSectorModal(true)}
                      className="text-[10px] md:text-xs text-orange-600 font-bold hover:underline"
                    >
                      + Novo Setor
                    </button>
                  </div>
                  <select
                    required
                    value={formData.setor_id}
                    onChange={(e) => setFormData({...formData, setor_id: e.target.value})}
                    className="mobile-form-control px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm md:text-base"
                  >
                    <option value="">Selecione...</option>
                    {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 white-space-normal leading-tight">Orçamento Previsto (R$)</label>
                  <input
                    type="number"
                    required
                    value={formData.orcamento_previsto}
                    onChange={(e) => setFormData({...formData, orcamento_previsto: e.target.value})}
                    placeholder="0,00"
                    className="mobile-form-control px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm md:text-base"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 white-space-normal leading-tight">Início da Obra</label>
                  <input
                    type="date"
                    required
                    value={formData.data_inicio_obra}
                    onChange={(e) => setFormData({...formData, data_inicio_obra: e.target.value})}
                    className="mobile-form-control px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm md:text-base"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 white-space-normal leading-tight">Status Inicial</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="mobile-form-control px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm md:text-base"
                  >
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em Obra">Em Obra</option>
                    <option value="Pausada">Pausada</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 md:mt-10 flex flex-col md:flex-row gap-3 md:gap-4 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="w-full md:flex-1 px-6 py-3.5 md:py-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm md:text-base order-2 md:order-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="w-full md:flex-1 px-6 py-3.5 md:py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 text-sm md:text-base order-1 md:order-2"
                >
                  Criar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectorModal && (
        <SectorModal 
          onClose={() => setShowSectorModal(false)} 
          onSuccess={handleNewSectorSuccess} 
        />
      )}
    </div>
  );
};

export default Unidades;
