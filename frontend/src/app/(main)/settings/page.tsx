"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  AlertCircle,
  CheckCircle2,
  Construction, 
  LogOut, 
  UserCircle, 
  Bell, 
  CreditCard,
  User,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/api/client";
import { updateProfile, changePassword, deleteAccount } from "@/api/user";
import styles from "./settings.module.css";

type SettingsTab = "account" | "notifications" | "payments";
type ToastTone = "success" | "error";

interface ToastState {
  tone: ToastTone;
  title: string;
  message: string;
}

const TABS: { id: SettingsTab; title: string; description: string; icon: any }[] = [
  { id: "account", title: "Mi cuenta", description: "Datos personales y seguridad.", icon: UserCircle },
  { id: "notifications", title: "Notificaciones", description: "Elegí cómo y cuándo recibirlas.", icon: Bell },
  { id: "payments", title: "Métodos de pago", description: "Administrá tus métodos.", icon: CreditCard },
];

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function joinName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidNamePart(value: string, required: boolean) {
  const trimmed = value.trim();
  if (!trimmed) return !required;
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,50}$/.test(trimmed);
}

function translateApiError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;

  const message = error.message.toLowerCase();
  if (error.code === "UNAUTHORIZED" || message.includes("current password")) {
    return "La contraseña actual no es correcta.";
  }
  if (error.code === "FORBIDDEN" || message.includes("password cannot be changed")) {
    return "No se puede cambiar la contraseña de esta cuenta.";
  }
  if (error.code === "VALIDATION_ERROR") {
    return "Revisá los datos ingresados e intentá nuevamente.";
  }
  return error.message || fallback;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.comingSoon}>
      <Construction className={styles.comingSoonIcon} />
      <h2 className={styles.comingSoonTitle}>{title}</h2>
      <p className={styles.comingSoonDesc}>
        <strong>Próximamente.</strong> {description}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isGoogleUser = user?.authProvider === "google";
  const canChangePassword = user?.authProvider === "local";

  const isChanged = user && (
    firstName !== splitName(user.name).firstName ||
    lastName !== splitName(user.name).lastName
  );
  const validation = useMemo(() => {
    const errors: { firstName?: string; lastName?: string; email?: string } = {};

    if (!isValidNamePart(firstName, true)) {
      errors.firstName = "Ingresá un nombre válido de al menos 2 letras.";
    }
    if (!isValidNamePart(lastName, false)) {
      errors.lastName = "Usá solo letras, espacios, apóstrofes o guiones.";
    }
    if (user?.email && !isValidEmail(user.email)) {
      errors.email = "El correo asociado a tu cuenta no tiene un formato válido.";
    }

    return errors;
  }, [firstName, lastName, user?.email]);
  const hasValidationErrors = Object.keys(validation).length > 0;

  useEffect(() => {
    if (!user || !user.name) return;
    try {
      const { firstName: f, lastName: l } = splitName(user.name);
      setFirstName(f);
      setLastName(l);
    } catch (err) {
      console.error('[Settings] Error splitting name:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const name = joinName(firstName, lastName);
    if (!name || hasValidationErrors) {
      setToast({
        tone: "error",
        title: "Revisá tus datos",
        message: "Hay campos que necesitan corrección antes de guardar.",
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(name, user.avatar ?? undefined);
      setUser(updated);
      setToast({
        tone: "success",
        title: "Cambios guardados",
        message: "Tu información personal se actualizó correctamente.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        title: "No pudimos guardar",
        message: translateApiError(error, "No pudimos guardar los cambios. Intentá de nuevo."),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setToast({
        tone: "success",
        title: "Contraseña actualizada",
        message: "Tu contraseña se cambió correctamente.",
      });
    } catch (error) {
      const message = translateApiError(error, "No pudimos cambiar la contraseña.");
      setPasswordError(message);
      setToast({
        tone: "error",
        title: "No pudimos cambiarla",
        message,
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (!confirm("¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await deleteAccount();
      router.push("/login");
    } catch (error) {
      setToast({
        tone: "error",
        title: "No pudimos eliminar la cuenta",
        message: "Intentá nuevamente en unos minutos.",
      });
    }
  }

  const handleAvatarChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({
        tone: "error",
        title: "Imagen demasiado pesada",
        message: "El archivo no puede superar los 2 MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setSaving(true);
      try {
        const updated = await updateProfile(user?.name || "", base64);
        setUser(updated);
        setToast({
          tone: "success",
          title: "Avatar actualizado",
          message: "Tu nueva imagen de perfil ya está guardada.",
        });
      } catch (error) {
        setToast({
          tone: "error",
          title: "No pudimos actualizar el avatar",
          message: "Intentá con otra imagen o probá nuevamente.",
        });
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <>
      <Header
        title="Configuración de cuenta"
        subtitle="Gestioná tu información personal y las preferencias de tu cuenta."
      />

      <main className={styles.main}>
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`${styles.toast} ${toast.tone === "success" ? styles.toastSuccess : styles.toastError}`}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="status"
            >
              <span className={styles.toastIconWrap}>
                {toast.tone === "success" ? (
                  <CheckCircle2 className={styles.toastIcon} />
                ) : (
                  <AlertCircle className={styles.toastIcon} />
                )}
              </span>
              <span className={styles.toastContent}>
                <span className={styles.toastTitle}>{toast.title}</span>
                <span className={styles.toastMessage}>{toast.message}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.layout}>
          <nav className={styles.subNav} aria-label="Secciones de configuración">
            {TABS.map(({ id, title, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={clsx(
                  styles.subNavItem,
                  activeTab === id && styles.subNavItemActive
                )}
                onClick={() => setActiveTab(id)}
              >
                <div className={styles.subNavIconWrapper}>
                  <Icon size={20} className={styles.subNavIcon} />
                </div>
                <div className={styles.subNavText}>
                  <span className={styles.subNavTitle}>{title}</span>
                  <span className={styles.subNavDesc}>{description}</span>
                </div>
              </button>
            ))}
          </nav>

          <div className={styles.content}>
            {activeTab === "account" && (
              <>
                <form onSubmit={handleSaveProfile}>
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                      <User className={styles.titleIcon} size={24} />
                      Información personal
                    </h2>

                    <div className={styles.personalRow}>
                      <div className={styles.avatarBlock}>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className={styles.avatar}
                          />
                        ) : (
                          <span className={styles.avatarFallback}>
                            {getInitials(user.name)}
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.avatarEditBtn}
                          onClick={handleAvatarChangeClick}
                          title="Cambiar imagen"
                          aria-label="Cambiar foto de perfil"
                        >
                          <Camera size={18} />
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          hidden 
                          accept="image/*" 
                          onChange={handleFileChange} 
                        />
                        <p className={styles.avatarHint}>
                          Cambiá tu imagen de perfil.
                        </p>
                      </div>

                      <div className={styles.formGrid}>
                        <div>
                          <label className={styles.fieldLabel} htmlFor="firstName">
                            Nombre
                          </label>
                          <input
                            id="firstName"
                            className={clsx(styles.fieldInput, validation.firstName && styles.fieldInputError)}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                            maxLength={50}
                            aria-invalid={Boolean(validation.firstName)}
                            aria-describedby={validation.firstName ? "firstName-error" : undefined}
                          />
                          {validation.firstName && (
                            <p id="firstName-error" className={styles.fieldError}>
                              {validation.firstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={styles.fieldLabel} htmlFor="lastName">
                            Apellido
                          </label>
                          <input
                            id="lastName"
                            className={clsx(styles.fieldInput, validation.lastName && styles.fieldInputError)}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                            maxLength={50}
                            aria-invalid={Boolean(validation.lastName)}
                            aria-describedby={validation.lastName ? "lastName-error" : undefined}
                          />
                          {validation.lastName && (
                            <p id="lastName-error" className={styles.fieldError}>
                              {validation.lastName}
                            </p>
                          )}
                        </div>
                        <div className={styles.fieldFull}>
                          <label className={styles.fieldLabel} htmlFor="email">
                            Correo electrónico
                          </label>
                          <input
                            id="email"
                            type="email"
                            className={clsx(styles.fieldInput, validation.email && styles.fieldInputError)}
                            value={user.email}
                            disabled
                            readOnly
                            aria-invalid={Boolean(validation.email)}
                            aria-describedby={validation.email ? "email-error" : "email-hint"}
                          />
                          <p id="email-hint" className={styles.fieldHint}>
                            El correo no se puede modificar porque es tu identificador de
                            acceso.
                          </p>
                          {validation.email && (
                            <p id="email-error" className={styles.fieldError}>
                              {validation.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.saveRow}>
                      <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={saving || !isChanged || hasValidationErrors}
                      >
                        {saving ? (
                          <div className={styles.loader} />
                        ) : (
                          "Guardar cambios"
                        )}
                      </button>
                    </div>
                  </section>
                </form>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    <ShieldCheck className={styles.titleIcon} size={24} />
                    Seguridad de la cuenta
                  </h2>

                  <div className={styles.securityRow}>
                    <div className={styles.securityInfo}>
                      <div className={styles.securityLabel}>
                        Contraseña
                        {isGoogleUser && (
                          <span className={styles.badgeGoogle}>Google</span>
                        )}
                      </div>
                      <p className={styles.securityDesc}>
                        {isGoogleUser
                          ? "Iniciaste sesión con Google. Gestioná tu contraseña desde tu cuenta de Google."
                          : "Actualizá tu contraseña de acceso a Prodeazo."}
                      </p>
                    </div>
                    {canChangePassword ? (
                      <>
                        <span className={styles.securityValue}>••••••••••••</span>
                        <button
                          type="button"
                          className={styles.outlineBtn}
                          onClick={() => {
                            setPasswordOpen(true);
                            setPasswordError(null);
                          }}
                        >
                          Cambiar contraseña
                        </button>
                      </>
                    ) : (
                      <button type="button" className={styles.outlineBtn} disabled>
                        No disponible
                      </button>
                    )}
                  </div>

                  <div className={styles.securityRow}>
                    <div className={styles.securityInfo}>
                      <div className={styles.securityLabel}>
                        Autenticación en dos pasos
                      </div>
                      <p className={styles.securityDesc}>
                        Protegé tu cuenta con un segundo factor de verificación.
                      </p>
                    </div>
                    <span className={styles.badgeSoon}>Próximamente</span>
                    <button type="button" className={styles.outlineBtn} disabled>
                      Gestionar
                    </button>
                  </div>
                </section>

                <section className={clsx(styles.section, styles.dangerSection)}>
                  <h2 className={styles.sectionTitle}>
                    <Trash2 className={clsx(styles.titleIcon, styles.titleIconDanger)} size={24} />
                    Eliminar cuenta
                  </h2>
                  <div className={styles.dangerRow}>
                    <p className={styles.dangerText}>
                      Esta acción no se puede deshacer. Se eliminarán todos tus datos y
                      perderás el acceso a tu cuenta.
                    </p>
                    <button 
                      type="button" 
                      className={styles.dangerBtn}
                      onClick={handleDeleteAccount}
                    >
                      Eliminar mi cuenta
                    </button>
                  </div>
                </section>

                <button
                  type="button"
                  className={styles.logoutAllBtn}
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </>
            )}

            {activeTab === "notifications" && (
              <ComingSoon
                title="Notificaciones"
                description="Pronto vas a poder elegir cómo y cuándo recibir alertas de partidos, resultados y ligas."
              />
            )}

            {activeTab === "payments" && (
              <ComingSoon
                title="Métodos de pago"
                description="La administración de métodos de pago estará disponible en una versión futura."
              />
            )}
          </div>
        </div>
      </main>

      {passwordOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
          onClick={() => setPasswordOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 id="password-modal-title" className={styles.modalTitle}>
              Cambiar contraseña
            </h3>
            <p className={styles.modalDesc}>
              Ingresá tu contraseña actual y elegí una nueva de al menos 8 caracteres.
            </p>
            <form onSubmit={handleChangePassword}>
              <div className={styles.modalFields}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="currentPassword">
                    Contraseña actual
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                  className={styles.fieldInput}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  minLength={1}
                  required
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="newPassword">
                    Nueva contraseña
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={styles.fieldInput}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="confirmPassword">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={styles.fieldInput}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              {passwordError && (
                <p className={styles.errorMsg} role="alert">
                  {passwordError}
                </p>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={() => setPasswordOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmit}
                  disabled={passwordSaving || !currentPassword || newPassword.length < 8 || confirmPassword.length < 8}
                >
                  {passwordSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
