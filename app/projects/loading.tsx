export default function ProjectsLoading() {
  return (
    <div className="min-h-screen w-full bg-background font-[family-name:var(--font-lato)]">
      <div
        className="absolute inset-0 bg-[length:200%_200%] animate-gradient-shift"
        style={{ backgroundImage: "var(--gradient-auth)" }}
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--auth-border)] border-t-[var(--auth-accent)]"
          aria-hidden
        />
      </div>
    </div>
  );
}
