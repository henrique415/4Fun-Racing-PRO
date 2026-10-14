import React, { useState } from 'react';
import {
  X,
  Crown,
  Shield,
  Trophy,
  LogIn,
  KeyRound,
  CheckCircle2,
  Users,
  Mail,
  UserPlus,
  Sparkles,
  Loader2,
  AlertCircle,
  Wrench,
  Flag,
} from 'lucide-react';
import { User, Driver, Role, Tenant } from '../types';
import { getRoleInfo, isSupreme } from '../utils/permissions';
import { googleSignIn } from '../services/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  drivers: Driver[];
  tenants?: Tenant[];
  onSelectUser: (user: User) => void;
  onCreatePilotUser: (name: string, email: string, driverId?: string, role?: Role, tenantId?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  drivers,
  tenants = [],
  onSelectUser,
  onCreatePilotUser,
}) => {
  const [activeMode, setActiveMode] = useState<'switch' | 'newAccount'>('switch');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<Role>('pilot');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || 'tenant-mp-racing');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isSup = isSupreme(currentUser);
  const isProducerAdminOrProducer =
    currentUser.role === 'producer_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'producer';
  const isPilotOrMechanic = !isSup && !isProducerAdminOrProducer;

  // Scoped users list: Supreme sees all, Producer Admins only see users of their own tenant
  const userTenantId = currentUser.tenantId || tenants[0]?.id || 'tenant-mp-racing';
  const scopedUsers = users.filter((u) => {
    if (isSup) return true;
    if (isProducerAdminOrProducer) {
      return (
        u.tenantId === userTenantId ||
        (u.tenantIds && u.tenantIds.includes(userTenantId))
      );
    }
    // Pilot / Mechanic: only themselves
    return u.id === currentUser.id;
  });

  const availableDrivers = drivers.filter((d) => {
    if (isSup) return true;
    return !d.tenantId || d.tenantId === userTenantId;
  });

  const activeTenantName =
    tenants.find((t) => t.id === userTenantId)?.name || 'Produtora Atual';

  if (!isOpen) return null;

  const handleCreateAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    const assignedRole = isSup
      ? customRole
      : customRole === 'supreme_admin'
      ? 'pilot'
      : customRole;
    const assignedTenantId = isSup
      ? customRole === 'supreme_admin'
        ? 'global'
        : selectedTenantId
      : userTenantId;

    onCreatePilotUser(
      customName.trim(),
      customEmail.trim(),
      assignedRole === 'pilot' ? selectedDriverId : undefined,
      assignedRole,
      assignedTenantId
    );
    onClose();
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      const googleResult = await googleSignIn();
      if (!googleResult || !googleResult.email) {
        throw new Error('Falha ao autenticar com Google.');
      }

      const email = googleResult.email.toLowerCase().trim();
      const existing = users.find((u) => u.email.toLowerCase() === email);

      if (existing) {
        onSelectUser(existing);
        onClose();
        return;
      }

      const matchedDriver = drivers.find(
        (d) => d.email && d.email.toLowerCase().trim() === email
      );

      const isSupremeOwner = email === 'henrique@g4f.capital';

      const newUser: User = {
        id: `user-google-${Date.now()}`,
        name: matchedDriver
          ? `${matchedDriver.name} (Piloto #${matchedDriver.kartNumber})`
          : googleResult.displayName || email.split('@')[0].toUpperCase(),
        email: email,
        role: isSupremeOwner ? 'supreme_admin' : 'pilot',
        tenantId: isSupremeOwner ? 'global' : (matchedDriver?.tenantId || selectedTenantId),
        driverId: matchedDriver?.id || (isSupremeOwner ? 'd-18' : undefined),
        avatar: googleResult.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        active: true,
      };

      onSelectUser(newUser);
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Erro ao conectar via Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'supreme_admin':
      case 'supreme':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'producer_admin':
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-red-400" />;
      case 'producer':
        return <Flag className="w-3.5 h-3.5 text-blue-400" />;
      case 'pilot':
        return <Trophy className="w-3.5 h-3.5 text-emerald-400" />;
      case 'mechanic':
        return <Wrench className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Trophy className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Controle de Acesso & Perfis (5 Papéis)
              </h3>
              <p className="text-xs text-zinc-400">
                Alterne entre perfis de teste ou autentique sua conta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authError && (
          <div className="mx-5 mt-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Mode Selector */}
        <div className="p-3 bg-zinc-950/60 border-b border-zinc-800 flex space-x-2 text-xs">
          <button
            onClick={() => setActiveMode('switch')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeMode === 'switch'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários Registrados ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveMode('newAccount')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeMode === 'newAccount'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Novo Acesso</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs max-h-[60vh] overflow-y-auto space-y-4">
          {activeMode === 'switch' ? (
            <div className="space-y-4">
              {/* Google Workspace Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading}
                className="w-full p-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-left transition cursor-pointer flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-xs">Entrar com Google (Gmail / Workspace)</h4>
                    <p className="text-[11px] text-zinc-400">Autentica com sua conta real e aplica seu perfil cadastrado</p>
                  </div>
                </div>
                <span className="text-zinc-500 group-hover:text-white font-bold text-xs">
                  Entrar →
                </span>
              </button>

              {/* Registered Users List */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider">
                  {isSup
                    ? 'Todos os Usuários do Sistema:'
                    : `Usuários Autorizados - ${activeTenantName}:`}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {scopedUsers.length} cadastrados
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scopedUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const roleInfo = getRoleInfo(u.role);
                  const matchedDriver = drivers.find((d) => d.id === u.driverId);

                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-red-950/30 border-red-500 shadow-md'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs">
                          {getRoleIcon(u.role)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-white text-xs">{u.name}</h4>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${roleInfo.badgeBg} ${roleInfo.badgeBorder} ${roleInfo.badgeText}`}
                            >
                              {roleInfo.shortLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">{u.email}</span>
                          {matchedDriver && (
                            <span className="text-[10px] text-amber-400 block">
                              Kart #{matchedDriver.kartNumber} • {matchedDriver.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] uppercase">
                          Ativo
                        </span>
                      ) : (
                        <span className="text-zinc-500 hover:text-white font-bold text-xs">
                          Selecionar →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* New Account / First Access Form */
            <form onSubmit={handleCreateAndLogin} className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">E-mail de Acesso *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: usuario@produtora.com.br"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nível de Permissão</label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as Role)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-red-500 font-bold"
                >
                  {isSup && (
                    <option value="supreme_admin">👑 Administrador Supremo (Acesso Global)</option>
                  )}
                  <option value="producer_admin">🛡️ Administrador da Produtora</option>
                  <option value="producer">🚩 Produtor (Campeonatos, Pilotos & Resultados)</option>
                  <option value="pilot">🏎️ Piloto (Perfil, Grid e Resultados)</option>
                  <option value="mechanic">🔧 Mecânico (Equipes e Resultados)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Produtora / Tenant</label>
                {isSup ? (
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-red-500"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.city || 'Oficial'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 font-semibold flex items-center justify-between">
                    <span>{activeTenantName}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Fixo</span>
                  </div>
                )}
              </div>

              {customRole === 'pilot' && (
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">
                    Vincular a um Piloto do Grid (Opcional)
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="">Nenhum (Independente)</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        #{d.kartNumber} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-lg shadow-red-950/50 cursor-pointer text-xs"
                >
                  Cadastrar e Acessar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            Acesso protegido por controle de papéis (RBAC Multi-Tenant).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
