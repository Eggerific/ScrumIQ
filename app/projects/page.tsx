export default function ProjectsPage() {
  return (
    <div className="min-h-screen w-full bg-background font-[family-name:var(--font-lato)]">
      <div
        className="absolute inset-0 bg-[length:200%_200%] animate-gradient-shift"
        style={{ backgroundImage: "var(--gradient-auth)" }}
      />
      <div className="relative z-10 flex min-h-screen flex-col p-6 md:p-10">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="mt-2 text-sm text-zinc-400">Your projects will appear here.</p>
      </div>
    </div>
  );
}
