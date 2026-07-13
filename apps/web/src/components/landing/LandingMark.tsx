/** Shared Slack Brain mark for landing chrome. */
export function LandingMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-land-forest text-sm text-white ${className}`}
      aria-hidden
    >
      🧠
    </span>
  );
}
