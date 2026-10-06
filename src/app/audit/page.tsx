'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react';
import { AuditLog } from '@/types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.user?.fullName && log.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    if (action.includes('RETURN') || action.includes('OVERRIDE')) {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    if (action.includes('DAMAGED') || action.includes('DELETE')) {
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
    if (action.includes('CREATE') || action.includes('FACTURE')) {
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Immutable System Audit Log (`audit_logs`)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tamper-evident record of price overrides, returns approvals, stock adjustments, cost modifications, and transactions.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, target entity ID, or user..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="w-full sm:w-56 py-2 px-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
        >
          <option value="all">All Action Types ({logs.length})</option>
          {actionTypes.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Trail List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const oldValObj = log.oldValues ? JSON.parse(log.oldValues) : null;
          const newValObj = log.newValues ? JSON.parse(log.newValues) : null;

          return (
            <div
              key={log.id}
              className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border ${getActionColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      Target: {log.entityType} ({log.entityId || 'N/A'})
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      User: <strong className="text-zinc-700 dark:text-zinc-300">{log.user?.fullName || 'System Event'}</strong>{' '}
                      ({log.user?.role || 'Daemon'}) • IP: <span className="font-mono">{log.ipAddress}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="font-mono text-zinc-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>

                  {(oldValObj || newValObj) && (
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-md bg-indigo-500/10"
                    >
                      <span>JSON Snapshot</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible JSON Snapshot Diff Viewer */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Old Values */}
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-300">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1.5">
                      🔻 Old Values (Before Action):
                    </span>
                    <pre className="text-[11px] text-rose-300 overflow-x-auto whitespace-pre-wrap">
                      {oldValObj ? JSON.stringify(oldValObj, null, 2) : 'null (New Record)'}
                    </pre>
                  </div>

                  {/* New Values */}
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-300">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1.5">
                      🟢 New Values (Committed State):
                    </span>
                    <pre className="text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                      {newValObj ? JSON.stringify(newValObj, null, 2) : 'null'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-xs text-zinc-500">
            No audit log entries matching filter.
          </div>
        )}
      </div>
    </div>
  );
}
