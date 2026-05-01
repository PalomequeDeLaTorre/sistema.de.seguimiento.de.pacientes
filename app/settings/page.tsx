// app/settings/page.tsx
'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Lock, Check, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const pink      = '#C2185B';
const roseDust  = '#D4788A';
const roseLight = '#fce8ee';
const rosePale  = '#fdf6f8';
const roseBorder= '#f0d0d8';
const bodyFont  = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ── Validation helpers ────────────────────────────────────────────────────────
function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Muy débil',  color: '#e53935' };
  if (score === 2) return { score, label: 'Débil',      color: '#fb8c00' };
  if (score === 3) return { score, label: 'Regular',    color: '#fdd835' };
  if (score === 4) return { score, label: 'Fuerte',     color: '#43a047' };
  return              { score, label: 'Muy fuerte', color: '#1b5e20' };
}

function PasswordInput({
  label, value, onChange, placeholder, required, minLength, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  const tooShort = touched && minLength !== undefined && value.length > 0 && value.length < minLength;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: '#9e9e9e', fontFamily: bodyFont,
      }}>
        {label}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          required={required}
          minLength={minLength}
          placeholder={placeholder ?? '••••••••'}
          style={{
            width: '100%',
            padding: '12px 44px 12px 16px',
            fontFamily: bodyFont,
            fontSize: 14,
            borderRadius: 12,
            border: `1.5px solid ${tooShort ? '#e53935' : roseBorder}`,
            background: tooShort ? '#fff5f5' : '#fff',
            color: '#1a1a1a',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color .15s, background .15s',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = tooShort ? '#e53935' : roseDust;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${tooShort ? 'rgba(229,57,53,.12)' : 'rgba(194,24,91,.10)'}`;
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = tooShort ? '#e53935' : roseBorder;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: show ? pink : '#bbb', padding: 4, display: 'flex',
            transition: 'color .15s',
          }}
          title={show ? 'Ocultar contraseña' : 'Ver contraseña'}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {tooShort && (
        <p style={{ fontSize: 11, color: '#e53935', margin: 0, fontFamily: bodyFont }}>
          Mínimo {minLength} caracteres
        </p>
      )}
      {hint && !tooShort && (
        <p style={{ fontSize: 11, color: '#bbb', margin: 0, fontFamily: bodyFont }}>{hint}</p>
      )}
    </div>
  );
}

// ── Strength bar ──────────────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: -2 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= score ? color : '#f0d0d8',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color, margin: 0, fontFamily: bodyFont, fontWeight: 600 }}>
        {label}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Error al cambiar contraseña');
      return;
    }

    setMessage('Contraseña actualizada correctamente');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f8f8', fontFamily: bodyFont }}>
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Navbar />
      </div>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* ── Page header — same style as patients ── */}
        <div style={{
          marginBottom: 28,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          border: '1px solid #f0f0f0',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: pink,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: pink, margin: 0 }}>
              Cuenta
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', margin: '2px 0 0' }}>
              Configuración
            </h1>
            <p style={{ fontSize: 13, color: '#aaa', margin: '2px 0 0' }}>
              Administra tu acceso y seguridad
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          border: '1px solid #f0f0f0',
          overflow: 'hidden',
        }}>
          {/* Card header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${roseBorder}`,
            background: rosePale,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: roseLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={17} color={pink} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Cambiar contraseña
              </h2>
              <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>
                Actualiza tu contraseña de acceso
              </p>
            </div>
          </div>

          {/* Card body */}
          <div style={{ padding: '24px' }}>

            {/* Success */}
            {message && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#f0faf4', border: '1.5px solid #a5d6b7',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              }}>
                <Check size={16} color="#2e7d52" />
                <span style={{ fontSize: 13, color: '#2e7d52', fontFamily: bodyFont }}>{message}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fff5f5', border: '1.5px solid #ffb3b3',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              }}>
                <AlertCircle size={16} color="#e53935" />
                <span style={{ fontSize: 13, color: '#e53935', fontFamily: bodyFont }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <PasswordInput
                label="Contraseña actual"
                value={currentPassword}
                onChange={setCurrentPassword}
                required
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <PasswordInput
                  label="Nueva contraseña"
                  value={newPassword}
                  onChange={setNewPassword}
                  required
                  minLength={6}
                  hint="Mínimo 6 caracteres"
                />
                <StrengthBar password={newPassword} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <PasswordInput
                  label="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                />
                {mismatch && (
                  <p style={{ fontSize: 11, color: '#e53935', margin: 0, fontFamily: bodyFont }}>
                    Las contraseñas no coinciden
                  </p>
                )}
                {!mismatch && confirmPassword.length > 0 && newPassword === confirmPassword && (
                  <p style={{ fontSize: 11, color: '#43a047', margin: 0, fontFamily: bodyFont, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={11} /> Las contraseñas coinciden
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${roseBorder}`, marginTop: 4 }} />

              <button
                type="submit"
                disabled={loading || mismatch}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: loading || mismatch ? 'not-allowed' : 'pointer',
                  background: loading || mismatch
                    ? '#e0e0e0'
                    : `linear-gradient(135deg, ${pink} 0%, ${roseDust} 100%)`,
                  color: loading || mismatch ? '#aaa' : '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: bodyFont,
                  transition: 'opacity .15s, background .2s',
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!loading && !mismatch) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                {loading ? 'Actualizando…' : 'Guardar nueva contraseña'}
              </button>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}