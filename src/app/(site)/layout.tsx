import { MotionRoot } from "@/components/motion-root";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <MotionRoot>
      <div className="grain" aria-hidden="true" />
      <div className="relative flex min-h-full flex-col">
        <SiteHeader initialLoggedIn={Boolean(user)} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </MotionRoot>
  );
}
