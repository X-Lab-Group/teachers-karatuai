import { useState } from 'react'
import ModelProvider from '../contexts/ModelContext'
import ModelLoadingScreen from './ModelLoadingScreen'
import Layout from './layout/Layout'
import ShareClassroomCard from './ShareClassroomCard'
import { useShouldShowClassroomGate } from '../hooks/useShouldShowClassroomGate'

// Wraps the app routes (everything except the landing page) with the model
// provider. This keeps the 1.87 GB model download from kicking off on the
// public landing page — it only starts once a user actually enters the app.
export default function AppShell() {
  return (
    <ModelProvider>
      <ModelLoadingScreen />
      <Layout />
      <ClassroomGate />
    </ModelProvider>
  )
}

// Renders the "tell us about your classroom" modal once a user has actually
// gotten value from the app (>=1 lesson/activity/assessment created). Native
// users skip the landing page so this is the only place they see the form.
function ClassroomGate() {
  const shouldShow = useShouldShowClassroomGate()
  const [open, setOpen] = useState(true)
  if (!shouldShow) return null
  return <ShareClassroomCard variant="modal" open={open} onClose={() => setOpen(false)} />
}
