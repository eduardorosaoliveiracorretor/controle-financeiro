import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Users, ShieldCheck, UserCircle, Pencil, Trash2,
  Loader2, X, Check, AlertTriangle, UserCog
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

const ROLES = ['master', 'contador'];

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estado do modal de edição
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Estado do modal de exclusão
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar usuários:', error.message);
    } else {
      setUsuarios(data || []);
    }
    setLoading(false);
  };

  const handleEditOpen = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.full_name);
    setEditRole(user.role);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName, role: editRole })
      .eq('id', editingUser.id);

    if (error) {
      alert(`Erro ao salvar: ${error.message}`);
    } else {
      setEditingUser(null);
      fetchUsuarios();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', deletingUser.id);

    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      setDeletingUser(null);
      fetchUsuarios();
    }
    setIsDeleting(false);
  };

  const RoleBadge = ({ role }: { role: string }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
      role === 'master'
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : 'bg-gray-100 text-gray-500 border-gray-200'
    }`}>
      {role === 'master' && <ShieldCheck size={10} />}
      {role || 'sem role'}
    </span>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Gerenciar Usuários</h2>
          <p className="text-sm text-gray-400 mt-1">Gerencie os acessos e permissões do sistema.</p>
        </div>
        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
          <Users size={28} />
        </div>
      </div>

      {/* Info */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
        <UserCog size={18} className="text-orange-500 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 font-medium leading-relaxed">
          Novos usuários se cadastram pela tela de cadastro e aparecem aqui automaticamente. 
          Como <strong>master</strong>, você pode definir o role de cada um e editar ou remover contas.
        </p>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gray-50/30 flex items-center justify-between">
          <h3 className="font-black text-gray-800 text-sm">Usuários Cadastrados</h3>
          <span className="text-[10px] bg-white border border-gray-100 px-3 py-1.5 rounded-full text-gray-600 font-bold uppercase tracking-wider">
            {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium text-sm">Carregando usuários...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="py-20 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
              <Users size={28} className="text-gray-200" />
            </div>
            <p className="text-gray-500 font-bold text-sm">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {usuarios.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-full ${user.role === 'master' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <UserCircle size={22} className={user.role === 'master' ? 'text-orange-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gray-800 text-sm">{user.full_name || 'Sem nome'}</p>
                      {user.id === currentUserId && (
                        <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Você</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <RoleBadge role={user.role} />
                      <span className="text-[10px] text-gray-400 font-medium">
                        Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações — master não pode se auto-excluir */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditOpen(user)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-800 text-lg">Editar Usuário</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{editingUser.full_name}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Nome Completo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-bold text-sm transition-all"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nível de Acesso</label>
                <div className="flex gap-3">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditRole(role)}
                      className={`flex-1 py-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        editRole === role
                          ? role === 'master'
                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100'
                            : 'bg-gray-700 border-gray-700 text-white shadow-lg shadow-gray-100'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {role === 'master' && <ShieldCheck size={13} />}
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3.5 border-2 border-gray-100 rounded-2xl text-gray-500 font-black text-sm hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving || !editName.trim()}
                className="flex-1 py-3.5 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-800 text-center mb-2">Remover Usuário?</h3>
            <p className="text-gray-500 text-sm text-center mb-8 px-2">
              Você está prestes a remover <span className="font-black text-gray-800">"{deletingUser.full_name}"</span>. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-4 border-2 border-gray-100 rounded-2xl text-gray-600 font-black text-sm hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;