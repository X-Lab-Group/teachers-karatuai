import ModelProvider from '../contexts/ModelContext'
import ModelLoadingScreen from './ModelLoadingScreen'
import Layout from './layout/Layout'

// Wraps the app routes (everything except the landing page) with the model
// provider. This keeps the 1.87 GB model download from kicking off on the
// public landing page — it only starts once a user actually enters the app.
export default function AppShell() {
  return (
    <ModelProvider>
      <ModelLoadingScreen />
      <Layout />
    </ModelProvider>
  )
}
