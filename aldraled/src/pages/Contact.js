import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL, getMediaUrl } from '../lib/api';
import { ROUTES } from '../lib/routes';
import CustomBlocks from '../components/CustomBlocks';

const B = '#0B67D8';

const HERO_IMG = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600';
const MAP_URL = 'https://www.openstreetmap.org/export/embed.html?bbox=5.932,52.206,5.942,52.216&layer=mapnik&marker=52.211,5.937';

const DEFAULTS = {
  eyebrow: 'Neem contact op',
  title: 'Heeft u een vraag, advies nodig of wilt u een offerte?',
  description: 'Laat het ons weten. Wij denken graag mee over de juiste LED-oplossing voor uw situatie.',
  detailsTitle: 'Contactgegevens',
  addressLabel: 'Adres',
  phoneLabel: 'Telefoon',
  emailLabel: 'Email',
  callTitle: 'Liever direct bellen?',
  callText: 'Onze experts helpen u graag telefonisch. Bel gerust!',
  companyDetails: 'Bedrijfsgegevens',
  kvkLabel: 'KvK',
  vatLabel: 'BTW',
  ibanLabel: 'IBAN',
  kvkValue: '62609297',
  vatValue: 'NL854885821B01',
  ibanValue: '',
  mapTitle: 'Onze locatie',
  mapSubtitle: 'Kom gerust langs op ons kantoor in Apeldoorn.',
  mapEmbedUrl: '',
  ctaTitle: 'Klaar om te beginnen?',
  ctaText: 'Vertel ons waar u verlichting voor nodig hebt. Wij adviseren de juiste oplossing.',
  ctaShopButton: 'Bekijk producten',
  ctaContactButton: 'Neem contact op',
  successTitle: 'Bericht verstuurd!',
  successText: 'We nemen zo snel mogelijk contact met u op.',
  newMessage: 'Nieuw bericht',
  errorTitle: 'Er is iets misgegaan',
  errorText: 'Probeer het opnieuw of neem telefonisch contact op.',
  phone: '085-0021 606',
  email: 'info@alra-led.nl',
  address: 'Dijkgraafweg 4a, 7336 AT Apeldoorn',
  heroImage: '',
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

/* ── Inline SVG-iconen ─────────────────────────────────────────── */
const Ic = ({ className = 'w-5 h-5', children }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconMapPin = (p) => <Ic {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Ic>;
const IconPhone = (p) => <Ic {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" /></Ic>;
const IconMail = (p) => <Ic {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></Ic>;
const IconArrow = (p) => <Ic {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Ic>;
const IconCheck = (p) => <Ic {...p}><path d="M20 6L9 17l-5-5" /></Ic>;
const IconBuilding = (p) => <Ic {...p}><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" /></Ic>;

const Eyebrow = ({ children, light }) => (
  <span className={`inline-flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] ${light ? 'text-white/80' : 'text-primary'}`}>
    <span className={`h-px w-8 ${light ? 'bg-white/40' : 'bg-[#0B67D8]'}`} />
    {children}
  </span>
);

const SectionTitle = ({ children, light }) => (
  <h2 className={`mt-4 text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-tight ${light ? 'text-white' : 'text-secondary'}`}>
    {children}
  </h2>
);

/* ── Formulier-element ─────────────────────────────────────────── */
const InputField = ({ id, label, type = 'text', placeholder, value, onChange, error, required }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-bold text-secondary uppercase tracking-wider">{label}{required && ' *'}</label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      aria-invalid={!!error || undefined}
      className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${error ? 'border-red-400 focus:border-red-500' : 'border-[#E4EAF1] focus:border-[#0B67D8]'}`}
    />
    {error && <p className="text-red-500 text-[11px] font-medium mt-0.5" role="alert">{error}</p>}
  </div>
);

/* ── HOOFDCOMPONENT ────────────────────────────────────────────── */
const Contact = () => {
  const { i18n } = useTranslation();
  const [info, setInfo] = useState(DEFAULTS);
  const [blocks, setBlocks] = useState([]);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/contact`, { params: { lang } })
      .then(res => setInfo({ ...DEFAULTS, ...res.data, form: { ...DEFAULTS.form, ...(res.data?.form || {}) } }))
      .catch(() => {});

    axios.get(`${API_URL}/api/content/page_blocks_contact`, { params: { lang } })
      .then(res => setBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBlocks([]));
  }, [i18n.resolvedLanguage, i18n.language]);

  const clientValidate = () => {
    const errs = {};
    if (!name.trim() || name.trim().length < 2) errs.name = 'Vul uw naam in (min. 2 tekens)';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Vul een geldig e-mailadres in';
    if (!message.trim() || message.trim().length < 5) errs.message = 'Bericht moet minimaal 5 tekens bevatten';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!clientValidate()) return;

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/contact`, { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      setSent(true);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.fields && typeof data.fields === 'object') {
        setFieldErrors(data.fields);
        const first = formRef.current?.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
      } else {
        setServerError(data?.error || info.errorText);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSent(false);
    setServerError('');
    setFieldErrors({});
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const contactCards = [
    { icon: IconMapPin, label: info.addressLabel, value: info.address, href: null },
    { icon: IconPhone, label: info.phoneLabel, value: info.phone, href: `tel:${info.phone.replace(/[^+\d]/g, '')}` },
    { icon: IconMail, label: info.emailLabel, value: info.email, href: `mailto:${info.email}` },
  ];

  const companyFields = [
    { label: info.kvkLabel, value: info.kvkValue },
    { label: info.vatLabel, value: info.vatValue },
    ...(info.ibanValue ? [{ label: info.ibanLabel, value: info.ibanValue }] : []),
  ].filter(f => f.value);

  return (
    <div className="bg-white">

      {/* ══ HERO — tekst links, foto rechts ══ */}
      <section className="relative overflow-hidden bg-white">
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[57%]">
          <img src={getMediaUrl(info.heroImage) || HERO_IMG} alt="ALRA LED Solutions — neem contact op" className="w-full h-full object-cover" loading="eager" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:min-h-[560px] items-center">
          <div className="max-w-xl space-y-6">
            <Eyebrow>{info.eyebrow}</Eyebrow>
            <h1 className="text-[clamp(2.1rem,4.8vw,4.4rem)] font-extrabold leading-[1.04] tracking-tight text-secondary">{info.title}</h1>
            <p className="text-[17px] leading-relaxed text-slate-500 max-w-lg">{info.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a href="#contact-form" className="inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/25">
                Stuur een bericht <IconArrow className="w-4 h-4" />
              </a>
              <a href={`tel:${info.phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center justify-center gap-2 border border-slate-200 text-secondary font-bold text-sm px-7 py-3.5 rounded-[10px] bg-white hover:border-[#0B67D8]/40 hover:text-[#0B67D8] transition-all">
                Bel direct
              </a>
            </div>
          </div>

          {/* Mobiele hero-foto */}
          <div className="lg:hidden">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <img src={getMediaUrl(info.heroImage) || HERO_IMG} alt="ALRA LED Solutions" className="w-full h-full object-cover" loading="eager" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTACT KAARTEN ══ */}
      <section className="bg-[#F5F8FC] border-y border-[#E4EAF1]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:divide-x lg:divide-[#E4EAF1]">
            {contactCards.map(card => {
              const Icon = card.icon;
              const Wrapper = card.href ? 'a' : 'div';
              const wrapperProps = card.href ? { href: card.href } : {};
              return (
                <Wrapper key={card.label} {...wrapperProps} className={`flex items-start gap-4 py-8 px-4 sm:px-8 group ${card.href ? 'cursor-pointer hover:bg-white transition-colors rounded-xl' : ''}`}>
                  <span className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: B }}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                    <p className={`text-[15px] font-bold leading-snug mt-1 ${card.href ? 'group-hover:text-[#0B67D8] transition-colors text-secondary' : 'text-secondary'}`}>
                      {card.value}
                    </p>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FORM + SIDEBAR ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-white" id="contact-form">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">
          {/* Formulier */}
          <div>
            {sent ? (
              <div className="bg-[#F5F8FC] border border-[#E4EAF1] rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-green-100 text-green-600 mx-auto mb-5">
                  <IconCheck className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-secondary text-2xl">{info.successTitle}</h3>
                <p className="text-slate-500 text-[15px] mt-2">{info.successText}</p>
                <button
                  onClick={resetForm}
                  className="mt-6 inline-flex items-center justify-center gap-2 text-[#0B67D8] font-bold text-sm hover:underline"
                >
                  {info.newMessage} <IconArrow className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate className="bg-[#F5F8FC] border border-[#E4EAF1] rounded-2xl p-8 sm:p-10 space-y-6">
                {serverError && (
                  <div role="alert" className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{serverError}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField id="contact-name" label={info.form?.nameLabel} placeholder={info.form?.namePlaceholder} value={name} onChange={e => setName(e.target.value)} error={fieldErrors.name} required />
                  <InputField id="contact-email" label={info.form?.emailLabel} type="email" placeholder={info.form?.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} error={fieldErrors.email} required />
                </div>
                <InputField id="contact-subject" label={info.form?.subjectLabel} placeholder={info.form?.subjectPlaceholder} value={subject} onChange={e => setSubject(e.target.value)} />
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-bold text-secondary uppercase tracking-wider">{info.form?.messageLabel} *</label>
                  <textarea
                    id="contact-message"
                    rows={6}
                    placeholder={info.form?.messagePlaceholder}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.message || undefined}
                    className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none ${fieldErrors.message ? 'border-red-400 focus:border-red-500' : 'border-[#E4EAF1] focus:border-[#0B67D8]'}`}
                  />
                  {fieldErrors.message && <p className="text-red-500 text-[11px] font-medium" role="alert">{fieldErrors.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-secondary text-white font-bold py-3.5 rounded-[10px] hover:bg-[#0B67D8] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-secondary/20"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Versturen…</>
                  ) : info.form?.submit}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 self-start lg:sticky lg:top-28">
            {/* Direct bellen card */}
            <div className="bg-[#07192D] rounded-2xl p-6 text-white space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10">
                <IconPhone className="w-5 h-5" />
              </div>
              <p className="font-extrabold text-[17px] leading-snug">{info.callTitle}</p>
              <p className="text-white/50 text-[13px] leading-relaxed">{info.callText}</p>
              <a href={`tel:${info.phone.replace(/[^+\d]/g, '')}`} className="block text-center bg-[#0B67D8] text-white font-bold text-sm py-3 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/30">
                {info.phone}
              </a>
            </div>

            {/* Bedrijfsgegevens */}
            {companyFields.length > 0 && (
              <div className="bg-[#F5F8FC] border border-[#E4EAF1] rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0B67D8]/10 text-[#0B67D8]">
                    <IconBuilding className="w-[18px] h-[18px]" />
                  </span>
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">{info.companyDetails}</p>
                </div>
                {companyFields.map(f => (
                  <div key={f.label} className="flex items-baseline justify-between text-[13px]">
                    <span className="text-slate-400">{f.label}</span>
                    <span className="font-bold text-secondary">{f.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ LOCATIE — MAP ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-[#F5F8FC] border-y border-[#E4EAF1]">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 items-center">
          <div className="space-y-5">
            <Eyebrow>{info.mapTitle}</Eyebrow>
            <SectionTitle>{info.mapSubtitle}</SectionTitle>
            <div className="space-y-3 text-[15px] text-slate-500 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: B }}>
                  <IconMapPin className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <p className="font-bold text-secondary">{info.address}</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&query=${encodeURIComponent(info.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#0B67D8] font-bold text-sm hover:underline pt-1"
              >
                Plan route <IconArrow className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(7,27,54,0.25)] border border-[#E4EAF1] bg-slate-100 h-[320px] sm:h-[380px] lg:h-[480px]">
            <iframe
              src={info.mapEmbedUrl || MAP_URL}
              title="ALRA LED Solutions locatie op kaart"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ══ AFSLUITENDE CTA ══ */}
      <section className="py-16 lg:py-20 px-5 sm:px-8 lg:px-10 bg-white">
        <div className="max-w-[1240px] mx-auto">
          <div className="rounded-[18px] overflow-hidden border border-[#E4EAF1] bg-[#F5F8FC] grid grid-cols-1 lg:grid-cols-[1fr_auto]">
            <div className="px-8 md:px-12 py-10 md:py-12">
              <h2 className="text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold leading-[1.06] tracking-tight text-secondary">{info.ctaTitle}</h2>
              <p className="text-slate-500 text-[15px] leading-relaxed mt-3 max-w-lg">{info.ctaText}</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <Link to={ROUTES.shop} className="inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/25">
                  {info.ctaShopButton} <IconArrow className="w-4 h-4" />
                </Link>
                <Link to={ROUTES.contact} className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white text-secondary font-bold text-sm px-7 py-3.5 rounded-[10px] hover:border-[#0B67D8]/40 hover:text-[#0B67D8] transition-all">
                  {info.ctaContactButton}
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center lg:w-[320px]">
              <div className="w-56 h-56 rounded-xl overflow-hidden rotate-2">
                <img src={getMediaUrl(info.heroImage) || HERO_IMG} alt="ALRA LED Solutions" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'bottom')} />
    </div>
  );
};

export default Contact;