// app/providers.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/Toast'

type Props = {
  children?: React.ReactNode
}

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  )
}
