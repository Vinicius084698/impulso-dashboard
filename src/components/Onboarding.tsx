import React, { useState, useEffect } from "react";
import { Check, Save, AlertCircle } from "lucide-react";

export default function Onboarding({ onSaveSuccess }: { onSaveSuccess: () => void }) {
  const [fbAccounts, setFbAccounts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/facebook/adaccounts");
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
        } else if (data.adAccounts) {
          setFbAccounts(data.adAccounts);
        }
      } catch (err) {
        setError("Falha ao buscar contas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(accId => accId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const selectedAccountsData = fbAccounts.filter(acc => selectedIds.includes(acc.account_id));
    
    try {
      const res = await fetch("/api/user/adaccounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedAccounts: selectedAccountsData })
      });
      
      const data = await res.json();
      if (data.success) {
        onSaveSuccess();
      } else {
        setError("Erro ao salvar seleções.");
      }
    } catch (err) {
      setError("Erro de rede ao salvar.");
    }
  };

  if (isLoading) {
    return <div style={{ color: "#ff5a00", padding: "2rem" }}>Buscando contas de anúncio na Meta...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "#ef4444", padding: "2rem", display: "flex", gap: "10px" }}>
        <AlertCircle /> Erro: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", background: "#111", borderRadius: "12px", border: "1px solid #333", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Selecione suas Franquias</h2>
      <p style={{ color: "#a1a1aa", marginBottom: "2rem" }}>
        Encontramos as seguintes contas de anúncios vinculadas ao seu perfil. Selecione quais franquias você deseja monitorar no Dashboard.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "2rem", maxHeight: "400px", overflowY: "auto" }}>
        {fbAccounts.map((acc) => {
          const isSelected = selectedIds.includes(acc.account_id);
          return (
            <div 
              key={acc.account_id}
              onClick={() => toggleSelection(acc.account_id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "1rem", borderRadius: "8px", cursor: "pointer",
                background: isSelected ? "rgba(255, 90, 0, 0.1)" : "#1a1a24",
                border: isSelected ? "1px solid #ff5a00" : "1px solid #2a2a35",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#fff", fontWeight: "500" }}>{acc.name}</span>
                <span style={{ color: "#71717a", fontSize: "0.85rem" }}>ID: {acc.account_id}</span>
              </div>
              <div style={{ 
                width: "24px", height: "24px", borderRadius: "4px", 
                border: isSelected ? "none" : "2px solid #52525b",
                background: isSelected ? "#ff5a00" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {isSelected && <Check size={16} color="#fff" />}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={handleSave}
        disabled={selectedIds.length === 0}
        style={{
          width: "100%", padding: "12px", borderRadius: "8px", border: "none",
          background: selectedIds.length > 0 ? "#ff5a00" : "#3f3f46",
          color: "#fff", fontWeight: "bold", cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}
      >
        <Save size={18} /> Salvar Franquias
      </button>
    </div>
  );
}
