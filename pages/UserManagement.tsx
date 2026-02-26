import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';

const UserManagement: React.FC = () => {
  const { profile, isMaster } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isMaster) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email, password, full_name: fullName, role: 'contador' }
    });

    if (error) {
      alert(`Erro ao criar contador: ${error.message}`);
    } else {
      alert(`Contador criado com sucesso: ${data?.user_id || ''}`);
      setEmail('');
      setPassword('');
      setFullName('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-800">Gerenciar Contadores</h2>
        <p className="text-sm text-gray-500">Logado como {profile?.full_name} ({profile?.role})</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm max-w-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Cadastrar novo contador</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <input className="mobile-form-control px-4 py-3 border rounded-xl" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <input className="mobile-form-control px-4 py-3 border rounded-xl" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="mobile-form-control px-4 py-3 border rounded-xl" placeholder="Senha temporária" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button disabled={loading} type="submit" className="w-full md:w-auto px-6 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-70">
            {loading ? 'Criando...' : 'Criar Contador'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
