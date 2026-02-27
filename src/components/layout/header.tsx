"use client";

interface HeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {title && (
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold leading-none">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </header>
  );
}
