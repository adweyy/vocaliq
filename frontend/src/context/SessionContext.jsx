import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessionConfig, setSessionConfig] = useState({
    context: 'presentation',  // presentation | interview | sales | public_speaking
    topic: '',
  })
  const [audioBlob, setAudioBlob] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  return (
    <SessionContext.Provider value={{
      sessionConfig, setSessionConfig,
      audioBlob, setAudioBlob,
      analysisResult, setAnalysisResult,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
