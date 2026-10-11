type IconProps = { className?: string };

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function ProposalsIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V3.5Z" />
      <path d="M14 3.5v4h4" />
      <path d="M9.5 12.5h5M9.5 15.5h5" />
    </Icon>
  );
}

export function ClientsIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.7a3 3 0 0 1 0 5.6" />
      <path d="M17 14.3a5.5 5.5 0 0 1 3.5 5.2" />
    </Icon>
  );
}

export function TemplateIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.5h16" />
      <path d="M10 9.5V20" />
    </Icon>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14" />
      <path d="M10 8.5 5.5 12 10 15.5" />
      <path d="M5.5 12H15" />
    </Icon>
  );
}
