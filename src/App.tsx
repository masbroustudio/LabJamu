import { useState } from 'react'
import { ChatPage }     from '@/pages/ChatPage'
import { StudioPage, type StudioSection }   from '@/pages/StudioPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import type { NavTab }  from '@/types'

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat')
  const [studioSection, setStudioSection] = useState<StudioSection>('overview')

  const handleNavigate = (tab: NavTab, section?: StudioSection) => {
    if (section) {
      setStudioSection(section)
    }
    setActiveTab(tab)
  }

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-rice-husk relative overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat'     && <ChatPage onNavigate={handleNavigate} />}
        {activeTab === 'studio'   && <StudioPage initialSection={studioSection} onNavigate={handleNavigate} />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
