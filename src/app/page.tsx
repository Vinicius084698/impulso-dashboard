"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Activity, Calendar, ChevronDown, Download, Users, TrendingUp, 
  BarChart as BarChartIcon, MousePointerClick, DollarSign, LayoutDashboard, Settings, Image as ImageIcon,
  ArrowUpRight, ArrowDownRight, UserCheck, Calculator, BarChart3, Lightbulb, UserPlus, Target, PieChart as PieIcon, RefreshCw, Megaphone, Sparkles, X
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, Line
} from "recharts";
import styles from "./page.module.css";
import { useSession, signIn, signOut } from "next-auth/react";

import { Search } from "lucide-react";

const COLORS = ['#ff5a00', '#2a2a35'];

type TabType = "visao_geral" | "campanhas" | "criativos" | "configuracoes";

export default function SaaS_Dashboard() {
  const { data: session, status } = useSession();
  
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("visao_geral");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [db, setDb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<any>(null);

  const getOneWeekAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  };
  const getToday = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getOneWeekAgo());
  const [endDate, setEndDate] = useState(getToday());

  const fetchFacebookData = async (unitIdToFetch = selectedUnit) => {
    if (!unitIdToFetch) return;
    setIsRefreshing(true);
    try {
      let url = `/api/facebook?actId=${unitIdToFetch}&since=${startDate}&until=${endDate}`;
      if (campaignFilter.trim()) {
        url += `&filter=${encodeURIComponent(campaignFilter.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setDb(data);
      setIsRefreshing(false);
      setIsLoading(false);
      
      // Chamar IA em background após montar os gráficos iniciais
      // fetchAIInsights(data, unitIdToFetch);
      
    } catch (err) {
      console.error(err);
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const fetchAIInsights = async (fbData: any, unitId: string) => {
    setIsAnalyzingAI(true);
    try {
      const accountName = availableAccounts.find((a:any) => a.id === unitId)?.name || 'Conta de Anúncios';
      const fullName = campaignFilter.trim() ? `${accountName} - Filtro: ${campaignFilter}` : accountName;
      
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: fbData, accountName: fullName })
      });
      const aiData = await res.json();
      
      if (aiData.insights) {
        setDb((prev: any) => ({ ...prev, insights: aiData.insights }));
      }
    } catch (err) {
      console.error('Falha ao buscar insights da IA:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  useEffect(() => {
    const initAccounts = async () => {
      try {
        const res = await fetch('/api/facebook/adaccounts');
        const data = await res.json();
        if (data.adAccounts && data.adAccounts.length > 0) {
          setAvailableAccounts(data.adAccounts);
          setSelectedUnit(data.adAccounts[0].account_id);
          fetchFacebookData(data.adAccounts[0].account_id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        setIsLoading(false);
      }
    };
    initAccounts();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      fetchFacebookData(selectedUnit);
    }
  }, [selectedUnit, startDate, endDate]);

  const handleRefresh = () => {
    if (selectedUnit) fetchFacebookData(selectedUnit);
  };

  if (status === "loading") {
    return (
      <div className={styles.dashboardWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: '#ff5a00', minHeight: '100vh' }}>
        <h2>Verificando credenciais...</h2>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className={styles.dashboardWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ background: '#111', padding: '3rem', borderRadius: '16px', border: '1px solid #333', textAlign: 'center', maxWidth: '400px' }}>
          <Activity size={48} color="#ff5a00" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Impulso Ads</h1>
          <p style={{ color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.9rem' }}>Conecte-se com sua conta da Meta para visualizar os dashboards das franquias.</p>
          
          <button 
            onClick={() => signIn("facebook")}
            style={{
              backgroundColor: '#1877F2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              transition: 'background-color 0.2s'
            }}
          >
            Entrar com Facebook
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !db) {
    return (
      <div className={styles.dashboardWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: '#ff5a00', minHeight: '100vh' }}>
        <h2>Sincronizando com Facebook (Meta Graph API)...</h2>
      </div>
    );
  }

  if (db && db.error) {
    return (
      <div className={styles.dashboardWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: '#ef4444', minHeight: '100vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <h2>Erro de Integração com a API do Facebook</h2>
        <p style={{ color: '#a1a1aa' }}>Mensagem do Facebook: {db.error}</p>
        <p style={{ color: '#a1a1aa', maxWidth: '600px' }}>Ocorreu um erro ao buscar os dados na Meta.</p>
      </div>
    );
  }

  const data = db;

  return (
    <div className={styles.dashboardWrapper}>
      
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Activity size={28} color="#ff5a00" />
          <span>Impulso Ads</span>
        </div>
        <nav>
          <div 
            className={`${styles.navItem} ${activeTab === "visao_geral" ? styles.active : ""}`}
            onClick={() => setActiveTab("visao_geral")}
          >
            <LayoutDashboard size={20} /> Visão Geral
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === "campanhas" ? styles.active : ""}`}
            onClick={() => setActiveTab("campanhas")}
          >
            <Megaphone size={20} /> Campanhas
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === "criativos" ? styles.active : ""}`}
            onClick={() => setActiveTab("criativos")}
          >
            <ImageIcon size={20} /> Criativos
          </div>
          <div 
            className={styles.navItem}
            onClick={() => signOut()}
            style={{ color: '#ef4444' }}
          >
            <Activity size={20} /> Sair
          </div>
        </nav>
      </aside>

      <main className={styles.mainArea}>
        
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>
            {activeTab === "visao_geral" && "Dashboard Oficial"}
            {activeTab === "campanhas" && "Gestão de Campanhas"}
            {activeTab === "criativos" && "Biblioteca de Criativos"}
            {activeTab === "configuracoes" && "Integração Meta Ads"}
          </h1>
          
          <div className={styles.topbarControls}>
            {activeTab !== "configuracoes" && availableAccounts.length > 0 && (
              <select 
                className={styles.unitSelector} 
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                {availableAccounts.map((acc: any) => (
                  <option key={acc.account_id} value={acc.account_id}>{acc.name}</option>
                ))}
              </select>
            )}

            {activeTab !== "configuracoes" && db && !db.error && (
              <>
                <div className={styles.dateFilter} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Search size={16} color="#a1a1aa" />
                  <select 
                    value={campaignFilter} 
                    onChange={(e) => setCampaignFilter(e.target.value)}
                    style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', outline: 'none', width: '180px' }}
                  >
                    <option value="" style={{ background: '#111' }}>Todas as Campanhas</option>
                    <option value="barra mansa" style={{ background: '#111' }}>Barra Mansa</option>
                    <option value="volta redonda" style={{ background: '#111' }}>Volta Redonda</option>
                  </select>
                </div>

                <div className={styles.dateFilter} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                  <Calendar size={16} color="#a1a1aa" />
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#fff', borderRadius: '4px', padding: '2px 4px', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <span style={{ color: '#a1a1aa' }}>até</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#fff', borderRadius: '4px', padding: '2px 4px', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <button className={styles.refreshBtn} onClick={handleRefresh}>
                  <RefreshCw size={16} className={isRefreshing ? styles.spinIcon : ""} />
                  {isRefreshing ? "Buscando..." : "Sincronizar BM"}
                </button>
              </>
            )}
          </div>
        </header>

        <div className={styles.contentContainer}>
          
          {activeTab === "visao_geral" && data && data.overview && (
            <>
              {/* METRICS ROW */}
              <div className={styles.metricsRow}>
                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <span>Valor Investido</span>
                    <DollarSign size={18} />
                  </div>
                  <div className={styles.cardValue}>R$ {data.overview.invested.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                  <div className={styles.cardFooter}>
                    <ArrowUpRight size={16} className={styles.trendUp} />
                    <span className={styles.trendUp}>+5%</span> <span>vs semana anterior</span>
                  </div>
                </div>

                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <span>Saldo na Conta</span>
                    <DollarSign size={18} />
                  </div>
                  <div className={styles.cardValue}>{data.overview.balance}</div>
                  <div className={styles.cardFooter}>
                    <span style={{color: '#a1a1aa'}}>Disponível / Atual</span>
                  </div>
                </div>

                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <span>CPC Médio</span>
                    <MousePointerClick size={18} />
                  </div>
                  <div className={styles.cardValue}>{data.overview.cpc}</div>
                  <div className={styles.cardFooter}>
                    <span style={{color: '#a1a1aa'}}>Custo por clique</span>
                  </div>
                </div>

                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <span>Total de Leads</span>
                    <Users size={18} />
                  </div>
                  <div className={styles.cardValue}>{data.overview.leads}</div>
                  <div className={styles.cardFooter}>
                    <ArrowUpRight size={16} className={styles.trendUp} />
                    <span className={styles.trendUp}>{data.overview.leadsPrev} anterior</span>
                  </div>
                </div>

                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <span>CPL Atual</span>
                    <MousePointerClick size={18} />
                  </div>
                  <div className={styles.cardValue}>{data.overview.cpl}</div>
                  <div className={styles.cardFooter}>
                    {selectedUnit === "Volta Redonda" ? (
                      <><ArrowDownRight size={16} className={styles.trendUp} /><span className={styles.trendUp}>-10%</span></>
                    ) : (
                      <><ArrowUpRight size={16} className={styles.trendDown} /><span className={styles.trendDown}>+15%</span></>
                    )}
                    <span> vs semana anterior</span>
                  </div>
                </div>

                {/* CTR AND CPM METRICS */}
                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <span>Qualidade dos Anúncios</span>
                    <BarChart3 size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>CTR Médio</span>
                      <strong style={{ fontSize: '1.2rem' }}>{data.overview.ctr || '0%'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>CPM Médio</span>
                      <strong style={{ fontSize: '1.2rem' }}>{data.overview.cpm || 'R$ 0,00'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* DEMOGRAPHICS CHARTS (WITH COMPARISON) */}
              <div className={styles.chartTitle} style={{ marginTop: '2rem' }}>Público-Alvo: Demografia e Comportamento</div>
              <div className={styles.chartsRow}>
                {/* AREA CHART: AGE COMPARISON */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Impressões por Idade (Atual x Anterior)</div>
                  <div style={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.demographics.age} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAgeAtual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff5a00" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ff5a00" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAgeAnterior" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#666" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#666" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="ageGroup" stroke="#888" tick={{fill: '#888'}} />
                        <YAxis stroke="#888" tick={{fill: '#888'}} />
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" name="Período Anterior" dataKey="Período Anterior" stroke="#666" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorAgeAnterior)" />
                        <Area type="monotone" name="Período Atual" dataKey="Período Atual" stroke="#ff5a00" strokeWidth={3} fillOpacity={1} fill="url(#colorAgeAtual)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BAR CHART: GENDER COMPARISON */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Impressões por Gênero</div>
                  <div style={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.demographics.gender} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} />
                        <YAxis stroke="#888" tick={{fill: '#888'}} />
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} cursor={{fill: '#222'}} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar name="Período Anterior" dataKey="Período Anterior" fill="#666" radius={[4, 4, 0, 0]} />
                        <Bar name="Período Atual" dataKey="Período Atual" fill="#ff5a00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* CAMPANHAS TABLE */}
              <div className={styles.chartTitle} style={{ marginTop: '2rem' }}>Detalhamento por Campanha (Atual)</div>
              <div className={styles.tableContainer}>
                <table className={styles.dataTablet}>
                  <thead>
                    <tr>
                      <th>Campanha</th>
                      <th>Status</th>
                      <th>Orçamento</th>
                      <th>Valor Investido</th>
                      <th>CPC</th>
                      <th>CTR</th>
                      <th>Leads</th>
                      <th>CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((camp: any) => (
                      <tr key={camp.id}>
                        <td>{camp.name}</td>
                        <td><span className={camp.status === 'Ativa' ? styles.statusActive : styles.statusPaused}>{camp.status}</span></td>
                        <td>{camp.budget}</td>
                        <td>{camp.spend}</td>
                        <td>{camp.cpc}</td>
                        <td>{camp.ctr}</td>
                        <td>{camp.leads}</td>
                        <td>{camp.cpl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CHARTS ROW (WITH COMPARISON) */}
              <div className={styles.chartTitle} style={{ marginTop: '2rem' }}>Desempenho Geral</div>
              <div className={styles.chartsRow}>
                {/* AREA CHART - COMPARISON */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Comparativo de Leads: Semana Atual x Semana Passada</div>
                  <div style={{ height: 200, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLeadsAtual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff5a00" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ff5a00" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLeadsAnterior" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#666" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#666" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#888" tick={{fill: '#888'}} />
                        <YAxis stroke="#888" tick={{fill: '#888'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" name="Período Anterior" dataKey="Período Anterior" stroke="#666" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorLeadsAnterior)" />
                        <Area type="monotone" name="Período Atual" dataKey="Período Atual" stroke="#ff5a00" strokeWidth={3} fillOpacity={1} fill="url(#colorLeadsAtual)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BAR CHART - COMPARISON */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Funil Comparativo (x1000)</div>
                  <div style={{ height: 200, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                        <YAxis stroke="#888" tick={{fill: '#888'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Período Anterior" fill="#444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Período Atual" fill="#ff5a00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* AI INSIGHTS SECTION - TEMPORARILY DISABLED 
              <div className={styles.aiInsightsBox}>
                <div className={styles.aiHeader}>
                  <Sparkles size={24} color="#ffae80" className={isAnalyzingAI ? styles.spinAnimation : ''} />
                  <h2 className={styles.aiTitle}>
                    O que a IA está vendo? ({availableAccounts?.find((a:any) => a.id === selectedUnit)?.name}{campaignFilter ? ` - ${campaignFilter}` : ''})
                  </h2>
                </div>
                <div className={styles.aiContent}>
                  {isAnalyzingAI ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                      <div style={{ color: '#ffae80', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        O Gestor de Tráfego Sênior está analisando seu funil de conversão, demografia e performance de campanhas. Aguarde um momento...
                      </div>
                      {[1, 2, 3].map((_, idx) => (
                        <div key={idx} style={{ height: '40px', background: 'rgba(255, 174, 128, 0.1)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                      ))}
                    </div>
                  ) : (
                    (data.insights || [{title: "IA em repouso", text: "Clique em Sincronizar para a IA analisar seus dados frescos."}]).map((insight: any, idx: number) => (
                      <div className={styles.aiInsightItem} key={idx}>
                        <Lightbulb size={20} className={styles.aiInsightIcon} style={{ minWidth: '20px' }} />
                        <div>
                          <strong style={{ color: '#ffae80' }}>{insight.title}:</strong> {insight.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              */}
            </>
          )}

          {activeTab === "campanhas" && data && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome da Campanha</th>
                    <th>Status</th>
                    <th>Orçamento</th>
                    <th>Valor Gasto</th>
                    <th>Leads</th>
                    <th>Custo por Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((camp: any) => (
                    <tr key={camp.id}>
                      <td><strong>{camp.name}</strong></td>
                      <td>
                        <span className={camp.status === "Ativa" ? styles.statusActive : styles.statusPaused}>
                          {camp.status}
                        </span>
                      </td>
                      <td>{camp.budget}</td>
                      <td>{camp.spend}</td>
                      <td>{camp.leads}</td>
                      <td><strong>{camp.cpl}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "criativos" && data && (
            <>
              <div className={styles.creativesRow}>
                {data.creatives.map((creative: any) => (
                  <div key={creative.id} className={styles.creativeItem} onClick={() => setSelectedCreative(creative)} style={{ cursor: 'pointer' }}>
                    <img 
                      src={creative.img} 
                      alt={creative.title} 
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
                      className={styles.creativeImage} 
                    />
                    <div className={styles.creativeData}>
                      <div className={styles.creativeLabel}>{creative.label}</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>{creative.title}</div>
                      
                      <div className={styles.creativeMetrics}>
                        <div className={styles.metricBlock}>
                          <span className={styles.metricLabel}>Leads</span>
                          <span className={styles.metricVal}>{creative.leads}</span>
                        </div>
                        <div className={styles.metricBlock}>
                          <span className={styles.metricLabel}>CPL</span>
                          <span className={styles.metricVal} style={{ color: '#10b981' }}>{creative.cpl}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "configuracoes" && (
            <div className={styles.settingsForm}>
              <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>Integração com Meta Graph API</h2>
              <p style={{ color: "#a1a1aa", marginBottom: "2rem", fontSize: "0.95rem" }}>
                Insira as credenciais geradas no Facebook for Developers para a unidade selecionada ({selectedUnit}).
                Estes dados permitirão ao sistema buscar métricas em tempo real diretamente da Business Manager.
              </p>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>App ID</label>
                <input type="text" className={styles.formInput} placeholder="Ex: 1029384756102" />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>App Secret</label>
                <input type="password" className={styles.formInput} placeholder="••••••••••••••••••••••••" />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>System User Access Token</label>
                <input type="text" className={styles.formInput} placeholder="EAAGm0PX4ZC... (Token permanente)" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ad Account ID (Conta de Anúncios)</label>
                <input type="text" className={styles.formInput} placeholder="act_9876543210" />
              </div>

              <button className={styles.submitBtn}>
                Salvar Credenciais
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Modal de Relatório Detalhado do Criativo */}
      {selectedCreative && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCreative(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{selectedCreative.title}</h3>
                <p className={styles.modalSubtitle}>Campanha: {selectedCreative.campaign}</p>
              </div>
              <button className={styles.closeButton} onClick={() => setSelectedCreative(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <img 
                src={selectedCreative.img} 
                alt={selectedCreative.title} 
                className={styles.modalImage}
              />
              
              <div className={styles.modalGrid}>
                <div className={styles.modalMetricBox}>
                  <span className={styles.modalMetricLabel}>Leads</span>
                  <span className={styles.modalMetricValue}>{selectedCreative.leads}</span>
                </div>
                <div className={styles.modalMetricBox}>
                  <span className={styles.modalMetricLabel}>Custo por Lead</span>
                  <span className={styles.modalMetricValue} style={{ color: '#10b981' }}>{selectedCreative.cpl}</span>
                </div>
                <div className={styles.modalMetricBox}>
                  <span className={styles.modalMetricLabel}>Valor Investido</span>
                  <span className={styles.modalMetricValue}>{selectedCreative.spend}</span>
                </div>
                <div className={styles.modalMetricBox}>
                  <span className={styles.modalMetricLabel}>Impressões</span>
                  <span className={styles.modalMetricValue}>{selectedCreative.impressions}</span>
                </div>
                <div className={styles.modalMetricBox}>
                  <span className={styles.modalMetricLabel}>Cliques</span>
                  <span className={styles.modalMetricValue}>{selectedCreative.clicks}</span>
                </div>
                <div className={styles.modalMetricBox}>
                  <span className={styles.modalMetricLabel}>CTR (Taxa de Clique)</span>
                  <span className={styles.modalMetricValue}>{selectedCreative.ctr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
