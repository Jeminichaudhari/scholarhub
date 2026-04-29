"use client"

import { useState, useEffect, useCallback } from "react"
import { defaultScholarships, type Scholarship, type Application } from "./translations"

const SCHOLARSHIPS_KEY = "scholarhub_scholarships"
const APPLICATIONS_KEY = "scholarhub_applications"
const DATA_VERSION     = "v4" // bump this to force reset when data changes
const VERSION_KEY      = "scholarhub_data_version"

function getStoredScholarships(): Scholarship[] {
  if (typeof window === "undefined") return defaultScholarships

  // Version check — if version mismatch, always reset to fresh data
  const storedVersion = localStorage.getItem(VERSION_KEY)
  if (storedVersion !== DATA_VERSION) {
    localStorage.setItem(SCHOLARSHIPS_KEY, JSON.stringify(defaultScholarships))
    localStorage.setItem(VERSION_KEY, DATA_VERSION)
    return defaultScholarships
  }

  const stored = localStorage.getItem(SCHOLARSHIPS_KEY)
  if (stored) {
    try {
      const parsed: Scholarship[] = JSON.parse(stored)
      const needsReset = parsed.length === 0 || !parsed[0].level
      if (needsReset) {
        localStorage.setItem(SCHOLARSHIPS_KEY, JSON.stringify(defaultScholarships))
        return defaultScholarships
      }
      return parsed
    } catch {
      return defaultScholarships
    }
  }
  localStorage.setItem(SCHOLARSHIPS_KEY, JSON.stringify(defaultScholarships))
  return defaultScholarships
}

function getStoredApplications(): Application[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(APPLICATIONS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function useScholarshipStore() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setScholarships(getStoredScholarships())
    setApplications(getStoredApplications())
    setIsLoaded(true)
  }, [])

  const saveScholarships = useCallback((data: Scholarship[]) => {
    setScholarships(data)
    localStorage.setItem(SCHOLARSHIPS_KEY, JSON.stringify(data))
  }, [])

  const saveApplications = useCallback((data: Application[]) => {
    setApplications(data)
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(data))
  }, [])

  const addScholarship = useCallback(
    (scholarship: Omit<Scholarship, "id">) => {
      const newScholarship: Scholarship = {
        ...scholarship,
        id: Date.now().toString(),
      }
      const updated = [...scholarships, newScholarship]
      saveScholarships(updated)
      return newScholarship
    },
    [scholarships, saveScholarships]
  )

  const updateScholarship = useCallback(
    (id: string, data: Partial<Scholarship>) => {
      const updated = scholarships.map((s) => (s.id === id ? { ...s, ...data } : s))
      saveScholarships(updated)
    },
    [scholarships, saveScholarships]
  )

  const deleteScholarship = useCallback(
    (id: string) => {
      const updated = scholarships.filter((s) => s.id !== id)
      saveScholarships(updated)
    },
    [scholarships, saveScholarships]
  )

  const applyForScholarship = useCallback(
    (scholarshipId: string, scholarshipTitle: string, studentName: string, studentEmail: string) => {
      const existing = applications.find((a) => a.scholarshipId === scholarshipId)
      if (existing) return false

      const newApp: Application = {
        id: Date.now().toString(),
        scholarshipId,
        scholarshipTitle,
        studentName: studentName || "Student",
        studentEmail: studentEmail || "",
        appliedDate: new Date().toISOString().split("T")[0],
        status: "pending",
      }
      const updated = [...applications, newApp]
      saveApplications(updated)
      return true
    },
    [applications, saveApplications]
  )

  const updateApplicationStatus = useCallback(
    (id: string, status: Application["status"]) => {
      const updated = applications.map((a) => (a.id === id ? { ...a, status } : a))
      saveApplications(updated)
    },
    [applications, saveApplications]
  )

  const hasApplied = useCallback(
    (scholarshipId: string) => {
      return applications.some((a) => a.scholarshipId === scholarshipId)
    },
    [applications]
  )

  const getScholarship = useCallback(
    (id: string) => {
      return scholarships.find((s) => s.id === id)
    },
    [scholarships]
  )

  return {
    scholarships,
    applications,
    isLoaded,
    addScholarship,
    updateScholarship,
    deleteScholarship,
    applyForScholarship,
    updateApplicationStatus,
    hasApplied,
    getScholarship,
  }
}
