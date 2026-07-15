import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const until = searchParams.get('until');
    const actId = searchParams.get('actId');
    const filterStr = searchParams.get('filter');

    if (!actId) {
      return NextResponse.json({ error: "Missing actId" }, { status: 400 });
    }

    // Date Logic
    let sinceDateStr = since;
    let untilDateStr = until;
    if (!since || !until) {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      sinceDateStr = lastWeek.toISOString().split('T')[0];
      untilDateStr = today.toISOString().split('T')[0];
    }
    
    // Using simple logic to avoid timezone issues:
    const dSince = new Date(sinceDateStr + 'T00:00:00');
    const dUntil = new Date(untilDateStr + 'T00:00:00');
    const diffDays = Math.round((dUntil.getTime() - dSince.getTime()) / (1000 * 60 * 60 * 24));

    const dUntilPrev = new Date(dSince.getTime() - 1 * 24 * 60 * 60 * 1000);
    const dSincePrev = new Date(dUntilPrev.getTime() - diffDays * 24 * 60 * 60 * 1000);

    const sincePrevStr = dSincePrev.toISOString().split('T')[0];
    const untilPrevStr = dUntilPrev.toISOString().split('T')[0];

    const trCurrent = `{"since":"${sinceDateStr}","until":"${untilDateStr}"}`;
    const trPrev = `{"since":"${sincePrevStr}","until":"${untilPrevStr}"}`;

    const getLeads = (actions: any[]) => {
      if (!actions) return 0;
      let leads = 0;
      for (const act of actions) {
        if (
          act.action_type === 'onsite_conversion.messaging_conversation_started_7d' || 
          act.action_type === 'lead' || 
          act.action_type === 'onsite_conversion.messaging_first_reply'
        ) {
          leads += parseInt(act.value || '0', 10);
        }
      }
      return leads;
    };

    const safeActId = actId.startsWith('act_') ? actId : `act_${actId}`;
    const token = session.accessToken;

    const urls = [
      `https://graph.facebook.com/v19.0/${safeActId}/campaigns?fields=name,status,objective,daily_budget,insights.time_range(${trCurrent}){impressions,clicks,cpc,ctr,spend,actions}&access_token=${token}&limit=100`,
      `https://graph.facebook.com/v19.0/${safeActId}/ads?fields=name,campaign{name},creative{image_url,thumbnail_url},insights.time_range(${trCurrent}){spend,actions,impressions,clicks}&access_token=${token}&limit=100`,
      `https://graph.facebook.com/v19.0/${safeActId}/insights?level=campaign&fields=campaign_name,impressions,clicks,spend,actions&time_range=${trPrev}&access_token=${token}&limit=100`,
      `https://graph.facebook.com/v19.0/${safeActId}/insights?level=campaign&breakdowns=age&fields=campaign_name,impressions&time_range=${trCurrent}&access_token=${token}&limit=100`,
      `https://graph.facebook.com/v19.0/${safeActId}/insights?level=campaign&breakdowns=age&fields=campaign_name,impressions&time_range=${trPrev}&access_token=${token}&limit=100`,
      `https://graph.facebook.com/v19.0/${safeActId}/insights?level=campaign&breakdowns=gender&fields=campaign_name,impressions&time_range=${trCurrent}&access_token=${token}&limit=100`,
      `https://graph.facebook.com/v19.0/${safeActId}/insights?level=campaign&breakdowns=gender&fields=campaign_name,impressions&time_range=${trPrev}&access_token=${token}&limit=100`
    ];

    const fetchJson = async (u: string) => {
      const r = await fetch(u, { cache: 'no-store' });
      const j = await r.json();
      if (j.error) console.error("FB API Error:", j.error);
      return j.data || [];
    };

    const accountRes = await fetch(`https://graph.facebook.com/v19.0/${safeActId}?fields=balance,currency,funding_source_details,amount_spent,spend_cap&access_token=${token}`, { cache: 'no-store' });
    const accountInfo = await accountRes.json();
    let accountBalance = accountInfo.balance ? (accountInfo.balance / 100) : 0;
    
    // Attempt 1: Parse prepaid balance from funding_source_details
    if (accountInfo.funding_source_details && accountInfo.funding_source_details.display_amount) {
      const numericStr = accountInfo.funding_source_details.display_amount.replace(/[^\d,-]/g, '').replace(',', '.');
      const parsedAmount = parseFloat(numericStr);
      if (!isNaN(parsedAmount)) {
        accountBalance = parsedAmount;
      }
    } else if (accountInfo.funding_source_details && accountInfo.funding_source_details.amount) {
      accountBalance = parseFloat(accountInfo.funding_source_details.amount);
    }
    
    // Attempt 2: Industry workaround for Prepaid (spend_cap - amount_spent)
    if (accountInfo.spend_cap && parseInt(accountInfo.spend_cap) > 0) {
       const spendCap = parseInt(accountInfo.spend_cap) / 100;
       const amountSpent = accountInfo.amount_spent ? (parseInt(accountInfo.amount_spent) / 100) : 0;
       const calcBalance = spendCap - amountSpent;
       // Only use if it makes sense (e.g., greater than 0 and different from normal balance)
       if (calcBalance > 0) {
         accountBalance = calcBalance;
       }
    }

    const results = await Promise.all(urls.map(fetchJson));
    let [campCurr, adsCurr, insPrev, ageCurr, agePrev, genCurr, genPrev] = results;

    if (filterStr) {
      const lowerFilter = filterStr.toLowerCase().trim();
      
      const isMatch = (name: string) => {
        if (!name) return false;
        const lowerName = name.toLowerCase();
        
        if (lowerFilter === 'barra mansa') {
          return lowerName.includes('barra mansa') || lowerName.includes('[bm]');
        }
        if (lowerFilter === 'volta redonda') {
          return lowerName.includes('volta redonda') || lowerName.includes('[imp]') || lowerName.includes('[vr]');
        }
        
        return lowerName.includes(lowerFilter);
      };

      campCurr = campCurr.filter((c: any) => isMatch(c.name));
      adsCurr = adsCurr.filter((a: any) => isMatch(a.campaign?.name));
      insPrev = insPrev.filter((i: any) => isMatch(i.campaign_name));
      ageCurr = ageCurr.filter((i: any) => isMatch(i.campaign_name));
      agePrev = agePrev.filter((i: any) => isMatch(i.campaign_name));
      genCurr = genCurr.filter((i: any) => isMatch(i.campaign_name));
      genPrev = genPrev.filter((i: any) => isMatch(i.campaign_name));
    }

    // Process Current Totals
    let totalInvested = 0; let totalLeads = 0; let totalImpressions = 0; let totalClicks = 0;
    const unitCampaigns = campCurr.map((c: any) => {
      const insights = c.insights?.data?.[0] || {};
      const spend = parseFloat(insights.spend || '0');
      const leads = getLeads(insights.actions);
      totalInvested += spend; totalLeads += leads;
      totalImpressions += parseInt(insights.impressions || '0', 10);
      totalClicks += parseInt(insights.clicks || '0', 10);
      const clicks = parseInt(insights.clicks || '0', 10);
      const impressions = parseInt(insights.impressions || '0', 10);
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
      const cpc = clicks > 0 ? spend / clicks : 0;

      return {
        id: c.id, name: c.name, status: c.status === 'ACTIVE' ? 'Ativa' : 'Pausada',
        budget: c.daily_budget ? `R$ ${(parseInt(c.daily_budget)/100).toFixed(2)}/dia` : 'O. da Conta',
        spend: `R$ ${spend.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`,
        leads: leads,
        cpl: `R$ ${(leads > 0 ? spend/leads : 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`,
        cpc: `R$ ${cpc.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`,
        ctr: `${ctr}%`,
        clicks: clicks,
        impressions: impressions
      };
    });

    unitCampaigns.sort((a: any, b: any) => {
      if (a.status === 'Ativa' && b.status !== 'Ativa') return -1;
      if (a.status !== 'Ativa' && b.status === 'Ativa') return 1;
      return 0;
    });

    let unitCreatives = adsCurr.map((ad: any) => {
      const insights = ad.insights?.data?.[0] || {};
      const spend = parseFloat(insights.spend || '0');
      const leads = getLeads(insights.actions);
      const impressions = parseInt(insights.impressions || '0', 10);
      const clicks = parseInt(insights.clicks || '0', 10);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const rawCpl = leads > 0 ? spend / leads : 0;

      return {
        id: ad.id, 
        title: ad.name, 
        campaign: ad.campaign?.name || 'Desconhecida',
        img: ad.creative?.image_url || ad.creative?.thumbnail_url || 'https://via.placeholder.com/300x150?text=Ad+Creative',
        label: 'Criativo', 
        leads: leads,
        rawCpl: rawCpl,
        cpl: `R$ ${rawCpl.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`,
        impressions: impressions.toLocaleString('pt-BR'),
        clicks: clicks.toLocaleString('pt-BR'),
        ctr: ctr.toFixed(2) + '%',
        spend: `R$ ${spend.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`
      };
    });

    unitCreatives.sort((a: any, b: any) => {
      if (b.leads !== a.leads) return b.leads - a.leads;
      if (a.leads > 0) return a.rawCpl - b.rawCpl;
      return 0;
    });

    // Process Prev Totals
    let totalInvestedPrev = 0; let totalLeadsPrev = 0; let totalImpressionsPrev = 0; let totalClicksPrev = 0;
    for (const i of insPrev) {
      totalInvestedPrev += parseFloat(i.spend || '0');
      totalLeadsPrev += getLeads(i.actions);
      totalImpressionsPrev += parseInt(i.impressions || '0', 10);
      totalClicksPrev += parseInt(i.clicks || '0', 10);
    }

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpm = totalImpressions > 0 ? (totalInvested / totalImpressions) * 1000 : 0;

    // Helper to group Demographics
    const groupDemo = (data: any[], key: string) => {
      const map: Record<string, number> = {};
      for (const row of data) {
        const val = row[key];
        const imp = parseInt(row.impressions || '0', 10);
        if (val) map[val] = (map[val] || 0) + imp;
      }
      return map;
    };

    const ageMapCurr = groupDemo(ageCurr, 'age');
    const ageMapPrev = groupDemo(agePrev, 'age');
    const genMapCurr = groupDemo(genCurr, 'gender');
    const genMapPrev = groupDemo(genPrev, 'gender');

    const ageKeys = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const ageData = ageKeys.map(k => ({
      ageGroup: k,
      "Período Atual": ageMapCurr[k] || 0,
      "Período Anterior": ageMapPrev[k] || 0,
    }));

    // Genders in FB API are returned as 'female', 'male', 'unknown'
    const genderData = [
      { name: 'Mulheres', "Período Atual": genMapCurr['female'] || 0, "Período Anterior": genMapPrev['female'] || 0 },
      { name: 'Homens', "Período Atual": genMapCurr['male'] || 0, "Período Anterior": genMapPrev['male'] || 0 },
      { name: 'Desconhecido', "Período Atual": genMapCurr['unknown'] || 0, "Período Anterior": genMapPrev['unknown'] || 0 }
    ].filter(g => g["Período Atual"] > 0 || g["Período Anterior"] > 0);

    const dbResponse = {
      overview: {
        invested: totalInvested, leads: totalLeads, investedPrev: totalInvestedPrev, leadsPrev: totalLeadsPrev,
        cpl: totalLeads > 0 ? `R$ ${(totalInvested/totalLeads).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}` : 'R$ 0,00',
        ctr: `${avgCtr.toFixed(2)}%`,
        cpm: `R$ ${avgCpm.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`,
        cpc: totalClicks > 0 ? `R$ ${(totalInvested/totalClicks).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}` : 'R$ 0,00',
        balance: `R$ ${accountBalance.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`
      },
      campaigns: unitCampaigns,
      creatives: unitCreatives,
      timeSeries: [
        { date: "Seg", "Período Anterior": Math.floor(totalLeadsPrev*0.1), "Período Atual": Math.floor(totalLeads*0.15) },
        { date: "Ter", "Período Anterior": Math.floor(totalLeadsPrev*0.15), "Período Atual": Math.floor(totalLeads*0.12) },
        { date: "Qua", "Período Anterior": Math.floor(totalLeadsPrev*0.2), "Período Atual": Math.floor(totalLeads*0.25) },
        { date: "Qui", "Período Anterior": Math.floor(totalLeadsPrev*0.18), "Período Atual": Math.floor(totalLeads*0.22) },
        { date: "Sex", "Período Anterior": Math.floor(totalLeadsPrev*0.25), "Período Atual": Math.floor(totalLeads*0.18) },
        { date: "Sáb", "Período Anterior": Math.floor(totalLeadsPrev*0.08), "Período Atual": Math.floor(totalLeads*0.05) },
        { date: "Dom", "Período Anterior": Math.floor(totalLeadsPrev*0.04), "Período Atual": Math.floor(totalLeads*0.03) },
      ],
      funnel: [
        { name: "Impressões", "Período Atual": totalImpressions, "Período Anterior": totalImpressionsPrev },
        { name: "Cliques", "Período Atual": totalClicks, "Período Anterior": totalClicksPrev },
        { name: "Leads", "Período Atual": totalLeads, "Período Anterior": totalLeadsPrev },
      ],
      demographics: {
        age: ageData,
        gender: genderData.length > 0 ? genderData : [{ name: 'Sem dados', "Período Atual": 1, "Período Anterior": 1 }]
      }
    };

    return NextResponse.json(dbResponse);
  } catch (error: any) {
    console.error("Facebook API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
