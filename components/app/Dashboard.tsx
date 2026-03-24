import { LayoutDashboard, FolderKanban, ListTodo } from "lucide-react";

const CHART_CARD =
  "rounded-xl border border-[var(--auth-border)] bg-[var(--auth-card)]/80 p-4 shadow-sm backdrop-blur-sm";

/** Sample “story points remaining” per day — replace with real sprint data later. */
function SprintLineChart() {
  const w = 280;
  const h = 100;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const days = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
  const values = [48, 44, 38, 32, 26, 18, 12];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const pts = values.map((v, i) => {
    const x = padL + (innerW * i) / (values.length - 1);
    const y = padT + innerH * (1 - (v - min) / span);
    return { x, y };
  });
  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;

  return (
    <div className={CHART_CARD}>
      <p className="text-sm font-medium text-zinc-400">Sprint burndown (sample)</p>
      <p className="mt-0.5 text-xs text-zinc-500">Story points remaining by day</p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-3 h-32 w-full max-w-full"
        role="img"
        aria-label="Sample sprint burndown line chart"
      >
        <defs>
          <linearGradient id="dash-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--app-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--app-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#dash-line-fill)" />
        <path
          d={lineD}
          fill="none"
          stroke="var(--app-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--background)" stroke="var(--app-accent)" strokeWidth="1.5" />
        ))}
        {days.map((d, i) => (
          <text
            key={d}
            x={padL + (innerW * i) / (days.length - 1)}
            y={h - 6}
            textAnchor="middle"
            className="fill-zinc-500"
            style={{ fontSize: "9px" }}
          >
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}

/** Sample backlog split — replace with real counts later. */
function BacklogDonutChart() {
  const cx = 52;
  const cy = 52;
  const r = 36;
  const stroke = 10;
  const c = 2 * Math.PI * r;
  const slices = [
    { pct: 0.45, label: "To do", color: "var(--app-accent)" },
    { pct: 0.3, label: "In progress", color: "oklch(0.55 0.12 165)" },
    { pct: 0.25, label: "Done", color: "oklch(0.42 0.04 260)" },
  ] as const;
  let rot = -90;
  return (
    <div className={CHART_CARD}>
      <p className="text-sm font-medium text-zinc-400">Backlog mix (sample)</p>
      <p className="mt-0.5 text-xs text-zinc-500">Share of items by status</p>
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
        <svg
          viewBox="0 0 104 104"
          className="h-28 w-28 shrink-0"
          role="img"
          aria-label="Sample backlog donut chart"
        >
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--auth-border)" strokeWidth={stroke} />
          {slices.map((s) => {
            const len = s.pct * c;
            const gap = c - len;
            const el = (
              <circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${gap}`}
                strokeLinecap="round"
                transform={`rotate(${rot} ${cx} ${cy})`}
              />
            );
            rot += s.pct * 360;
            return el;
          })}
        </svg>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 sm:flex-col sm:items-start">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Sample Scrum AI comparison — replace with model-driven analytics later. */
function ScrumAIBarChart() {
  const rows = [
    { label: "Velocity", value: 78 },
    { label: "Points / member", value: 62 },
    { label: "Points by status", value: 89 },
  ] as const;

  return (
    <div className={CHART_CARD}>
      <p className="text-sm font-medium text-zinc-400">Scrum AI analytics (sample)</p>
      <p className="mt-0.5 text-xs text-zinc-500">Categorical comparison for sprint insights</p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-400">{row.label}</span>
              <span className="text-zinc-500">{row.value}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--auth-border)]/70">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.value}%`,
                  background:
                    "linear-gradient(90deg, var(--app-accent), oklch(0.55 0.12 165))",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small recent-activity feed for the dashboard shell. */
function RecentActivityPanel() {
  const items = [
    { text: "AI suggested 3 sprint stories for Acme Corp", time: "10m ago" },
    { text: "Backlog item moved to In progress", time: "34m ago" },
    { text: "Sprint plan draft generated", time: "1h ago" },
  ] as const;

  return (
    <div className={CHART_CARD}>
      <p className="text-sm font-medium text-zinc-400">Recent activity</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={`${item.text}-${item.time}`}
            className="rounded-md border border-[var(--auth-border)]/70 bg-[var(--background)]/30 px-3 py-2"
          >
            <p className="text-xs text-zinc-300">{item.text}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{item.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Minimal dashboard body — uses global theme tokens (auth/app shell). */
export function Dashboard() {
  const cards = [
    {
      label: "Projects",
      value: "—",
      hint: "Create or open a project",
      icon: FolderKanban,
    },
    {
      label: "Active sprint",
      value: "—",
      hint: "Sprint planning next",
      icon: LayoutDashboard,
    },
    {
      label: "Tasks",
      value: "—",
      hint: "Backlog & board later",
      icon: ListTodo,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--auth-border)] bg-[var(--auth-card)]/80 p-4 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-zinc-400">{label}</p>
              <Icon
                className="h-4 w-4 shrink-0 text-[var(--app-accent)] opacity-90"
                aria-hidden
              />
            </div>
            <p
              className="mt-2 text-2xl font-semibold tabular-nums tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SprintLineChart />
          <ScrumAIBarChart />
        </div>
        <div className="space-y-4">
          <BacklogDonutChart />
          <RecentActivityPanel />
        </div>
      </div>

      <p className="max-w-xl text-sm text-zinc-500">
        Charts use sample data for layout only. Hook them to sprint / backlog
        queries when your API is ready.
      </p>
    </div>
  );
}
