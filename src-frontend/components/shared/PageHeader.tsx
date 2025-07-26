import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-surface pb-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-1 text-text-secondary">{description}</p>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
} 