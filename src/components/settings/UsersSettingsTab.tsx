import React, { useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Eye,
  Send,
  Trash2,
  Edit2,
  UserCheck,
  Shield,
  Loader2,
  Lock,
  Building2,
  Check,
  Filter,
} from 'lucide-react';
import { User, Role, Tenant, Driver } from '../../types';
import { getRoleInfo, isSupreme } from '../../utils/permissions';
import { sendWelcomeEmailViaGmail } from '../../services/gmailService';
import { StorageService } from '../../services/storage';
import { CloudDatabaseService } from '../../services/cloudDatabase';

interface UsersSettingsTabProps {
  users: User[];
  onSaveUsers: (users: User[]) => void;
  tenants: Tenant[];
  activeTenant?: Tenant;
  drivers: Driver[];
  currentUser: User | null;
  onPreviewEmail: (user: User) => void;
  showNotification: (msg: string) => void;
  showErrorNotification: (msg: string) => void;
}

export const UsersSettingsTab: React.FC<UsersSettingsTabProps> = ({
  users,
  onSaveUsers,
  tenants,
  activeTenant,
  drivers,
  currentUser,
  onPreviewEmail,
  showNotification,
  showErrorNotification,
}) => {
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'admins' | Role>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('pilot');
  const [newUserTenantId, setNewUserTenantId] = useState<string>(activeTenant?.id || tenants[0]?.id || 'tenant-mp-racing');
  const [newUserDriverId, setNewUserDriverId] = useState('');
  const [sendEmailAuto, setSendEmailAuto] = useState(true);

  // Edit user form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('pilot');
  const [editTenantId, setEditTenantId] = useState<string>('');
  const [editTenantIds, setEditTenantIds] = useState<string[]>([]);
  const [editDriverId, setEditDriverId] = useState('');
  const [editActive, setEditActive] = useState(true);

  const isUserSupreme = isSupreme(currentUser);

  // Scoping logic:
  // Supreme admin sees all tenants (with filter option).
  // Producer admin only sees users in their own tenant.
  const scopedUsers = users.filter((u) => {
    // Role filter
    if (filterRole === 'admins') {
      if (u.role !== 'supreme_admin' && u.role !== 'supreme' && u.role !== 'producer_admin' && u.role !== 'admin') {
        return false;
      }
    } else if (filterRole !== 'all') {
      if (u.role !== filterRole) return false;
    }

    // Tenant scoping
    if (!isUserSupreme && activeTenant) {
      const inTenant =
        u.tenantId === activeTenant.id ||
        (u.tenantIds && u.tenantIds.includes(activeTenant.id));
      if (!inTenant) return false;
    } else if (filterTenant !== 'all') {
      if (filterTenant === 'global') {
        if (u.tenantId !== 'global' && u.role !== 'supreme_admin') return false;
      } else {
        const matches =
          u.tenantId === filterTenant ||
          (u.tenantIds && u.tenantIds.includes(filterTenant));
        if (!matches) return false;
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.tenantId && u.tenantId.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showErrorNotification('Preencha o nome e e-mail do usuário.');
      return;
    }

    const cleanEmail = newUserEmail.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
      showErrorNotification(`Já existe um usuário com o e-mail ${cleanEmail}.`);
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      email: cleanEmail,
      role: isUserSupreme ? newUserRole : (newUserRole === 'supreme_admin' ? 'pilot' : newUserRole),
      password: newUserPassword.trim() || undefined,
      tenantId: isUserSupreme
        ? (newUserRole === 'supreme_admin' ? 'global' : newUserTenantId)
        : (activeTenant?.id || 'tenant-mp-racing'),
      tenantIds: isUserSupreme
        ? [newUserTenantId]
        : [activeTenant?.id || 'tenant-mp-racing'],
      driverId: newUserDriverId || undefined,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      active: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    onSaveUsers(updated);
    StorageService.saveUsers(updated);
    await CloudDatabaseService.saveToCloud({ users: updated });

    setShowNewModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('pilot');
    setNewUserDriverId('');

    if (sendEmailAuto) {
      setIsSendingEmail(true);
      showNotification(`Usuário criado! Enviando e-mail de acesso via Gmail...`);
      const matchedDriver = drivers.find((d) => d.id === newUser.driverId);
      const res = await sendWelcomeEmailViaGmail({
        toEmail: newUser.email,
        userName: newUser.name,
        role: newUser.role,
        kartNumber: matchedDriver?.kartNumber,
        driverName: matchedDriver?.name,
      });
      setIsSendingEmail(false);
      if (res.success) {
        showNotification(`✅ Usuário ${newUser.name} cadastrado e e-mail de acesso enviado via Gmail!`);
      } else {
        showNotification(`Usuário salvo com sucesso! (Aviso e-mail: ${res.error || res.warning})`);
      }
    } else {
      showNotification(`Usuário ${newUser.name} cadastrado com sucesso!`);
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword(user.password || '');
    setEditRole(user.role);
    setEditTenantId(user.tenantId || activeTenant?.id || 'tenant-mp-racing');
    setEditTenantIds(user.tenantIds || [user.tenantId || 'tenant-mp-racing']);
    setEditDriverId(user.driverId || '');
    setEditActive(user.active !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      showErrorNotification('Nome e e-mail são obrigatórios.');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      password: editPassword.trim() || undefined,
      tenantId: editRole === 'supreme_admin' ? 'global' : editTenantId,
      tenantIds: editTenantIds.length > 0 ? editTenantIds : [editTenantId],
      driverId: editDriverId || undefined,
      active: editActive,
    };

    const updated = users.map((u) => (u.id === editingUser.id ? updatedUser : u));
    onSaveUsers(updated);
    StorageService.saveUsers(updated);
    await CloudDatabaseService.saveToCloud({ users: updated });

    setEditingUser(null);
    showNotification(`Usuário "${updatedUser.name}" atualizado e persistido com sucesso!`);
  };

  const handleDeleteUser = async (user: User) => {
    if (user.email === 'henrique@g4f.capital') {
      showErrorNotification('O Usuário Administrador Supremo oficial não pode ser excluído.');
      return;
    }

    const updated = users.filter((u) => u.id !== user.id);
    onSaveUsers(updated);
    StorageService.saveUsers(updated);
    await CloudDatabaseService.saveToCloud({ users: updated });
    setUserToDelete(null);
    showNotification(`Usuário ${user.name} removido do sistema.`);
  };

  const handleResendEmail = async (user: User) => {
    setIsSendingEmail(true);
    showNotification(`Enviando instruções de acesso para ${user.email} via Gmail...`);
    const matchedDriver = drivers.find((d) => d.id === user.driverId);
    const res = await sendWelcomeEmailViaGmail({
      toEmail: user.email,
      userName: user.name,
      role: user.role,
      kartNumber: matchedDriver?.kartNumber,
      driverName: matchedDriver?.name,
    });
    setIsSendingEmail(false);
    if (res.success) {
      showNotification(`✅ E-mail reenviado para ${user.email} com sucesso via Gmail!`);
    } else {
      showErrorNotification(`Falha no envio: ${res.error || res.warning}`);
    }
  };

  const getTenantBadge = (u: User) => {
    if (u.role === 'supreme_admin' || u.tenantId === 'global') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          🌐 Global
        </span>
      );
    }
    const found = tenants.find((t) => t.id === u.tenantId);
    const multipleCount = u.tenantIds ? u.tenantIds.length : 1;
    return (
      <div className="flex items-center space-x-1">
        <span className="text-xs text-white font-medium">
          {found ? found.name : u.tenantId}
        </span>
        {multipleCount > 1 && (
          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono" title={`Acesso a ${multipleCount} produtoras`}>
            +{multipleCount - 1}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        {/* Header & New User Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              <span>Gestão de Usuários & Controle Multi-Tenant</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Usuários cadastrados com controle de permissões por produtora, multi-tenancy e credenciais.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Novo Usuário</span>
          </button>
        </div>

        {/* User vs Pilot Explanatory Banner */}
        <div className="mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
            i
          </div>
          <div>
            <strong className="text-zinc-200">Arquitetura de Acesso (Usuário vs Piloto):</strong> Um <strong className="text-emerald-400">Usuário</strong> tem credenciais para acessar o sistema com papel e permissões específicos definidos aqui pelo Administrador Supremo. Um <strong className="text-amber-400">Piloto</strong> é participante do grid e pontuação das etapas. Para dar acesso ao sistema a um piloto, cadastre-o aqui como Usuário e vincule-o ao seu piloto correspondente.
          </div>
        </div>

        {/* Filters Strip */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 text-xs text-zinc-400">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold">Filtros:</span>
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="bg-zinc-900 text-xs text-white border border-zinc-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500"
            >
              <option value="all">Todos os Papéis ({users.length})</option>
              <option value="admins">Apenas Administradores (Supremo & Produtora)</option>
              <option value="supreme_admin">👑 Administrador Supremo</option>
              <option value="producer_admin">🛡️ Admin Produtora</option>
              <option value="producer">🚩 Produtor</option>
              <option value="pilot">🏎️ Piloto</option>
              <option value="mechanic">🔧 Mecânico</option>
            </select>

            {/* Tenant Filter (Available for Supreme) */}
            {isUserSupreme && (
              <select
                value={filterTenant}
                onChange={(e) => setFilterTenant(e.target.value)}
                className="bg-zinc-900 text-xs text-white border border-zinc-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500"
              >
                <option value="all">Todas as Produtoras</option>
                <option value="global">🌐 Global (Supremos)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏢 {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-zinc-400">
            Exibindo <strong className="text-white">{scopedUsers.length}</strong> de {users.length} usuários
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Produtora(s)</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Senha</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {scopedUsers.map((u) => {
                const roleInfo = getRoleInfo(u.role);
                return (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.active === false && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                                Inativo
                              </span>
                            )}
                          </div>
                          {u.email === 'henrique@g4f.capital' && (
                            <span className="text-[10px] text-amber-400 font-bold">
                              👑 Master Supremo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-400">{u.email}</td>

                    <td className="py-3 px-4">{getTenantBadge(u)}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold inline-block ${roleInfo.badgeBg} ${roleInfo.badgeBorder} ${roleInfo.badgeText}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {u.password ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Configurada
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-medium">
                          1º Acesso Pendente
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                          title="Editar dados, permissões e senha do usuário"
                        >
                          <Edit2 className="w-3 h-3 text-sky-400" />
                          <span>Editar</span>
                        </button>

                        {/* Send Email Button */}
                        <button
                          onClick={() => handleResendEmail(u)}
                          disabled={isSendingEmail}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs transition cursor-pointer"
                          title="Enviar e-mail com dados de acesso via Gmail"
                        >
                          <Send className="w-3.5 h-3.5 text-red-400" />
                        </button>

                        {/* Delete Button */}
                        {u.email !== 'henrique@g4f.capital' && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-800/40 transition cursor-pointer"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm">Cadastrar Novo Usuário</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  E-mail Cadastrado *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@produtora.com.br"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Senha Provisória (Opcional - usuário pode definir no Primeiro Acesso)
                </label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Deixe em branco para o usuário configurar"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nível de Acesso (Perfil)
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer font-bold"
                  >
                    <option value="pilot">🏎️ Piloto</option>
                    <option value="producer">🚩 Produtor</option>
                    <option value="producer_admin">🛡️ Admin Produtora</option>
                    <option value="mechanic">🔧 Mecânico</option>
                    {isUserSupreme && (
                      <option value="supreme_admin">👑 Administrador Supremo (Global)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Produtora de Origem
                  </label>
                  {isUserSupreme ? (
                    <select
                      value={newUserTenantId}
                      onChange={(e) => setNewUserTenantId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 font-semibold flex items-center justify-between">
                      <span>{activeTenant?.name || 'Produtora Atual'}</span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Tenant Fixo</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Vincular a um Piloto do Grid (Opcional)
                </label>
                <select
                  value={newUserDriverId}
                  onChange={(e) => setNewUserDriverId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="">Nenhum (Apenas usuário do sistema)</option>
                  {drivers
                    .filter((d) => !d.tenantId || d.tenantId === (isUserSupreme ? newUserTenantId : activeTenant?.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        🏎️ #{d.kartNumber} - {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-red-500/30 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="autoSendEmailNew"
                  checked={sendEmailAuto}
                  onChange={(e) => setSendEmailAuto(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-red-600 cursor-pointer"
                />
                <label htmlFor="autoSendEmailNew" className="text-xs text-zinc-300 cursor-pointer">
                  <strong className="text-white block">✉️ Enviar e-mail com dados de acesso via Gmail</strong>
                  Dispara automaticamente as instruções para o novo usuário.
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-950/50 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Salvar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm">Editar Usuário</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  E-mail Cadastrado *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={editingUser.email === 'henrique@g4f.capital'}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Senha de Acesso (Ver / Alterar)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Defina ou altere a senha deste usuário"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Se preenchida, o usuário poderá fazer login imediatamente com esta senha.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nível de Acesso (Perfil)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    disabled={editingUser.email === 'henrique@g4f.capital'}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer font-bold disabled:opacity-60"
                  >
                    <option value="pilot">🏎️ Piloto</option>
                    <option value="producer">🚩 Produtor</option>
                    <option value="producer_admin">🛡️ Admin Produtora</option>
                    <option value="mechanic">🔧 Mecânico</option>
                    <option value="supreme_admin">👑 Administrador Supremo (Global)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Produtora Principal
                  </label>
                  <select
                    value={editTenantId}
                    onChange={(e) => setEditTenantId(e.target.value)}
                    disabled={editingUser.email === 'henrique@g4f.capital'}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer disabled:opacity-60"
                  >
                    <option value="global">🌐 Global (Todas)</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Tenant Access Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Produtoras Autorizadas para este Usuário (Multi-Tenant)</span>
                </label>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 max-h-36 overflow-y-auto">
                  {tenants.map((t) => {
                    const isChecked = editTenantIds.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditTenantIds([...editTenantIds, t.id]);
                            } else {
                              setEditTenantIds(editTenantIds.filter((id) => id !== t.id));
                            }
                          }}
                          className="w-4 h-4 rounded accent-red-600"
                        />
                        <span className="font-bold">{t.name}</span>
                        <span className="text-zinc-500 text-[10px]">({t.city || 'SP'})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Ativo / Inativo */}
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-xs font-bold text-white block">Status da Conta</span>
                  <span className="text-[11px] text-zinc-400">
                    {editActive ? 'Conta ativa e liberada para login' : 'Conta desativada (login bloqueado)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                    editActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-950 text-red-400 border border-red-500/40'
                  }`}
                >
                  {editActive ? 'Ativa' : 'Inativa'}
                </button>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-950/50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Gravar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <h3 className="font-bold text-white text-sm">Excluir Usuário</h3>
            <p className="text-xs text-zinc-300">
              Deseja realmente remover o usuário <strong>{userToDelete.name}</strong> ({userToDelete.email})?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
