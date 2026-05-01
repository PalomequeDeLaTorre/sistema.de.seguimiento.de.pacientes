import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const result = await pool.query('SELECT id, name, email, password FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password);

    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    await createSession(user.id.toString(), user.email, user.name);

    return NextResponse.json({ success: true, name: user.name });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
