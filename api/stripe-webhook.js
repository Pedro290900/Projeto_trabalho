import { buffer } from 'micro';
import Stripe from 'stripe';
import { Resend } from 'resend';

// ======================
// 1. CONFIGURAÇÃO INICIAL
// ======================
// ... (imports e configurações anteriores)

// Função para obter o segredo do webhook correto
function getWebhookSecret() {
  // Se a chave secreta começa com 'sk_test_', use o segredo de teste
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    if (!process.env.STRIPE_WEBHOOK_SECRET_TEST) {
      throw new Error('STRIPE_WEBHOOK_SECRET_TEST não configurado');
    }
    return process.env.STRIPE_WEBHOOK_SECRET_TEST;
  }
  // Senão, use o segredo de produção
  if (!process.env.STRIPE_WEBHOOK_SECRET_LIVE) {
    throw new Error('STRIPE_WEBHOOK_SECRET_LIVE não configurado');
  }
  return process.env.STRIPE_WEBHOOK_SECRET_LIVE;
}


// Validação das variáveis de ambiente essenciais
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Variável STRIPE_SECRET_KEY não configurada');
}
if (!process.env.RESEND_API_KEY) {
  throw new Error('Variável RESEND_API_KEY não configurada');
}

// Configuração do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil', // Atualize para a versão mais recente
});

// Configuração do Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_VERIFIED_EMAIL || 'onboarding@resend.dev';

// ======================
// 2. FUNÇÕES AUXILIARES
// ======================

/**
 * Obtém o segredo do webhook conforme ambiente (teste/produção)
 */
function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 
    (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') 
      ? process.env.STRIPE_WEBHOOK_SECRET_TEST 
      : process.env.STRIPE_WEBHOOK_SECRET_LIVE);

  if (!secret) {
    throw new Error('Nenhum segredo de webhook configurado');
  }
  return secret;
}

/**
 * Template de e-mail de confirmação
 */
function getConfirmationEmail(name) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Olá <strong>${name}</strong>!</p>
      <p>Seu pagamento foi confirmado com sucesso! 🎉</p>
      <p>Recebemos seu pedido e já estamos começando a produção.</p>
      <p>Você receberá atualizações em breve.</p>
      <br/>
      <p style="font-size: 12px; color: #666;">
        Este e-mail foi gerado automaticamente após confirmação de pagamento.
      </p>
    </div>
  `;
}

// ======================
// 3. HANDLER PRINCIPAL
// ======================

export const config = {
  api: { bodyParser: false }, // Necessário para webhooks
};

export default async function handler(req, res) {
  // Verifica o método HTTP
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ 
      error: 'Método não permitido',
      allowed: ['POST'] 
    });
  }

  try {
    // Verifica a assinatura do webhook
    const sig = req.headers['stripe-signature'];
    const buf = await buffer(req);
    const webhookSecret = getWebhookSecret();
    
    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log(`🔔 Evento recebido: ${event.type}`);

    // Processa eventos de checkout completo
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extrai dados do cliente
      const email = session.customer_details?.email || session.customer_email;
      const name = session.metadata?.name || 'Cliente';

      if (!email) {
        console.warn('⚠️ E-mail não encontrado na sessão:', session.id);
        return res.status(200).json({ received: true });
      }

      // Envia e-mail de confirmação
      try {
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Pagamento confirmado! Pedido recebido',
          html: getConfirmationEmail(name),
        });

        console.log(`✉️ E-mail enviado para: ${email}`);

        // Notificação para admin (opcional)
        if (process.env.ADMIN_EMAIL) {
          await resend.emails.send({
            from: fromEmail,
            to: process.env.ADMIN_EMAIL,
            subject: `🎉 Novo pedido de ${name}`,
            html: `
              <p>Novo pedido confirmado:</p>
              <ul>
                <li><strong>Cliente:</strong> ${name}</li>
                <li><strong>E-mail:</strong> ${email}</li>
                <li><strong>ID Sessão:</strong> ${session.id}</li>
                <li><strong>Valor:</strong> ${(session.amount_total / 100).toFixed(2)} ${session.currency}</li>
              </ul>
            `
          });
        }

      } catch (emailError) {
        console.error('❌ Erro ao enviar e-mail:', emailError);
        // Não quebra o fluxo do webhook
      }
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('❌ Erro no webhook:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({ 
      error: 'Erro no processamento',
      message: err.message 
    });
  }
}import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const handleStripeCheckout = async (pkgPrice) => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Falha ao carregar o Stripe');
    }

    // Verificar se estamos em modo de teste
    const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');
    
    if (isTestMode) {
      console.log('🧪 Modo de teste ativo - Use cartões de teste do Stripe');
    }

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(pkgPrice * 100), // Garante que é inteiro (centavos)
        currency: 'eur',
        mode: 'payment',
        test_mode: isTestMode, // Informar se é teste
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na API');
    }

    const { sessionId, error } = await response.json();

    if (error) {
      throw new Error(error);
    }

    if (!sessionId) {
      throw new Error('ID da sessão de checkout não recebido');
    }

    // Redireciona para o checkout do Stripe
    const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
    
    if (redirectError) {
      throw new Error(redirectError.message);
    }

  } catch (error) {
    console.error('Erro no processo de checkout:', error);
    
    // Mostrar erro amigável para o usuário
    if (error.message.includes('Falha ao carregar o Stripe')) {
      alert('Erro ao carregar sistema de pagamento. Verifique sua conexão.');
    } else {
      alert(`Erro no checkout: ${error.message}`);
    }
    
    throw error;
  }
};

// Função auxiliar para cartões de teste
export const getTestCards = () => {
  return {
    success: '4242424242424242',
    declined: '4000000000000002',
    requiresAuth: '4000002500003155',
  };
};