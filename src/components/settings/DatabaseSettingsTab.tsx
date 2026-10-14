import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  Save,
  Download,
  Upload,
  CheckCircle2,
  Server,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Championship, Tenant, User } from '../../types';
import { StorageService } from '../../services/storage';

interface DatabaseSettingsTabProps {
  tenants: Tenant[];
  championships: Championship[];
  users: User[];
  onSyncCloud?: () => Promise<void>;
  showNotification: (msg: string) => void;
  showErrorNotification: (msg: string) => void;
}

export const DatabaseSettingsTab: React.FC<DatabaseSettingsTabProps> = ({
  tenants,
  championships,
  users,
  onSyncCloud,
  showNotification,
  showErrorNotification,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = async () => {
    if (!onSyncCloud) return;
    try {
      setIsSyncing(true);
      await onSyncCloud();
      showNotification('✅ Banco de dados sincronizado com a nuvem Firestore com sucesso!');
    } catch (err: any) {
      showErrorNotification(`Erro na sincronização: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const jsonStr = StorageService.exportBackupJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitstop-pro-database-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Backup completo em JSON baixado com sucesso!');
    } catch (e: any) {
      showErrorNotification('Falha ao gerar arquivo de backup.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importBackupJson(content);
        if (success) {
          showNotification('Backup restaurado! Recarregando sistema em instantes...');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showErrorNotification('Erro: Arquivo JSON de backup corrompido ou inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md space-y-5">
        <div className="border-b border-zinc-800/80 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-red-500" />
            <span>Banco de Dados Oficial na Nuvem (Firebase Firestore)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sincronização persistente e imediata em tempo real. Qualquer alteração em campeonatos, baterias, pilotos ou configurações grava diretamente no Firestore.
          </p>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 font-semibold block uppercase tracking-wider mb-1">
              Conexão Firestore
            </span>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-base font-black text-white">Conectado (Tempo Real)</span>
            </div>
            <span className="text-[11px] text-zinc-500 block mt-1">
              Auto-sync imediato em cada ação
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 font-semibold block uppercase tracking-wider mb-1">
              Produtoras / Tenants
            </span>
            <span className="text-xl font-black text-white">{tenants.length} Produtora(s)</span>
            <span className="text-[11px] text-zinc-500 block mt-1">
              Isolamento multi-tenant ativo
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 font-semibold block uppercase tracking-wider mb-1">
              Usuários Registrados
            </span>
            <span className="text-xl font-black text-white">{users.length} Usuário(s)</span>
            <span className="text-[11px] text-zinc-500 block mt-1">
              Autenticação unificada Google / Senha
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando Firestore...' : 'Sincronizar Agora com Firestore'}</span>
          </button>
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md">
        <div className="border-b border-zinc-800/80 pb-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Save className="w-4 h-4 text-amber-400" />
            <span>Backup de Segurança & Restauração</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Faça download do snapshot completo dos dados em formato JSON ou faça upload para restaurar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Arquivo de Backup (.JSON)</span>
          </button>

          <label className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 cursor-pointer">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Importar / Restaurar Backup</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportBackup}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
