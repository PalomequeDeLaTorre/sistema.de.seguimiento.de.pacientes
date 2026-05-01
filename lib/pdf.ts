// lib/pdf.ts
'use client';

import { jsPDF } from 'jspdf';

export function generatePatientPDF(patientName: string, age: number | null, content: string, sheetNumber?: number) {
  const doc = new jsPDF();
  const title = sheetNumber ? `SEGUIMIENTO #${sheetNumber}` : 'FICHA DE IDENTIFICACIÓN';

  doc.setFontSize(16);
  doc.text(title, 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Paciente: ${patientName}`, 20, 40);
  if (age) doc.text(`Edad: ${age} años`, 20, 50);

  doc.setFontSize(11);
  const lines = doc.splitTextToSize(content, 170);
  doc.text(lines, 20, 65);

  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
