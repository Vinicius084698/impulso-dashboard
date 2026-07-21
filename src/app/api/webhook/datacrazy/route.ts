import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Impulso Ads - DataCrazy Webhook Integration',
    endpoint: 'https://impulso-dashboard-qpcy.vercel.app/api/webhook/datacrazy',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log('Received DataCrazy Webhook payload:', JSON.stringify(body, null, 2));

    const {
      pixel_id,
      access_token,
      event_name = 'Purchase',
      value = 0,
      currency = 'BRL',
      email,
      phone,
      fbclid,
      client_user_agent,
      client_ip_address
    } = body;

    // Optional: Forward directly to Meta Conversions API (CAPI) if credentials are provided in payload
    let metaResponse = null;
    if (pixel_id && access_token) {
      const eventTime = Math.floor(Date.now() / 1000);
      const metaPayload = {
        data: [
          {
            event_name: event_name,
            event_time: eventTime,
            action_source: 'system_generated',
            user_data: {
              em: email ? [crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex')] : undefined,
              ph: phone ? [crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex')] : undefined,
              client_user_agent: client_user_agent || undefined,
              client_ip_address: client_ip_address || undefined,
              fbc: fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined
            },
            custom_data: {
              currency: currency,
              value: parseFloat(value) || 0
            }
          }
        ]
      };

      const res = await fetch(`https://graph.facebook.com/v19.0/${pixel_id}/events?access_token=${access_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaPayload)
      });
      metaResponse = await res.json();
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook recebido com sucesso',
      forwarded_to_meta: !!metaResponse,
      meta_response: metaResponse,
      received_payload: body
    }, { status: 200 });

  } catch (error: any) {
    console.error('DataCrazy Webhook Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno ao processar webhook'
    }, { status: 500 });
  }
}
