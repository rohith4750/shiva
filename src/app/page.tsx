import { Suspense } from "react";
import AuthSplash from "@/components/AuthSplash";
import { getServerAuth } from "@/lib/server/currentUser";
import HomeClient from "./HomeClient";

// The splash is the static shell; the app or the login form streams in once the
// session has been verified on the server, so the app never renders before auth.
export default function Page() {
  return (
    <Suspense fallback={<AuthSplash />}>
      <AuthGate />
    </Suspense>
  );
}

async function AuthGate() {
  const auth = await getServerAuth();
  return <HomeClient initialAuth={auth} />;
}
