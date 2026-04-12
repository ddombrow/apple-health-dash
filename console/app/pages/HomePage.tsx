import { useQuery } from "@tanstack/react-query";

import { api, unwrap } from "~/api";

type DayMileage = {
  dayKey: string;
  label: string;
  miles: number;
  isToday: boolean;
};

function MileageBar({ value, max = 1000 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <section className="rounded-2xl border border-default bg-default p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-mono-sm text-secondary">
          <span>Mileage To Goal</span>
          <span>
            {value} / {max} mi
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-accent">
          <div
            className="h-full rounded-full bg-green-700 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function startOfCurrentWeek(today: Date) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCurrentWeek(today = new Date()): DayMileage[] {
  const weekStart = startOfCurrentWeek(today);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    return {
      dayKey: formatDayKey(date),
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
        date,
      ),
      miles: 0,
      isToday: formatDayKey(date) === formatDayKey(today),
    };
  });
}

function formatMiles(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value >= 10 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function WeeklyWalkingWidget({ days }: { days: DayMileage[] }) {
  const totalMiles = days.reduce((sum, day) => sum + day.miles, 0);
  const maxMiles = Math.max(...days.map((day) => day.miles), 1);
  const weekStart = days[0]?.dayKey;
  const weekEnd = days[days.length - 1]?.dayKey;

  return (
    <section className="rounded-2xl border border-default bg-default p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-default pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-mono-sm uppercase tracking-[0.2em] text-secondary">
            Walking activity
          </p>
          <h2 className="text-2xl font-semibold">This Week</h2>
          <p className="text-sm text-secondary">
            {weekStart} to {weekEnd}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-4xl font-semibold text-raise">
            {formatMiles(totalMiles)}
          </p>
          <p className="text-sm text-secondary">miles so far this week</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-7">
        {days.map((day) => {
          const height = Math.max(
            (day.miles / maxMiles) * 100,
            day.miles > 0 ? 12 : 0,
          );

          return (
            <div
              key={day.dayKey}
              className={`rounded-xl border p-4 ${
                day.isToday
                  ? "border-accent bg-accent"
                  : "border-default bg-default"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-raise">{day.label}</p>
                {day.isToday ? (
                  <span className="rounded-full bg-green-700/10 px-2 py-0.5 text-xs font-medium text-green-800">
                    Today
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex h-32 items-end">
                <div className="flex h-full w-full items-end rounded-full bg-accent/60">
                  <div
                    className="w-full rounded-full bg-green-700 transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      minHeight: day.miles > 0 ? "0.75rem" : "0",
                    }}
                  />
                </div>
              </div>
              <p className="mt-4 text-lg font-semibold text-raise">
                {formatMiles(day.miles)} mi
              </p>
              <p className="text-xs text-secondary">{day.dayKey}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HomePage() {
  const goalStartDate = "2023-03-10";
  const {
    data: mileageRows,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["daily-mileage"],
    queryFn: () => api.methods.dailyMileage({}).then(unwrap),
  });
  const {
    data: goalMileage,
    isLoading: isGoalLoading,
    error: goalError,
  } = useQuery({
    queryKey: ["mileage", goalStartDate],
    queryFn: () =>
      api.methods
        .mileageFromDate({ query: { date: goalStartDate } })
        .then(unwrap),
  });

  const week = buildCurrentWeek();
  const mileageByDay = new Map(
    mileageRows?.map((row) => [row.day, Number(row.miles)]) ?? [],
  );
  const roundedGoalMileage =
    goalMileage !== undefined ? Math.floor(Number(goalMileage.miles)) : 0;
  const currentWeekDays = week.map((day) => ({
    ...day,
    miles: mileageByDay.get(day.dayKey) ?? 0,
  }));

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-12">
      <div className="mb-8">
        <h1 className="pb-2 text-3xl">Apple Health Console</h1>
        <p className="text-secondary">Main walking and activity stats.</p>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Walking Goal</h2>
          <p className="text-sm text-secondary">Get to 1000 miles by October</p>
          {isGoalLoading && (
            <p className="text-secondary">Loading mileage...</p>
          )}
          {goalError && (
            <p className="text-error">Error: {goalError.message}</p>
          )}
          <MileageBar value={roundedGoalMileage} />
        </section>

        <section>
          {isLoading && (
            <p className="text-secondary">Loading walking activity...</p>
          )}
          {error && <p className="text-error">Error: {error.message}</p>}
          {!isLoading && !error ? (
            <WeeklyWalkingWidget days={currentWeekDays} />
          ) : null}
        </section>
      </div>
    </main>
  );
}
