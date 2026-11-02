import React, { useState } from 'react';
import { Check, Code2, Copy, Download, ShieldCheck } from 'lucide-react';
import { JAVA_SPRING_BOOT_FILES } from '../data/initialData';
import {
  CloudDocument,
  GoalItem,
  HabitItem,
  SessionAuditEntry,
  TaskItem,
  UserAccount,
} from '../types/plms';

interface JavaSpringInspectorProps {
  currentUser: UserAccount;
  tasks: TaskItem[];
  habits: HabitItem[];
  goals: GoalItem[];
  documents: CloudDocument[];
  auditLogs: SessionAuditEntry[];
}

export const JavaSpringInspector: React.FC<JavaSpringInspectorProps> = ({
  currentUser,
  tasks,
  habits,
  goals,
  documents,
  auditLogs,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(
    JAVA_SPRING_BOOT_FILES[0].id
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'java-source' | 'live-json' | 'security-audit'>(
    'java-source'
  );

  const activeFile =
    JAVA_SPRING_BOOT_FILES.find((f) => f.id === selectedFileId) ||
    JAVA_SPRING_BOOT_FILES[0];

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadSourceFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const liveJsonPayload = JSON.stringify(
    {
      application: 'Personal Life Management System',
      javaRuntime: 'OpenJDK 21.0.5 LTS (Spring Boot 3.4.0)',
      principal: {
        id: currentUser.id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        roleTitle: currentUser.roleTitle,
      },
      counts: {
        tasks: tasks.length,
        habits: habits.length,
        goals: goals.length,
        cloudDocuments: documents.length,
      },
      tasks,
      habits,
      goals,
      documents: documents.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        folder: d.folder,
        sizeBytes: d.sizeBytes,
        sha256Checksum: d.sha256Checksum,
        version: d.version,
      })),
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      {/* Top Architecture Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Java 21 & Spring Boot 3.4 Backend Architecture & Session Audit
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect or download the complete Java 21 Spring Boot REST controllers, JWT security configuration, and Flyway SQL schema
          </p>
        </div>

        {/* Mode Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setInspectorTab('java-source')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              inspectorTab === 'java-source'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Java 21 Source Files
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab('live-json')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              inspectorTab === 'live-json'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Live API State Payload
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab('security-audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              inspectorTab === 'security-audit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Session Security Audit
          </button>
        </div>
      </div>

      {inspectorTab === 'java-source' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* File Tree List (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Spring Boot Project Structure
              </p>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
                {JAVA_SPRING_BOOT_FILES.map((file) => {
                  const isSelected = file.id === activeFile.id;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setSelectedFileId(file.id)}
                      className={`w-full text-left py-3 px-2.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {file.fileName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {file.packagePath}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 space-y-1">
              <div>Java Target: OpenJDK 21 LTS</div>
              <div>Spring Boot: 3.4.0-RELEASE</div>
            </div>
          </div>

          {/* Code Viewer (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                    {activeFile.packagePath}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeFile.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeFile.code, activeFile.id)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === activeFile.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Source</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadSourceFile(activeFile.fileName, activeFile.code)
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {activeFile.fileName}</span>
                  </button>
                </div>
              </div>

              <pre className="mt-4 p-5 text-xs font-mono leading-relaxed bg-slate-950 text-slate-100 rounded-lg overflow-x-auto max-h-[460px]">
                {activeFile.code}
              </pre>
            </div>
          </div>
        </div>
      )}

      {inspectorTab === 'live-json' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live REST API Snapshot (/api/v1/workspace/export)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time serialized state of your authenticated session, tasks, habits, goals, and document checksums
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleDownloadSourceFile('plms-workspace-export.json', liveJsonPayload)
              }
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
          </div>
          <pre className="p-5 text-xs font-mono leading-relaxed bg-slate-950 text-emerald-300 rounded-lg overflow-x-auto max-h-[440px]">
            {liveJsonPayload}
          </pre>
        </div>
      )}

      {inspectorTab === 'security-audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Authenticated Principal & Security Audit Trail
              </h3>
            </div>
            <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
              Principal ID: {currentUser.id}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Audit Event ID</th>
                  <th className="py-2.5 px-3">Security Operation</th>
                  <th className="py-2.5 px-3">Client Workstation</th>
                  <th className="py-2.5 px-3">Network Origin</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {auditLogs.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-500">
                      {entry.id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {entry.event}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {entry.device}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-500">
                      {entry.ipAddress}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                      {entry.timestamp}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {entry.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
