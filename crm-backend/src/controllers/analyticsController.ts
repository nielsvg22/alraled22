import { Response, Request } from 'express';
import { db } from '../lib/db';
import { visits, pageViews, analyticsEvents } from '../db/schema';
import { eq, and, gte, lte, sql, desc, count, avg, sum } from 'drizzle-orm';
import { z } from 'zod';

const visitSchema = z.object({
  sessionId: z.string(),
  userAgent: z.string().optional(),
  referrer: z.string().nullable().optional(),
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  isNewVisitor: z.number().optional(),
  landingPage: z.string().optional(),
});

const pageViewSchema = z.object({
  visitId: z.string().uuid(),
  url: z.string(),
  title: z.string().optional(),
  referrer: z.string().nullable().optional(),
  timeOnPage: z.number().optional(),
  scrollDepth: z.number().optional(),
  isExit: z.number().optional(),
});

const eventSchema = z.object({
  visitId: z.string().uuid(),
  type: z.enum(['click', 'view', 'form_submit', 'purchase', 'add_to_cart', 'remove_from_cart', 'checkout_start', 'checkout_complete', 'error']),
  category: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  value: z.number().nullable().optional(),
  metadata: z.string().nullable().optional(),
});

// Get client IP from request
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// Get location from IP (simplified - in production use a proper IP geolocation service)
async function getLocationFromIP(ip: string): Promise<{ country: string | null; city: string | null }> {
  // This is a placeholder - in production you'd use a service like MaxMind GeoIP2
  // For now, return null values
  return { country: null, city: null };
}

export const trackVisit = async (req: Request, res: Response) => {
  try {
    const data = visitSchema.parse(req.body);
    const ip = getClientIP(req);
    const location = await getLocationFromIP(ip);

    const visitData = {
      id: crypto.randomUUID(),
      sessionId: data.sessionId,
      userAgent: data.userAgent || null,
      ip: ip,
      referrer: data.referrer || null,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      country: location.country,
      city: location.city,
      device: data.device || null,
      browser: data.browser || null,
      os: data.os || null,
      isNewVisitor: data.isNewVisitor || 1,
      landingPage: data.landingPage || null,
    };

    await db.insert(visits).values(visitData);
    res.json({ visitId: visitData.id });
  } catch (error) {
    console.error('Track visit error:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
};

export const trackPageView = async (req: Request, res: Response) => {
  try {
    const data = pageViewSchema.parse(req.body);
    const pageViewData = {
      id: crypto.randomUUID(),
      ...data,
    };

    await db.insert(pageViews).values(pageViewData);
    
    // Update visit page view count
    await db.update(visits)
      .set({ 
        pageViews: sql`${visits.pageViews} + 1`,
        updatedAt: new Date()
      })
      .where(eq(visits.id, data.visitId));

    res.json({ success: true });
  } catch (error) {
    console.error('Track page view error:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
};

export const updatePageView = async (req: Request, res: Response) => {
  try {
    const { visitId, timeOnPage, scrollDepth, isExit } = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (timeOnPage !== undefined) updateData.timeOnPage = timeOnPage;
    if (scrollDepth !== undefined) updateData.scrollDepth = scrollDepth;
    if (isExit !== undefined) updateData.isExit = isExit;

    // Update the latest page view for this visit
    await db.update(pageViews)
      .set(updateData)
      .where(and(
        eq(pageViews.visitId, visitId),
        sql`id = (SELECT id FROM ${pageViews} WHERE visitId = ${visitId} ORDER BY createdAt DESC LIMIT 1)`
      ));

    // Update visit duration and exit page if this is an exit
    if (isExit) {
      await db.update(visits)
        .set({ 
          duration: timeOnPage || 0,
          exitPage: sql`(SELECT url FROM ${pageViews} WHERE visitId = ${visitId} ORDER BY createdAt DESC LIMIT 1)`,
          updatedAt: new Date()
        })
        .where(eq(visits.id, visitId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update page view error:', error);
    res.status(500).json({ error: 'Failed to update page view' });
  }
};

export const trackEvent = async (req: Request, res: Response) => {
  try {
    const data = eventSchema.parse(req.body);
    const eventData = {
      id: crypto.randomUUID(),
      ...data,
    };

    await db.insert(analyticsEvents).values(eventData);

    // Mark visit as converted if it's a purchase event
    if (data.type === 'purchase' || data.type === 'checkout_complete') {
      await db.update(visits)
        .set({ 
          converted: 1,
          updatedAt: new Date()
        })
        .where(eq(visits.id, data.visitId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Total visits and unique visitors
    const totalVisits = await db
      .select({ count: count() })
      .from(visits)
      .where(gte(visits.createdAt, startDate));

    const uniqueVisitors = await db
      .select({ count: count(sql`DISTINCT ${visits.sessionId}`) })
      .from(visits)
      .where(gte(visits.createdAt, startDate));

    // Page views
    const totalPageViews = await db
      .select({ count: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, startDate));

    // Conversions
    const conversions = await db
      .select({ count: count() })
      .from(visits)
      .where(and(
        gte(visits.createdAt, startDate),
        eq(visits.converted, 1)
      ));

    // Average session duration
    const avgDuration = await db
      .select({ avg: avg(visits.duration) })
      .from(visits)
      .where(and(
        gte(visits.createdAt, startDate),
        sql`${visits.duration} > 0`
      ));

    // Top pages
    const topPages = await db
      .select({
        url: pageViews.url,
        views: count(),
        uniqueVisitors: count(visits.sessionId),
      })
      .from(pageViews)
      .leftJoin(visits, eq(pageViews.visitId, visits.id))
      .where(gte(pageViews.createdAt, startDate))
      .groupBy(pageViews.url)
      .orderBy(desc(count(pageViews.url)))
      .limit(10);

    // Device breakdown
    const deviceStats = await db
      .select({
        device: visits.device,
        count: count(),
      })
      .from(visits)
      .where(and(
        gte(visits.createdAt, startDate),
        sql`${visits.device} IS NOT NULL`
      ))
      .groupBy(visits.device)
      .orderBy(desc(count(visits.device)));

    // Browser breakdown
    const browserStats = await db
      .select({
        browser: visits.browser,
        count: count(),
      })
      .from(visits)
      .where(and(
        gte(visits.createdAt, startDate),
        sql`${visits.browser} IS NOT NULL`
      ))
      .groupBy(visits.browser)
      .orderBy(desc(count(visits.browser)));

    // Daily stats for chart (visits only — avoid inflated counts from joining page views)
    const dailyStats = await db
      .select({
        date: sql`DATE(${visits.createdAt})`,
        visits: count(),
        uniqueVisitors: count(sql`DISTINCT ${visits.sessionId}`),
        conversions: count(sql`CASE WHEN ${visits.converted} = 1 THEN 1 END`),
      })
      .from(visits)
      .where(gte(visits.createdAt, startDate))
      .groupBy(sql`DATE(${visits.createdAt})`)
      .orderBy(sql`DATE(${visits.createdAt})`);

    // Conversion funnel (unique sessions per step)
    const funnelEvents = await db
      .select({
        type: analyticsEvents.type,
        count: count(sql`DISTINCT ${analyticsEvents.visitId}`),
      })
      .from(analyticsEvents)
      .leftJoin(visits, eq(analyticsEvents.visitId, visits.id))
      .where(and(
        gte(analyticsEvents.createdAt, startDate),
        sql`${analyticsEvents.type} IN ('view', 'add_to_cart', 'checkout_start', 'checkout_complete')`
      ))
      .groupBy(analyticsEvents.type)
      .orderBy(sql`FIELD(${analyticsEvents.type}, 'view', 'add_to_cart', 'checkout_start', 'checkout_complete')`);

    // Pages where visitors leave the site
    const exitPages = await db
      .select({
        url: pageViews.url,
        exits: count(),
      })
      .from(pageViews)
      .where(and(
        gte(pageViews.createdAt, startDate),
        eq(pageViews.isExit, 1)
      ))
      .groupBy(pageViews.url)
      .orderBy(desc(count(pageViews.url)))
      .limit(10);

    // Landing pages (where visitors enter)
    const landingPages = await db
      .select({
        url: visits.landingPage,
        visits: count(),
      })
      .from(visits)
      .where(and(
        gte(visits.createdAt, startDate),
        sql`${visits.landingPage} IS NOT NULL`
      ))
      .groupBy(visits.landingPage)
      .orderBy(desc(count(visits.landingPage)))
      .limit(10);

    const totalVisitCount = Number(totalVisits[0]?.count ?? 0);
    const conversionCount = Number(conversions[0]?.count ?? 0);

    res.json({
      summary: {
        totalVisits: totalVisitCount,
        uniqueVisitors: Number(uniqueVisitors[0]?.count ?? 0),
        totalPageViews: Number(totalPageViews[0]?.count ?? 0),
        conversions: conversionCount,
        avgDuration: Math.round(Number(avgDuration[0]?.avg ?? 0)),
        conversionRate: totalVisitCount > 0
          ? Math.round((conversionCount / totalVisitCount) * 100 * 100) / 100
          : 0,
      },
      topPages,
      deviceStats,
      browserStats,
      dailyStats,
      funnelEvents,
      exitPages,
      landingPages,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Get dashboard stats error:', error);
    const missingTable = /doesn't exist|does not exist|Unknown table/i.test(message);
    res.status(500).json({
      error: missingTable
        ? 'Analytics-tabellen ontbreken nog in de database'
        : 'Analytics konden niet geladen worden',
      message,
    });
  }
};

export const getVisitDetails = async (req: Request, res: Response) => {
  try {
    const visitId = Array.isArray(req.params.visitId) ? req.params.visitId[0] : req.params.visitId;
    if (!visitId) {
      return res.status(400).json({ error: 'Visit ID is required' });
    }

    const visit = await db.query.visits.findFirst({
      where: eq(visits.id, visitId),
      with: {
        pageViews: {
          orderBy: (pageViews, { asc }) => [asc(pageViews.createdAt)],
        },
        events: {
          orderBy: (analyticsEvents, { asc }) => [asc(analyticsEvents.createdAt)],
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Get visit details error:', error);
    res.status(500).json({ error: 'Failed to get visit details' });
  }
};
