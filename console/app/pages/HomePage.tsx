import { useQuery } from "@tanstack/react-query";

import { api, unwrap } from "~/api";

function MileageBar({ value, max = 1000 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
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
  );
}

export function HomePage() {
  const goalStartDate = "2023-03-10";

  const {
    data: mileage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mileage", goalStartDate],
    queryFn: () =>
      api.methods
        .mileageFromDate({ query: { date: goalStartDate } })
        .then(unwrap),
  });

  const roundedMileage =
    mileage !== undefined ? Math.floor(Number(mileage.miles)) : 0;

  return (
    <main className="mx-auto max-w-3xl p-12">
      <h1 className="text-3xl pb-5">Apple Health Console</h1>
      <p>Walking goal: Get to 1000 miles by October</p>
      <div className="mb-5 mt-5">
        {isLoading && <p className="text-secondary">Loading mileage...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}
        <MileageBar value={roundedMileage} />
      </div>
    </main>
  );
}
