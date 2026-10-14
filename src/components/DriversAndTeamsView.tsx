import React, { useState } from 'react';
import {
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Users,
  Shield,
  CheckCircle,
  Plus,
  X,
  Flag,
  Trophy,
  AlertTriangle,
  Award,
  Sparkles,
} from 'lucide-react';
import { Driver, Team, Category, Championship, User, DriverStats } from '../types';
import { canManageCompetitions, canEnrollDriver } from '../utils/permissions';
import { DriverAvatar } from './DriverAvatar';

interface DriversAndTeamsViewProps {
  drivers: Driver[];
  teams: Team[];
  categories: Category[];
  championship?: Championship;
  currentUser: User;
  standings?: DriverStats[];
  onSaveDriver: (driver: Driver) => void;
  onDeleteDriver: (driverId: string) => void;
  onSaveTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onToggleEnrollment: (driverId: string) => void;
  onViewProfile: (driverId: string) => void;
  onOpenEnrollment?: () => void;
}

export const DriversAndTeamsView: React.FC<DriversAndTeamsViewProps> = ({
  drivers,
  teams,
  categories,
  championship,
  currentUser,
  standings = [],
  onSaveDriver,
  onDeleteDriver,
  onSaveTeam,
  onDeleteTeam,
  onToggleEnrollment,
  onViewProfile,
  onOpenEnrollment,
}) => {
  const [activeTab, setActiveTab] = useState<'drivers' | 'teams'>('drivers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Driver CRUD state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverKart, setDriverKart] = useState('');
  const [driverTeamId, setDriverTeamId] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverBio, setDriverBio] = useState('');
  const [driverAvatarUrl, setDriverAvatarUrl] = useState('');
  const [driverError, setDriverError] = useState<string | null>(null);

  // Driver delete confirmation state
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // Team CRUD state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#EF4444');
  const [teamSponsor, setTeamSponsor] = useState('');
  const [teamError, setTeamError] = useState<string | null>(null);

  // Team delete confirmation state
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const canManage = canManageCompetitions(currentUser);

  // ================= DRIVER ACTIONS =================
  const handleOpenNewDriver = () => {
    setEditingDriverId(null);
    setDriverName('');
    setDriverKart('');
    setDriverTeamId(teams[0]?.id || '');
    setDriverEmail('');
    setDriverBio('');
    setDriverAvatarUrl('');
    setDriverError(null);
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver: Driver) => {
    setEditingDriverId(driver.id);
    setDriverName(driver.name);
    setDriverKart(driver.kartNumber);
    setDriverTeamId(driver.teamId || '');
    setDriverEmail(driver.email || '');
    setDriverBio(driver.bio || '');
    setDriverAvatarUrl(driver.avatarUrl || '');
    setDriverError(null);
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverKart.trim()) {
      setDriverError('Nome e número do kart são obrigatórios.');
      return;
    }

    // Check duplicate kart number among other drivers
    const duplicate = drivers.find(
      (d) => d.id !== editingDriverId && d.kartNumber.trim() === driverKart.trim()
    );
    if (duplicate) {
      setDriverError(`O número de kart #${driverKart} já pertence ao piloto ${duplicate.name}.`);
      return;
    }

    const existing = drivers.find((d) => d.id === editingDriverId);
    const saved: Driver = {
      id: editingDriverId || `driver-${Date.now()}`,
      name: driverName.trim().toUpperCase(),
      kartNumber: driverKart.trim(),
      teamId: driverTeamId || undefined,
      categoryId: existing?.categoryId,
      categoryIds: existing?.categoryIds,
      email: driverEmail.trim() || undefined,
      bio: driverBio.trim() || undefined,
      avatarUrl: driverAvatarUrl.trim() || undefined,
      active: true,
    };

    onSaveDriver(saved);
    setIsDriverModalOpen(false);
  };

  const handleConfirmDeleteDriver = () => {
    if (!driverToDelete) return;
    onDeleteDriver(driverToDelete.id);
    setDriverToDelete(null);
  };

  // ================= TEAM ACTIONS =================
  const handleOpenNewTeam = () => {
    setEditingTeamId(null);
    setTeamName('');
    setTeamColor('#EF4444');
    setTeamSponsor('');
    setTeamError(null);
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setTeamColor(team.color);
    setTeamSponsor(team.sponsor || '');
    setTeamError(null);
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setTeamError('Nome da equipe é obrigatório.');
      return;
    }

    const saved: Team = {
      id: editingTeamId || `team-${Date.now()}`,
      name: teamName.trim(),
      color: teamColor,
      sponsor: teamSponsor.trim() || undefined,
    };

    onSaveTeam(saved);
    setIsTeamModalOpen(false);
  };

  const handleConfirmDeleteTeam = () => {
    if (!teamToDelete) return;
    onDeleteTeam(teamToDelete.id);
    setTeamToDelete(null);
  };

  // ================= FILTERING =================
  const filteredDrivers = drivers.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.kartNumber.includes(searchTerm) ||
      (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchTeam = selectedTeamFilter === 'all' || d.teamId === selectedTeamFilter;
    const driverCatId =
      championship?.driverCategories?.[d.id] ||
      d.categoryIds?.[championship?.id || ''] ||
      d.categoryId ||
      (categories[0]?.id || 'cat-geral');
    const matchCategory =
      selectedCategoryFilter === 'all' || driverCatId === selectedCategoryFilter;

    return matchSearch && matchTeam && matchCategory;
  });

  const filteredTeams = teams.filter((t) => {
    return (
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.sponsor && t.sponsor.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Calculate team stats
  const getTeamStats = (teamId: string) => {
    const teamDrivers = drivers.filter((d) => d.teamId === teamId);
    const totalPoints = teamDrivers.reduce((sum, d) => {
      const st = standings.find((s) => s.driverId === d.id);
      return sum + (st?.totalPoints || 0);
    }, 0);
    return {
      driverCount: teamDrivers.length,
      driverNames: teamDrivers.map((d) => `${d.name} (#${d.kartNumber})`),
      totalPoints,
    };
  };

  const presetColors = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#64748B', // Slate
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Gestão de Pilotos & Equipes
                </h2>
                <p className="text-xs text-zinc-400">
                  Cadastre novos competidores, vincule escuderias e gerencie inscrições na temporada
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {onOpenEnrollment && (
              <button
                onClick={onOpenEnrollment}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shadow-sm cursor-pointer"
                title="Inscrever piloto no campeonato ativo"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Inscrever-se</span>
              </button>
            )}
            <button
              onClick={handleOpenNewDriver}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950/40 transition cursor-pointer"
              title="Cadastrar um novo piloto no sistema"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Novo Piloto</span>
            </button>
            <button
              onClick={handleOpenNewTeam}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white border border-zinc-700 text-xs font-bold transition cursor-pointer"
              title="Cadastrar uma nova escuderia/equipe"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>+ Nova Equipe</span>
            </button>
          </div>
        </div>

        {/* Tab Selector & Filters */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sub-tabs exactly as in user screenshot */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'drivers'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Pilotos ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'teams'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Equipes & Escuderias ({teams.length})
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'drivers' ? 'Buscar piloto por nome ou nº...' : 'Buscar equipe ou patrocinador...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 transition outline-none"
              />
            </div>

            {activeTab === 'drivers' && (
              <>
                <select
                  value={selectedTeamFilter}
                  onChange={(e) => setSelectedTeamFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none"
                >
                  <option value="all">Todas as Equipes</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= DRIVERS CONTENT ================= */}
      {activeTab === 'drivers' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-12 text-zinc-400 uppercase font-bold text-[11px] py-3.5 px-4 bg-zinc-950 border-b border-zinc-800 tracking-wider">
            <span className="col-span-1 text-center">Nº</span>
            <span className="col-span-3">Nome do Piloto</span>
            <span className="col-span-3">Equipe</span>
            <span className="col-span-2 text-center">Inscrição</span>
            <span className="col-span-1 text-right hidden sm:block">Pts</span>
            <span className="col-span-3 sm:col-span-2 text-right">Ações</span>
          </div>

          {/* Drivers Rows */}
          <div className="divide-y divide-zinc-800/60 text-xs">
            {filteredDrivers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                Nenhum piloto encontrado com os filtros atuais.
              </div>
            ) : (
              filteredDrivers.map((driver) => {
                const team = teams.find((t) => t.id === driver.teamId);
                const isEnrolled = (championship?.registeredDriverIds || []).includes(driver.id);
                const isCurrentPilot = currentUser.driverId === driver.id;
                const canEnroll = canEnrollDriver(currentUser, driver.id);
                const st = standings.find((s) => s.driverId === driver.id);

                return (
                  <div
                    key={driver.id}
                    className={`grid grid-cols-12 items-center px-4 py-3 transition hover:bg-zinc-800/40 ${
                      isCurrentPilot ? 'bg-red-950/15 border-l-2 border-red-500' : ''
                    }`}
                  >
                    {/* Kart Number */}
                    <div className="col-span-1 text-center">
                      <span className="font-mono font-black text-sm text-zinc-100 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-lg inline-block">
                        #{driver.kartNumber}
                      </span>
                    </div>

                    {/* Driver Name & Badges */}
                    <div className="col-span-3 flex items-center space-x-2.5 overflow-hidden">
                      <DriverAvatar
                        name={driver.name}
                        avatarUrl={driver.avatarUrl}
                        teamColor={team?.color}
                        kartNumber={driver.kartNumber}
                        size="md"
                      />
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-black text-white text-sm tracking-tight truncate">
                            {driver.name}
                          </span>
                          {isCurrentPilot && (
                            <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        {driver.email && (
                          <span className="text-[11px] text-zinc-500 truncate block">
                            {driver.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team */}
                    <div className="col-span-3 flex items-center space-x-2 text-zinc-300">
                      {team ? (
                        <>
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="truncate font-medium">{team.name}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500 italic">Independente</span>
                      )}
                    </div>

                    {/* Enrollment Toggle */}
                    <div className="col-span-2 text-center">
                      <button
                        type="button"
                        onClick={() => canEnroll && onToggleEnrollment(driver.id)}
                        disabled={!canEnroll}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                          isEnrolled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                        } ${canEnroll ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                        title={
                          canEnroll
                            ? 'Clique para alternar inscrição'
                            : 'Apenas o próprio piloto ou administradores podem alterar inscrição'
                        }
                      >
                        {isEnrolled ? 'Inscrito ✓' : '+ Inscrever'}
                      </button>
                    </div>

                    {/* Points */}
                    <div className="col-span-1 text-right hidden sm:block font-mono font-bold text-amber-400">
                      {st?.totalPoints || 0}
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDriver(driver)}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 font-semibold text-[11px] flex items-center space-x-1 transition cursor-pointer"
                        title="Editar piloto"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDriverToDelete(driver)}
                        className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-red-950/40 hover:bg-red-900/70 text-red-400 hover:text-red-200 border border-red-800/40 font-semibold text-[11px] flex items-center space-x-1 transition cursor-pointer"
                        title="Excluir piloto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Excluir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewProfile(driver.id)}
                        className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 font-semibold text-[11px] transition cursor-pointer"
                        title="Ver ficha técnica"
                      >
                        Ficha
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TEAMS CONTENT ================= */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-zinc-500 bg-zinc-900 rounded-2xl border border-zinc-800">
              Nenhuma escuderia encontrada.
            </div>
          ) : (
            filteredTeams.map((team) => {
              const stats = getTeamStats(team.id);

              return (
                <div
                  key={team.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition shadow-lg relative overflow-hidden group"
                >
                  {/* Top Color Accent Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: team.color }}
                  />

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-3">
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-md ring-2 ring-zinc-950"
                          style={{ backgroundColor: team.color }}
                        />
                        <div>
                          <h3 className="font-black text-white text-base tracking-tight">
                            {team.name}
                          </h3>
                          {team.sponsor && (
                            <span className="text-[11px] font-mono text-zinc-400">
                              Patrocinador: <strong className="text-zinc-300">{team.sponsor}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Team */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeam(team)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                          title="Editar dados da equipe"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeamToDelete(team)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/70 text-red-400 hover:text-red-200 border border-red-800/40 text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                          title="Excluir equipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>

                    {/* Pilots List */}
                    <div className="mt-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span className="font-bold uppercase text-[10px] tracking-wider">
                          Pilotos Vinculados ({stats.driverCount})
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {stats.totalPoints} pts
                        </span>
                      </div>
                      <div className="text-xs text-zinc-200 font-semibold leading-relaxed">
                        {stats.driverNames.length > 0 ? (
                          stats.driverNames.join(', ')
                        ) : (
                          <span className="text-zinc-500 font-normal italic">
                            Nenhum piloto vinculado no momento
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= MODAL: CADASTRO / EDIÇÃO DE PILOTO ================= */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black text-white">
                  {editingDriverId ? 'Editar Piloto' : 'Cadastrar Novo Piloto'}
                </h3>
              </div>
              <button
                onClick={() => setIsDriverModalOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4 text-xs">
              {driverError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{driverError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-bold mb-1">
                    Nome Completo do Piloto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: HENRIQUE SILVA"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">
                    Nº do Kart / Carro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 188"
                    value={driverKart}
                    onChange={(e) => setDriverKart(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Equipe</label>
                  <select
                    value={driverTeamId}
                    onChange={(e) => setDriverTeamId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
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
                  <label className="block text-zinc-400 font-bold mb-1">
                    E-mail / Login de Acesso
                  </label>
                  <input
                    type="email"
                    placeholder="piloto@email.com"
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-bold mb-1">
                    URL da Foto / Avatar do Piloto
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto-piloto.jpg"
                      value={driverAvatarUrl}
                      onChange={(e) => setDriverAvatarUrl(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white text-xs font-mono"
                    />
                    <DriverAvatar
                      name={driverName || 'P'}
                      avatarUrl={driverAvatarUrl}
                      teamColor={teams.find((t) => t.id === driverTeamId)?.color}
                      kartNumber={driverKart}
                      size="md"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Cole o link direto da foto do piloto (JPG, PNG, WebP) ou deixe em branco para usar o capacete automático.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-bold mb-1">
                    Biografia / Observação Técnica
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Especialista em traçados técnicos e ritmo de prova"
                    value={driverBio}
                    onChange={(e) => setDriverBio(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-950/40 cursor-pointer"
                >
                  {editingDriverId ? 'Salvar Alterações' : 'Cadastrar Piloto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXCLUSÃO DE PILOTO ================= */}
      {driverToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-black text-white">Excluir Piloto</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Você tem certeza que deseja excluir o piloto{' '}
              <strong className="text-white font-bold">
                {driverToDelete.name} (#{driverToDelete.kartNumber})
              </strong>
              ? Esta ação removerá o competidor das listagens oficiais.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDriverToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriver}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Sim, Excluir Piloto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CADASTRO / EDIÇÃO DE EQUIPE ================= */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center space-x-2">
                <Flag className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black text-white">
                  {editingTeamId ? 'Editar Escuderia' : 'Cadastrar Nova Escuderia'}
                </h3>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="p-6 space-y-4 text-xs">
              {teamError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{teamError}</span>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Nome da Escuderia / Equipe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MP Scuderia Racing"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Cor da Equipe (Ponto Distintivo & Gráficos)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={teamColor}
                      onChange={(e) => setTeamColor(e.target.value)}
                      className="w-12 h-10 bg-transparent border-0 cursor-pointer rounded-lg"
                    />
                    <input
                      type="text"
                      value={teamColor}
                      onChange={(e) => setTeamColor(e.target.value)}
                      className="w-28 bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-white font-mono text-xs"
                    />
                    <div
                      className="px-3 py-1.5 rounded-xl text-white font-bold text-xs"
                      style={{ backgroundColor: teamColor }}
                    >
                      Prévia
                    </div>
                  </div>

                  {/* Preset colors */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTeamColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          teamColor.toLowerCase() === color.toLowerCase()
                            ? 'border-white scale-110'
                            : 'border-zinc-800 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Patrocinador Principal
                </label>
                <input
                  type="text"
                  placeholder="Ex: MP Parts, Gulf Oil, Sparco"
                  value={teamSponsor}
                  onChange={(e) => setTeamSponsor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-950/40 cursor-pointer"
                >
                  {editingTeamId ? 'Salvar Alterações' : 'Cadastrar Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXCLUSÃO DE EQUIPE ================= */}
      {teamToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-black text-white">Excluir Equipe</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Você tem certeza que deseja excluir a escuderia{' '}
              <strong className="text-white font-bold">{teamToDelete.name}</strong>?
              Os pilotos vinculados a esta equipe passarão automaticamente a ser considerados{' '}
              <strong className="text-amber-400">Independentes</strong> sem perda de pontos ou histórico.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTeam}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Sim, Excluir Equipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
