// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword === password && confirmPassword !== "";
  const isFormValid =
    isNameValid && isEmailValid && isPasswordValid && isConfirmValid;

  const nameError = touched.name && !isNameValid && name !== "";
  const emailError = touched.email && !isEmailValid && email !== "";
  const passwordError = touched.password && !isPasswordValid && password !== "";
  const confirmError =
    touched.confirmPassword && !isConfirmValid && confirmPassword !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Error al registrar");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ===================== LADO IZQUIERDO - IMAGEN ===================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/logo.jpg"
            alt="Sistema de Seguimientos Pro"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Badge Superior Izquierda */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white/20 backdrop-blur-sm border border-white/35 rounded-lg px-4 py-2 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-white flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-white text-base font-black tracking-tight leading-tight drop-shadow">
                Seguimiento Clínico
              </p>
              <p className="text-white text-base font-black tracking-tight leading-tight drop-shadow">
                de Pacientes
              </p>
            </div>
          </div>
        </div>

        {/* Badge Inferior Derecha: Sistema Operativo + punto verde */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-white/20 backdrop-blur-sm border border-white/35 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-white text-[11px] font-semibold tracking-wide drop-shadow">
              Sistema Operativo
            </p>
          </div>
        </div>

        {/* Badge Inferior Izquierda */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white/20 backdrop-blur-sm border border-white/35 rounded-lg px-3 py-1.5">
            <p className="text-white text-[11px] font-semibold tracking-wide drop-shadow">
              2026 Ginecología
            </p>
          </div>
        </div>
      </div>

      {/* ===================== LADO DERECHO - REGISTRO ===================== */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-y-auto"
        style={{ animation: "fadePink 4s ease-in-out infinite" }}
      >
        <div className="w-full max-w-xs">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl shadow-lg overflow-hidden">
              <img
                src="/logo.png"
                alt="Sistema de Seguimientos Pro"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-lg font-bold text-[#1F2933]">
              Sistema de Seguimientos Pro
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Gestión integral de salud
            </p>
          </div>

          {/* Card de registro */}
          <div className="bg-[#E8AEB7] rounded-xl shadow-lg p-5">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-white">Crear cuenta</h1>
              <p className="text-white/80 text-xs mt-1">
                Completa tus datos para registrarte
              </p>
            </div>

            {error && (
              <div className="bg-white/20 text-white p-2 rounded-lg mb-3 text-xs border border-white/30">
                <div className="flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Nombre completo */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                    nameError
                      ? "border-red-400 focus:ring-red-400/30"
                      : "border-white/30 focus:border-white focus:ring-white/20"
                  }`}
                  placeholder="Tu nombre completo"
                  required
                />
                {nameError && (
                  <p className="mt-0.5 text-[10px] text-white font-medium">
                    ✗ Mínimo 2 caracteres
                  </p>
                )}
              </div>

              {/* Correo electrónico */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                    emailError
                      ? "border-red-400 focus:ring-red-400/30"
                      : "border-white/30 focus:border-white focus:ring-white/20"
                  }`}
                  placeholder="usuario@ejemplo.com"
                  required
                />
                {emailError && (
                  <p className="mt-0.5 text-[10px] text-white font-medium">
                    ✗ Correo inválido
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm pr-9 ${
                      passwordError
                        ? "border-red-400 focus:ring-red-400/30"
                        : "border-white/30 focus:border-white focus:ring-white/20"
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#E8AEB7] hover:text-[#D4788A] transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-0.5 text-[10px] text-white font-medium">
                    ✗ Mínimo 6 caracteres
                  </p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() =>
                      setTouched({ ...touched, confirmPassword: true })
                    }
                    className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm pr-9 ${
                      confirmError
                        ? "border-red-400 focus:ring-red-400/30"
                        : "border-white/30 focus:border-white focus:ring-white/20"
                    }`}
                    placeholder="Repite tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#E8AEB7] hover:text-[#D4788A] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmError && (
                  <p className="mt-0.5 text-[10px] text-white font-medium">
                    ✗ Las contraseñas no coinciden
                  </p>
                )}
              </div>

              {/* Botón: siempre visible, deshabilitado si el formulario no es válido */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bg-[#C2185B] text-white py-2 rounded-lg font-bold hover:bg-[#AD1457] active:bg-[#880E4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[0_3px_14px_rgba(194,24,91,0.45)] mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  "Registrarse"
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-white/30">
              <p className="text-center text-xs text-white">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="text-white font-bold hover:text-gray-100 transition-colors underline"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>

            {/* Indicador de seguridad */}
            <div className="mt-3 flex items-center justify-center space-x-1 text-[10px] text-white/80">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Encriptación SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
