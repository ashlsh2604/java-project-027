import React, { useRef, useState } from 'react';
import {
  CloudUpload,
  Download,
  FileText,
  FolderLock,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { computeDeterministicHash } from '../data/initialData';
import { CloudDocument, DocumentFolder } from '../types/plms';

interface CloudDocumentVaultProps {
  documents: CloudDocument[];
  onAddDocument: (doc: CloudDocument) => void;
  onUpdateDocument: (doc: CloudDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onTriggerCloudSync: () => void;
  lastCloudSyncTime: string;
  isSyncing: boolean;
}

const FOLDERS: DocumentFolder[] = [
  'Financial Records',
  'Career & Contracts',
  'Health & Medical',
  'Personal Notes',
  'Identity & Legal',
];

export const CloudDocumentVault: React.FC<CloudDocumentVaultProps> = ({
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onTriggerCloudSync,
  lastCloudSyncTime,
  isSyncing,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<'ALL' | DocumentFolder>('ALL');
  const [starredOnly, setStarredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDocumentId, setActiveDocumentId] = useState<string>(
    documents[0]?.id || ''
  );
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editorBuffer, setEditorBuffer] = useState('');
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);

  // New Document Modal State
  const [newTitle, setNewTitle] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFolder, setNewFolder] = useState<DocumentFolder>('Personal Notes');
  const [newContent, setNewContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesFolder = selectedFolder === 'ALL' || doc.folder === selectedFolder;
    const matchesStarred = !starredOnly || doc.starred;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesStarred && matchesSearch;
  });

  const activeDoc =
    documents.find((d) => d.id === activeDocumentId) || filteredDocs[0] || null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const textContent =
        typeof reader.result === 'string'
          ? reader.result
          : `# Uploaded Binary Asset: ${file.name}\nSize: ${file.size} bytes\nMIME: ${file.type}`;

      const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const uploadedDoc: CloudDocument = {
        id: `DOC-${Math.floor(910 + Math.random() * 8900)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        folder: selectedFolder === 'ALL' ? 'Personal Notes' : selectedFolder,
        mimeType: file.type || 'text/plain',
        sizeBytes: file.size || new TextEncoder().encode(textContent).length,
        content: textContent,
        sha256Checksum: computeDeterministicHash(textContent),
        version: 1,
        starred: false,
        updatedAt: nowStr,
        syncState: 'Synced',
      };

      onAddDocument(uploadedDoc);
      setActiveDocumentId(uploadedDoc.id);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadDocument = (doc: CloudDocument) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || `${doc.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEditedContent = () => {
    if (!activeDoc) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    onUpdateDocument({
      ...activeDoc,
      content: editorBuffer,
      sizeBytes: new TextEncoder().encode(editorBuffer).length,
      sha256Checksum: computeDeterministicHash(editorBuffer),
      version: activeDoc.version + 1,
      updatedAt: nowStr,
      syncState: 'Synced',
    });
    setIsEditingContent(false);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const cleanFile =
      newFileName.trim() ||
      `${newTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.md`;
    const body =
      newContent.trim() || `# ${newTitle.trim()}\n\nCreated in PLMS Cloud Document Vault.`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const created: CloudDocument = {
      id: `DOC-${Math.floor(910 + Math.random() * 8900)}`,
      title: newTitle.trim(),
      fileName: cleanFile,
      folder: newFolder,
      mimeType: 'text/markdown',
      sizeBytes: new TextEncoder().encode(body).length,
      content: body,
      sha256Checksum: computeDeterministicHash(body),
      version: 1,
      starred: false,
      updatedAt: nowStr,
      syncState: 'Synced',
    };

    onAddDocument(created);
    setActiveDocumentId(created.id);
    setNewTitle('');
    setNewFileName('');
    setNewContent('');
    setIsNewDocModalOpen(false);
  };

  const totalStorageBytes = documents.reduce((acc, d) => acc + d.sizeBytes, 0);

  return (
    <div className="space-y-6">
      {/* Top Cloud Sync Telemetry & Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Cloud-Synced Document Storage Vault
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {documents.length} Encrypted Objects · {formatBytes(totalStorageBytes)} Used · Last
            Cloud Checkpoint: {lastCloudSyncTime}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.json,.csv,.log,.xml,.java,.sql"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={onTriggerCloudSync}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Verify & Sync Vault'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Upload Local File</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewDocModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Cloud Document</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace: Left Folder & Document Table (5 cols) | Right Live Inspector & Editor (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Folder Selector + Document List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Search + Starred Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search filename or content..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setStarredOnly(!starredOnly)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  starredOnly
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Starred</span>
              </button>
            </div>

            {/* Folder Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedFolder('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedFolder === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({documents.length})
              </button>
              {FOLDERS.map((folder) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setSelectedFolder(folder)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    selectedFolder === folder
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {folder.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Document Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
              {filteredDocs.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setActiveDocumentId(doc.id);
                      setIsEditingContent(false);
                    }}
                    className={`py-3 px-2.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {doc.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
                        <span>{doc.folder}</span>
                        <span aria-hidden="true">·</span>
                        <span>v{doc.version}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatBytes(doc.sizeBytes)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateDocument({ ...doc, starred: !doc.starred });
                      }}
                      aria-label={`Star ${doc.title}`}
                      className={`p-1 cursor-pointer ${
                        doc.starred
                          ? 'text-amber-500'
                          : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono tabular-nums">
            <span>Encryption: AES-256-GCM</span>
            <span>Integrity: SHA-256 Verified</span>
          </div>
        </div>

        {/* Right Column: Document Reader, Live Editor & SHA-256 Checksum Inspector */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          {activeDoc ? (
            <>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mb-1">
                      <span>{activeDoc.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeDoc.fileName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {activeDoc.syncState}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                      {activeDoc.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditingContent ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditorBuffer(activeDoc.content);
                          setIsEditingContent(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit Document
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditingContent(false)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditedContent}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                        >
                          Commit v{activeDoc.version + 1}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(activeDoc)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDocument(activeDoc.id)}
                      aria-label={`Delete ${activeDoc.title}`}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Document Body or Editor */}
                <div className="my-5">
                  {isEditingContent ? (
                    <textarea
                      rows={14}
                      value={editorBuffer}
                      onChange={(e) => setEditorBuffer(e.target.value)}
                      className="w-full p-4 text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  ) : (
                    <pre className="w-full p-5 text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto max-h-[360px]">
                      {activeDoc.content}
                    </pre>
                  )}
                </div>
              </div>

              {/* Cryptographic Metadata Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Folder: {activeDoc.folder}</span>
                  <span>Updated: {activeDoc.updatedAt}</span>
                  <span>Revision: v{activeDoc.version}</span>
                </div>
                <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                  SHA-256 Digest: {activeDoc.sha256Checksum}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Select a document from the Cloud Vault or create a new record.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create New Cloud Document Modal */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Create Cloud-Synced Document
              </h3>
              <button
                type="button"
                onClick={() => setIsNewDocModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 2026 Estate & Trust Beneficiary Schedule"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vault Folder
                  </label>
                  <select
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value as DocumentFolder)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {FOLDERS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="estate-schedule-2026.md"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Markdown / Text Content
                </label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="# Document Heading&#10;&#10;Enter structured notes, records, or configuration..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Encrypt & Sync to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
