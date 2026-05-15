import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut,
  Menu,
  X,
  FileText,
  Palette,
  Sparkles,
  Layers,
  Mail,
  MapPin,
  RotateCcw,
  Link2,
  Ticket
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Users', href: '/users', icon: Users });
    navigation.push({ name: 'Pagina\'s', href: '/pages', icon: FileText });
    navigation.push({ name: 'Pagina Bouwer', href: '/builder', icon: Layers });
    navigation.push({ name: 'Retouren', href: '/rmas', icon: RotateCcw });
    navigation.push({ name: 'Verkooppunten', href: '/dealers', icon: MapPin });
    navigation.push({ name: 'Thema & Kleuren', href: '/theme', icon: Palette });
    navigation.push({ name: 'AI Assistent', href: '/ai', icon: Sparkles });
    navigation.push({ name: 'AI Instellingen', href: '/ai-settings', icon: Sparkles });
    navigation.push({ name: 'Email Instellingen', href: '/email', icon: Mail });
    navigation.push({ name: 'Snelstart', href: '/snelstart', icon: Link2 });
    navigation.push({ name: 'Kortingscodes', href: '/discounts', icon: Ticket });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: 'var(--crm-bg)', color: 'var(--crm-text)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--crm-sidebar)', color: 'var(--crm-sidebar-text)' }}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center space-x-3" style={{ borderBottom: '1px solid var(--crm-border)' }}>
            <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--crm-primary)' }}>
              <LayoutDashboard className="w-6 h-6" style={{ color: 'var(--crm-sidebar-text)' }} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight uppercase" style={{ color: 'var(--crm-sidebar-text)' }}>Aldra CRM</span>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--crm-primary)', filter: 'brightness(1.4)' }}>Admin Panel</span>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
            <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 opacity-40" style={{ color: 'var(--crm-sidebar-text)' }}>Main Menu</p>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={({ isActive }) => isActive
                  ? { backgroundColor: 'var(--crm-nav-active)', color: '#ffffff', fontWeight: 700 }
                  : { color: 'var(--crm-sidebar-text)', opacity: 0.7 }
                }
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200
                  ${isActive ? 'scale-[1.02] shadow-lg' : 'hover:opacity-100'}
                `}
                onMouseEnter={e => { if (!e.currentTarget.classList.contains('scale-[1.02]')) e.currentTarget.style.backgroundColor = 'var(--crm-nav-hover)'; }}
                onMouseLeave={e => { if (!e.currentTarget.classList.contains('scale-[1.02]')) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-6 space-y-6" style={{ borderTop: '1px solid var(--crm-border)' }}>
            <div className="flex items-center space-x-4 px-2">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-md" style={{ background: 'var(--crm-primary)' }}>
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full shadow-sm" style={{ border: '2px solid var(--crm-sidebar)' }}></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--crm-sidebar-text)' }}>{user?.name}</p>
                <p className="text-[11px] font-medium truncate uppercase tracking-wider opacity-50" style={{ color: 'var(--crm-sidebar-text)' }}>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3.5 rounded-xl transition-all duration-200 hover:opacity-100 opacity-60"
              style={{ color: 'var(--crm-sidebar-text)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--crm-sidebar-text)'; }}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="shadow-sm md:hidden flex items-center justify-between px-6 py-4" style={{ backgroundColor: 'var(--crm-surface)', borderBottom: '1px solid var(--crm-border)' }}>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--crm-primary)' }}>
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--crm-text)' }}>Aldra</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--crm-bg)', color: 'var(--crm-text-muted)' }}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
