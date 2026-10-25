import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthSplash from "@/components/AuthSplash";
import TradingJournalView from "@/components/TradingJournalView";
import { getServerAuth } from "@/lib/server/currentUser";

// Standalone journal route: only rendered for a verified session, otherwise back to sign-in
export default function TradingJournalPage() {
  return (
    <Suspense fallback={<AuthSplash />}>
      <JournalGate />
    </Suspense>
  );
}

async function JournalGate() {
  const auth = await getServerAuth();
  if (auth.status !== "authenticated") redirect("/");
  return <TradingJournalView />;
}
