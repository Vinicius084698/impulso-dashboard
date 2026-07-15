import React from 'react';

export default function DataDeletion() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#fff' }}>
      <h1>Instruções de Exclusão de Dados</h1>
      <p><strong>Última atualização:</strong> 15 de Julho de 2026</p>
      
      <p>O aplicativo "Integração com impulso dash" não salva seus dados pessoais, publicações ou informações do Facebook em nenhum banco de dados permanente. Tudo é processado em tempo real e armazenado apenas temporariamente durante a sua sessão.</p>

      <h2>Como remover a integração e excluir os dados:</h2>
      <p>Se você deseja remover a nossa integração e garantir que não tenhamos mais acesso à sua conta, siga estes passos simples diretamente no seu Facebook:</p>
      
      <ol style={{ lineHeight: '2' }}>
        <li>Acesse a sua conta do Facebook e vá em <strong>Configurações e privacidade</strong> &gt; <strong>Configurações</strong>.</li>
        <li>No menu esquerdo, role para baixo e clique em <strong>Aplicativos e sites</strong>.</li>
        <li>Encontre o aplicativo <strong>"Integração com impulso dash"</strong> na lista de aplicativos ativos.</li>
        <li>Clique em <strong>Remover</strong> ao lado do nome do aplicativo.</li>
        <li>Siga as instruções na tela para confirmar a remoção.</li>
      </ol>
      
      <p>Assim que você remover a integração, nós perderemos instantaneamente qualquer acesso às suas contas de anúncio e o seu token de acesso será permanentemente invalidado.</p>

      <h2>Dúvidas?</h2>
      <p>Para suporte ou dúvidas sobre a exclusão de dados, entre em contato através de: viniciusmedeiros8464@outlook.com</p>
    </div>
  );
}
