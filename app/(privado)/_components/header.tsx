type HeaderProps = {
  userName: string;
  userEmail: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-admin-line px-6 md:px-8">
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-sm text-admin-text">{userName}</p>
        <p className="text-xs text-admin-muted">{userEmail}</p>
      </div>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-full bg-admin-raised text-xs font-medium text-dourado ring-1 ring-admin-line"
      >
        {initials(userName)}
      </span>
    </header>
  );
}
