
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X } from 'lucide-react';

interface SectorModalProps {
  onClose: () => void;
  onSuccess: (newSectorId: string) => void;
}

const SectorModal: React.FC<SectorModalProps> = ({ onClose, onSuccess }) => {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Usuário não autenticado.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('setores')
      .insert([{ 
        nome: nome.trim(),
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      alert(`Erro ao salvar setor: ${error.message}`);
      console.error(error);
    } else {
      onSuccess(data.id);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 overflow-hidden">
      <div className="mobile-modal bg-white rounded-t-3xl sm:rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Novo Setor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mobile-modal-content p-4 sm:p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Setor</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mobile-form-control px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Ex: Loteamento Alvorada"
              autoFocus
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Cadastrar Setor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SectorModal;
