import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Boxes,
  Users,
  Eye,
  Timer,
  BarChart3,
  Funnel,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/Card';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from 'recharts';
import { errorText } from '../lib/errorText';

const currencyFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    healthyInventoryProducts: 0,
    recentOrders: [],
    revenueSeries: [],
    scope: 'personal',
  });
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashRes = await api.get('/dashboard/stats');
        const data = dashRes.data;
        setStats((prev) => ({
          ...prev,
          ...data,
          recentOrders: Array.isArray(data?.recentOrders) ? data.recentOrders : [],
          revenueSeries: Array.isArray(data?.revenueSeries) ? data.revenueSeries : [],
        }));
      } catch (fetchError) {
        setError(errorText(fetchError, 'Failed to fetch dashboard stats'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError('');
        const analyticsRes = await api.get('/analytics/dashboard', { params: { days: analyticsDays } });
        setAnalytics(analyticsRes.data);
      } catch (fetchError) {
        setAnalytics(null);
        setAnalyticsError(errorText(fetchError, 'Analytics konden niet geladen worden'));
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (!loading && !error) {
      fetchAnalytics();
    }
  }, [loading, error, analyticsDays]);

  const funnelSteps = useMemo(() => {
    if (!analytics) return [];
    const eventCount = (type) => analytics.funnelEvents?.find((e) => e.type === type)?.count || 0;
    return [
      { key: 'visit', label: 'Bezoek', count: analytics.summary.totalVisits },
      { key: 'view', label: 'Product bekeken', count: eventCount('view') },
      { key: 'add_to_cart', label: 'In winkelwagen', count: eventCount('add_to_cart') },
      { key: 'checkout_start', label: 'Checkout gestart', count: eventCount('checkout_start') },
      { key: 'checkout_complete', label: 'Bestelling voltooid', count: eventCount('checkout_complete') },
    ];
  }, [analytics]);

  const statCards = useMemo(
    () => [
      {
        name: 'Total Revenue',
        value: currencyFormatter.format(stats.totalRevenue),
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        detail: `${stats.scope === 'global' ? 'Global' : 'Your'} sales value`,
        trendUp: true,
      },
      {
        name: 'Orders',
        value: stats.totalOrders,
        icon: ShoppingCart,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        detail: `${stats.pendingOrders} pending or processing`,
        trendUp: null,
      },
      {
        name: 'Products',
        value: stats.totalProducts,
        icon: Package,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        detail: `${stats.lowStockProducts} low stock`,
        trendUp: null,
      },
      {
        name: 'Avg. Order',
        value: currencyFormatter.format(stats.avgOrderValue),
        icon: TrendingUp,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        detail: 'Average basket value',
        trendUp: stats.avgOrderValue >= 100,
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{String(error)}</div>;
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1 font-medium">
            {stats.scope === 'global' ? 'Company-wide CRM performance' : 'Your recent account activity'}
          </p>
        </div>
        <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-sm font-bold text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-blue-500" />
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name} className="group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`${stat.color} w-6 h-6`} />
                </div>
                {stat.trendUp !== null && (
                  <div className={`flex items-center text-xs font-black px-2 py-1 rounded-lg ${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {stat.detail}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">{stat.name}</p>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                {stat.trendUp === null && <p className="mt-2 text-sm text-gray-500">{stat.detail}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Performance"
            subtitle="Revenue trend from your latest order periods"
          />
          <CardContent className="space-y-4">
            {(stats.revenueSeries || []).length === 0 ? (
              <div className="h-80 flex items-center justify-center bg-gray-50/50 rounded-2xl">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nog geen omzetdata</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `€${v}`} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Omzet']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 700, color: '#1f2937' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Inventory Status" />
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-gray-700">Low Stock Products</span>
                </div>
                <span className="bg-red-50 text-red-600 text-xs font-black px-2 py-1 rounded-md">{stats.lowStockProducts} items</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Boxes className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-gray-700">Out of Stock</span>
                </div>
                <span className="bg-amber-50 text-amber-600 text-xs font-black px-2 py-1 rounded-md">{stats.outOfStockProducts} items</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-gray-700">Healthy Inventory</span>
                </div>
                <span className="bg-emerald-50 text-emerald-600 text-xs font-black px-2 py-1 rounded-md">{stats.healthyInventoryProducts} items</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent Orders" subtitle="Latest customer activity in the CRM" />
        <CardContent className="p-0 overflow-x-auto">
          {(stats.recentOrders || []).length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">No recent orders yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Order</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.user?.name || 'Customer'}</div>
                      <div className="text-xs text-gray-400">{order.user?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">{order.status}</td>
                    <td className="px-6 py-4 text-right font-semibold">{currencyFormatter.format(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {!loading && !error && (
        <>
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Basis Analytics</h2>
              <p className="text-gray-500 mt-1 font-medium">Bezoekers, conversietrechter en waar bezoekers afhaken</p>
            </div>
            <div className="flex items-center gap-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setAnalyticsDays(days)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                    analyticsDays === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </header>

          {analyticsError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-800 text-sm">
              {analyticsError}
              <span className="block mt-1 text-amber-700">
                De backend maakt deze tabellen automatisch aan bij opstarten. Wacht op een nieuwe deploy of herstart de Railway-service.
              </span>
            </div>
          )}

          {analyticsLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          )}

          {!analyticsLoading && analytics && (
          <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Bezoeken', value: analytics.summary.totalVisits, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Unieke bezoekers', value: analytics.summary.uniqueVisitors, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Paginaweergaven', value: analytics.summary.totalPageViews, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Conversie', value: `${analytics.summary.conversionRate}%`, icon: Funnel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Gem. duur', value: `${Math.floor(analytics.summary.avgDuration / 60)}:${String(analytics.summary.avgDuration % 60).padStart(2, '0')}`, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((stat) => (
              <Card key={stat.label} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${stat.bg} p-2 rounded-xl`}>
                      <stat.icon className={`${stat.color} w-4 h-4`} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader title="Bezoekers per dag" subtitle={`Laatste ${analyticsDays} dagen`} />
            <CardContent>
              {(!analytics.dailyStats || analytics.dailyStats.length === 0) ? (
                <div className="h-48 flex items-center justify-center bg-gray-50/50 rounded-2xl">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nog geen bezoekdata</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={analytics.dailyStats.map((d) => ({
                      ...d,
                      date: String(d.date).slice(5),
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="visits" name="Bezoeken" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" name="Conversies" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader title="Conversietrechter" subtitle="Hoe ver komen bezoekers in het aankoopproces — percentage t.o.v. vorige stap" />
              <CardContent>
                {funnelSteps.every((s) => s.count === 0) ? (
                  <div className="h-64 flex items-center justify-center bg-gray-50/50 rounded-2xl">
                    <div className="text-center">
                      <Funnel className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nog geen data — bezoek de webshop om tracking te starten</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { color: 'bg-slate-500' },
                      { color: 'bg-blue-500' },
                      { color: 'bg-indigo-500' },
                      { color: 'bg-amber-500' },
                      { color: 'bg-emerald-500' },
                    ].map((style, i) => {
                      const step = funnelSteps[i];
                      const count = step.count;
                      const prevCount = i > 0 ? funnelSteps[i - 1].count : count;
                      const maxCount = Math.max(...funnelSteps.map((s) => s.count), 1);
                      const barPct = Math.round((count / maxCount) * 100);
                      const stepPct = i === 0 ? 100 : prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
                      const dropOff = i > 0 && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
                      return (
                        <div key={step.key} className="space-y-1">
                          <div className="flex justify-between text-sm gap-2">
                            <span className="font-bold text-gray-700">{step.label}</span>
                            <span className="font-black text-gray-900 shrink-0">
                              {count}
                              {i > 0 && (
                                <span className="text-xs text-gray-400 font-bold ml-1">
                                  ({stepPct}% door)
                                  {dropOff > 0 && <span className="text-red-500 ml-1">−{dropOff}% afgehaakt</span>}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div className={`${style.color} h-3 rounded-full transition-all duration-700`} style={{ width: `${barPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Top Pagina's" />
              <CardContent className="p-0">
                {(!analytics.topPages || analytics.topPages.length === 0) ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nog geen data</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {analytics.topPages.slice(0, 8).map((page, i) => (
                      <div key={page.url} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-700 truncate">{page.url}</span>
                        </div>
                        <span className="text-xs font-black text-gray-500 ml-2">{page.views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader title="Afhaakpunten" subtitle="Pagina's waar bezoekers de site verlaten" />
              <CardContent className="p-0">
                {(!analytics.exitPages || analytics.exitPages.length === 0) ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nog geen exit-data</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {analytics.exitPages.slice(0, 8).map((page, i) => (
                      <div key={page.url} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-xs font-black text-red-400 w-4">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-700 truncate" title={page.url}>{page.url}</span>
                        </div>
                        <span className="text-xs font-black text-red-600 ml-2">{page.exits}× exit</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Instappagina's" subtitle="Waar bezoekers binnenkomen" />
              <CardContent className="p-0">
                {(!analytics.landingPages || analytics.landingPages.length === 0) ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nog geen data</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {analytics.landingPages.slice(0, 8).map((page, i) => (
                      <div key={page.url} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-xs font-black text-emerald-500 w-4">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-700 truncate" title={page.url}>{page.url}</span>
                        </div>
                        <span className="text-xs font-black text-gray-500 ml-2">{page.visits}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader title="Apparaten" />
              <CardContent>
                {(!analytics.deviceStats || analytics.deviceStats.length === 0) ? (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nog geen data</div>
                ) : (
                  <div className="space-y-3">
                    {analytics.deviceStats.map((d) => {
                      const maxCount = Math.max(...analytics.deviceStats.map(x => x.count));
                      const pct = Math.round((d.count / maxCount) * 100);
                      return (
                        <div key={d.device} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-bold text-gray-700 capitalize">{d.device}</span>
                            <span className="font-black text-gray-900">{d.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Browser" />
              <CardContent>
                {(!analytics.browserStats || analytics.browserStats.length === 0) ? (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nog geen data</div>
                ) : (
                  <div className="space-y-3">
                    {analytics.browserStats.map((b) => {
                      const maxCount = Math.max(...analytics.browserStats.map(x => x.count));
                      const pct = Math.round((b.count / maxCount) * 100);
                      return (
                        <div key={b.browser} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-bold text-gray-700 capitalize">{b.browser}</span>
                            <span className="font-black text-gray-900">{b.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}
