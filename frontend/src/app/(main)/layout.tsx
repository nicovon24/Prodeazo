"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TournamentInitializer } from "@/components/TournamentInitializer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, fetchMe } = useAuth();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    fetchMe().finally(() => setAuthReady(true));
  }, [fetchMe]);

  useEffect(() => {
    if (authReady && !loading && !user) {
      router.replace("/login");
    }
  }, [authReady, loading, user, router]);

  if (!authReady || loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <TournamentInitializer />
      <Sidebar />
      <div
        style={{
          marginLeft: 220,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
