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
  CircleDollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [stats, setStats] = useState({
    totalInvestido: 0,
    totalCasas: 0
  });
  const [ultimasDespesas, setUltimasDespesas] = useState<Despesa[]>([]);
  const [setorData, setSetorData] = useState<any[]>([]);
  const [casaData, setCasaData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Busca todos os dados sem filtrar por user_id
      const [despesasRes, casasRes, setoresRes] = await Promise.all([
        supabase.from('despesas').select('*, casas(nome_casa, setor_id), categorias_despesa(nome)').order('data_lancamento', { ascending: false }),
        supabase.from('casas').select('*, setores(nome)'),
        supabase.from('setores').select('*')
      ]);

      if (despesasRes.error) throw despesasRes.error;
      if (casasRes.error) throw casasRes.error;
      if (setoresRes.error) throw setoresRes.error;

      const despesas = despesasRes.data || [];
      const fetchedCasas = casasRes.data || [];
      const setores = setoresRes.data || [];

      setCasas(fetchedCasas);

      const totalInvestido = despesas.reduce((sum, d) => sum + Number(d.valor), 0);
      setStats({
        totalInvestido,
        totalCasas: fetchedCasas.length
      });

      setUltimasDespesas(despesas.slice(0, 5));

      const setorAgg = setores.map(s => {
        const setorDespesas = despesas.filter(d => (d.casas as any)?.setor_id === s.id);
        const total = setorDespesas.reduce((sum, d) => sum + Number(d.valor), 0);
        return { name: s.nome, total };
      }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
      setSetorData(setorAgg);

      const casaAgg = fetchedCasas.map(c => {
        const casaDespesas = despesas.filter(d => d.casa_id === c.id);
        const total = casaDespesas.reduce((sum, d) => sum + Number(d.valor), 0);
        return { name: c.nome_casa, total };
      }).filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
      setCasaData(casaAgg);

    } catch (err: any) {
      console.error(err);
      alert(`Erro no dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'];

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-gray-500 font-bold gap-4">
        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
        Carregando indicadores...
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-2xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight">Dashboard</h2>
        <p className="text-gray-500 text-sm md:text-base mt-1">Visão financeira estratégica de seus projetos.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
        <div 
          onClick={() => navigate('/unidades')}
          className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-orange-200 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
              <TrendingUp size={28} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 shadow-sm">Realtime</span>
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest relative z-10 mb-2">Investimento Consolidado</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-800 tracking-tighter">{formatCurrency(stats.totalInvestido)}</p>
            <ArrowUpRight size={20} className="text-gray-200 group-hover:text-orange-500 transform group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/unidades')}
          className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
              <Home size={28} />
            </div>
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest relative z-10 mb-2">Unidades em Carteira</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-800 tracking-tighter">{stats.totalCasas} Unidades</p>
            <ArrowUpRight size={20} className="text-gray-200 group-hover:text-blue-500 transform group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Chart Setores */}
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Layers size={20} /></div>
            Por Setor
          </h3>
          <div className="h-72">
            {setorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setorData} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    formatter={(val: any) => formatCurrency(val)}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '12px 16px' }}
                  />
                  <Bar dataKey="total" radius={[0, 12, 12, 0]} barSize={32}>
                    {setorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold italic">Nenhum dado financeiro</div>
            )}
          </div>
        </div>

        {/* Latest Expenses */}
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-4">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Clock size={20} /></div>
              Recentes
            </h3>
            <button 
              onClick={() => navigate('/unidades')}
              className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors bg-orange-50 px-4 py-2 rounded-xl"
            >
              Ver Tudo
            </button>
          </div>
          <div className="space-y-4">
            {ultimasDespesas.length > 0 ? (
              ultimasDespesas.map((despesa) => (
                <div 
                  key={despesa.id} 
                  onClick={() => navigate(`/unidade/${despesa.casa_id}`)}
                  className="flex items-center justify-between p-4 hover:bg-orange-50 transition-all rounded-[1.5rem] border border-transparent hover:border-orange-100 cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shrink-0">
                      <CircleDollarSign size={24} />
                    </div>
                    <div className="truncate">
                      <p className="font-black text-gray-800 text-sm truncate group-hover:text-orange-600 transition-colors">{despesa.descricao_original}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">
                        {(despesa.casas as any)?.nome_casa}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-800 text-sm">{formatCurrency(despesa.valor)}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">
                      {new Date(despesa.data_lancamento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400 italic font-bold">Sem movimentação recente</div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Chart */}
      <div className="bg-white p-6 lg:p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-gray-800 mb-10 flex items-center gap-4">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Home size={20} /></div>
          Ranking de Unidades por Investimento
        </h3>
        <div className="h-96">
          {casaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={casaData} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(val) => `R$ ${val / 1000}k`} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 12}}
                  formatter={(val: any) => formatCurrency(val)}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '16px' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#F97316" 
                  radius={[12, 12, 0, 0]} 
                  barSize={40} 
                  className="cursor-pointer"
                  onClick={(data) => {
                    const house = casas.find(c => c.nome_casa === data.name);
                    if (house) navigate(`/unidade/${house.id}`);
                  }}
                >
                  {casaData.map((_entry, index) => (
                    <Cell key={`cell-u-${index}`} fill={index % 2 === 0 ? '#F97316' : '#FB923C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 font-bold italic">Nenhuma obra com gastos ativos</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;