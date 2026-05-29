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
  LineChart,
  Line,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/analytics/dashboard'),
        ]);
        const data = dashRes.data;
        setStats((prev) => ({
          ...prev,
          ...data,
          recentOrders: Array.isArray(data?.recentOrders) ? data.recentOrders : [],
          revenueSeries: Array.isArray(data?.revenueSeries) ? data.revenueSeries : [],
        }));
        setAnalytics(analyticsRes.data);
      } catch (fetchError) {
        setError(errorText(fetchError, 'Failed to fetch dashboard stats'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      {analytics && (
        <>
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Bezoekersinzicht</h2>
              <p className="text-gray-500 mt-1 font-medium">Website analytics en conversietrechter</p>
            </div>
          </header>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader title="Conversietrechter" subtitle="Hoe ver komen bezoekers in het aankoopproces" />
              <CardContent>
                {(!analytics.funnelEvents || analytics.funnelEvents.length === 0) ? (
                  <div className="h-64 flex items-center justify-center bg-gray-50/50 rounded-2xl">
                    <div className="text-center">
                      <Funnel className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nog geen data</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { key: 'view', label: 'Product bekeken', color: 'bg-blue-500' },
                      { key: 'add_to_cart', label: 'Toegevoegd aan winkelwagen', color: 'bg-indigo-500' },
                      { key: 'checkout_start', label: 'Checkout gestart', color: 'bg-amber-500' },
                      { key: 'checkout_complete', label: 'Bestelling voltooid', color: 'bg-emerald-500' },
                    ].map((step, i) => {
                      const event = analytics.funnelEvents.find(e => e.type === step.key);
                      const count = event?.count || 0;
                      const maxCount = analytics.funnelEvents.length > 0 ? Math.max(...analytics.funnelEvents.map(e => e.count)) : 1;
                      const pct = Math.round((count / maxCount) * 100);
                      const dropPct = i > 0 ? Math.round((count / (analytics.funnelEvents[Math.min(i-1, analytics.funnelEvents.length-1)]?.count || 1)) * 100) : 100;
                      return (
                        <div key={step.key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-bold text-gray-700">{step.label}</span>
                            <span className="font-black text-gray-900">{count} <span className="text-xs text-gray-400 font-bold">({dropPct}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div className={`${step.color} h-3 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
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
    </div>
  );
}
