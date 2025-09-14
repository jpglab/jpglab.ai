import './globals.css'
import { Jersey_10 } from 'next/font/google'

const jersey10 = Jersey_10({
  subsets: ['latin'],
  variable: '--font-jersey',
  weight: ['400']
})

export const metadata = {
  title: 'jpglab',
  description: 'jpglab',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full w-full m-0 p-0 bg-simulation-bg">
      <body className={`${jersey10.variable} flex flex-col w-full h-full relative m-0 p-0 border-none bg-simulation-bg`}>
        {children}
      </body>
    </html>
  )
}
