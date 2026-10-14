import React, { useState } from 'react';
import {
  X,
  Bell,
  Send,
  CheckCircle2,
  Calendar,
  Trophy,
  Award,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { NotificationItem, User } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  currentUser: User;
  onMarkAllAsRead: () => void;
  onSendPushNotification: (title: string, message: string, type: 'round' | 'result' | 'podium' | 'system') => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  onMarkAllAsRead,
  onSendPushNotification,
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState<'round' | 'result' | 'podium' | 'system'>('round');
  const [webNotificationStatus, setWebNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  if (!isOpen) return null;

  const handleRequestWebNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setWebNotificationStatus(perm);
        if (perm === 'granted') {
          new Notification('🏁 PitStop Pro - Notificações Ativadas!', {
            body: 'Você receberá avisos em tempo real sobre novas rodadas e resultados de corridas.',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    onSendPushNotification(title, message, notifType);
    setTitle('');
    setMessage('');
    setIsComposing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-black text-white">
                Centro de Notificações & Avisos
              </h3>
              <p className="text-xs text-zinc-400">
                Avisos oficiais sobre novas rodadas, homologação de resultados e pódios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web Push Banner */}
        <div className="p-3.5 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-zinc-300">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Notificações no Navegador:</span>
            <span className="font-mono font-bold capitalize text-zinc-400">
              {webNotificationStatus === 'granted'
                ? 'Ativadas ✓'
                : webNotificationStatus === 'denied'
                ? 'Bloqueadas'
                : 'Não ativadas'}
            </span>
          </div>

          {webNotificationStatus !== 'granted' && webNotificationStatus !== 'unsupported' && (
            <button
              onClick={handleRequestWebNotificationPermission}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
            >
              Ativar Avisos Push
            </button>
          )}
        </div>

        {/* Compose Push Form (Admin only) */}
        {currentUser.role === 'admin' && (
          <div className="p-4 bg-zinc-950 border-b border-zinc-800">
            {!isComposing ? (
              <button
                onClick={() => setIsComposing(true)}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Disparar Nova Notificação Push para os Pilotos</span>
              </button>
            ) : (
              <form onSubmit={handleSend} className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="font-bold text-white text-xs">Compor Notificação Push</span>
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="text-zinc-500 hover:text-white text-xs"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Título do Aviso</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 🏁 Grid da 9ª Etapa Definido!"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Tipo de Notificação</label>
                    <select
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                    >
                      <option value="round">🏁 Nova Rodada / Etapa</option>
                      <option value="result">📊 Homologação de Resultado</option>
                      <option value="podium">🏆 Consagração de Pódio</option>
                      <option value="system">📢 Comunicado Geral</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Mensagem Push</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ex: Os horários das baterias de Setembro já foram publicados no mural oficial."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Notificação</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Nenhuma notificação registrada no momento.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition flex items-start space-x-3 ${
                  item.read
                    ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
                    : 'bg-zinc-950 border-red-500/40 text-zinc-200'
                }`}
              >
                <div className="mt-0.5">
                  {item.type === 'result' ? (
                    <Trophy className="w-4 h-4 text-amber-400" />
                  ) : item.type === 'podium' ? (
                    <Award className="w-4 h-4 text-amber-500" />
                  ) : item.type === 'round' ? (
                    <Calendar className="w-4 h-4 text-blue-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-zinc-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-white text-xs truncate">{item.title}</h4>
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllAsRead}
            className="text-zinc-400 hover:text-white transition font-semibold"
          >
            Marcar todas como lidas
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
