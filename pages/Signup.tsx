
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, UserPlus, Mail, Lock, Loader2, User } from 'lucide-react';
import { BRANDING } from '../config/branding';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
        navigate('/login');
      }
    } catch {
      setError('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── PAINEL ESQUERDO — dark branding ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500 rounded-full blur-[140px] opacity-20 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/40">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-base leading-none">{BRANDING.shortName}</p>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5">{BRANDING.companyName}</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            Crie sua conta<br />
            e comece a<br />
            <span className="text-orange-500">controlar hoje.</span>
          </h1>
          <p className="text-slate-400 text-base font-medium leading-relaxed max-w-sm">
            Em poucos segundos você terá acesso completo ao sistema de gestão financeira.
          </p>
        </div>

        <p className="relative z-10 text-slate-600 text-xs font-medium">
          © {new Date().getFullYear()} {BRANDING.companyName}
        </p>
      </div>

      {/* ── PAINEL DIREITO — formulário ──────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50 min-h-screen lg:min-h-0">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-5 bg-slate-900">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/40">
            <TrendingUp size={16} className="text-white" />
          </div>
          <p className="text-white font-black text-sm">{BRANDING.shortName}</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm">

            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Criar nova conta</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Preencha os dados para se cadastrar.</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-4 mt-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-orange-500/25 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={17} />
                    Criar minha conta
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 font-medium">
              Já possui conta?{' '}
              <Link to="/login" className="text-orange-600 font-black hover:text-orange-500 transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
