export function BadgePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 text-xs px-3 py-1 border border-indigo-100">
      <span className="i-lucide-award w-3.5 h-3.5" />
      {label.replaceAll("_"," ")}
    </span>
  );
}
