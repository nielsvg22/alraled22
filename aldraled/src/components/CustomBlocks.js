import React from 'react';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../lib/api';

/* ─────────────────────────────────────────────────────────
   Shared high-end block renderer — used by Home, About,
   Contact, Blog and any future page.
   Each block: { id, type, data, visible }
───────────────────────────────────────────────────────── */

/* ── Banner ──────────────────────────────────────────── */
function BannerBlock({ data }) {
  return (
    <section
      style={{ background: `linear-gradient(135deg, ${data.bgColor || '#0c4684'} 0%, ${data.bgColor || '#0c4684'}cc 100%)` }}
      className="relative overflow-hidden py-20 px-6"
    >
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
        style={{ background: data.textColor || '#fff' }} />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-5"
        style={{ background: data.textColor || '#fff' }} />

      <div className="relative max-w-4xl mx-auto text-center space-y-5"
        style={{ color: data.textColor || '#ffffff' }}>
        <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
          {data.heading}
        </h2>
        {data.subtext && (
          <p className="text-lg opacity-75 max-w-2xl mx-auto font-light leading-relaxed">
            {data.subtext}
          </p>
        )}
        {data.buttonText && (
          <div className="pt-2">
            <Link to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-full font-bold text-sm hover:scale-105 hover:shadow-xl transition-all duration-300">
              {data.buttonText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Text Block ──────────────────────────────────────── */
function TextBlock({ data }) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="h-px w-12 bg-primary/40" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-6">
          {data.heading}
        </h2>
        {data.body && (
          <p className="text-gray-500 text-lg leading-relaxed font-light whitespace-pre-wrap">
            {data.body}
          </p>
        )}
      </div>
    </section>
  );
}

/* ── Feature Grid ────────────────────────────────────── */
function FeatureGrid({ data }) {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {data.heading && (
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{data.heading}</h2>
            <div className="flex justify-center mt-4">
              <div className="h-1 w-16 rounded-full bg-primary" />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(data.items || []).map((item, i) => (
            <div key={i}
              className="group bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-primary/20 transition-colors">
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Image + Text ────────────────────────────────────── */
function ImageTextBlock({ data }) {
  const isRight = data.imagePosition === 'right';
  return (
    <section className="py-20 px-6 bg-white overflow-hidden">
      <div className={`max-w-5xl mx-auto flex flex-col ${isRight ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-14`}>
        {data.imageUrl && (
          <div className="flex-1 w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img src={getMediaUrl(data.imageUrl)} alt={data.heading}
                className="w-full h-72 md:h-96 object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        )}
        <div className="flex-1 space-y-5">
          <div className="h-1 w-12 rounded-full bg-primary" />
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{data.heading}</h2>
          <p className="text-gray-500 leading-relaxed text-lg font-light whitespace-pre-wrap">{data.body}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Stats Row ───────────────────────────────────────── */
function StatsRow({ data }) {
  return (
    <section className="py-16 px-6 bg-gradient-to-r from-primary/5 via-white to-primary/5 border-y border-primary/10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center divide-x divide-primary/10">
          {(data.items || []).map((item, i) => (
            <div key={i} className="flex-1 min-w-[140px] text-center px-8 py-4">
              <p className="text-5xl font-black text-primary leading-none">{item.number}</p>
              <p className="text-sm text-gray-500 mt-2 font-semibold uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA Block ───────────────────────────────────────── */
function CtaBlock({ data }) {
  return (
    <section className="py-20 px-6 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgb(var(--color-primary)/0.15),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgb(var(--color-primary)/0.08),_transparent_60%)]" />
      <div className="relative max-w-3xl mx-auto text-center space-y-5">
        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">{data.heading}</h2>
        {data.subtext && <p className="text-white/50 text-lg font-light">{data.subtext}</p>}
        <div className="flex flex-wrap justify-center gap-4 pt-3">
          {data.primaryButton && (
            <Link to="/contact"
              className="px-8 py-3.5 bg-primary text-white rounded-full font-bold text-sm hover:brightness-110 hover:scale-105 transition-all shadow-lg shadow-primary/30">
              {data.primaryButton}
            </Link>
          )}
          {data.secondaryButton && (
            <Link to="/producten"
              className="px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white/20 hover:scale-105 transition-all">
              {data.secondaryButton}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Steps ───────────────────────────────────────────── */
function StepsBlock({ data }) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {data.heading && (
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{data.heading}</h2>
            <div className="flex justify-center mt-4">
              <div className="h-1 w-16 rounded-full bg-primary" />
            </div>
          </div>
        )}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {(data.items || []).map((step, i) => (
              <div key={i} className="text-center group">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary font-black text-xl mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                  {step.number}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Blog Post Card ──────────────────────────────────── */
function BlogPostBlock({ data }) {
  return (
    <article className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      {data.imageUrl && (
        <div className="relative h-52 overflow-hidden">
          <img src={getMediaUrl(data.imageUrl)} alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}
      <div className="p-7 space-y-3">
        {data.date && (
          <p className="text-xs font-bold text-primary uppercase tracking-widest">{data.date}</p>
        )}
        <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-primary transition-colors">
          {data.title}
        </h3>
        {data.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{data.excerpt}</p>
        )}
        {data.author && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {data.author[0]}
            </div>
            <span className="text-xs font-semibold text-gray-500">{data.author}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function LayoutBuilderBlock({ data }) {
  const background = data?.background || 'white';
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const container = data?.container || 'wide';
  const variant = data?.variant || 'plain';
  const gap = data?.gap || 'md';
  const padding = data?.padding || 'lg';
  const sectionClass = background === 'dark'
    ? 'py-20 px-6 bg-secondary'
    : background === 'gray'
      ? 'py-20 px-6 bg-gray-50'
      : 'py-20 px-6 bg-white';
  const textColor = background === 'dark' ? 'text-white' : 'text-secondary';
  const subTextColor = background === 'dark' ? 'text-white/60' : 'text-gray-500';
  const divider = background === 'dark' ? 'bg-white/10' : 'bg-gray-100';
  const containerClass = container === 'narrow' ? 'max-w-3xl' : container === 'normal' ? 'max-w-5xl' : 'max-w-6xl';
  const gapClass = gap === 'sm' ? 'space-y-3' : gap === 'lg' ? 'space-y-10' : 'space-y-6';
  const padClass = padding === 'md' ? 'p-8' : 'p-10';

  return (
    <section className={sectionClass}>
      <div className={`${containerClass} mx-auto`}>
        <div className={`${variant === 'card' ? `rounded-3xl ${padClass} ${background === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}` : ''}`}>
          <div className={gapClass}>
            {elements.map((e) => {
              if (!e || !e.type) return null;
              if (e.type === 'spacer') return <div key={e.id} style={{ height: Number(e.size) || 24 }} />;

              if (e.type === 'heading') {
                const align = e.align === 'center' ? 'text-center' : 'text-left';
                const level = Number(e.level) || 2;
                const cls = level === 3
                  ? `text-2xl md:text-3xl font-black tracking-tight ${textColor} ${align}`
                  : level === 4
                    ? `text-xl md:text-2xl font-black tracking-tight ${textColor} ${align}`
                    : `text-3xl md:text-4xl font-black tracking-tight ${textColor} ${align}`;
                const Tag = level === 4 ? 'h4' : level === 3 ? 'h3' : 'h2';
                return <Tag key={e.id} className={cls}>{e.text}</Tag>;
              }

              if (e.type === 'text') {
                const align = e.align === 'center' ? 'text-center' : 'text-left';
                return (
                  <p key={e.id} className={`text-lg leading-relaxed font-light whitespace-pre-wrap ${subTextColor} ${align}`}>
                    {e.text}
                  </p>
                );
              }

              if (e.type === 'image') {
                if (!e.url) return null;
                const explicitW = Number(e.widthPx);
                const explicitH = Number(e.heightPx);
                const maxWidth = Number.isFinite(explicitW) && explicitW > 0
                  ? explicitW
                  : e.size === 'sm' ? 420 : e.size === 'md' ? 640 : e.size === 'xl' ? 1024 : e.size === 'full' ? '100%' : 800;
                const align = e.align === 'left' ? 'justify-start' : e.align === 'right' ? 'justify-end' : 'justify-center';
                const ratio = e.aspect === '4:3' ? '4 / 3' : e.aspect === '1:1' ? '1 / 1' : e.aspect === 'auto' ? null : '16 / 9';
                const frame = e.style === 'frame';
                const shadow = e.style === 'shadow';
                const borderStyle = frame
                  ? (background === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0')
                  : 'none';
                return (
                  <div key={e.id} className={`flex ${align}`}>
                    <div style={{ width: '100%', maxWidth }}>
                      <div
                        className={`overflow-hidden ${e.rounded === false ? 'rounded-xl' : 'rounded-3xl'} ${shadow ? 'shadow-2xl' : ''}`}
                        style={{
                          border: borderStyle,
                          aspectRatio: (Number.isFinite(explicitH) && explicitH > 0) ? undefined : (ratio || undefined),
                          height: Number.isFinite(explicitH) && explicitH > 0 ? explicitH : (ratio ? undefined : (Number(e.height) || 320)),
                          background: background === 'dark' ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                        }}
                      >
                        <img
                          src={getMediaUrl(e.url)}
                          alt={e.alt || ''}
                          className="w-full h-full"
                          style={{ objectFit: e.fit === 'contain' ? 'contain' : 'cover' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (e.type === 'button') {
                const buttonVariant = e.variant || 'primary';
                const className = buttonVariant === 'secondary'
                  ? background === 'dark'
                    ? 'px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white/20 transition-all inline-flex'
                    : 'px-8 py-3.5 bg-secondary text-white rounded-full font-bold text-sm hover:bg-primary transition-all inline-flex'
                  : 'px-8 py-3.5 bg-primary text-white rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30 inline-flex';
                const href = e.href || '/contact';
                const align = e.align === 'center' ? 'justify-center' : 'justify-start';
                const Wrapper = ({ children }) => (
                  <div className={`flex ${align}`}>
                    {children}
                  </div>
                );
                if (href.startsWith('/')) {
                  return (
                    <Wrapper key={e.id}>
                      <Link to={href} className={className}>{e.text}</Link>
                    </Wrapper>
                  );
                }
                return (
                  <Wrapper key={e.id}>
                    <a href={href} className={className} rel="noreferrer">{e.text}</a>
                  </Wrapper>
                );
              }

              if (e.type === 'divider') {
                return <div key={e.id} className={`h-px w-full ${divider}`} />;
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Renderer ───────────────────────────────────── */
export default function CustomBlocks({ blocks = [] }) {
  const visible = blocks.filter(b => b.visible !== false);
  if (!visible.length) return null;

  // Blog posts are grouped into a grid section
  const blogPosts = visible.filter(b => b.type === 'blog_post');
  const otherBlocks = visible.filter(b => b.type !== 'blog_post');

  return (
    <>
      {otherBlocks.map(block => {
        const { id, type, data } = block;
        switch (type) {
          case 'banner':       return <BannerBlock      key={id} data={data} />;
          case 'text_block':   return <TextBlock        key={id} data={data} />;
          case 'feature_grid': return <FeatureGrid      key={id} data={data} />;
          case 'image_text':   return <ImageTextBlock   key={id} data={data} />;
          case 'stats_row':    return <StatsRow         key={id} data={data} />;
          case 'cta_block':    return <CtaBlock         key={id} data={data} />;
          case 'steps':        return <StepsBlock       key={id} data={data} />;
          case 'layout_builder': return <LayoutBuilderBlock key={id} data={data} />;
          default:             return null;
        }
      })}

      {blogPosts.length > 0 && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-black text-gray-900">Blog</h2>
              <div className="flex justify-center mt-4">
                <div className="h-1 w-16 rounded-full bg-primary" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {blogPosts.map(b => <BlogPostBlock key={b.id} data={b.data} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
