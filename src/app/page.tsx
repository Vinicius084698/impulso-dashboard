"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Activity, Users, DollarSign, MousePointerClick, 
  LayoutDashboard, Megaphone, Image as ImageIcon, Settings, Calendar, 
  ArrowUpRight, ArrowDownRight, Sparkles, Lightbulb, RefreshCw, Calculator, PieChart as PieIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, Line
} from "recharts";
import styles from "./page.module.css";

const COLORS = ['#ff5a00', '#2a2a35'];

type TabType = "visao_geral" | "campanhas" | "criativos" | "configuracoes";

export default function SaaS_Dashboard() {
  const [selectedUnit, setSelectedUnit] = useState<"Barra Mansa" | "Volta Redonda">("Volta Redonda");
  const [activeTab, setActiveTab] = useState<TabType>("visao_geral");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [db, setDb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ROAS Calculator State
  const [offlineSales, setOfflineSales] = useState<string>("50");
  const [avgTicket, setAvgTicket] = useState<string>("120");

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

  const fetchFacebookData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/facebook?since=${startDate}&until=${endDate}`);
      const data = await res.json();
      setDb(data);
    } catch (err) {
      console.error("Error loading facebook data:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacebookData();
  }, []);

  const handleRefresh = () => {
    fetchFacebookData();
  };

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
        <p style={{ color: '#a1a1aa', maxWidth: '600px' }}>Verifique se o FB_TOKEN e o FB_ACT foram adicionados corretamente na aba "Environment Variables" da Vercel. Certifique-se de que não há espaços em branco no final do Token e faça um novo "Redeploy".</p>
      </div>
    );
  }

  const data = db[selectedUnit];

  // Calculated ROAS
  const totalRevenue = (parseInt(offlineSales || "0") * parseFloat(avgTicket || "0"));
  const currentRoas = totalRevenue > 0 ? (totalRevenue / data.overview.invested).toFixed(2) : "0.00";

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
            className={`${styles.navItem} ${activeTab === "configuracoes" ? styles.active : ""}`}
            style={{ marginTop: 'auto' }}
            onClick={() => setActiveTab("configuracoes")}
          >
            <Settings size={20} /> Configurações
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
            <select 
              className={styles.unitSelector} 
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as "Barra Mansa" | "Volta Redonda")}
            >
              <option value="Volta Redonda">Cartão de Todos - Volta Redonda</option>
              <option value="Barra Mansa">Cartão de Todos - Barra Mansa</option>
            </select>

            {activeTab !== "configuracoes" && (
              <>
                <div className={styles.dateFilter} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
          
          {activeTab === "visao_geral" && (
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
                    <span>Total de Leads</span>
                    <Users size={18} />
                  </div>
                  <div className={styles.cardValue}>{data.overview.leads}</div>
                  <div className={styles.cardFooter}>
                    <ArrowUpRight size={16} className={styles.trendUp} />
                    <span className={styles.trendUp}>+12%</span> <span>vs semana anterior</span>
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

                {/* ROAS CALCULATOR (INSPIRED BY ACARAÚ) */}
                <div className={styles.glassCard} style={{ border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div className={styles.cardHeader}>
                    <span style={{ color: '#10b981' }}>ROAS Estimado (Offline)</span>
                    <Calculator size={18} color="#10b981" />
                  </div>
                  <div className={styles.cardValue} style={{ color: '#10b981' }}>{currentRoas}x</div>
                  <div className={styles.cardFooter} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '50px' }} 
                      value={offlineSales} 
                      onChange={(e) => setOfflineSales(e.target.value)}
                      title="Vendas Fechadas"
                    />
                    <span style={{ fontSize: '0.75rem', alignSelf: 'center' }}>vendas x</span>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '60px' }} 
                      value={avgTicket} 
                      onChange={(e) => setAvgTicket(e.target.value)}
                      title="Ticket Médio"
                    />
                  </div>
                </div>
              </div>

              {/* DEMOGRAPHICS CHARTS (INSPIRED BY ACARAÚ) */}
              <div className={styles.chartTitle} style={{ marginTop: '2rem' }}>Público-Alvo: Demografia e Comportamento</div>
              <div className={styles.chartsRow}>
                {/* MIXED CHART: AGE vs CTR */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Idade: Impressões x CTR</div>
                  <div style={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.demographics.age} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="ageGroup" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                        <YAxis yAxisId="left" orientation="left" stroke="#888" tick={{fill: '#888', fontSize: 11}} />
                        <YAxis yAxisId="right" orientation="right" stroke="#ffb648" tick={{fill: '#ffb648', fontSize: 11}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar yAxisId="left" name="Impressões" dataKey="impr" fill="rgba(255, 90, 0, 0.4)" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" name="CTR (%)" type="monotone" dataKey="ctr" stroke="#ffb648" strokeWidth={3} dot={{r: 4}} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* PIE CHART: GENDER */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Gênero Principal</div>
                  <div style={{ height: 250, width: '100%', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.demographics.gender}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.demographics.gender.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <PieIcon size={24} color="#ff5a00" />
                    </div>
                  </div>
                </div>
              </div>

              {/* CHARTS ROW (WITH COMPARISON) */}
              <div className={styles.chartTitle} style={{ marginTop: '2rem' }}>Desempenho Geral</div>
              <div className={styles.chartsRow}>
                {/* AREA CHART - COMPARISON */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Comparativo de Leads: Semana Atual x Semana Passada</div>
                  <div style={{ height: 300, width: '100%' }}>
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
                        <Area type="monotone" name="Semana Anterior" dataKey="leadsAnterior" stroke="#666" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorLeadsAnterior)" />
                        <Area type="monotone" name="Semana Atual" dataKey="leadsAtual" stroke="#ff5a00" strokeWidth={3} fillOpacity={1} fill="url(#colorLeadsAtual)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BAR CHART - COMPARISON */}
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>Funil Comparativo (x1000)</div>
                  <div style={{ height: 300, width: '100%' }}>
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
                        <Bar dataKey="Semana Passada" fill="#444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Semana Atual" fill="#ff5a00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* AI INSIGHTS SECTION */}
              <div className={styles.aiInsightsBox}>
                <div className={styles.aiHeader}>
                  <Sparkles size={24} color="#ffae80" />
                  <h2 className={styles.aiTitle}>Sugestões de Estratégia ({selectedUnit})</h2>
                </div>
                <div className={styles.aiContent}>
                  {data.insights.map((insight: any, idx: number) => (
                    <div className={styles.aiInsightItem} key={idx}>
                      <Lightbulb size={20} className={styles.aiInsightIcon} />
                      <div>
                        <strong style={{ color: '#ffae80' }}>{insight.title}:</strong> {insight.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "campanhas" && (
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

          {activeTab === "criativos" && (
            <>
              <div className={styles.creativesRow}>
                {data.creatives.map((creative: any) => (
                  <div key={creative.id} className={styles.creativeItem}>
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
    </div>
  );
}
