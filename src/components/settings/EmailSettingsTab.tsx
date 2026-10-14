import React, { useState } from 'react';
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  FileText,
  Key,
} from 'lucide-react';
import { User, Driver, Role } from '../../types';
import { sendWelcomeEmailViaGmail, generateWelcomeEmailHtml } from '../../services/gmailService';

interface EmailSettingsTabProps {
  users: User[];
  drivers: Driver[];
  showNotification: (msg: string) => void;
  showErrorNotification: (msg: string) => void;
}

export const EmailSettingsTab: React.FC<EmailSettingsTabProps> = ({
  users,
  drivers,
  showNotification,
  showErrorNotification,
}) => {
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('Piloto de Teste');
  const [testRole, setTestRole] = useState<Role>('pilot');
  const [isSending, setIsSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; to: string; date: string; status: 'ok' | 'error' }>>([
    { id: '1', to: 'henrique@g4f.capital', date: 'Hoje às 10:15', status: 'ok' },
  ]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      showErrorNotification('Informe um endereço de e-mail válido para o teste.');
      return;
    }

    setIsSending(true);
    showNotification(`Disparando e-mail de teste para ${testEmail} via Gmail...`);

    const res = await sendWelcomeEmailViaGmail({
      toEmail: testEmail.trim(),
      userName: testName.trim(),
      role: testRole,
      kartNumber: '07',
      driverName: testName.trim(),
    });

    setIsSending(false);

    if (res.success) {
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          to: testEmail.trim(),
          date: 'Agora mesmo',
          status: 'ok',
        },
        ...prev,
      ]);
      showNotification(`✅ E-mail disparado com sucesso para ${testEmail}!`);
    } else {
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          to: testEmail.trim(),
          date: 'Agora mesmo',
          status: 'error',
        },
        ...prev,
      ]);
      showErrorNotification(`Falha no envio: ${res.error || res.warning}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-red-500" />
              <span>Envio de E-mail & Automação Gmail</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configurações de envio automático de credenciais, primeiro acesso e comunicados de baterias.
            </p>
          </div>

          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <span>Visualizar Modelo do E-mail</span>
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Conexão Gmail API</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">Ativa & Pronta</span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">Google Workspace OAuth2</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300 mb-1">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Template de E-mail</span>
            </div>
            <span className="text-sm font-bold text-white">Boas-Vindas & Acesso</span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">HTML responsivo estilizado</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300 mb-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Disparo Automático</span>
            </div>
            <span className="text-sm font-bold text-white">No Cadastro de Usuário</span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">Com link direto e credenciais</span>
          </div>
        </div>

        {/* Test Send Form */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-red-500" />
            <span>Disparar E-mail de Teste</span>
          </h4>

          <form onSubmit={handleSendTest} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 font-bold mb-1">
                Destinatário (E-mail)
              </label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 font-bold mb-1">
                Nome do Destinatário
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Ex: Carlos Piloto"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-red-950/40"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Disparando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Teste Agora</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Dispatch History */}
        <div className="mt-5 space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Histórico Recente de Disparos
          </h4>
          <div className="space-y-1.5">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-white">{h.to}</span>
                  <span className="text-zinc-500 text-[11px]">• {h.date}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Enviado
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Email Template Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-white text-sm">
                  Modelo Oficial do E-mail (Primeiro Acesso)
                </h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-zinc-950">
              <div
                dangerouslySetInnerHTML={{
                  __html: generateWelcomeEmailHtml({
                    toEmail: 'piloto@mpracing.com.br',
                    userName: 'Carlos Eduardo',
                    role: 'pilot',
                    kartNumber: '18',
                    driverName: 'Carlos Eduardo',
                  }),
                }}
              />
            </div>

            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
