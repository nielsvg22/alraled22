import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Save, Mail, CheckCircle, Send, ChevronDown } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const textareaCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-3 border-b bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors">
        <h3 className="font-bold text-gray-600 text-xs uppercase tracking-widest">{title}</h3>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-6 space-y-4">{children}</div>}
    </div>
  );
}

const VARS_INFO = {
  order: '{{orderId}} {{customerName}} {{customerEmail}} {{total}} {{itemsList}}',
  status: '{{orderId}} {{customerName}} {{status}}',
};

const DEFAULT_SETTINGS = {
  host: 'smtp.gmail.com', port: 587, secure: false,
  user: '', pass: '', fromName: 'ALRA LED Solutions', fromEmail: '', adminEmail: '',
};

const DEFAULT_TEMPLATES = {
  orderConfirmSubject: 'Bevestiging van uw bestelling #{{orderId}}',
  orderConfirmBody: `Beste {{customerName}},\n\nBedankt voor uw bestelling bij ALRA LED Solutions!\n\nOrdernummer: #{{orderId}}\nTotaalbedrag: €{{total}}\n\nBestelde producten:\n{{itemsList}}\n\nWij nemen zo snel mogelijk contact met u op.\n\nMet vriendelijke groet,\nALRA LED Solutions`,
  statusUpdateSubject: 'Update voor uw bestelling #{{orderId}}',
  statusUpdateBody: `Beste {{customerName}},\n\nDe status van uw bestelling #{{orderId}} is bijgewerkt naar: {{status}}\n\nHeeft u vragen? Neem contact op via contact@alraled.nl\n\nMet vriendelijke groet,\nALRA LED Solutions`,
  adminNotifySubject: '🛍️ Nieuwe bestelling #{{orderId}} — €{{total}}',
  adminNotifyBody: `Er is een nieuwe bestelling geplaatst!\n\nOrdernummer: #{{orderId}}\nKlant: {{customerName}} ({{customerEmail}})\nTotaal: €{{total}}\n\nProducten:\n{{itemsList}}`,
};

export default function EmailSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    api.get('/content/email_settings').then(r => setSettings({ ...DEFAULT_SETTINGS, ...r.data })).catch(() => {});
    api.get('/content/email_templates').then(r => setTemplates({ ...DEFAULT_TEMPLATES, ...r.data })).catch(() => {});
  }, []);

  const save = async (key, value, label) => {
    setSaving(true);
    try {
      await api.put(`/content/${key}`, value);
      setSaved(label);
      setTimeout(() => setSaved(''), 2500);
    } catch { }
    finally { setSaving(false); }
  };

  const sendTest = async () => {
    if (!testEmail) return;
    setTesting(true);
    setTestResult('');
    try {
      await api.post('/ai/test-email', { to: testEmail, settings });
      setTestResult('✅ Test email verzonden!');
    } catch (e) {
      setTestResult('❌ ' + (e.response?.data?.error || 'Verzenden mislukt'));
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(''), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Email Instellingen</h1>
        <p className="text-sm text-gray-500 mt-1">Configureer SMTP en pas de email-sjablonen aan.</p>
      </div>

      {/* SMTP */}
      <Section title="SMTP Verbinding">
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Host">
            <input className={inputCls} placeholder="smtp.gmail.com" value={settings.host}
              onChange={e => setSettings({ ...settings, host: e.target.value })} />
          </Field>
          <Field label="Poort">
            <input className={inputCls} type="number" placeholder="587" value={settings.port}
              onChange={e => setSettings({ ...settings, port: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gebruikersnaam (email)">
            <input className={inputCls} placeholder="jouw@gmail.com" value={settings.user}
              onChange={e => setSettings({ ...settings, user: e.target.value })} />
          </Field>
          <Field label="Wachtwoord / App-wachtwoord" hint="Voor Gmail: gebruik een App-wachtwoord uit Google Account → Beveiliging">
            <input className={inputCls} type="password" placeholder="••••••••••••" value={settings.pass}
              onChange={e => setSettings({ ...settings, pass: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Afzendernaam">
            <input className={inputCls} placeholder="ALRA LED Solutions" value={settings.fromName}
              onChange={e => setSettings({ ...settings, fromName: e.target.value })} />
          </Field>
          <Field label="Afzender e-mailadres">
            <input className={inputCls} placeholder="info@alraled.nl" value={settings.fromEmail}
              onChange={e => setSettings({ ...settings, fromEmail: e.target.value })} />
          </Field>
        </div>
        <Field label="Admin notificatie e-mailadres" hint="Hierheen worden nieuwe bestelnotificaties gestuurd">
          <input className={inputCls} placeholder="admin@alraled.nl" value={settings.adminEmail}
            onChange={e => setSettings({ ...settings, adminEmail: e.target.value })} />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <input className={inputCls + ' flex-1'} placeholder="Test-emailadres" value={testEmail}
            onChange={e => setTestEmail(e.target.value)} />
          <button onClick={sendTest} disabled={testing || !testEmail}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
            <Send className="w-4 h-4" />
            {testing ? 'Bezig...' : 'Verstuur test'}
          </button>
        </div>
        {testResult && <p className="text-sm font-medium">{testResult}</p>}

        <button onClick={() => save('email_settings', settings, 'SMTP')}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saved === 'SMTP' ? <><CheckCircle className="w-4 h-4" /> Opgeslagen!</> : <><Save className="w-4 h-4" /> SMTP opslaan</>}
        </button>
      </Section>

      {/* Templates */}
      <Section title="Bestelbevestiging (naar klant)">
        <p className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">Beschikbare variabelen: <code>{VARS_INFO.order}</code></p>
        <Field label="Onderwerp">
          <input className={inputCls} value={templates.orderConfirmSubject}
            onChange={e => setTemplates({ ...templates, orderConfirmSubject: e.target.value })} />
        </Field>
        <Field label="Inhoud">
          <textarea className={textareaCls} rows={10} value={templates.orderConfirmBody}
            onChange={e => setTemplates({ ...templates, orderConfirmBody: e.target.value })} />
        </Field>
      </Section>

      <Section title="Status update (naar klant)">
        <p className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">Beschikbare variabelen: <code>{VARS_INFO.status}</code></p>
        <Field label="Onderwerp">
          <input className={inputCls} value={templates.statusUpdateSubject}
            onChange={e => setTemplates({ ...templates, statusUpdateSubject: e.target.value })} />
        </Field>
        <Field label="Inhoud">
          <textarea className={textareaCls} rows={8} value={templates.statusUpdateBody}
            onChange={e => setTemplates({ ...templates, statusUpdateBody: e.target.value })} />
        </Field>
      </Section>

      <Section title="Admin notificatie (bij nieuwe bestelling)">
        <p className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">Beschikbare variabelen: <code>{VARS_INFO.order}</code></p>
        <Field label="Onderwerp">
          <input className={inputCls} value={templates.adminNotifySubject}
            onChange={e => setTemplates({ ...templates, adminNotifySubject: e.target.value })} />
        </Field>
        <Field label="Inhoud">
          <textarea className={textareaCls} rows={8} value={templates.adminNotifyBody}
            onChange={e => setTemplates({ ...templates, adminNotifyBody: e.target.value })} />
        </Field>
      </Section>

      <div className="pb-6">
        <button onClick={() => save('email_templates', templates, 'templates')}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saved === 'templates' ? <><CheckCircle className="w-4 h-4" /> Opgeslagen!</> : <><Save className="w-4 h-4" /> Sjablonen opslaan</>}
        </button>
      </div>
    </div>
  );
}
