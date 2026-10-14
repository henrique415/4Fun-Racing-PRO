import { User, Role } from '../types';

export const isSupreme = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === 'supreme_admin' || user.role === 'supreme';
};

export const isProducerAdmin = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === 'producer_admin' || user.role === 'admin';
};

export const isProducer = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === 'producer';
};

export const isPilot = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === 'pilot';
};

export const isMechanic = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === 'mechanic';
};

/**
 * Admin Supremo ou Admin da Produtora
 */
export const isAdminOrSupreme = (user?: User | null): boolean => {
  return isSupreme(user) || isProducerAdmin(user);
};

/**
 * Admin Supremo, Admin da Produtora ou Produtor
 * Podem criar, editar e deletar campeonatos, equipes, pilotos, usuários da produtora e resultados
 */
export const canManageCompetitions = (user?: User | null): boolean => {
  return isSupreme(user) || isProducerAdmin(user) || isProducer(user);
};

/**
 * Somente o Admin Supremo pode criar e gerenciar Produtoras (Tenants)
 */
export const canManageTenants = (user?: User | null): boolean => {
  return isSupreme(user);
};

/**
 * Admin Supremo ou Admin da Produtora podem alterar configurações da produtora
 */
export const canConfigureTenant = (user?: User | null): boolean => {
  return isSupreme(user) || isProducerAdmin(user);
};

/**
 * Gestão de Equipes: Supremo, Admin Produtora, Produtor e Mecânico
 */
export const canManageTeams = (user?: User | null): boolean => {
  return isSupreme(user) || isProducerAdmin(user) || isProducer(user) || isMechanic(user);
};

/**
 * Atualização do próprio perfil de piloto
 */
export const canEditDriverProfile = (user?: User | null, driverId?: string): boolean => {
  if (!user) return false;
  if (canManageCompetitions(user)) return true;
  return isPilot(user) && (!driverId || user.driverId === driverId);
};

/**
 * Inscrição em campeonatos
 */
export const canEnrollDriver = (user?: User | null, driverId?: string): boolean => {
  if (!user) return false;
  if (canManageCompetitions(user)) return true;
  return isPilot(user) && (!driverId || user.driverId === driverId);
};

export interface RoleInfo {
  role: Role;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconName: string;
  description: string;
  scopeLabel: string;
}

export const getRoleInfo = (role?: Role): RoleInfo => {
  switch (role) {
    case 'supreme_admin':
    case 'supreme':
      return {
        role: 'supreme_admin',
        label: 'Admin Supremo',
        shortLabel: 'Supremo',
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-400',
        iconName: 'Crown',
        description: 'Acesso Global: Gestão de todas as Produtoras (Tenants), Bancos de Dados e Configurações do Sistema',
        scopeLabel: 'Acesso Global em Todos os Tenants',
      };
    case 'producer_admin':
    case 'admin':
      return {
        role: 'producer_admin',
        label: 'Admin Produtora',
        shortLabel: 'Admin Produtora',
        badgeBg: 'bg-red-500/15',
        badgeBorder: 'border-red-500/30',
        badgeText: 'text-red-400',
        iconName: 'Shield',
        description: 'Administrador do Tenant: Gerencia configurações da produtora, usuários, regras e todas as competições',
        scopeLabel: 'Administrador do Tenant Atual',
      };
    case 'producer':
      return {
        role: 'producer',
        label: 'Produtor',
        shortLabel: 'Produtor',
        badgeBg: 'bg-blue-500/15',
        badgeBorder: 'border-blue-500/30',
        badgeText: 'text-blue-400',
        iconName: 'Flag',
        description: 'Operação de Pista: Cria, edita e gerencia campeonatos, etapas, baterias, voltas rápidas e resultados',
        scopeLabel: 'Gestor Operacional do Tenant',
      };
    case 'pilot':
      return {
        role: 'pilot',
        label: 'Piloto',
        shortLabel: 'Piloto',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-400',
        iconName: 'Trophy',
        description: 'Perfil de Piloto: Atualiza fotos e dados cadastrais, inscreve-se em campeonatos e consulta classificações',
        scopeLabel: 'Piloto Participante do Grid',
      };
    case 'mechanic':
      return {
        role: 'mechanic',
        label: 'Mecânico / Equipe',
        shortLabel: 'Mecânico',
        badgeBg: 'bg-purple-500/15',
        badgeBorder: 'border-purple-500/30',
        badgeText: 'text-purple-400',
        iconName: 'Wrench',
        description: 'Gestão Técnica: Atualiza seu perfil, cadastra e edita equipes, karts e consulta resultados',
        scopeLabel: 'Responsável Técnico / Mecânico',
      };
    default:
      return {
        role: 'pilot',
        label: 'Piloto',
        shortLabel: 'Piloto',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-400',
        iconName: 'Trophy',
        description: 'Perfil de Piloto do Grid',
        scopeLabel: 'Piloto do Grid',
      };
  }
};

