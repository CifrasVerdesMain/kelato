"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Contraseña incorrecta. Intenta de nuevo.");
        setPassword("");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-lg p-8"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.jpeg"
            alt="Kelato"
            width={200}
            height={100}
            className="object-contain"
            priority
          />
        </div>

        <h1
          className="text-center text-lg font-semibold mb-6"
          style={{ color: "var(--foreground)" }}
        >
          Panel de Ventas
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--foreground)" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: "var(--muted)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--primary)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 cursor-pointer"
            style={{
              background: "var(--primary)",
              color: "#FFFFFF",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs" style={{ color: "var(--primary-light)" }}>
        Cifras Verdes · Kelato
      </p>
    </div>
  );
}
