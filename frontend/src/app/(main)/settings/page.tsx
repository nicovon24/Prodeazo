"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  Construction, 
  LogOut, 
  UserCircle, 
  Bell, 
  CreditCard,
  User,
  ShieldCheck,
  Trash2
} from "lucide-react";
import clsx from "clsx";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/api/client";
import { updateProfile, changePassword, deleteAccount } from "@/api/user";
import styles from "./settings.module.css";

type SettingsTab = "account" | "notifications" | "payments";

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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setSaveMessage(null);
    setSaveError(null);

    const name = joinName(firstName, lastName);
    if (!name) {
      setSaveError("Ingresá al menos tu nombre.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(name, user?.avatar);
      setUser(updated);
      setSaveMessage("Cambios guardados correctamente.");
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "No pudimos guardar los cambios. Intentá de nuevo."
      );
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
      setSaveMessage("Contraseña actualizada correctamente.");
    } catch (error) {
      if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
        setPasswordError("La contraseña actual no es correcta.");
      } else {
        setPasswordError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cambiar la contraseña."
        );
      }
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
      alert("No se pudo eliminar la cuenta. Intentá de nuevo.");
    }
  }

  const handleAvatarChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveError("La imagen es muy pesada (máx 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setSaving(true);
      try {
        const updated = await updateProfile(user?.name || "", base64);
        setUser(updated);
        setSaveMessage("Avatar actualizado.");
      } catch (error) {
        setSaveError("No se pudo actualizar el avatar.");
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
                            className={styles.fieldInput}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                            maxLength={50}
                          />
                        </div>
                        <div>
                          <label className={styles.fieldLabel} htmlFor="lastName">
                            Apellido
                          </label>
                          <input
                            id="lastName"
                            className={styles.fieldInput}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                            maxLength={50}
                          />
                        </div>
                        <div className={styles.fieldFull}>
                          <label className={styles.fieldLabel} htmlFor="email">
                            Correo electrónico
                          </label>
                          <input
                            id="email"
                            className={styles.fieldInput}
                            value={user.email}
                            disabled
                            readOnly
                          />
                          <p className={styles.fieldHint}>
                            El correo no se puede modificar porque es tu identificador de
                            acceso.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.saveRow}>
                      <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={saving || !isChanged}
                      >
                        {saving ? (
                          <div className={styles.loader} />
                        ) : (
                          "Guardar cambios"
                        )}
                      </button>
                    </div>
                    {saveMessage && (
                      <p className={styles.successMsg} role="status">
                        {saveMessage}
                      </p>
                    )}
                    {saveError && (
                      <p className={styles.errorMsg} role="alert">
                        {saveError}
                      </p>
                    )}
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
                  disabled={passwordSaving}
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
