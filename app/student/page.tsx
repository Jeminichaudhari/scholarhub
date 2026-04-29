import { Suspense } from "react"
import StudentDashboard from "@/components/student-dashboard"

export const metadata = {
  title: "Student Dashboard - ScholarHub",
  description: "View and track your scholarship applications",
}

export default function StudentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    }>
      <StudentDashboard />
    </Suspense>
  )
}
