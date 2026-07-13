/** Shared Slack Brain mark — matches dashboard indigo mark. */
export function LandingMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm text-white shadow-md ${className}`}
      aria-hidden
    >
      🧠
    </span>
  );
}
