import nodemailer from 'nodemailer';
import { getContent } from '../db/contentRepo';

type EmailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  adminEmail: string;
};

type EmailTemplates = {
  orderConfirmSubject: string;
  orderConfirmBody: string;
  statusUpdateSubject: string;
  statusUpdateBody: string;
  adminNotifySubject: string;
  adminNotifyBody: string;
};

const DEFAULT_TEMPLATES: EmailTemplates = {
  orderConfirmSubject: 'Bevestiging van uw bestelling #{{orderId}}',
  orderConfirmBody: `Beste {{customerName}}, bedankt voor uw bestelling #{{orderId}}. Totaal: €{{total}}.`,
  statusUpdateSubject: 'Update voor uw bestelling #{{orderId}}',
  statusUpdateBody: `Beste {{customerName}}, uw bestelling #{{orderId}} heeft nu status: {{status}}.`,
  adminNotifySubject: 'Nieuwe bestelling #{{orderId}} — €{{total}}',
  adminNotifyBody: `Nieuwe bestelling van {{customerName}} ({{customerEmail}}). Totaal: €{{total}}.`,
};

// ── Vertalingen voor klantmails (nl = standaard, aanpasbaar via templates in het CRM) ──
type Lang = 'nl' | 'en' | 'de';
export function normLang(l?: string | null): Lang { return l === 'en' || l === 'de' ? l : 'nl'; }
const EM = {
  nl: { thanks: 'Bedankt voor uw bestelling!', dear: 'Beste', received: 'uw bestelling is succesvol ontvangen.', orderNo: 'Ordernummer', total: 'Totaal', items: 'Bestelde producten', what: 'Wat gebeurt er nu?', whatText: 'Wij verwerken uw bestelling en nemen indien nodig contact met u op. U ontvangt een email zodra uw bestelling wordt verzonden.', myOrders: 'Mijn bestellingen bekijken →', statusTitle: 'Statusupdate bestelling', statusIntro: 'er is een update voor uw bestelling.', newStatus: 'Nieuwe status', questions: 'Heeft u vragen over uw bestelling? Neem gerust contact op via', myOrders2: 'Mijn bestellingen →', customer: 'Klant', product: 'Product', qty: 'Aantal', amount: 'Bedrag' },
  en: { thanks: 'Thank you for your order!', dear: 'Dear', received: 'your order has been received successfully.', orderNo: 'Order number', total: 'Total', items: 'Ordered products', what: 'What happens now?', whatText: 'We are processing your order and will contact you if necessary. You will receive an email as soon as your order is shipped.', myOrders: 'View my orders →', statusTitle: 'Order status update', statusIntro: 'there is an update on your order.', newStatus: 'New status', questions: 'Do you have questions about your order? Feel free to contact us at', myOrders2: 'My orders →', customer: 'Customer', product: 'Product', qty: 'Quantity', amount: 'Amount' },
  de: { thanks: 'Vielen Dank für Ihre Bestellung!', dear: 'Guten Tag', received: 'Ihre Bestellung ist erfolgreich eingegangen.', orderNo: 'Bestellnummer', total: 'Gesamt', items: 'Bestellte Produkte', what: 'Wie geht es weiter?', whatText: 'Wir bearbeiten Ihre Bestellung und melden uns bei Bedarf bei Ihnen. Sie erhalten eine E-Mail, sobald Ihre Bestellung versendet wird.', myOrders: 'Meine Bestellungen ansehen →', statusTitle: 'Statusupdate zur Bestellung', statusIntro: 'es gibt ein Update zu Ihrer Bestellung.', newStatus: 'Neuer Status', questions: 'Haben Sie Fragen zu Ihrer Bestellung? Kontaktieren Sie uns gerne unter', myOrders2: 'Meine Bestellungen →', customer: 'Kunde', product: 'Produkt', qty: 'Anzahl', amount: 'Betrag' },
} as const;
const STATUS_LABELS: Record<Lang, Record<string, string>> = {
  nl: { PENDING: 'In afwachting', PROCESSING: 'In behandeling', SHIPPED: 'Verzonden', DELIVERED: 'Afgeleverd', CANCELLED: 'Geannuleerd' },
  en: { PENDING: 'Pending', PROCESSING: 'Processing', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' },
  de: { PENDING: 'Ausstehend', PROCESSING: 'In Bearbeitung', SHIPPED: 'Versendet', DELIVERED: 'Zugestellt', CANCELLED: 'Storniert' },
};
const BASE_TEMPLATES: Record<'en' | 'de', EmailTemplates> = {
  en: { orderConfirmSubject: 'Confirmation of your order #{{orderId}}', orderConfirmBody: 'Dear {{customerName}}, thank you for your order #{{orderId}}. Total: €{{total}}.\n\n{{itemsList}}', statusUpdateSubject: 'Update on your order #{{orderId}}', statusUpdateBody: 'Dear {{customerName}}, your order #{{orderId}} now has status: {{status}}.', adminNotifySubject: '', adminNotifyBody: '' },
  de: { orderConfirmSubject: 'Bestätigung Ihrer Bestellung #{{orderId}}', orderConfirmBody: 'Guten Tag {{customerName}}, vielen Dank für Ihre Bestellung #{{orderId}}. Gesamt: €{{total}}.\n\n{{itemsList}}', statusUpdateSubject: 'Update zu Ihrer Bestellung #{{orderId}}', statusUpdateBody: 'Guten Tag {{customerName}}, Ihre Bestellung #{{orderId}} hat jetzt den Status: {{status}}.', adminNotifySubject: '', adminNotifyBody: '' },
};

// ── HTML wrapper ─────────────────────────────────────────────────
function htmlWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ALRA LED Solutions</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0c2d5e;border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:#f59e0b;border-radius:8px;padding:6px 14px;margin-bottom:16px;">
              <span style="color:#fff;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">ALRA LED Solutions</span>
            </div>
            <div style="width:48px;height:2px;background:#f59e0b;margin:0 auto;border-radius:2px;"></div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0c2d5e;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:12px;">ALRA LED Solutions</p>
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">
              Heeft u vragen? <a href="mailto:contact@alraled.nl" style="color:#f59e0b;text-decoration:none;">contact@alraled.nl</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Order confirmation HTML ──────────────────────────────────────
function orderConfirmHtml(vars: {
  lang?: Lang;
  orderId: string;
  customerName: string;
  total: string;
  itemsHtml: string;
}): string {
  const e = EM[vars.lang || 'nl'];
  return htmlWrapper(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0c2d5e;letter-spacing:-0.5px;">
      ${e.thanks}
    </h1>
    <p style="margin:0 0 28px;color:#6b7280;font-size:15px;">
      ${e.dear} <strong style="color:#1f2937;">${vars.customerName}</strong>, ${e.received}
    </p>

    <!-- Order badge -->
    <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-bottom:28px;display:inline-block;width:100%;box-sizing:border-box;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;">${e.orderNo}</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#0c2d5e;font-family:monospace;">#${vars.orderId}</p>
          </td>
          <td align="right">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;">${e.total}</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#f59e0b;">€${vars.total}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Items -->
    <h2 style="margin:0 0 14px;font-size:13px;font-weight:700;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;">${e.items}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #f3f4f6;">${e.product}</th>
          <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #f3f4f6;">${e.qty}</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #f3f4f6;">${e.amount}</th>
        </tr>
      </thead>
      <tbody>
        ${vars.itemsHtml}
      </tbody>
    </table>

    <!-- Next steps -->
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:14px;color:#92400e;">
        <strong>${e.what}</strong> ${e.whatText}
      </p>
    </div>

    <a href="http://localhost:3000/account"
       style="display:inline-block;background:#0c2d5e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.02em;">
      ${e.myOrders}
    </a>
  `);
}

// ── Status update HTML ───────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING:    { color: '#92400e', bg: '#fffbeb', icon: '⏳', label: 'In afwachting' },
  PROCESSING: { color: '#1e40af', bg: '#eff6ff', icon: '⚙️', label: 'In behandeling' },
  SHIPPED:    { color: '#065f46', bg: '#ecfdf5', icon: '🚚', label: 'Verzonden' },
  DELIVERED:  { color: '#14532d', bg: '#f0fdf4', icon: '✅', label: 'Afgeleverd' },
  CANCELLED:  { color: '#7f1d1d', bg: '#fef2f2', icon: '❌', label: 'Geannuleerd' },
};

function statusUpdateHtml(vars: {
  lang?: Lang;
  orderId: string;
  customerName: string;
  status: string;
}): string {
  const e = EM[vars.lang || 'nl'];
  const cfg0 = STATUS_CONFIG[vars.status] || { color: '#1f2937', bg: '#f9fafb', icon: '📦', label: vars.status };
  const cfg = { ...cfg0, label: STATUS_LABELS[vars.lang || 'nl'][vars.status] || cfg0.label };
  return htmlWrapper(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0c2d5e;">
      ${e.statusTitle}
    </h1>
    <p style="margin:0 0 28px;color:#6b7280;font-size:15px;">
      ${e.dear} <strong style="color:#1f2937;">${vars.customerName}</strong>, ${e.statusIntro}
    </p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">${e.orderNo}</p>
      <p style="margin:0;font-size:20px;font-weight:800;color:#0c2d5e;font-family:monospace;">#${vars.orderId}</p>
    </div>

    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;">${e.newStatus}</p>
    <div style="background:${cfg.bg};border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:10px;">${cfg.icon}</div>
      <p style="margin:0;font-size:20px;font-weight:800;color:${cfg.color};">${cfg.label}</p>
    </div>

    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      ${e.questions} <a href="mailto:contact@alraled.nl" style="color:#0c2d5e;font-weight:700;">contact@alraled.nl</a>.
    </p>

    <a href="http://localhost:3000/account"
       style="display:inline-block;background:#0c2d5e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;">
      ${e.myOrders2}
    </a>
  `);
}

// ── Admin notification HTML ──────────────────────────────────────
function adminNotifyHtml(vars: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: string;
  itemsHtml: string;
}): string {
  return htmlWrapper(`
    <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">🛍️ Er is een nieuwe bestelling binnengekomen!</p>
    </div>

    <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#0c2d5e;">
      Bestelling #${vars.orderId}
    </h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Klant</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#1f2937;">${vars.customerName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">E-mail</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
          <a href="mailto:${vars.customerEmail}" style="font-size:14px;font-weight:600;color:#0c2d5e;text-decoration:none;">${vars.customerEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;">
          <span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Totaal</span>
        </td>
        <td style="padding:10px 0;text-align:right;">
          <span style="font-size:20px;font-weight:800;color:#f59e0b;">€${vars.total}</span>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 14px;font-size:13px;font-weight:700;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;">Producten</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;border-bottom:2px solid #f3f4f6;">Product</th>
          <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;border-bottom:2px solid #f3f4f6;">Aantal</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;border-bottom:2px solid #f3f4f6;">Bedrag</th>
        </tr>
      </thead>
      <tbody>
        ${vars.itemsHtml}
      </tbody>
    </table>

    <a href="http://localhost:5174/orders"
       style="display:inline-block;background:#0c2d5e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;">
      Bekijk in CRM →
    </a>
  `);
}

// ── Helpers ──────────────────────────────────────────────────────
async function getSettings(): Promise<EmailSettings | null> {
  try {
    const raw = await getContent('email_settings');
    if (!raw || typeof raw !== 'object') return null;
    const s = raw as Partial<EmailSettings>;
    if (!s.host || !s.user || !s.pass) return null;
    return {
      host: String(s.host),
      port: Number(s.port ?? 587),
      secure: Boolean(s.secure ?? false),
      user: String(s.user),
      pass: String(s.pass),
      fromName: String(s.fromName ?? ''),
      fromEmail: String(s.fromEmail ?? ''),
      adminEmail: String(s.adminEmail ?? ''),
    };
  } catch { return null; }
}

async function getTemplates(): Promise<EmailTemplates> {
  try {
    const raw = await getContent('email_templates');
    if (!raw || typeof raw !== 'object') return DEFAULT_TEMPLATES;
    return { ...DEFAULT_TEMPLATES, ...(raw as Partial<EmailTemplates>) };
  } catch { return DEFAULT_TEMPLATES; }
}

function createTransport(settings: EmailSettings) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port || 587,
    secure: settings.secure || false,
    auth: { user: settings.user, pass: settings.pass },
  });
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.split(`{{${key}}}`).join(val),
    template
  );
}

function buildItemsHtml(items: { product: { name: string } | null; quantity: number; price: number }[]): string {
  return items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding:12px 14px;font-size:14px;color:#1f2937;font-weight:500;border-bottom:1px solid #f3f4f6;">
        ${item.product?.name || 'Product'}
      </td>
      <td style="padding:12px 14px;font-size:14px;color:#6b7280;text-align:center;border-bottom:1px solid #f3f4f6;">
        ${item.quantity}×
      </td>
      <td style="padding:12px 14px;font-size:14px;font-weight:700;color:#0c2d5e;text-align:right;border-bottom:1px solid #f3f4f6;">
        €${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
}

// ── Public send functions ─────────────────────────────────────────
export async function sendOrderConfirmation(order: {
  id: string;
  language?: string | null;
  total: number;
  user: { name: string; email: string } | null;
  items: { product: { name: string } | null; quantity: number; price: number }[];
}) {
  const settings = await getSettings();
  if (!settings) return;

  const customerEmail = order.user?.email;
  if (!customerEmail) return;

  const lang = normLang(order.language);
  const templates = lang === 'nl' ? await getTemplates() : { ...(await getTemplates()), ...BASE_TEMPLATES[lang] };
  const orderId = order.id.slice(0, 8).toUpperCase();
  const customerName = order.user?.name || EM[lang].customer;
  const total = order.total.toFixed(2);

  const textVars = {
    orderId, customerName, customerEmail, total,
    itemsList: order.items.map(i => `- ${i.product?.name || 'Product'} x${i.quantity} — €${(i.price * i.quantity).toFixed(2)}`).join('\n'),
  };

  const transport = createTransport(settings);
  await transport.sendMail({
    from: `"${settings.fromName || 'ALRA LED Solutions'}" <${settings.fromEmail || settings.user}>`,
    to: customerEmail,
    subject: fillTemplate(templates.orderConfirmSubject, textVars),
    text: fillTemplate(templates.orderConfirmBody, textVars),
    html: orderConfirmHtml({ lang, orderId, customerName, total, itemsHtml: buildItemsHtml(order.items) }),
  });
}

export async function sendAdminNotification(order: {
  id: string;
  total: number;
  user: { name: string; email: string } | null;
  items: { product: { name: string } | null; quantity: number; price: number }[];
}) {
  const settings = await getSettings();
  if (!settings?.adminEmail) return;

  const templates = await getTemplates();
  const orderId = order.id.slice(0, 8).toUpperCase();
  const customerName = order.user?.name || 'Onbekende klant';
  const customerEmail = order.user?.email || '-';
  const total = order.total.toFixed(2);

  const textVars = {
    orderId, customerName, customerEmail, total,
    itemsList: order.items.map(i => `- ${i.product?.name || 'Product'} x${i.quantity} — €${(i.price * i.quantity).toFixed(2)}`).join('\n'),
  };

  const transport = createTransport(settings);
  await transport.sendMail({
    from: `"${settings.fromName || 'ALRA LED Solutions'}" <${settings.fromEmail || settings.user}>`,
    to: settings.adminEmail,
    subject: fillTemplate(templates.adminNotifySubject, textVars),
    text: fillTemplate(templates.adminNotifyBody, textVars),
    html: adminNotifyHtml({ orderId, customerName, customerEmail, total, itemsHtml: buildItemsHtml(order.items) }),
  });
}

// ── Contact form admin notification ──────────────────────────────
export async function sendContactAdminNotification(submission: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const settings = await getSettings();
  if (!settings) return;

  const transport = createTransport(settings);
  await transport.sendMail({
    from: `"${settings.fromName || 'ALRA LED Solutions'}" <${settings.fromEmail || settings.user}>`,
    to: settings.adminEmail || settings.user,
    subject: `Nieuw contactformulier — ${submission.name}`,
    text: `Naam: ${submission.name}\nE-mail: ${submission.email}\nOnderwerp: ${submission.subject || '-'}\n\nBericht:\n${submission.message}`,
    html: htmlWrapper(`
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#1e40af;">📩 Er is een nieuw bericht verzonden via het contactformulier!</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Naam</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
            <span style="font-size:14px;font-weight:600;color:#1f2937;">${submission.name}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">E-mail</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
            <a href="mailto:${submission.email}" style="font-size:14px;font-weight:600;color:#0c2d5e;text-decoration:none;">${submission.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Onderwerp</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
            <span style="font-size:14px;font-weight:600;color:#1f2937;">${submission.subject || '-'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Bericht</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:14px 18px;background:#f9fafb;border-radius:12px;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">
            ${submission.message}
          </td>
        </tr>
      </table>
    `),
  });
}

export async function sendStatusUpdate(order: {
  id: string;
  language?: string | null;
  status: string;
  user: { name: string; email: string } | null;
}) {
  const settings = await getSettings();
  if (!settings) return;

  const customerEmail = order.user?.email;
  if (!customerEmail) return;

  const lang = normLang(order.language);
  const templates = lang === 'nl' ? await getTemplates() : { ...(await getTemplates()), ...BASE_TEMPLATES[lang] };
  const orderId = order.id.slice(0, 8).toUpperCase();
  const customerName = order.user?.name || EM[lang].customer;
  const statusText = STATUS_LABELS[lang][order.status] || STATUS_CONFIG[order.status]?.label || order.status;

  const textVars = { orderId, customerName, status: statusText };

  const transport = createTransport(settings);
  await transport.sendMail({
    from: `"${settings.fromName || 'ALRA LED Solutions'}" <${settings.fromEmail || settings.user}>`,
    to: customerEmail,
    subject: fillTemplate(templates.statusUpdateSubject, textVars),
    text: fillTemplate(templates.statusUpdateBody, textVars),
    html: statusUpdateHtml({ lang, orderId, customerName, status: order.status }),
  });
}
