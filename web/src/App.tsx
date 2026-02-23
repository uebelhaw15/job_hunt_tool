import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { Layout } from '@/components/Layout'
import { JobsPage } from '@/pages/JobsPage'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { BankPage } from '@/pages/BankPage'
import { PracticePage } from '@/pages/PracticePage'
import { PracticeSessionPage } from '@/pages/PracticeSessionPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/bank" element={<BankPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/practice/:id" element={<PracticeSessionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
      </ToastProvider>
    </BrowserRouter>
  )
}
