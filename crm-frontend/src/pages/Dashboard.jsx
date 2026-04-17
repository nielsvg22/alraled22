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
} from 'recharts';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
      } catch (fetchError) {
        setError(fetchError.response?.data?.error || 'Failed to fetch dashboard stats');
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
    return <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;
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
            {stats.revenueSeries.length === 0 ? (
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
          {stats.recentOrders.length === 0 ? (
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
    </div>
  );
}
