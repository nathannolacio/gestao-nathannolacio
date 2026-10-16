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

export function SendIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M20 4 10.5 13.5" />
      <path d="M20 4 14 20l-3.5-6.5L4 10l16-6Z" />
    </Icon>
  );
}

export function EditIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 7.5 3 3" />
    </Icon>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M17.5 14v4.5a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1H10" />
    </Icon>
  );
}

export function ArchiveIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
      <path d="M5.5 8.5v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-10" />
      <path d="M10 12.5h4" />
    </Icon>
  );
}

export function UndoIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M9 14 4.5 9.5 9 5" />
      <path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3" />
    </Icon>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </Icon>
  );
}
