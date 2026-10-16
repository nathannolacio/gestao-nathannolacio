"use client";

type ApproveButtonProps = {
  disabled?: boolean;
  pending?: boolean;
  onClick?: () => void;
};

export function ApproveButton({ disabled = false, pending = false, onClick }: ApproveButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-full bg-dourado px-7 py-3.5 font-semibold text-white shadow-lg shadow-dourado/30 transition hover:bg-grafite hover:shadow-grafite/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-dourado disabled:active:scale-100"
    >
      {pending ? "Aprovando..." : "Aprovar proposta"}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
