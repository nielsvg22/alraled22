// Mail versturen via Microsoft Graph (app-only, client credentials). Geen SMTP of mailboxwachtwoord nodig.
// Configuratie via omgevingsvariabelen (nooit in de database of repository):
//   GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_SENDER (de mailbox waarvandaan verstuurd wordt)
export type GraphConfig = { tenantId: string; clientId: string; clientSecret: string; sender: string };

export function getGraphConfig(): GraphConfig | null {
  const tenantId = (process.env.GRAPH_TENANT_ID || '').trim();
  const clientId = (process.env.GRAPH_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GRAPH_CLIENT_SECRET || '').trim();
  const sender = (process.env.GRAPH_SENDER || '').trim();
  if (!tenantId || !clientId || !clientSecret || !sender) return null;
  return { tenantId, clientId, clientSecret, sender };
}

let cached: { token: string; exp: number } | null = null;

async function getToken(cfg: GraphConfig): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(cfg.tenantId)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }).toString(),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`Microsoft-token ophalen mislukt (${res.status}): ${data.error_description || data.error || 'onbekende fout'}`.slice(0, 400));
  cached = { token: data.access_token, exp: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return cached.token;
}

const addr = (a: string) => ({ emailAddress: { address: a.trim() } });
// "Naam" <mail@x.nl> of mail@x.nl → los adres
const bare = (s: string) => (s.match(/<([^>]+)>/)?.[1] || s).trim();

export async function sendViaGraph(cfg: GraphConfig, mail: { to: string; subject: string; text?: string; html?: string; replyTo?: string }): Promise<void> {
  const token = await getToken(cfg);
  const message: any = {
    subject: mail.subject,
    body: mail.html ? { contentType: 'HTML', content: mail.html } : { contentType: 'Text', content: mail.text || '' },
    toRecipients: mail.to.split(',').map((t) => addr(bare(t))).filter((r) => r.emailAddress.address),
  };
  if (mail.replyTo) message.replyTo = [addr(bare(mail.replyTo))];
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(cfg.sender)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });
  if (res.status === 401) cached = null;
  if (!res.ok) {
    const data: any = await res.json().catch(() => ({}));
    throw new Error(`Graph sendMail mislukt (${res.status}): ${data?.error?.message || data?.error?.code || 'onbekende fout'}`.slice(0, 450));
  }
}
