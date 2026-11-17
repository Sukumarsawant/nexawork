import BusinessNavbar from '@/component/BusinessNavbar'
import RoleGate from '@/component/RoleGate'

export const metadata = { title: 'Business workspace | Nexawork', description: 'Share your work and discover opportunities on Nexawork.' }

export default function BusinessLayout({ children }) {
  return <RoleGate role="business"><div className="nx-workspace"><a href="#workspace-content" className="nx-skip-link">Skip to content</a><BusinessNavbar /><div id="workspace-content">{children}</div></div></RoleGate>
}
