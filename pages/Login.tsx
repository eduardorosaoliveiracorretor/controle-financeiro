
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, LogIn, Mail, Lock, Loader2, BarChart2, ShieldCheck, Zap } from 'lucide-react';
import { BRANDING } from '../config/branding';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('E-mail ou senha incorretos. Tente novamente.');
      } else {
        navigate('/');
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BarChart2, text: 'Dashboards em tempo real' },
    { icon: ShieldCheck, text: 'Controle de acesso por perfil' },
    { icon: Zap, text: 'Relatórios e exportação PDF' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── PAINEL ESQUERDO — branding dark ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid decoration */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500 rounded-full blur-[140px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-600 rounded-full blur-[140px] opacity-10 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/40">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-base leading-none">{BRANDING.shortName}</p>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5">{BRANDING.companyName}</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Gestão financeira<br />
              <span className="text-orange-500">inteligente</span> para<br />
              sua construtora.
            </h1>
            <p className="mt-4 text-slate-400 text-base font-medium leading-relaxed max-w-sm">
              Controle investimentos, acompanhe despesas e tome decisões com clareza.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-orange-400" />
                </div>
                <p className="text-slate-300 text-sm font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bem-vindo de volta</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Acesse sua conta para continuar.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-4 mt-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-orange-500/25 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={17} />
                    Entrar na conta
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 font-medium">
              Ainda não tem conta?{' '}
              <Link to="/signup" className="text-orange-600 font-black hover:text-orange-500 transition-colors">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
