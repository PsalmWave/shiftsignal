import { Route, Routes } from 'react-router-dom'

import { AppShell } from './AppShell'
import { ShiftOverviewPage } from '@/features/shift/ShiftOverviewPage'
import { TaskBoardPage } from '@/features/tasks/TaskBoardPage'
import { HandoffPage } from '@/features/handoff/HandoffPage'
import { ChecklistsPage } from '@/features/checklists/ChecklistsPage'
import { ChecklistDetailPage } from '@/features/checklists/ChecklistDetailPage'
import { TemplatesPage } from '@/features/templates/TemplatesPage'
import { TemplateEditorPage } from '@/features/templates/TemplateEditorPage'
import { TeamWorkloadPage } from '@/features/team/TeamWorkloadPage'
import { ActivityPage } from '@/features/activity/ActivityPage'
import { CaseStudyPage } from '@/features/case-study/CaseStudyPage'
import { NotFoundPage } from '@/features/NotFoundPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ShiftOverviewPage />} />
        <Route path="tasks" element={<TaskBoardPage />} />
        <Route path="handoff" element={<HandoffPage />} />
        <Route path="checklists" element={<ChecklistsPage />} />
        <Route path="checklists/:checklistId" element={<ChecklistDetailPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="templates/:templateId" element={<TemplateEditorPage />} />
        <Route path="team" element={<TeamWorkloadPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="case-study" element={<CaseStudyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
