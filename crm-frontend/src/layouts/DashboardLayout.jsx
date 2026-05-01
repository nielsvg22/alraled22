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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#1e293b] text-white shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center space-x-3 border-b border-gray-700/50">
            <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white uppercase">Aldra CRM</span>
              <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Admin Panel</span>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-[1.02]' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className={`w-5 h-5 ${isMobileMenuOpen ? 'scale-110' : ''}`} />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-6 border-t border-gray-700/50 space-y-6">
            <div className="flex items-center space-x-4 px-2">
              <div className="relative">
                <div className="bg-gradient-to-tr from-blue-600 to-blue-400 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#1e293b] rounded-full shadow-sm"></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-400 font-medium truncate uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200"
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
        <header className="bg-white shadow-sm md:hidden flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-black text-gray-800 uppercase tracking-tight">Aldra</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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
