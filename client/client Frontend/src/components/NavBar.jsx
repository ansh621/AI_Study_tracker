import React from 'react'

const NavItem = ({ icon, label, active = false }) => (
  <button className={`flex flex-col items-center px-5 py-2 ${active ? 'text-[#6152a8]' : 'text-gray-400'}`}>
    {icon}
    <span className="text-[11px] font-medium mt-1">{label}</span>
  </button>
)

function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full px-4 pb-6 pt-3 bg-white border-t flex justify-around items-center">
      <NavItem icon={<BookOpen size={24} />} label="Learn" />
      <NavItem icon={<BarChart3 size={24} />} label="Insights" />
      <NavItem icon={<Users size={24} />} label="Social" />
      <NavItem icon={<User size={24} />} label="Profile" active />
    </nav>
  )
}

export default NavBar