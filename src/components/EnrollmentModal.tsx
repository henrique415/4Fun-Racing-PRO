import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Flag,
  Shield,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Championship, Driver, Category, Team, User } from '../types';
import confetti from 'canvas-confetti';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  championship: Championship;
  drivers: Driver[];
  categories: Category[];
  teams: Team[];
  currentUser: User;
  onToggleEnrollment: (driverId: string) => void;
  onAddNewDriver?: (newDriver: Driver) => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  championship,
  drivers,
  categories,
  teams,
  currentUser,
  onToggleEnrollment,
  onAddNewDriver,
}) => {
  // Find linked driver if current user has driverId or matching email/name
  const defaultDriver =
    drivers.find((d) => d.id === currentUser.driverId) ||
    drivers.find(
      (d) =>
        d.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
        d.name.toLowerCase() === currentUser.name.toLowerCase()
    ) ||
    drivers[0];

  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    defaultDriver ? defaultDriver.id : drivers[0]?.id || ''
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Quick form for new driver registration
  const [newName, setNewName] = useState(currentUser.name || '');
  const [newKartNumber, setNewKartNumber] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || 'cat-geral');
  const [newTeamId, setNewTeamId] = useState<string>('');

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
  const isSelectedEnrolled = selectedDriver
    ? championship.registeredDriverIds.includes(selectedDriver.id)
    : false;

  const handleConfirmEnrollment = () => {
    if (!selectedDriver) return;
    onToggleEnrollment(selectedDriver.id);
    if (!isSelectedEnrolled) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
    onClose();
  };

  const handleCreateAndEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newKartNumber.trim()) {
      alert('Preencha o nome e o número do kart.');
      return;
    }

    const newDriver: Driver = {
      id: `driver-${Date.now()}`,
      name: newName.trim(),
      kartNumber: newKartNumber.trim(),
      categoryId: newCategoryId,
      teamId: newTeamId || undefined,
      email: currentUser.email,
      phone: currentUser.phone,
      active: true,
    };

    if (onAddNewDriver) {
      onAddNewDriver(newDriver);
    } else {
      onToggleEnrollment(newDriver.id);
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in my-8">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Inscrição no Campeonato</span>
                <span className="text-[10px] bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                  {championship.season}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-sm">
                {championship.name}
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

        <div className="p-6 space-y-5 text-xs">
          {/* Status banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Status do Grid</span>
              <span className="text-sm font-black text-white">
                {championship.registeredDriverIds.length} Pilotos Inscritos
              </span>
            </div>
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold">
              <Flag className="w-3.5 h-3.5" />
              <span>Inscrições Abertas</span>
            </div>
          </div>

          {!isCreatingNew ? (
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Selecione o Piloto para o Grid
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs cursor-pointer"
                >
                  {drivers.map((d) => {
                    const isEnrolled = championship.registeredDriverIds.includes(d.id);
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name} (#{d.kartNumber}) {isEnrolled ? '— [JÁ INSCRITO]' : '— [DISPONÍVEL]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedDriver && (
                <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-white">
                      #{selectedDriver.kartNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{selectedDriver.name}</h4>
                      <p className="text-[11px] text-zinc-400">
                        {teams.find((t) => t.id === selectedDriver.teamId)?.name || 'Sem Equipe'} •{' '}
                        {categories.find((c) => c.id === selectedDriver.categoryId)?.name || 'Categoria Geral'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      isSelectedEnrolled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {isSelectedEnrolled ? 'Inscrito no Grid' : 'Não Inscrito'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="text-xs text-red-400 hover:text-red-300 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Não está na lista? Cadastrar novo piloto</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEnrollment}
                  className={`px-5 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-lg ${
                    isSelectedEnrolled
                      ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border border-zinc-700 hover:border-red-600'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                  }`}
                >
                  {isSelectedEnrolled ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Cancelar Inscrição do Grid</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Inscrição no Grid</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Novo Piloto */
            <form onSubmit={handleCreateAndEnroll} className="space-y-4">
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[11px] text-red-300">
                Preencha os dados do novo competidor. Ele será salvo no tenant e inscrito automaticamente no grid deste campeonato.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-300 font-bold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Ayrton da Silva"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Nº do Kart</label>
                  <input
                    type="text"
                    required
                    value={newKartNumber}
                    onChange={(e) => setNewKartNumber(e.target.value)}
                    placeholder="Ex: 12"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-red-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Categoria</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Equipe / Escuderia</label>
                  <select
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs cursor-pointer"
                  >
                    <option value="">Sem Equipe (Piloto Independente)</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  ← Voltar para lista
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-lg shadow-red-950/50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cadastrar e Inscrever no Grid</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
