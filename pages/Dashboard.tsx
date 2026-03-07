import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../utils/normalization';
import { Despesa, Casa, Setor } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Home,
  Layers,
  Clock,
  ArrowUpRight,
  CircleDollarSign,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [stats, setStats] = useState({ totalInvestido: 0, totalCasas: 0 });
  const [ultimasDespesas, setUltimasDespesas] = useState<Despesa[]>([]);
  const [setorData, setSetorData] = useState<any[]>([]);
  const [casaData, setCasaData] = useState<any[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [despesasRes, casasRes, setoresRes] = await Promise.all([
        supabase.from('despesas').select('*, casas(nome_casa, setor_id), categorias_despesa(nome)').order('data_lancamento', { ascending: false }),
        supabase.from('casas').select('*, setores(nome)'),
        supabase.from('setores').select('*'),
      ]);

      if (despesasRes.error) throw despesasRes.error;
      if (casasRes.error) throw casasRes.error;
      if (setoresRes.error) throw setoresRes.error;

      const despesas = despesasRes.data || [];
      const fetchedCasas = casasRes.data || [];
      const setores = setoresRes.data || [];

      setCasas(fetchedCasas);
      const totalInvestido = despesas.reduce((sum, d) => sum + Number(d.valor), 0);
      setStats({ totalInvestido, totalCasas: fetchedCasas.length });
      setUltimasDespesas(despesas.slice(0, 5));

      const setorAgg = setores.map((s: Setor) => {
        const total = despesas.filter((d) => (d.casas as any)?.setor_id === s.id).reduce((sum, d) => sum + Number(d.valor), 0);
        return { name: s.nome, total };
      }).filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
      setSetorData(setorAgg);

      const casaAgg = fetchedCasas.map((c: Casa) => {
        const total = despesas.filter((d) => d.casa_id === c.id).reduce((sum, d) => sum + Number(d.valor), 0);
        return { name: c.nome_casa, total };
      }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
      setCasaData(casaAgg);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
        <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold">Carregando indicadores…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-0.5">Visão financeira estratégica dos seus projetos.</p>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Total investido */}
        <div
          onClick={() => navigate('/unidades')}
          className="group cursor-pointer bg-slate-900 rounded-2xl p-6 relative overflow-hidden hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          {/* glow decoration */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-orange-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                Realtime
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Investimento Consolidado</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formatCurrency(stats.totalInvestido)}</p>
              <ArrowUpRight size={18} className="text-orange-400 mb-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Unidades */}
        <div
          onClick={() => navigate('/unidades')}
          className="group cursor-pointer bg-white border border-slate-100 rounded-2xl p-6 relative overflow-hidden hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 active:scale-[0.99] transition-all"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center">
                <Home size={18} className="text-orange-500" />
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Unidades em Carteira</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {stats.totalCasas} <span className="text-base font-bold text-slate-400">unidades</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Por setor */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center">
              <Layers size={15} className="text-orange-500" />
            </div>
            <h3 className="font-black text-slate-800 text-sm">Por Setor</h3>
          </div>
          <div className="h-64">
            {setorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setorData} layout="vertical" margin={{ left: -10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(val: any) => [formatCurrency(val), 'Total']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', padding: '10px 14px', fontSize: 12 }}
                  />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={26}>
                    {setorData.map((_entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm font-semibold">Nenhum dado disponível</div>
            )}
          </div>
        </div>

        {/* Recentes */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={15} className="text-orange-500" />
              </div>
              <h3 className="font-black text-slate-800 text-sm">Lançamentos Recentes</h3>
            </div>
            <button
              onClick={() => navigate('/unidades')}
              className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors bg-orange-50 px-3 py-1.5 rounded-lg"
            >
              Ver tudo
            </button>
          </div>

          <div className="space-y-1">
            {ultimasDespesas.length > 0 ? (
              ultimasDespesas.map((despesa) => (
                <div
                  key={despesa.id}
                  onClick={() => navigate(`/unidade/${despesa.casa_id}`)}
                  className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                      <CircleDollarSign size={14} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate group-hover:text-orange-600 transition-colors">
                        {despesa.descricao_original}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                        {(despesa.casas as any)?.nome_casa}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <p className="text-sm font-black text-slate-800">{formatCurrency(despesa.valor)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">
                      {new Date(despesa.data_lancamento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-300 text-sm font-semibold">Sem movimentação recente</div>
            )}
          </div>
        </div>
      </div>

      {/* ── RANKING CASAS ──────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center">
            <Home size={15} className="text-orange-500" />
          </div>
          <h3 className="font-black text-slate-800 text-sm">Ranking por Investimento</h3>
        </div>
        <div className="h-72 sm:h-80">
          {casaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={casaData} margin={{ bottom: 36, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tickFormatter={(val) => `R$${val / 1000}k`}
                  tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', radius: 8 }}
                  formatter={(val: any) => [formatCurrency(val), 'Investido']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', padding: '10px 14px', fontSize: 12 }}
                />
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  className="cursor-pointer"
                  onClick={(data) => {
                    const house = casas.find((c) => c.nome_casa === data.name);
                    if (house) navigate(`/unidade/${house.id}`);
                  }}
                >
                  {casaData.map((_entry, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#F97316' : '#FB923C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 text-sm font-semibold">
              Nenhuma unidade com gastos
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
