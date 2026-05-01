// app/uth/change-password/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession, hashPassword, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const result = await pool.query('SELECT password FROM users WHERE id = $1', [session.userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, result.rows[0].password);
    if (!valid) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, session.userId]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
