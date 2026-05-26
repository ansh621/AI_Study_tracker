import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Bot, User, HomeIcon } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center px-5 py-2 transition-colors ${
        isActive ? 'text-[#6152a8]' : 'text-gray-400 hover:text-gray-600'
      }`
    }
  >
    <Icon size={24} />
    <span className="text-[11px] font-medium mt-1">{label}</span>
  </NavLink>
);

function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full px-4 pb-6 pt-3 bg-white border-t border-gray-100 flex justify-around items-center z-50">
      <NavItem to="/Dashboard" icon={HomeIcon} label="Dashboard" />
      <NavItem to="/focus-setup" icon={Bot} label="AI Tutor" />
      <NavItem to="/insights" icon={BarChart3} label="Insights" />
      <NavItem to="/ProfilePage" icon={User} label="Profile" />
    </nav>
  );
}

export default NavBar;
