# ADR-0005: Zero-Network Offline & Tabular Exports

- **Date**: 2026-09-05
- **Status**: Approved
- **Author**: Antigravity / mussaddiqmahmood7
- **User Approved**: Yes

## Context & Problem Statement

1. **Corrupted CSV Output**: The previous CSV export simply dumped raw stringified JSON into three giant cells, embedding multi-megabyte base64 logo strings that broke spreadsheet software like Excel, Google Sheets, and Numbers.
2. **Online-Only Export Fallback**: If the network connection dropped, export for formats other than JSON completely failed because the client relied solely on `/api/invoice/export`.

## Considered Options

1. **Server-only exports**: Dependent on server uptime and network latency.
2. **Hybrid Client/Server with Standard Tabular Schema & Offline Zero-Network Mode**:
   - Format CSV into clean, multi-row accounting tables (one row per item, containing metadata, party information, financial breakdown, and payment details).
   - Exclude heavy base64 logo image payloads from tabular data.
   - Implement client-side export generation in `services/invoice/client/exportInvoice.ts` that triggers automatically when the network or API endpoint is unreachable.

## Decision Taken

1. **Clean Tabular Accounting CSV**:
   - Re-architected CSV generation in `services/invoice/server/exportInvoiceService.ts` and client helpers.
   - Each invoice item forms a discrete tabular row with complete invoice metadata.
   - Base64 image strings are stripped from CSV and XML exports.
2. **Zero-Network Client-Side Exporter**:
   - `services/invoice/client/exportInvoice.ts` generates valid JSON, XML, and CSV files in-browser using standard Web Blobs.
   - If `/api/invoice/export` returns an error or the user is offline, the client seamlessly falls back to client-side generation without failing.

## Consequences & Invariants (DO NOT BREAK)

- CSV exports must remain compatible with accounting software; never re-introduce nested raw JSON or multi-megabyte base64 strings into CSV cells.
- Client-side offline fallback must be maintained for privacy and zero-network resilience.
