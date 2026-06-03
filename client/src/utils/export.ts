import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Ticket } from '../types';

export function exportTicketsToCSV(tickets: Ticket[], filename = 'tickets_export.csv') {
  if (!tickets.length) return;

  const headers = ['Ticket Number', 'Title', 'Status', 'Priority', 'Type', 'Assignee', 'Due Date'];

  const rows = tickets.map(t => [
    t.ticketNumber,
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.type,
    t.assignedTo ? `"${t.assignedTo.fullName}"` : 'Unassigned',
    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTicketsToPDF(tickets: Ticket[], filename = 'tickets_export.pdf') {
  if (!tickets.length) return;

  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('TaskPilot - Tickets Export', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  const tableColumn = ['Key', 'Title', 'Status', 'Priority', 'Assignee'];
  const tableRows: any[] = [];

  tickets.forEach(ticket => {
    const ticketData = [
      ticket.ticketNumber,
      ticket.title.length > 30 ? ticket.title.substring(0, 30) + '...' : ticket.title,
      ticket.status.replace(/_/g, ' '),
      ticket.priority,
      ticket.assignedTo?.fullName || 'Unassigned'
    ];
    tableRows.push(ticketData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42] }
  });

  doc.save(filename);
}
