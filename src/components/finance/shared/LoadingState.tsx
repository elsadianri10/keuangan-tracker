export function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/5">
      <div className="mb-3 h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="grid gap-4">
      <LoadingCard />
      <LoadingCard />
    </div>
  );
}
