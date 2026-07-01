import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-60">
        <Header />
        <main className="flex-1 p-6 pt-20 lg:pt-6">{children}</main>
      </div>
    </div>
  )
}
