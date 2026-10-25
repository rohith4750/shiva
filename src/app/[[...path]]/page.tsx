import { Suspense } from "react";
import { notFound } from "next/navigation";
import AuthSplash from "@/components/AuthSplash";
import { getServerAuth } from "@/lib/server/currentUser";
import { parseRoute, type AppRoute } from "@/lib/routes";
import HomeClient from "../HomeClient";

// One page serves every app path (/journal/history, /users, …; see src/lib/routes.ts).
// The splash streams first; the app or the login form follows once the session is
// verified on the server, so nothing private renders before auth.
export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const route = parseRoute(path);
  if (!route) notFound();

  return (
    <Suspense fallback={<AuthSplash />}>
      <AuthGate route={route} />
    </Suspense>
  );
}

async function AuthGate({ route }: { route: AppRoute }) {
  const auth = await getServerAuth();
  return <HomeClient initialAuth={auth} initialRoute={route} />;
}
