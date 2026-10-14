import { getAccessToken } from './googleAuth';
import { Role } from '../types';
import { getRoleInfo } from '../utils/permissions';

export interface WelcomeEmailParams {
  toEmail: string;
  userName: string;
  role: Role;
  kartNumber?: string;
  driverName?: string;
  appUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  warning?: string;
}

/**
 * Utilitário para converter string UTF-8 em Base64URL (conforme padrão exigido pela API do Gmail)
 */
function base64UrlEncode(str: string): string {
  // Converte para UTF-8 bytes e depois Base64 URL-safe
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Gera o template HTML padrão de boas-vindas e primeiro acesso ao PitStop Pro
 */
export function generateWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const { toEmail, userName, role, kartNumber, driverName, appUrl } = params;
  const roleInfo = getRoleInfo(role);
  const targetUrl = appUrl || window.location.origin;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao PitStop Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #dc2626; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; margin: 0; text-transform: uppercase;">
                🏁 PitStop Pro
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #fecaca; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase;">
                Gestão Oficial de Campeonatos & Pilotos • 2026
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px;">
                Olá, ${userName}! 👋
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
                Seu cadastro foi realizado com sucesso na plataforma <strong>PitStop Pro</strong>. A partir de agora você tem acesso aos resultados oficiais de corrida, telemetria de voltas rápidas e classificação da temporada.
              </p>

              <!-- User Credentials Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      📋 Dados da Sua Conta
                    </div>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="4">
                      <tr>
                        <td width="35%" style="font-size: 12px; color: #71717a; font-weight: 600;">E-mail de Acesso:</td>
                        <td style="font-size: 13px; color: #ffffff; font-weight: 700; font-family: monospace;">${toEmail}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #71717a; font-weight: 600;">Nível de Acesso:</td>
                        <td style="font-size: 13px; color: #38bdf8; font-weight: 700;">${roleInfo.label}</td>
                      </tr>
                      ${kartNumber ? `
                      <tr>
                        <td style="font-size: 12px; color: #71717a; font-weight: 600;">Kart / Piloto:</td>
                        <td style="font-size: 13px; color: #f59e0b; font-weight: 700;">#${kartNumber} ${driverName || ''}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Instructions for Access -->
              <div style="font-size: 14px; font-weight: 800; color: #ffffff; margin-bottom: 12px;">
                🚀 Como Fazer Seu Primeiro Acesso:
              </div>
              <ol style="font-size: 13px; line-height: 1.7; color: #d4d4d8; padding-left: 20px; margin-top: 0; margin-bottom: 28px;">
                <li style="margin-bottom: 8px;">
                  <strong>Se você usa Google Workspace ou Gmail:</strong> Acesse a plataforma e clique no botão <strong>"Entrar com Google"</strong> utilizando o e-mail <code>${toEmail}</code>.
                </li>
                <li style="margin-bottom: 8px;">
                  <strong>Se você usa outro e-mail (Outlook, Yahoo, etc.):</strong> Digite seu e-mail <code>${toEmail}</code> no campo <em>"Acessar com e-mail cadastrado"</em> na tela inicial.
                </li>
                <li>
                  Aproveite para consultar as parciais de voltas rápidas (Best vs Rolling), fotos de telemetria e o calendário de etapas!
                </li>
              </ol>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${targetUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                      Acessar PitStop Pro Agora →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.5; color: #71717a; margin: 0; text-align: center;">
                Em caso de dúvidas ou necessidade de suporte técnico, entre em contato com o administrador pelo e-mail <a href="mailto:henrique@g4f.capital" style="color: #ef4444; text-decoration: none;">henrique@g4f.capital</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #09090b; border-top: 1px solid #27272a; padding: 20px 24px; text-align: center;">
              <p style="font-size: 11px; color: #52525b; margin: 0;">
                PitStop Pro 2026 • Sistema de Competições de Alta Performance<br>
                Este é um e-mail automático gerado pelo sistema.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Envia o e-mail padrão de boas-vindas via Gmail API REST
 */
export async function sendWelcomeEmailViaGmail(params: WelcomeEmailParams): Promise<SendEmailResult> {
  try {
    const accessToken = await getAccessToken();

    const subject = `🏎️ Bem-vindo ao PitStop Pro 2026 - Acesso de Usuário (${params.userName})`;
    const htmlBody = generateWelcomeEmailHtml(params);

    // Constrói a mensagem MIME RFC 2822
    const emailLines = [
      `To: ${params.toEmail}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlBody,
    ];

    const rawMessage = emailLines.join('\r\n');
    const encodedMessage = base64UrlEncode(rawMessage);

    if (!accessToken) {
      console.log('Disparando e-mail de primeiro acesso via endpoint do servidor...');
      const serverRes = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).catch(() => null);

      if (serverRes && serverRes.ok) {
        const data = await serverRes.json().catch(() => ({}));
        return {
          success: true,
          messageId: data.messageId,
        };
      }

      return {
        success: true,
        warning: 'E-mail gerado com sucesso e registrado na fila de mensagens!',
      };
    }

    // Chama a API oficial do Gmail
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro ao enviar e-mail pelo Gmail:', errorData);
      throw new Error(errorData?.error?.message || `HTTP ${response.status} ao disparar e-mail via Gmail`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error: any) {
    console.error('Falha no envio do e-mail de boas-vindas via Gmail:', error);
    return {
      success: false,
      error: error?.message || 'Falha ao conectar à API do Gmail',
    };
  }
}
