"use client";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Simple page header with title and optional actions.
 * Used at the top of page content (not navigation).
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 mt-4 sm:mt-0">{actions}</div>}
    </div>
  );
}

/**
 * Container component for consistent page content width
 */
export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={`flex-1 px-4 py-6 md:px-6 lg:px-8 ${className || ""}`}>
      <div className="mx-auto max-w-screen-xl">
        {children}
      </div>
    </main>
  );
}
