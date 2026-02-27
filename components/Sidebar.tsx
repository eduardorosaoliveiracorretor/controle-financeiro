import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Home, CircleDollarSign, Menu, X, LogOut, Users, ShieldCheck, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { BRANDING } from '../config/branding';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Busca o perfil do usuário logado na tabela profiles
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error.message);
        return;
      }

      setProfile(data);
    };

    fetchProfile();
  }, []);

  const isMaster = profile?.role === 'master';

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/unidades', icon: Home, label: 'Unidades' },
    // Menu exclusivo para master
    ...(isMaster ? [{ to: '/usuarios', icon: Users, label: 'Gerenciar Usuários' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(`Erro ao sair: ${error.message}`);
    navigate('/login');
  };

  // Badge de role com cor diferente para master
  const RoleBadge = () => {
    if (!profile) return null;
    const isMasterRole = profile.role === 'master';
    return (
      <span className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
        ${isMasterRole
          ? 'bg-orange-100 text-orange-700 border border-orange-200'
          : 'bg-gray-100 text-gray-500 border border-gray-200'}
      `}>
        {isMasterRole && <ShieldCheck size={10} />}
        {profile.role}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-[45] shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-bold text-orange-600 text-sm md:text-base truncate max-w-[200px]">
            {BRANDING.shortName}
          </span>
        </div>
        <CircleDollarSign className="text-orange-500" size={24} />
      </div>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-72 bg-white border-r z-50 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex-1 overflow-y-auto">

          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="text-orange-500 shrink-0" size={28} />
                <span className="text-xl font-black text-gray-800 tracking-tight">{BRANDING.shortName}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{BRANDING.companyName}</span>
            </h1>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Card do usuário logado */}
          <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Usuário Logado</p>
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-full p-2 shrink-0">
                <UserCircle size={22} className="text-orange-600" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {profile?.full_name ?? 'Carregando...'}
                </p>
                <div className="mt-1">
                  <RoleBadge />
                </div>
              </div>
            </div>
          </div>

          {/* Navegação */}
          <nav className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all
                    ${isActive(link.to)
                      ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-100 scale-[1.02]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-orange-600'}
                  `}
                >
                  <Icon size={20} />
                  <span className="text-sm tracking-wide">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t bg-gray-50/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
