import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
      <Sonner position="top-right" richColors />
    </>
  )
}

export default App 