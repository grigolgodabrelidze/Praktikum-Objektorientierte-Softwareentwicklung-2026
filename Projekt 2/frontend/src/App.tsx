import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { GeneratePage } from './pages/GeneratePage'
import { QuizPage } from './pages/QuizPage'
import { StudyRoomPage } from './pages/StudyRoomPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="generieren" element={<GeneratePage />} />
        <Route path="study-room" element={<StudyRoomPage />} />
        <Route path="quiz-modus" element={<QuizPage />} />
      </Route>
    </Routes>
  )
}

export default App
