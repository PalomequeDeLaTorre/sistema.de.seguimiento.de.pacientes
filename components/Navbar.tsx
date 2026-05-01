// app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, Users, History, Settings, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/patients', label: 'Pacientes', icon: Users },
    { href: '/history', label: 'Historial', icon: History },
    { href: '/settings', label: 'Configuración', icon: Settings },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav
      className="bg-[#D4788A] text-white shadow-md"
      style={{ position: 'sticky', top: 0, zIndex: 50 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo / título — flex-shrink-0 para que nunca se comprima */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
            </svg>
            <div className="leading-tight flex-shrink-0">
              <p className="font-black text-sm tracking-tight leading-none whitespace-nowrap">Seguimiento Clínico</p>
              <p className="font-black text-sm tracking-tight leading-none whitespace-nowrap">de Pacientes</p>
            </div>
          </div>

          {/* Nav links — escritorio */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition ${
                    isActive ? 'bg-[#880E4F]' : 'hover:bg-[#AD1457]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-[#E8AEB7]">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm hover:bg-[#AD1457] transition disabled:opacity-70"
              >
                {loggingOut ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Saliendo...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    <span>Salir</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Botón hamburguesa — móvil */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileOpen && (
        <div className="md:hidden bg-[#880E4F] px-4 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-2 px-3 py-3 rounded-md text-sm ${
                  isActive ? 'bg-[#6A0F3A]' : ''
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="mt-2 pt-2 border-t border-[#E8AEB7]/30">
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              disabled={loggingOut}
              className="flex items-center space-x-2 px-3 py-3 text-sm w-full disabled:opacity-70"
            >
              {loggingOut ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Saliendo...</span>
                </>
              ) : (
                <>
                  <LogOut size={18} />
                  <span>Cerrar sesión</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}