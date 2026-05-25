"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getInviteInfo, joinByToken } from "../../api/mini-leagues";
import { ApiError } from "../../api/client";
import styles from "./join.module.css";

type PageState = "loading" | "ready" | "joining" | "success" | "expired" | "already_member" | "error";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const token = searchParams.get("token") ?? "";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [leagueName, setLeagueName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Persist token so we can redirect back after login
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("pendingInviteToken", token);
    }
  }, [token]);

  // Fetch league info once we have the token
  useEffect(() => {
    if (!token) {
      setPageState("error");
      setErrorMsg("Link de invitación inválido.");
      return;
    }

    getInviteInfo(token)
      .then((info) => {
        setLeagueName(info.name);
        setExpiresAt(info.expiresAt);
        setPageState("ready");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setPageState("expired");
        } else {
          setPageState("error");
          setErrorMsg("No se pudo cargar la invitación.");
        }
      });
  }, [token]);

  async function handleJoin() {
    if (!user) {
      router.push(`/login?redirect=/join?token=${token}`);
      return;
    }

    setPageState("joining");
    try {
      await joinByToken(token);
      sessionStorage.removeItem("pendingInviteToken");
      setPageState("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setPageState("already_member");
      } else if (err instanceof ApiError && err.status === 404) {
        setPageState("expired");
      } else {
        setPageState("error");
        setErrorMsg("No se pudo unir a la liga. Intentá de nuevo.");
      }
    }
  }

  if (authLoading || pageState === "loading") {
    return (
      <div className={styles.shell}>
        <p className={styles.hint}>Cargando invitación...</p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Users className="w-8 h-8" />
        </div>

        {pageState === "ready" || pageState === "joining" ? (
          <>
            <h1 className={styles.title}>Fuiste invitado a</h1>
            <p className={styles.leagueName}>{leagueName}</p>
            {expiresAt && (
              <p className={styles.expiry}>
                Esta invitación vence el{" "}
                {new Date(expiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
              </p>
            )}

            {!user ? (
              <>
                <p className={styles.hint}>Iniciá sesión para unirte a la liga.</p>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => router.push(`/login?redirect=/join?token=${token}`)}
                >
                  Iniciar sesión
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleJoin}
                disabled={pageState === "joining"}
              >
                {pageState === "joining" ? "Uniéndote..." : "Unirme a la liga"}
              </button>
            )}
          </>
        ) : pageState === "success" ? (
          <>
            <h1 className={styles.title}>¡Te uniste a {leagueName}!</h1>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push("/leagues")}
            >
              Ver mis ligas
            </button>
          </>
        ) : pageState === "already_member" ? (
          <>
            <h1 className={styles.title}>Ya sos miembro de {leagueName}</h1>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push("/leagues")}
            >
              Ver mis ligas
            </button>
          </>
        ) : pageState === "expired" ? (
          <>
            <h1 className={styles.title}>Este link expiró</h1>
            <p className={styles.hint}>Pedile al dueño de la liga que genere uno nuevo.</p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push("/home")}
            >
              Ir al inicio
            </button>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Algo salió mal</h1>
            <p className={styles.hint}>{errorMsg}</p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push("/home")}
            >
              Ir al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
