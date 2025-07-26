import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Github } from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Register Model', href: '/models/register', icon: PlusCircle },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-surface bg-surface/50 p-4 md:flex">
      <div className="mb-8 flex items-center gap-2">
        <img src="/logo.svg" alt="Allora Logo" className="h-8 w-8" />
        <h1 className="text-xl font-bold text-text-primary">Allora Gateway</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                ? 'bg-primary/20 text-primary'
                : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.name}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <a
          href="https://github.com/allora-network/allora-mcp-node"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          <Github className="h-5 w-5" />
          View on GitHub
        </a>
      </div>
    </aside>
  );
} 