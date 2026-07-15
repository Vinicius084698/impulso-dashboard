import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#fff' }}>
      <h1>Política de Privacidade</h1>
      <p><strong>Última atualização:</strong> 15 de Julho de 2026</p>
      
      <h2>1. Introdução</h2>
      <p>O aplicativo "Integração com impulso dash" (doravante "Nós" ou "Dashboard") respeita a sua privacidade. Esta política explica como coletamos, usamos e protegemos os seus dados quando você utiliza nossa integração com o Facebook.</p>
      
      <h2>2. Dados que Coletamos</h2>
      <p>Ao conectar sua conta do Facebook, solicitamos acesso a:</p>
      <ul>
        <li><strong>Perfil Público:</strong> Nome e foto de perfil para identificação no sistema.</li>
        <li><strong>Facebook Ads (ads_read):</strong> Acesso leitura às suas contas de anúncio, campanhas e criativos para gerar os relatórios e métricas de desempenho apresentados no dashboard.</li>
      </ul>
      
      <h2>3. Como Usamos os Dados</h2>
      <p>Os dados coletados são usados <strong>exclusivamente</strong> para:</p>
      <ul>
        <li>Exibir estatísticas, relatórios e métricas de desempenho de anúncios na interface do seu Dashboard.</li>
        <li>Fornecer insights automatizados sobre suas campanhas.</li>
      </ul>
      <p>Nós não vendemos, alugamos ou compartilhamos seus dados com terceiros. As informações de anúncios são armazenadas apenas temporariamente em sessão segura.</p>

      <h2>4. Proteção de Dados</h2>
      <p>Utilizamos criptografia (HTTPS) e JSON Web Tokens (JWT) para garantir que sua sessão e seus tokens de acesso do Facebook permaneçam seguros e privados, sem exposição em bancos de dados públicos.</p>

      <h2>5. Contato</h2>
      <p>Se tiver dúvidas sobre esta política, entre em contato através do e-mail: viniciusmedeiros8464@outlook.com</p>
    </div>
  );
}
