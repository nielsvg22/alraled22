import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../lib/api';
import CustomBlocks from '../components/CustomBlocks';

const DEFAULTS = {
  eyebrow: 'Neem contact op',
  title: 'Contact',
  description: 'Loopt u in het werkveld tegen een probleem aan? Laat het ons weten — wij komen graag bij u langs om samen tot een oplossing te komen.',
  detailsTitle: 'Gegevens',
  addressLabel: 'Adres',
  phoneLabel: 'Telefoon',
  emailLabel: 'Email',
  callTitle: 'Liever direct bellen?',
  callText: 'Onze experts helpen u graag telefonisch.',
  companyDetails: 'Bedrijfsgegevens',
  kvkLabel: 'KvK',
  vatLabel: 'BTW',
  kvkValue: '62609297',
  vatValue: 'NL854885821B01',
  successTitle: 'Bericht verstuurd!',
  successText: 'We nemen zo snel mogelijk contact met u op.',
  newMessage: 'Nieuw bericht',
  errorTitle: 'Er is iets misgegaan',
  errorText: 'Probeer het opnieuw of neem telefonisch contact op.',
  phone: '085-0021 606',
  email: 'info@alra-led.nl',
  address: 'Dijkgraafweg 4a, 7336 AT Apeldoorn',
  form: {
    nameLabel: 'Naam',
    emailLabel: 'Email',
    subjectLabel: 'Onderwerp',
    messageLabel: 'Bericht',
    namePlaceholder: 'Uw naam',
    emailPlaceholder: 'uw@email.nl',
    subjectPlaceholder: 'Waar gaat uw vraag over?',
    messagePlaceholder: 'Hoe kunnen we u helpen?',
    submit: 'Verstuur bericht',
  },
};

const Contact = () => {
  const { i18n } = useTranslation();
  const [info, setInfo] = useState(DEFAULTS);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/contact`, { params: { lang } })
      .then(res => setInfo({ ...DEFAULTS, ...res.data }))
      .catch(() => {});

    axios.get(`${API_URL}/api/content/page_blocks_contact`, { params: { lang } })
      .then(res => setBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBlocks([]));
  }, [i18n.resolvedLanguage, i18n.language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/contact`, { name, email, subject, message });
      setSent(true);
    } catch {
      setError(info.errorText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{info.eyebrow}</p>
          <h1 className="text-3xl md:text-4xl font-black text-secondary">{info.title}</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-xl">{info.description}</p>
        </div>
      </div>

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'top')} />

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">{info.detailsTitle}</p>
              <div className="space-y-4">
                {[
                  { icon: '📍', label: info.addressLabel, value: info.address },
                  { icon: '📞', label: info.phoneLabel, value: info.phone, href: `tel:${info.phone.replace(/[^+\d]/g, '')}` },
                  { icon: '✉️', label: info.emailLabel, value: info.email, href: `mailto:${info.email}` },
                ].map(({ icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-base shrink-0" aria-hidden="true">{icon}</div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm font-medium text-secondary hover:text-primary transition-colors mt-0.5 block">{value}</a>
                      ) : (
                        <p className="text-sm font-medium text-secondary mt-0.5">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-secondary rounded-2xl p-6">
              <p className="text-white font-bold text-sm mb-1">{info.callTitle}</p>
              <p className="text-white/50 text-xs mb-4">{info.callText}</p>
              <a href={`tel:${info.phone.replace(/[^+\d]/g, '')}`} className="block text-center bg-primary text-white text-xs font-bold py-2.5 rounded-xl hover:brightness-110 transition-all">
                {info.phone}
              </a>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{info.companyDetails}</p>
              <p className="text-xs text-gray-500">{info.kvkLabel}: <span className="font-semibold text-secondary">{info.kvkValue}</span></p>
              <p className="text-xs text-gray-500">{info.vatLabel}: <span className="font-semibold text-secondary">{info.vatValue}</span></p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 bg-gray-50 rounded-2xl p-12 text-center border border-gray-100">
                <div className="text-4xl" aria-hidden="true">✅</div>
                <h3 className="font-black text-secondary text-xl">{info.successTitle}</h3>
                <p className="text-gray-400 text-sm">{info.successText}</p>
                <button onClick={() => { setSent(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }} className="text-primary text-sm font-bold hover:underline">{info.newMessage}</button>
              </div>
            ) : (
              <form
                className="bg-gray-50 border border-gray-100 rounded-2xl p-8 space-y-5"
                onSubmit={handleSubmit}
                noValidate
              >
                {error && (
                  <div role="alert" className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-xs font-bold text-secondary uppercase tracking-wider">{info.form?.nameLabel}</label>
                    <input id="contact-name" type="text" required placeholder={info.form?.namePlaceholder} value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-bold text-secondary uppercase tracking-wider">{info.form?.emailLabel}</label>
                    <input id="contact-email" type="email" required placeholder={info.form?.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="text-xs font-bold text-secondary uppercase tracking-wider">{info.form?.subjectLabel}</label>
                  <input id="contact-subject" type="text" placeholder={info.form?.subjectPlaceholder} value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-bold text-secondary uppercase tracking-wider">{info.form?.messageLabel}</label>
                  <textarea id="contact-message" rows={5} required placeholder={info.form?.messagePlaceholder} value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors resize-none" />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-secondary text-white font-bold py-3 rounded-xl hover:bg-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Versturen...
                    </>
                  ) : info.form?.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'bottom')} />
    </div>
  );
};

export default Contact;
