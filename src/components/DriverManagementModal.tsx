import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  CheckCircle,
  Plus,
  Users,
  Search,
} from 'lucide-react';
import { Driver, Team, Category, Championship, User } from '../types';

interface DriverManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  teams: Team[];
  categories: Category[];
  championship?: Championship;
  currentUser: User;
  onSaveDriver: (driver: Driver) => void;
  onSaveTeam: (team: Team) => void;
  onToggleEnrollment: (driverId: string) => void;
  onViewProfile: (driverId: string) => void;
}

export const DriverManagementModal: React.FC<DriverManagementModalProps> = ({
  isOpen,
  onClose,
  drivers,
  teams,
  categories,
  championship,
  currentUser,
  onSaveDriver,
  onSaveTeam,
  onToggleEnrollment,
  onViewProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'drivers' | 'teams'>('drivers');

  // Driver edit state
  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverKart, setDriverKart] = useState('');
  const [driverTeamId, setDriverTeamId] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverBio, setDriverBio] = useState('');

  // Team edit state
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#EF4444');
  const [teamSponsor, setTeamSponsor] = useState('');

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  const handleOpenNewDriver = () => {
    setEditingDriverId(null);
    setDriverName('');
    setDriverKart('');
    setDriverTeamId(teams[0]?.id || '');
    setDriverEmail('');
    setDriverBio('');
    setIsEditingDriver(true);
  };

  const handleOpenEditDriver = (driver: Driver) => {
    setEditingDriverId(driver.id);
    setDriverName(driver.name);
    setDriverKart(driver.kartNumber);
    setDriverTeamId(driver.teamId || '');
    setDriverEmail(driver.email || '');
    setDriverBio(driver.bio || '');
    setIsEditingDriver(true);
  };

  const handleSaveDriverForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverKart) return;

    const existing = drivers.find((d) => d.id === editingDriverId);
    const saved: Driver = {
      id: editingDriverId || `d-${Date.now()}`,
      tenantId: championship?.tenantId || currentUser.tenantId || 'tenant-mp-racing',
      name: driverName.toUpperCase(),
      kartNumber: driverKart,
      teamId: driverTeamId || undefined,
      categoryId: existing?.categoryId,
      categoryIds: existing?.categoryIds,
      email: driverEmail || undefined,
      bio: driverBio || undefined,
      active: true,
    };

    onSaveDriver(saved);
    setIsEditingDriver(false);
  };

  const handleSaveTeamForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;

    const saved: Team = {
      id: `team-${Date.now()}`,
      tenantId: championship?.tenantId || currentUser.tenantId || 'tenant-mp-racing',
      name: teamName,
      color: teamColor,
      sponsor: teamSponsor || undefined,
    };

    onSaveTeam(saved);
    setIsEditingTeam(false);
    setTeamName('');
    setTeamSponsor('');
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchName = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKart = d.kartNumber.includes(searchTerm);
    return matchName || matchKart;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-black text-white">
                Gestão de Pilotos & Equipes
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cadastre pilotos, vincule escuderias e gerencie inscrições no campeonato
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Pilot Scope Banner */}
        <div className="bg-zinc-950/90 border-b border-zinc-800 px-5 py-2.5 flex items-center justify-between text-[11px] text-zinc-400">
          <span>
            ℹ️ <strong className="text-zinc-200">Piloto de Campeonato:</strong> Os pilotos cadastrados aqui participam do grid e pontuação das etapas. Eles <strong className="text-amber-400">não possuem acesso ao sistema</strong> a menos que o Administrador cadastre uma conta de Usuário vinculada a eles.
          </span>
        </div>

        {/* Tab & Action Bar */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/60">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'drivers'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              Pilotos ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'teams'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              Equipes & Escuderias ({teams.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'drivers' ? (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar piloto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-zinc-500"
                  />
                </div>
                {isAdmin && (
                  <button
                    onClick={handleOpenNewDriver}
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Novo Piloto</span>
                  </button>
                )}
              </>
            ) : (
              isAdmin && (
                <button
                  onClick={() => setIsEditingTeam(true)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Equipe</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto text-xs">
          {/* Driver Edit Form Sub-Modal / Drawer */}
          {isEditingDriver && (
            <form
              onSubmit={handleSaveDriverForm}
              className="mb-6 bg-zinc-950 p-4 rounded-xl border border-red-500/40 space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-white text-sm">
                  {editingDriverId ? 'Editar Piloto' : 'Cadastrar Novo Piloto'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingDriver(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nome do Piloto *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Ex: HENRIQUE"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nº Kart / Carro *</label>
                  <input
                    type="text"
                    required
                    value={driverKart}
                    onChange={(e) => setDriverKart(e.target.value)}
                    placeholder="Ex: 188"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Equipe</label>
                  <select
                    value={driverTeamId}
                    onChange={(e) => setDriverTeamId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                  >
                    <option value="">Sem Equipe (Independente)</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Email / Login</label>
                  <input
                    type="email"
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    placeholder="piloto@email.com"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Biografia / Observação</label>
                  <input
                    type="text"
                    value={driverBio}
                    onChange={(e) => setDriverBio(e.target.value)}
                    placeholder="Especialista em chuva, etc."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditingDriver(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Salvar Piloto
                </button>
              </div>
            </form>
          )}

          {/* DRIVERS LIST */}
          {activeTab === 'drivers' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-zinc-400 uppercase font-bold text-[10px] pb-2 px-3 border-b border-zinc-800">
                <span className="col-span-1 text-center">Nº</span>
                <span className="col-span-4">NOME DO PILOTO</span>
                <span className="col-span-3">EQUIPE</span>
                <span className="col-span-2 text-center">INSCRIÇÃO</span>
                <span className="col-span-2 text-right">AÇÕES</span>
              </div>

              {filteredDrivers.map((driver) => {
                const team = teams.find((t) => t.id === driver.teamId);
                const isEnrolled = (championship?.registeredDriverIds || []).includes(driver.id);
                const isCurrentPilot = currentUser.driverId === driver.id;

                return (
                  <div
                    key={driver.id}
                    className={`grid grid-cols-12 items-center p-3 rounded-xl border transition ${
                      isCurrentPilot
                        ? 'bg-red-950/20 border-red-500/40'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <span className="col-span-1 text-center font-mono font-bold text-sm text-zinc-200">
                      #{driver.kartNumber}
                    </span>

                    <div className="col-span-4 flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{driver.name}</span>
                      {isCurrentPilot && (
                        <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                          VOCÊ
                        </span>
                      )}
                    </div>

                    <div className="col-span-3 flex items-center space-x-1.5 text-zinc-300">
                      {team ? (
                        <>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="truncate">{team.name}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500 italic">Independente</span>
                      )}
                    </div>

                    {/* Championship Enrollment Toggle */}
                    <div className="col-span-2 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleEnrollment(driver.id)}
                        disabled={!isAdmin && !isCurrentPilot}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                          isEnrolled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                        } ${!isAdmin && !isCurrentPilot ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isEnrolled ? 'Inscrito ✓' : '+ Inscrever'}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => onViewProfile(driver.id)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-[11px]"
                      >
                        Ficha
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditDriver(driver)}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TEAMS LIST */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              {isEditingTeam && (
                <form
                  onSubmit={handleSaveTeamForm}
                  className="bg-zinc-950 p-4 rounded-xl border border-red-500/40 space-y-3"
                >
                  <span className="font-bold text-white text-sm block">Cadastrar Nova Escuderia</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">Nome da Equipe *</label>
                      <input
                        type="text"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Ex: Scuderia Monza"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">Cor da Equipe</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={teamColor}
                          onChange={(e) => setTeamColor(e.target.value)}
                          className="w-10 h-9 bg-transparent border-0 cursor-pointer rounded"
                        />
                        <span className="font-mono text-zinc-300">{teamColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">Patrocinador Principal</label>
                      <input
                        type="text"
                        value={teamSponsor}
                        onChange={(e) => setTeamSponsor(e.target.value)}
                        placeholder="Ex: Sparco"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingTeam(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      Salvar Equipe
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teams.map((team) => {
                  const teamDrivers = drivers.filter((d) => d.teamId === team.id);
                  return (
                    <div
                      key={team.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <h4 className="font-bold text-white text-sm">{team.name}</h4>
                        </div>
                        {team.sponsor && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {team.sponsor}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>Pilotos vinculados:</span>
                        <span className="font-bold text-zinc-200">
                          {teamDrivers.map((d) => d.name).join(', ') || 'Nenhum piloto'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-500 text-xs">
            Pilotos inscritos têm suas pontuações calculadas automaticamente no campeonato.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
