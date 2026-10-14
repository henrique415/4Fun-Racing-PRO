import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { User, Driver, Tenant, Role } from '../types';
import { getRoleInfo } from '../utils/permissions';
import { googleSignIn } from '../services/googleAuth';
import { StorageService } from '../services/storage';
import { CloudDatabaseService } from '../services/cloudDatabase';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
  onSaveUsers?: (users: User[]) => void;
  drivers: Driver[];
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant?: (tenant: Tenant) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  users: initialUsers,
  onSaveUsers,
  drivers,
  tenants,
  activeTenant,
  onSelectTenant,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'first_access'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First Access State
  const [firstAccessStep, setFirstAccessStep] = useState<'verify' | 'set_password'>('verify');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Loading & Feedback
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper para buscar usuários sempre com os dados mais recentes (Storage + Props)
  const getAllRegisteredUsers = (): User[] => {
    const storageUsers = StorageService.getUsers();
    const map = new Map<string, User>();
    storageUsers.forEach((u) => map.set(u.email.toLowerCase().trim(), u));
    initialUsers.forEach((u) => {
      const email = u.email.toLowerCase().trim();
      if (!map.has(email)) {
        map.set(email, u);
      }
    });
    return Array.from(map.values());
  };

  // 1. Login via Google Workspace / Gmail (Sistema Fechado)
  const handleGoogleSignInClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const googleResult = await googleSignIn();
      if (!googleResult || !googleResult.email) {
        throw new Error('Não foi possível obter os dados da conta Google.');
      }

      const verifiedEmail = googleResult.email.toLowerCase().trim();

      // Checagem Especial: E-mail do Administrador Supremo Oficial
      if (verifiedEmail === 'henrique@g4f.capital') {
        const supremeUser: User = {
          id: 'user-supreme',
          name: 'Henrique (Admin Supremo)',
          email: 'henrique@g4f.capital',
          role: 'supreme_admin',
          tenantId: 'global',
          avatar:
            googleResult.photoURL ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          driverId: 'd-18',
          active: true,
        };
        setSuccessMessage(`Acesso Supremo Concedido: Henrique (Global)`);
        setTimeout(() => onLogin(supremeUser), 500);
        return;
      }

      // Procura usuário em todos os cadastros
      const allUsers = getAllRegisteredUsers();
      const existingUser = allUsers.find(
        (u) => u.email.toLowerCase().trim() === verifiedEmail
      );

      if (existingUser) {
        if (existingUser.active === false) {
          setErrorMessage(`A conta associada ao e-mail ${verifiedEmail} está desativada no sistema.`);
          return;
        }

        // Se o usuário possui avatar do Google, atualiza suavemente
        if (googleResult.photoURL && !existingUser.avatar) {
          existingUser.avatar = googleResult.photoURL;
        }

        setSuccessMessage(
          `Bem-vindo(a), ${existingUser.name}! Perfil do sistema: ${getRoleInfo(existingUser.role).label}`
        );
        setTimeout(() => onLogin(existingUser), 500);
        return;
      }

      // SISTEMA FECHADO: E-mail não cadastrado como Usuário do Sistema
      // Pilotos cadastrados apenas para administração de pontuação não possuem acesso automático
      setErrorMessage(
        `Acesso Negado: O e-mail "${verifiedEmail}" não está cadastrado como usuário com acesso ao sistema. O cadastro e as permissões devem ser concedidos pelo Administrador Supremo.`
      );
    } catch (err: any) {
      console.error('Erro no Google Sign-In:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Autenticação Google cancelada pelo usuário.');
      } else {
        setErrorMessage(
          err.message || 'Falha ao autenticar com Google. Verifique sua conexão e tente novamente.'
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 2. Login com E-mail e Senha Cadastrados
  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu endereço de e-mail cadastrado.');
      return;
    }

    // Checagem Especial: E-mail do Administrador Supremo Oficial
    if (cleanEmail === 'henrique@g4f.capital') {
      const supremeUser: User = {
        id: 'user-supreme',
        name: 'Henrique (Admin Supremo)',
        email: 'henrique@g4f.capital',
        role: 'supreme_admin',
        tenantId: 'global',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        driverId: 'd-18',
        active: true,
      };
      setSuccessMessage(`Acesso concedido: Henrique (Admin Supremo Global)`);
      setTimeout(() => onLogin(supremeUser), 500);
      return;
    }

    const allUsers = getAllRegisteredUsers();
    const existingUser = allUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);

    if (!existingUser) {
      setErrorMessage(
        `Acesso Negado: O e-mail "${cleanEmail}" não está cadastrado como usuário do sistema. Pilotos sem conta de usuário cadastrada pelo Administrador Supremo não possuem acesso ao sistema.`
      );
      return;
    }

    if (existingUser.active === false) {
      setErrorMessage(`A conta associada ao e-mail ${cleanEmail} está desativada no sistema.`);
      return;
    }

    // Se o usuário ainda não possui senha configurada, encaminha para Primeiro Acesso
    if (!existingUser.password) {
      setVerifiedUser(existingUser);
      setAuthMode('first_access');
      setFirstAccessStep('set_password');
      setSuccessMessage('Identificamos que este é o seu primeiro acesso! Crie sua senha de acesso abaixo.');
      return;
    }

    // Valida a senha informada
    if (!passwordInput) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    if (existingUser.password !== passwordInput) {
      setErrorMessage('Senha incorreta. Verifique os caracteres ou clique em "Primeiro Acesso / Redefinir Senha".');
      return;
    }

    setSuccessMessage(`Bem-vindo(a), ${existingUser.name}! Acesso autorizado.`);
    setTimeout(() => onLogin(existingUser), 400);
  };

  // 3. Primeiro Acesso: Verificar E-mail
  const handleVerifyFirstAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Informe seu e-mail cadastrado na plataforma.');
      return;
    }

    // Checagem se é o Supremo
    if (cleanEmail === 'henrique@g4f.capital') {
      const supremeUser: User = {
        id: 'user-supreme',
        name: 'Henrique (Admin Supremo)',
        email: 'henrique@g4f.capital',
        role: 'supreme_admin',
        tenantId: 'global',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        driverId: 'd-18',
        active: true,
      };
      setVerifiedUser(supremeUser);
      setFirstAccessStep('set_password');
      setSuccessMessage('Cadastro de Administrador Supremo localizado!');
      return;
    }

    const allUsers = getAllRegisteredUsers();
    const foundUser = allUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);

    if (foundUser) {
      if (foundUser.active === false) {
        setErrorMessage('Esta conta de usuário está inativa. Contate o administrador da produtora.');
        return;
      }
      setVerifiedUser(foundUser);
      setFirstAccessStep('set_password');
      setSuccessMessage(`Olá, ${foundUser.name}! Configure sua senha abaixo para ter acesso imediato.`);
      return;
    }

    // Checa pilotos
    const matchedDriver = drivers.find(
      (d) => d.email && d.email.toLowerCase().trim() === cleanEmail
    );
    if (matchedDriver) {
      const pilotUser: User = {
        id: `user-${matchedDriver.id}`,
        name: `${matchedDriver.name} (Piloto #${matchedDriver.kartNumber})`,
        email: matchedDriver.email!,
        role: 'pilot',
        tenantId: matchedDriver.tenantId || activeTenant.id,
        driverId: matchedDriver.id,
        avatar: matchedDriver.avatarUrl,
        active: true,
      };
      setVerifiedUser(pilotUser);
      setFirstAccessStep('set_password');
      setSuccessMessage(`Piloto #${matchedDriver.kartNumber} ${matchedDriver.name} localizado! Configure sua senha.`);
      return;
    }

    setErrorMessage(
      `Acesso Negado: O e-mail "${cleanEmail}" não foi encontrado no sistema fechado. Certifique-se de que a Produtora já efetuou seu cadastro prévio.`
    );
  };

  // 4. Primeiro Acesso: Salvar Nova Senha e Entrar
  const handleSavePasswordAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!verifiedUser) return;

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const allUsers = getAllRegisteredUsers();
      const userIndex = allUsers.findIndex(
        (u) => u.email.toLowerCase().trim() === verifiedUser.email.toLowerCase().trim()
      );

      const updatedUser: User = {
        ...verifiedUser,
        password: newPassword,
        active: true,
      };

      let updatedList: User[];
      if (userIndex >= 0) {
        updatedList = allUsers.map((u, i) => (i === userIndex ? updatedUser : u));
      } else {
        updatedList = [...allUsers, updatedUser];
      }

      // 1. Salva localmente
      StorageService.saveUsers(updatedList, false);

      // 2. Atualiza estado do App se disponível
      if (onSaveUsers) {
        onSaveUsers(updatedList);
      }

      // 3. Salva imediatamente no Firestore oficial
      await CloudDatabaseService.saveToCloud({ users: updatedList });

      setSuccessMessage(`Senha cadastrada com sucesso! Entrando na plataforma como ${updatedUser.name}...`);
      setTimeout(() => {
        onLogin(updatedUser);
      }, 600);
    } catch (err: any) {
      console.error('Erro ao salvar senha:', err);
      setErrorMessage('Erro ao persistir senha no banco de dados. Tente novamente.');
      setIsSavingPassword(false);
    }
  };

  const getTenantName = (tId?: string) => {
    if (!tId || tId === 'global') return 'Acesso Global';
    const found = tenants.find((t) => t.id === tId);
    return found ? found.name : 'Produtora Oficial';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-900/40">
            P
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>PITSTOP PRO</span>
              <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Motorsport Platform
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Plataforma de Gestão de Campeonatos de Automobilismo
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-300">Ambiente Seguro</span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 my-6">
        <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-red-500 mb-1 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {authMode === 'login' ? 'Acesso ao Sistema' : 'Primeiro Acesso • Definir Senha'}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
              <Lock className="w-3 h-3 text-red-400" />
              <span>Plataforma Fechada • Acesso para Usuários Cadastrados</span>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start space-x-2.5 animate-fade-in shadow-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-emerald-200 text-xs flex items-start space-x-2.5 animate-fade-in shadow-md">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <>
              {/* 1. Official Google Workspace / Gmail Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isGoogleLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs border border-zinc-300 transition flex items-center justify-center space-x-3 shadow-lg shadow-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
                  <span className="tracking-tight">
                    {isGoogleLoading ? 'Autenticando via Google...' : 'Entrar com Google (Workspace / Gmail)'}
                  </span>
                </button>
              </div>

              {/* Separator */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800" />
                <span className="flex-shrink mx-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Ou acesse com e-mail cadastrado
                </span>
                <div className="flex-grow border-t border-zinc-800" />
              </div>

              {/* 2. Login Form (Email & Password) */}
              <form onSubmit={handleEmailPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@produtora.com.br"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('first_access');
                        setFirstAccessStep('verify');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer underline decoration-dotted"
                    >
                      Primeiro Acesso / Definir Senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Botão de destaque para Primeiro Acesso */}
              <div className="pt-2 border-t border-zinc-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('first_access');
                    setFirstAccessStep('verify');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Primeiro Acesso? Clique aqui para Criar sua Senha</span>
                </button>
              </div>
            </>
          ) : (
            /* FIRST ACCESS / SET PASSWORD WORKFLOW */
            <div className="space-y-4 animate-fade-in">
              {firstAccessStep === 'verify' ? (
                <form onSubmit={handleVerifyFirstAccess} className="space-y-3.5">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                    Informe seu e-mail cadastrado pela sua Produtora para localizarmos seus dados e habilitar a criação da sua senha.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="seu.email@produtora.com.br"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>Localizar Cadastro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-2 text-center text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                  >
                    Voltar para a tela de login
                  </button>
                </form>
              ) : (
                /* STEP 2: SET PASSWORD */
                <form onSubmit={handleSavePasswordAndLogin} className="space-y-3.5 animate-fade-in">
                  {verifiedUser && (
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{verifiedUser.name}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 uppercase">
                          {getRoleInfo(verifiedUser.role).label}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {verifiedUser.email} • {getTenantName(verifiedUser.tenantId)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Crie sua Nova Senha (mínimo 4 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Confirme a Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Gravando e Acessando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Salvar Senha e Entrar na Plataforma</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFirstAccessStep('verify');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-1 text-center text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                  >
                    Alterar e-mail informado
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Security note */}
          <div className="pt-1 text-center text-[10px] text-zinc-500 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sistema Seguro • Controle de Acesso Baseado em Perfis (RBAC)</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-4 text-center text-xs text-zinc-400 border-t border-zinc-900">
        PitStop Pro &copy; 2026 • Plataforma de Gestão Multi-Tenant para Produtoras de Kart
      </footer>
    </div>
  );
};
