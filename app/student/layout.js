import StudentNavbar from '@/component/Navbar'
import RoleGate from '@/component/RoleGate'

export const metadata = { title: 'Student workspace | Nexawork', description: 'Share your work and discover opportunities on Nexawork.' }

export default function StudentLayout({ children }) {
  return <RoleGate role="student"><div className="nx-workspace"><a href="#workspace-content" className="nx-skip-link">Skip to content</a><StudentNavbar /><div id="workspace-content">{children}</div></div></RoleGate>
}
