import { AuthCardShell } from "@/components/auth/AuthCardShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCardShell>{children}</AuthCardShell>;
}
