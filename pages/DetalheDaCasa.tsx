
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Casa, Despesa } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  CircleDollarSign, 
  FileText, 
  ChevronRight, 
  ExternalLink,
  MoreHorizontal,
  Info,
  AlertTriangle,
  Pencil,
  Trash2,
  Loader2,
  History,
  FileDown,
  Share2,
  Download,
  ShieldCheck,
  Calendar,
  Filter,
  CheckCircle2,
  Settings2,
  X,
  Receipt,
  // Fix: Added missing TrendingUp import from lucide-react
  TrendingUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExpenseModal from '../components/ExpenseModal';
import AuditModal from '../components/AuditModal';
import { formatCurrency } from '../utils/normalization';
import { BRANDING } from '../config/branding';

const DetalheDaCasa: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [casa, setCasa] = useState<Casa | null>(null);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Date filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Actions states
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Despesa | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Despesa | null>(null);
  const [expenseForAudit, setExpenseForAudit] = useState<Despesa | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDetails = async () => {
    setLoading(true);
    const [casaRes, despesasRes] = await Promise.all([
      supabase.from('casas').select('*, setores(*)').eq('id', id).single(),
      supabase.from('despesas').select('*, categorias_despesa(*)').eq('casa_id', id).order('data_lancamento', { ascending: true })
    ]);

    if (casaRes.error) {
      console.error(casaRes.error);
      alert('Erro ao carregar unidade.');
      navigate('/unidades');
    } else {
      setCasa(casaRes.data);
      setDespesas(despesasRes.data || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (novoStatus: Casa['status']) => {
    if (!casa) return;
    setStatusLoading(true);
    const { error } = await supabase
      .from('casas')
      .update({ status: novoStatus })
      .eq('id', casa.id);

    if (error) {
      alert(`Erro ao atualizar status: ${error.message}`);
    } else {
      setCasa({ ...casa, status: novoStatus });
      setShowStatusModal(false);
    }
    setStatusLoading(false);
  };

  const totalInvestido = despesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const orcamentoPrevisto = casa?.orcamento_previsto || 0;
  const isOverBudget = totalInvestido > orcamentoPrevisto;
  const percentualOrcamento = orcamentoPrevisto > 0 ? (totalInvestido / orcamentoPrevisto) * 100 : 0;
  const exceededValue = isOverBudget ? totalInvestido - orcamentoPrevisto : 0;
  const percentualExcedido = orcamentoPrevisto > 0 ? (exceededValue / orcamentoPrevisto) * 100 : 0;

  // Period-based stats filtering
  const filteredDespesas = useMemo(() => {
    return despesas.filter(d => {
      const date = d.data_lancamento.split('T')[0];
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }, [despesas, startDate, endDate]);

  const totalPeriodo = filteredDespesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const isDateInvalid = startDate && endDate && endDate < startDate;

  const setRangeMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const setRange30Days = () => {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    setStartDate(last30);
    setEndDate(today);
  };

  const setRangeYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const clearRange = () => {
    setStartDate('');
    setEndDate('');
  };

  // Função para gerar o Hash SHA-256 de integridade
  const generateIntegrityHash = async (data: any) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleGeneratePDF = async () => {
    if (!casa || filteredDespesas.length === 0) {
      if (filteredDespesas.length === 0) alert("Nenhum lançamento encontrado no período selecionado.");
      return;
    }
    
    if (isDateInvalid) {
      alert("A data final deve ser maior ou igual à data inicial.");
      return;
    }

    setPdfLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const doc = new jsPDF();
      const dateNow = new Date();
      const timestamp = dateNow.toLocaleString('pt-BR');
      const timeStr = dateNow.getHours().toString().padStart(2, '0') + dateNow.getMinutes().toString().padStart(2, '0');
      
      const startSlug = startDate ? startDate.replace(/-/g, '') : '';
      const endSlug = endDate ? endDate.replace(/-/g, '') : '';
      const periodLabel = (startDate && endDate) ? `${startSlug}_${endSlug}` : (startDate ? `desde_${startSlug}` : (endDate ? `ate_${endSlug}` : 'todos'));
      
      const fileName = `extrato_${periodLabel}_${timeStr}.pdf`;
      const storagePath = `${user.id}/${casa.id}/${fileName}`;

      // Gerar Hash de Integridade
      const auditPayload = {
        casa_id: casa.id,
        nome_casa: casa.nome_casa,
        periodo: { start: startDate || 'Todos', end: endDate || 'Todos' },
        total_periodo: totalPeriodo,
        lancamentos_count: filteredDespesas.length,
        items: filteredDespesas.map(d => ({
          d: d.data_lancamento,
          desc: d.descricao_original,
          v: d.valor
        }))
      };
      const fullHash = await generateIntegrityHash(auditPayload);
      const displayHash = fullHash.substring(0, 24) + "...";

      // 1. Cabeçalho Corporativo
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, 210, 15, 'F');

      doc.setFontSize(20);
      doc.setTextColor(249, 115, 22);
      doc.setFont('helvetica', 'bold');
      doc.text('Extrato de Despesas', 14, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.setFont('helvetica', 'normal');
      doc.text(BRANDING.appName, 14, 36);
      doc.text(BRANDING.companyName, 14, 41);

      // 2. Metadados do Documento (Caixa de Informações)
      doc.setDrawColor(240);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(14, 50, 182, 35, 3, 3, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DA UNIDADE', 20, 58);
      doc.text('INFORMAÇÕES DE EMISSÃO', 110, 58);

      doc.setFont('helvetica', 'normal');
      doc.text(`Unidade: ${casa.nome_casa}`, 20, 65);
      doc.text(`Setor: ${casa.setores?.nome || 'N/A'}`, 20, 70);
      doc.text(`Período: ${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} a ${endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'}`, 20, 75);

      doc.text(`Responsável: ${user.email}`, 110, 65);
      doc.text(`Data Emissão: ${timestamp}`, 110, 70);
      doc.text(`Lançamentos: ${filteredDespesas.length} registros`, 110, 75);

      // 3. Tabela de Despesas
      const tableData = filteredDespesas.map(d => [
        new Date(d.data_lancamento).toLocaleDateString('pt-BR'),
        d.descricao_original,
        d.quantidade,
        formatCurrency(d.valor_unitario),
        formatCurrency(d.valor),
        d.categorias_despesa?.nome || '-',
        d.observacao || ''
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Data', 'Descrição', 'Qtd', 'Unit', 'Total', 'Categoria', 'Observação']],
        body: tableData,
        headStyles: { 
          fillColor: [249, 115, 22],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 7,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 10, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25 },
        },
        foot: [['', 'TOTAL NO PERÍODO', '', '', formatCurrency(totalPeriodo), '', '']],
        footStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [249, 115, 22], 
          fontStyle: 'bold',
          fontSize: 9,
          lineColor: [249, 115, 22],
          lineWidth: 0.1
        },
        theme: 'striped',
        margin: { bottom: 30 }
      });

      // 4. Rodapé e Hash de Integridade
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        
        doc.setFontSize(7);
        doc.text(`Documento gerado automaticamente pelo sistema ${BRANDING.appName}. Alterações manuais invalidam a assinatura digital.`, 14, 280);
        doc.setFont('helvetica', 'bold');
        doc.text(`Hash de Integridade (SHA-256): ${displayHash}`, 14, 284);
      }

      const pdfBlob = doc.output('blob');

      // Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('extratos')
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Gerar Signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('extratos')
        .createSignedUrl(storagePath, 60 * 60 * 24); // 24h

      if (signedError) throw signedError;

      setSignedPdfUrl(signedData.signedUrl);
      alert("Extrato do período gerado e assinado digitalmente.");
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      alert(`Erro ao processar PDF: ${err.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!signedPdfUrl || !casa) return;
    
    setDownloadLoading(true);
    try {
      const response = await fetch(signedPdfUrl);
      if (!response.ok) throw new Error("Falha ao baixar arquivo do servidor");
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      const safeCasaName = casa.nome_casa.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const periodSuffix = (startDate && endDate) ? `_${startDate}_a_${endDate}` : '_completo';
      a.download = `extrato_${safeCasaName}${periodSuffix}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (err: any) {
      console.error('Erro no download:', err);
      alert("Não foi possível baixar o arquivo. Tente novamente.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!signedPdfUrl || !casa) return;
    const periodText = (startDate && endDate) ? `(Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')})` : '(Extrato Completo)';
    const text = `📄 Extrato Profissional - ${casa.nome_casa} ${periodText}\n\nO relatório detalhado de investimentos está disponível no link abaixo:\n🔗 ${signedPdfUrl}\n\n_Assinado Digitalmente por ${BRANDING.companyName}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    const { error } = await supabase.from('despesas').delete().eq('id', expenseToDelete.id);
    
    if (error) {
      console.error(error);
      alert("Erro ao excluir despesa.");
    } else {
      setExpenseToDelete(null);
      fetchDetails();
    }
    setIsDeleting(false);
  };

  const handleEditClick = (d: Despesa) => {
    setExpenseToEdit(d);
    setMenuOpenId(null);
  };

  const handleAuditClick = (d: Despesa) => {
    setExpenseForAudit(d);
    setMenuOpenId(null);
  };

  const getStatusBadgeClass = (status: Casa['status']) => {
    switch (status) {
      case 'Planejamento': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Em Obra': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Pausada': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Finalizado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Vendido': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;
  if (!casa) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/unidades')}
            className="p-2.5 hover:bg-white bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-black text-gray-800 truncate leading-tight">{casa.nome_casa}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <p className="text-gray-500 text-xs font-medium">{casa.setores?.nome}</p>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <button 
                onClick={() => setShowStatusModal(true)}
                className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${getStatusBadgeClass(casa.status)}`}
              >
                {casa.status}
                <Settings2 size={10} />
              </button>
            </div>
          </div>
        </div>

        {isOverBudget && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center gap-3 animate-pulse">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle size={18} />
            </div>
            <p className="text-xs font-bold text-red-700">O orçamento previsto foi ultrapassado.</p>
          </div>
        )}

        <button 
          onClick={() => setShowExpenseModal(true)}
          className="w-full lg:w-auto lg:self-end bg-orange-500 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={20} />
          Lançar Despesa
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className={`p-6 rounded-3xl border transition-all ${isOverBudget ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Investido</p>
            <CircleDollarSign size={18} className={isOverBudget ? 'text-red-400' : 'text-orange-400'} />
          </div>
          <p className={`text-2xl font-black ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}>
            {formatCurrency(totalInvestido)}
          </p>
          <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${isOverBudget ? 'bg-red-500' : 'bg-orange-500'}`} 
              style={{ width: `${Math.min(percentualOrcamento, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-2 text-right">
            {percentualOrcamento.toFixed(1)}% do previsto
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orçamento Previsto</p>
            <Calendar size={18} className="text-gray-300" />
          </div>
          <p className="text-2xl font-black text-gray-800">{formatCurrency(orcamentoPrevisto)}</p>
          <p className="text-[10px] mt-2 text-gray-400 font-medium italic">Teto de investimento planejado</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Estimado</p>
            <TrendingUp size={18} className={isOverBudget ? 'text-red-400' : 'text-green-400'} />
          </div>
          <p className={`text-2xl font-black ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
            {formatCurrency(orcamentoPrevisto - totalInvestido)}
          </p>
          <p className="text-[10px] mt-2 text-gray-400 font-medium italic">Valor restante p/ planejado</p>
        </div>
      </div>

      {/* PDF Generation Section */}
      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 lg:space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl relative shrink-0 shadow-inner">
              <FileDown size={28} />
              {signedPdfUrl && <ShieldCheck size={16} className="absolute -bottom-1 -right-1 text-green-500 bg-white rounded-full p-0.5 shadow-sm" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-gray-800 text-lg leading-tight flex flex-wrap items-center gap-2">
                Relatório de Investimentos
                {signedPdfUrl && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Assinado</span>}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Filtre por período e gere um documento profissional.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button onClick={setRangeMonth} className="text-[10px] px-3 py-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-bold text-gray-500 transition-all border border-gray-100">Mês Atual</button>
            <button onClick={setRange30Days} className="text-[10px] px-3 py-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-bold text-gray-500 transition-all border border-gray-100">30 Dias</button>
            <button onClick={setRangeYear} className="text-[10px] px-3 py-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-bold text-gray-500 transition-all border border-gray-100">Este Ano</button>
            <button onClick={clearRange} className="text-[10px] px-3 py-2 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold text-gray-400 transition-all border border-gray-100">Todos</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={12} /> Data Inicial
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm transition-all shadow-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={12} /> Data Final
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm transition-all shadow-sm ${isDateInvalid ? 'border-red-300 ring-red-100 ring-2' : 'border-gray-200'}`} 
              />
            </div>
            {isDateInvalid && (
              <p className="col-span-1 sm:col-span-2 text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Período inválido: data final &lt; data inicial.
              </p>
            )}
          </div>

          <div className="lg:col-span-3 bg-gray-50/50 rounded-2xl p-5 border border-dashed border-gray-200 shadow-inner">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
               <Filter size={12} /> Filtro Ativo
             </p>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500 font-medium">Registros:</span>
                 <span className="font-black text-gray-800">{filteredDespesas.length}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500 font-medium">Gasto no período:</span>
                 <span className="font-black text-orange-600">{formatCurrency(totalPeriodo)}</span>
               </div>
             </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <button
              onClick={handleGeneratePDF}
              disabled={pdfLoading || filteredDespesas.length === 0 || isDateInvalid}
              className="w-full px-6 py-4 bg-gray-800 text-white rounded-2xl font-black text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-gray-200 active:scale-95"
            >
              {pdfLoading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
              Gerar Relatório Profissional
            </button>
            
            {signedPdfUrl && (
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadLoading}
                  className="flex-1 px-4 py-4 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-100 disabled:opacity-70 active:scale-95"
                >
                  {downloadLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Baixar PDF
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center shadow-lg shadow-green-100 active:scale-90"
                  title="WhatsApp"
                >
                  <Share2 size={24} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense List Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Receipt size={20} />
            </div>
            <h3 className="font-black text-gray-800 text-sm md:text-base">Extrato Detalhado</h3>
          </div>
          <span className="text-[10px] md:text-xs bg-white border border-gray-100 px-3 py-1.5 rounded-full text-gray-600 font-bold uppercase tracking-wider">
            {despesas.length} Itens
          </span>
        </div>
        
        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Data</th>
                <th className="px-6 py-5">Lançamento</th>
                <th className="px-6 py-5">Categoria</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {despesas.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/80 transition-all group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">
                    {new Date(d.data_lancamento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-800 text-sm mb-0.5">{d.descricao_original}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                       {d.quantidade} un. x {formatCurrency(d.valor_unitario)}
                    </p>
                    {d.observacao && <p className="text-[10px] text-gray-400 mt-1 italic max-w-xs truncate">{d.observacao}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg">
                      {d.categorias_despesa?.nome}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-black text-gray-800 text-sm">{formatCurrency(d.valor)}</p>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.note_fiscal_url && (
                        <a 
                          href={d.nota_fiscal_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                          title="Nota Fiscal"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      
                      <div className="relative">
                        <button 
                          onClick={() => setMenuOpenId(menuOpenId === d.id ? null : d.id)}
                          className={`p-2 rounded-xl transition-all ${menuOpenId === d.id ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        
                        {menuOpenId === d.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-150"
                          >
                            <button 
                              onClick={() => handleEditClick(d)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Pencil size={14} className="text-blue-500" />
                              Editar Registro
                            </button>
                            <button 
                              onClick={() => handleAuditClick(d)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50"
                            >
                              <History size={14} className="text-orange-500" />
                              Ver Histórico
                            </button>
                            <button 
                              onClick={() => { setExpenseToDelete(d); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} className="text-red-500" />
                              Excluir Item
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (Visible only on small screens) */}
        <div className="md:hidden divide-y divide-gray-100">
          {despesas.map((d) => (
            <div key={d.id} className="p-4 space-y-3 active:bg-gray-50 transition-colors relative">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {new Date(d.data_lancamento).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{d.descricao_original}</p>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpenId(menuOpenId === d.id ? null : d.id)}
                    className={`p-2 rounded-xl border border-gray-100 shadow-sm ${menuOpenId === d.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-400'}`}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {menuOpenId === d.id && (
                    <div 
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <button 
                        onClick={() => handleEditClick(d)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={14} className="text-blue-500" />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleAuditClick(d)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 border-b"
                      >
                        <History size={14} className="text-orange-500" />
                        Auditoria
                      </button>
                      <button 
                        onClick={() => { setExpenseToDelete(d); setMenuOpenId(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="text-red-500" />
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg">
                  {d.categorias_despesa?.nome}
                </span>
                {d.nota_fiscal_url && (
                  <a 
                    href={d.nota_fiscal_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1 text-orange-500 bg-orange-50 rounded-lg"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <div className="flex justify-between items-end bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                <p className="text-[10px] text-gray-400 font-bold">
                  {d.quantidade} x {formatCurrency(d.valor_unitario)}
                </p>
                <p className="font-black text-gray-800 text-base">{formatCurrency(d.valor)}</p>
              </div>
            </div>
          ))}
        </div>
        
        {despesas.length === 0 && (
          <div className="py-20 text-center px-6">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
              <Receipt size={32} className="text-gray-200" />
            </div>
            <p className="text-gray-500 font-bold text-sm">Nenhuma despesa registrada.</p>
            <p className="text-gray-400 text-xs mt-1">Clique no botão acima para adicionar.</p>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal 
          casaId={casa.id} 
          onClose={() => setShowExpenseModal(false)} 
          onSuccess={fetchDetails} 
        />
      )}

      {/* Edit Modal */}
      {expenseToEdit && (
        <ExpenseModal 
          mode="edit"
          initialData={expenseToEdit}
          casaId={casa.id} 
          onClose={() => setExpenseToEdit(null)} 
          onSuccess={fetchDetails} 
        />
      )}

      {/* Audit Modal */}
      {expenseForAudit && (
        <AuditModal 
          despesaId={expenseForAudit.id}
          descricaoOriginal={expenseForAudit.descricao_original}
          onClose={() => setExpenseForAudit(null)}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 overflow-hidden">
          <div className="mobile-modal bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-800 text-lg">Alterar Status</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{casa.nome_casa}</p>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)} 
                className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mobile-modal-content p-4 sm:p-6 space-y-2">
              {(['Planejamento', 'Em Obra', 'Pausada', 'Finalizado', 'Vendido'] as Casa['status'][]).map((st) => (
                <button
                  key={st}
                  disabled={statusLoading}
                  onClick={() => handleUpdateStatus(st)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    casa.status === st 
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-black shadow-md' 
                      : 'bg-white border-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-white shadow-sm ${
                      st === 'Planejamento' ? 'bg-gray-400' :
                      st === 'Em Obra' ? 'bg-orange-500' :
                      st === 'Pausada' ? 'bg-amber-500' :
                      st === 'Finalizado' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></span>
                    <span className="text-sm tracking-tight">{st}</span>
                  </div>
                  {casa.status === st && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
            {statusLoading && (
              <div className="p-5 bg-orange-500 flex items-center justify-center gap-3 text-white text-sm font-black animate-pulse">
                <Loader2 size={18} className="animate-spin" />
                Atualizando unidade...
              </div>
            )}
            <div className="h-4 sm:hidden"></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[110] p-0 sm:p-4 overflow-hidden">
          <div className="mobile-modal bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-sm">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-800 text-center mb-2">Excluir Registro?</h3>
            <p className="text-gray-500 text-sm text-center mb-8 px-4">
              Você está prestes a remover <span className="font-black text-gray-800">"{expenseToDelete.descricao_original}"</span> permanentemente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                disabled={isDeleting}
                onClick={() => setExpenseToDelete(null)}
                className="w-full py-4 border-2 border-gray-100 rounded-2xl text-gray-600 font-black text-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-95"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Confirmar"}
              </button>
            </div>
            <div className="h-4 sm:hidden"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalheDaCasa;
