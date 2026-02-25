
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CircleDollarSign, UserPlus, Mail, Lock, Loader2 } from 'lucide-react';
import { BRANDING } from '../config/branding';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(`Erro ao cadastrar: ${error.message}`);
      } else {
        alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação se necessário.');
        navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-4 rounded-2xl shadow-inner">
              <CircleDollarSign size={48} className="text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Nova Conta</h2>
          <p className="mt-2 text-sm text-gray-500">
            Cadastre-se no sistema da {BRANDING.companyName}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSignup}>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">E-mail Corporativo</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Escolha uma Senha</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-400 italic">* Mínimo de 6 caracteres</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 shadow-lg shadow-orange-100"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <UserPlus className="h-5 w-5 absolute left-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
                  <span>Cadastrar Agora</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:text-orange-500 transition-colors">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
