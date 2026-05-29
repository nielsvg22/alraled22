import { API_URL } from './api';

const ANALYTICS_API = `${API_URL}/api/analytics`;

class Analytics {
  constructor() {
    this.sessionId = this.getSessionId();
    this.visitId = null;
    this.pageStartTime = Date.now();
    this.trackingEnabled = true;
    this.deviceInfo = this.getDeviceInfo();
    this.init();
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      device = /iPad/.test(ua) ? 'tablet' : 'mobile';
    }

    if (ua.includes('Chrome')) browser = 'chrome';
    else if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Safari')) browser = 'safari';
    else if (ua.includes('Edge')) browser = 'edge';

    if (ua.includes('Windows')) os = 'windows';
    else if (ua.includes('Mac')) os = 'macos';
    else if (ua.includes('Linux')) os = 'linux';
    else if (ua.includes('Android')) os = 'android';
    else if (ua.includes('iOS')) os = 'ios';

    return { device, browser, os };
  }

  async init() {
    await this.trackVisit();
    this.trackPageView();
    this.setupEventListeners();
  }

  getUTMParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || null;
  }

  async trackVisit() {
    try {
      const isNewVisitor = !localStorage.getItem('analytics_visited_before');
      if (isNewVisitor) {
        localStorage.setItem('analytics_visited_before', 'true');
      }

      const visitData = {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
        utmSource: this.getUTMParam('utm_source'),
        utmMedium: this.getUTMParam('utm_medium'),
        utmCampaign: this.getUTMParam('utm_campaign'),
        device: this.deviceInfo.device,
        browser: this.deviceInfo.browser,
        os: this.deviceInfo.os,
        isNewVisitor: isNewVisitor ? 1 : 0,
        landingPage: window.location.pathname + window.location.search,
      };

      const response = await fetch(`${ANALYTICS_API}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData),
      });

      if (response.ok) {
        const data = await response.json();
        this.visitId = data.visitId;
      }
    } catch (error) {
      console.warn('Analytics visit tracking failed:', error);
    }
  }

  trackPageView() {
    if (!this.trackingEnabled || !this.visitId) return;

    this.sendToBackend(`${ANALYTICS_API}/pageview`, {
      visitId: this.visitId,
      url: window.location.pathname + window.location.search,
      title: document.title,
      referrer: document.referrer || null,
    });
  }

  trackEvent(type, category = null, action = null, label = null, value = null, metadata = null) {
    if (!this.trackingEnabled || !this.visitId) return;

    this.sendToBackend(`${ANALYTICS_API}/event`, {
      visitId: this.visitId,
      type,
      category,
      action,
      label,
      value,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  }

  trackClick(element, category = 'click', label = null) {
    this.trackEvent('click', category, 'click', label || element.textContent?.trim(), null, {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      href: element.href,
    });
  }

  trackAddToCart(productId, price, quantity = 1) {
    this.trackEvent('add_to_cart', 'ecommerce', 'add_to_cart', String(productId), price * quantity, { quantity });
  }

  trackRemoveFromCart(productId, price, quantity = 1) {
    this.trackEvent('remove_from_cart', 'ecommerce', 'remove_from_cart', String(productId), price * quantity, { quantity });
  }

  trackCheckoutStart() {
    this.trackEvent('checkout_start', 'ecommerce', 'checkout_start', 'checkout_process');
  }

  trackCheckoutComplete(orderId, amount) {
    this.trackEvent('checkout_complete', 'ecommerce', 'checkout_complete', String(orderId), amount);
  }

  setupEventListeners() {
    window.addEventListener('beforeunload', () => {
      if (this.visitId) {
        const timeOnPage = Date.now() - this.pageStartTime;
        this.sendToBackend(`${ANALYTICS_API}/pageview/update`, {
          visitId: this.visitId,
          timeOnPage: Math.floor(timeOnPage / 1000),
          isExit: 1,
        }, true);
      }
    });

    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, [data-track]');
      if (target) {
        const trackData = target.dataset.track;
        if (trackData) {
          try {
            const data = JSON.parse(trackData);
            this.trackClick(target, data.category, data.label);
          } catch {
            this.trackClick(target, 'click', trackData);
          }
        } else {
          this.trackClick(target);
        }
      }
    });

    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.id) {
        this.trackEvent('form_submit', 'form', 'submit', form.id, null, {
          action: form.action,
          method: form.method,
        });
      }
    });

    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }
    });

    window.addEventListener('beforeunload', () => {
      if (maxScroll > 0 && this.visitId) {
        this.sendToBackend(`${ANALYTICS_API}/pageview/update`, {
          visitId: this.visitId,
          scrollDepth: maxScroll,
        }, true);
      }
    });
  }

  async sendToBackend(endpoint, data, isBeacon = false) {
    if (!this.trackingEnabled) return;

    const payload = JSON.stringify(data);

    if (isBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, payload);
      return;
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    } catch (error) {
      console.warn('Analytics send failed:', error);
    }
  }

  disable() {
    this.trackingEnabled = false;
  }

  enable() {
    this.trackingEnabled = true;
  }
}

const analytics = new Analytics();
window.analytics = analytics;
export default analytics;
