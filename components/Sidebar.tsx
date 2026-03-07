import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Home, TrendingUp, LogOut, Users, ShieldCheck, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { BRANDING } from '../config/branding';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

const Sidebar: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, []);

  const isMaster = profile?.role === 'master';

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/unidades', icon: Home, label: 'Unidades' },
    ...(isMaster ? [{ to: '/usuarios', icon: Users, label: 'Usuários' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-slate-900 flex-col z-50">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 shrink-0">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/40 shrink-0">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-black text-sm leading-none truncate">{BRANDING.shortName}</p>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5 truncate">{BRANDING.companyName}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] px-3 mb-3">Menu</p>
          {links.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User card + logout */}
        <div className="px-3 pb-5 border-t border-slate-800 pt-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMaster ? 'bg-orange-500' : 'bg-slate-700'}`}>
              {isMaster ? <ShieldCheck size={15} className="text-white" /> : <UserCircle size={15} className="text-slate-400" />}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-slate-100 text-xs font-black truncate">{profile?.full_name ?? '...'}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${isMaster ? 'text-orange-400' : 'text-slate-500'}`}>
                {profile?.role ?? ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-semibold"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP HEADER ───────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-slate-900 flex items-center justify-between px-4 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/40">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="text-white font-black text-sm tracking-tight">{BRANDING.shortName}</span>
        </div>
        {profile && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMaster ? 'bg-orange-500' : 'bg-slate-700'}`}>
            {isMaster ? <ShieldCheck size={15} className="text-white" /> : <UserCircle size={15} className="text-slate-400" />}
          </div>
        )}
      </header>

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 z-40 flex items-stretch safe-area-inset-bottom">
        {links.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? 'text-orange-500' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-b-full" />
              )}
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[9px] font-black uppercase tracking-wider leading-none">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-slate-500 active:text-red-400 transition-colors"
        >
          <LogOut size={21} strokeWidth={1.8} />
          <span className="text-[9px] font-black uppercase tracking-wider leading-none">Sair</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
