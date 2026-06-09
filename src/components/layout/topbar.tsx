import { logoutAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="md:hidden flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          SPK
        </div>
        <span className="font-semibold text-sm">SPK Koperasi</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-xs text-muted-foreground leading-tight">{user.email}</div>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </form>
      </div>
    </header>
  );
}
