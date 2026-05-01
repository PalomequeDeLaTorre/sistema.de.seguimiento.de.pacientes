// app/api/followups/route.ts
// app/api/followups/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await pool.query(
      'SELECT f.*, p.full_name FROM followups f JOIN patients p ON f.patient_id = p.id WHERE f.id = $1 AND f.user_id = $2',
      [id, session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Seguimiento no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { content } = await req.json();

    await pool.query(
      'UPDATE followups SET content = $1 WHERE id = $2 AND user_id = $3',
      [content, id, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}