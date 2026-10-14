import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Mail,
  User,
  ExternalLink,
  Trash2,
  Edit2,
  Check,
  Shield,
  Save,
} from 'lucide-react';
import { Tenant, Championship, Driver, User as UserType } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudDatabaseService } from '../../services/cloudDatabase';
import { sendWelcomeEmailViaGmail } from '../../services/gmailService';

interface TenantsSettingsTabProps {
  tenants: Tenant[];
  onSaveTenants: (tenants: Tenant[]) => void;
  activeTenant?: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  championships: Championship[];
  drivers: Driver[];
  users: UserType[];
  onSaveUsers?: (users: UserType[]) => void;
  showNotification: (msg: string) => void;
  showErrorNotification: (msg: string) => void;
}

export const TenantsSettingsTab: React.FC<TenantsSettingsTabProps> = ({
  tenants,
  onSaveTenants,
  activeTenant,
  onSelectTenant,
  championships,
  drivers,
  users,
  onSaveUsers,
  showNotification,
  showErrorNotification,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('SP');
  const [primaryColor, setPrimaryColor] = useState('#dc2626');

  const handleOpenCreate = () => {
    setName('');
    setSlug('');
    setAdminName('');
    setAdminEmail('');
    setCity('São Paulo');
    setStateUf('SP');
    setPrimaryColor('#dc2626');
    setShowNewModal(true);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showErrorNotification('O nome da produtora é obrigatório.');
      return;
    }

    const generatedSlug =
      slug.trim().toLowerCase() ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');

    const newTenant: Tenant = {
      id: `tenant-${generatedSlug}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      slug: generatedSlug,
      adminName: adminName.trim() || undefined,
      adminEmail: adminEmail.trim().toLowerCase() || 'admin@produtora.com',
      city: city.trim() || 'São Paulo',
      state: stateUf.trim().toUpperCase() || 'SP',
      primaryColor: primaryColor || '#dc2626',
      active: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...tenants, newTenant];
    onSaveTenants(updated);
    StorageService.saveTenants(updated);

    // If adminEmail provided, create or ensure user exists with role producer_admin
    if (adminEmail.trim()) {
      const cleanEmail = adminEmail.trim().toLowerCase();
      const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      let updatedUsers: UserType[];
      if (!existingUser) {
        const newUser: UserType = {
          id: `user-${Date.now()}`,
          name: adminName.trim() || `Admin ${name.trim()}`,
          email: cleanEmail,
          role: 'producer_admin',
          tenantId: newTenant.id,
          tenantIds: [newTenant.id],
          active: true,
        };
        updatedUsers = [...users, newUser];
        if (onSaveUsers) onSaveUsers(updatedUsers);
        StorageService.saveUsers(updatedUsers);

        // Dispara e-mail automático de primeiro acesso com instruções
        sendWelcomeEmailViaGmail({
          toEmail: newUser.email,
          userName: newUser.name,
          role: newUser.role,
        }).catch((err) => console.warn('Erro ao disparar e-mail de boas-vindas:', err));

        await CloudDatabaseService.saveToCloud({ tenants: updated, users: updatedUsers });
        showNotification(`Produtora "${newTenant.name}" cadastrada! Administrador "${newUser.name}" criado com e-mail de primeiro acesso enviado.`);
      } else {
        updatedUsers = users.map((u) =>
          u.id === existingUser.id
            ? {
                ...u,
                tenantIds: Array.from(new Set([...(u.tenantIds || [u.tenantId || '']), newTenant.id])),
              }
            : u
        );
        if (onSaveUsers) onSaveUsers(updatedUsers);
        StorageService.saveUsers(updatedUsers);
        await CloudDatabaseService.saveToCloud({ tenants: updated, users: updatedUsers });
        showNotification(`Produtora "${newTenant.name}" cadastrada! Usuário existente "${existingUser.name}" vinculado como administrador.`);
      }
    } else {
      await CloudDatabaseService.saveToCloud({ tenants: updated });
      showNotification(`Produtora "${newTenant.name}" cadastrada com sucesso!`);
    }

    setShowNewModal(false);
  };

  const handleStartEdit = (t: Tenant) => {
    setEditingTenant(t);
    setName(t.name);
    setSlug(t.slug || '');
    setAdminName(t.adminName || '');
    setAdminEmail(t.adminEmail || '');
    setCity(t.city || '');
    setStateUf(t.state || 'SP');
    setPrimaryColor(t.primaryColor || '#dc2626');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    const updatedTenant: Tenant = {
      ...editingTenant,
      name: name.trim(),
      slug: slug.trim().toLowerCase() || editingTenant.slug,
      adminName: adminName.trim() || undefined,
      adminEmail: adminEmail.trim().toLowerCase() || editingTenant.adminEmail,
      city: city.trim() || editingTenant.city,
      state: stateUf.trim().toUpperCase() || editingTenant.state,
      primaryColor: primaryColor || editingTenant.primaryColor,
    };

    const updated = tenants.map((t) => (t.id === editingTenant.id ? updatedTenant : t));
    onSaveTenants(updated);
    StorageService.saveTenants(updated);
    await CloudDatabaseService.saveToCloud({ tenants: updated });

    setEditingTenant(null);
    showNotification(`Produtora "${updatedTenant.name}" atualizada com sucesso!`);
  };

  const handleDeleteTenant = async (t: Tenant) => {
    if (t.id === 'tenant-mp-racing') {
      showErrorNotification('A produtora padrão MP Racing não pode ser excluída.');
      return;
    }

    // Exclusão completa de todo o ambiente (campeonatos, pilotos, equipes e tenant)
    StorageService.deleteTenantCompletely(t.id);
    const remainingTenants = StorageService.getTenants();
    const remainingUsers = StorageService.getUsers();
    onSaveTenants(remainingTenants);
    if (onSaveUsers) onSaveUsers(remainingUsers);

    setTenantToDelete(null);
    showNotification(
      `Produtora "${t.name}" e todo seu ambiente isolado foram 100% excluídos do sistema. O domínio e e-mail agora podem ser recriados do zero.`
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" />
              <span>Produtoras Cadastradas & Isolamento Multi-Tenant</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cada produtora possui ambiente isolado com seus campeonatos, pontuações e pilotos.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Nova Produtora</span>
          </button>
        </div>

        {/* Tenants Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((t) => {
            const champCount = championships.filter((c) => !c.tenantId || c.tenantId === t.id).length;
            const driverCount = drivers.filter((d) => !d.tenantId || d.tenantId === t.id).length;
            const userCount = users.filter((u) => u.tenantId === t.id || (u.tenantIds && u.tenantIds.includes(t.id))).length;
            const isActive = activeTenant?.id === t.id;

            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl bg-zinc-950 border transition flex flex-col justify-between space-y-4 ${
                  isActive ? 'border-red-500 ring-1 ring-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md"
                        style={{ backgroundColor: t.primaryColor || '#dc2626' }}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">
                              Em Uso
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-mono">ID: {t.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 space-y-1.5 mt-3">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{t.city || 'São Paulo'}, {t.state || 'SP'}</span>
                    </div>
                    {t.adminName && (
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Responsável: <strong className="text-zinc-200">{t.adminName}</strong></span>
                      </div>
                    )}
                    {t.adminEmail && (
                      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-300">{t.adminEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/80 text-center">
                  <div className="bg-zinc-900/60 p-2 rounded-xl">
                    <span className="block text-xs font-black text-white">{champCount}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">Campeonatos</span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-xl">
                    <span className="block text-xs font-black text-white">{driverCount}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">Pilotos</span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-xl">
                    <span className="block text-xs font-black text-white">{userCount}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">Usuários</span>
                  </div>
                </div>

                {/* Actions: Acessar Produtora + Editar + Excluir */}
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onSelectTenant(t);
                      showNotification(`Ambiente alternado para a produtora "${t.name}"!`);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-400 cursor-default'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/40'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Ambiente Atual' : 'Acessar Produtora'}</span>
                  </button>

                  <button
                    onClick={() => handleStartEdit(t)}
                    className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
                    title="Editar produtora"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {t.id !== 'tenant-mp-racing' && (
                    <button
                      onClick={() => setTenantToDelete(t)}
                      className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 transition cursor-pointer"
                      title="Excluir produtora"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE NEW TENANT MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm">Cadastrar Nova Produtora / Tenant</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nome da Produtora / Liga de Kart *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Speed Racing Brasil"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nome do Administrador
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Ex: Roberto Carlos"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@speedracing.com"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 uppercase"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-950/50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Cadastrar Produtora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TENANT MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm">Editar Produtora</h3>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nome da Produtora *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nome do Responsável
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value)}
                    maxLength={2}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-950/50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <h3 className="font-bold text-white text-sm">Excluir Produtora</h3>
            <p className="text-xs text-zinc-300">
              Deseja realmente excluir a produtora <strong>{tenantToDelete.name}</strong> ({tenantToDelete.id})?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setTenantToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteTenant(tenantToDelete)}
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
