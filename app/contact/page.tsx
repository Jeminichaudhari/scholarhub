"use client"

import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft } from "lucide-react"

export default function ContactPage() {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-md border">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {t("contactUs")}
        </h1>

        <p className="text-gray-600 mb-8">
          {t("contactDescription")}
        </p>

        <form className="space-y-6">

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("name")}
            </label>
            <input
              type="text"
              placeholder={t("enterName")}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("email")}
            </label>
            <input
              type="email"
              placeholder={t("enterEmail")}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("message")}
            </label>
            <textarea
              rows={4}
              placeholder={t("enterMessage")}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition"
          >
            {t("sendMessage")}
          </button>

        </form>

      </div>
    </div>
  )
}