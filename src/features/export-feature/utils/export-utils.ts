import type { MaterialRequestWithRelations } from "@/lib/supabase";
import { format } from "date-fns";

// Label mappings
const UNIT_LABELS: Record<string, string> = {
  kg: "Kilograms (kg)",
  m: "Meters (m)",
  pieces: "Pieces",
  liters: "Liters (L)",
  tons: "Tons",
  cubic_meters: "Cubic Meters (m³)",
  square_meters: "Square Meters (m²)",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function getUnitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit;
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function getPriorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

function getRequesterName(request: MaterialRequestWithRelations): string {
  return request.requester?.full_name ?? request.requester?.email ?? "Unknown";
}

export function exportToCSV(
  data: MaterialRequestWithRelations[],
  filename: string
): void {
  const headers = [
    "Material Name",
    "Quantity",
    "Unit",
    "Status",
    "Priority",
    "Requested By",
    "Requested Date",
    "Notes",
  ];

  const rows = data.map((request) => [
    request.material_name,
    request.quantity.toString(),
    getUnitLabel(request.unit),
    getStatusLabel(request.status),
    getPriorityLabel(request.priority),
    getRequesterName(request),
    format(new Date(request.requested_at), "yyyy-MM-dd HH:mm"),
    request.notes ?? "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv");
}

export function exportToExcel(
  data: MaterialRequestWithRelations[],
  filename: string
): void {
  const headers = [
    "Material Name",
    "Quantity",
    "Unit",
    "Status",
    "Priority",
    "Requested By",
    "Requested Date",
    "Notes",
  ];

  const rows = data.map((request) => [
    escapeHtml(request.material_name),
    request.quantity,
    escapeHtml(getUnitLabel(request.unit)),
    escapeHtml(getStatusLabel(request.status)),
    escapeHtml(getPriorityLabel(request.priority)),
    escapeHtml(getRequesterName(request)),
    format(new Date(request.requested_at), "yyyy-MM-dd HH:mm"),
    escapeHtml(request.notes ?? ""),
  ]);

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"></head>
    <body>
      <table border="1">
        <thead>
          <tr>${headers.map((h) => `<th style="background-color:#f0f0f0;font-weight:bold">${escapeHtml(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  downloadFile(tableHtml, `${filename}.xls`, "application/vnd.ms-excel");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
