"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface CustomInstructionsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function CustomInstructionsModal({ isOpen, onClose, userEmail }: CustomInstructionsModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [charCount, setCharCount] = useState(0)
  const MAX_CHARS = 3000

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchInstructions()
    }
  }, [isOpen, userEmail])

  useEffect(() => {
    setCharCount(instructions.length)
  }, [instructions])

  const fetchInstructions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/custom-instructions?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      if (data.success && data.instructions) {
        setInstructions(data.instructions)
      }
    } catch (error) {
      console.error('Error fetching custom instructions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/custom-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          instructions
        }),
      })

      if (response.ok) {
        alert('Custom instructions saved successfully!')
        onClose()
      } else {
        alert('Failed to save custom instructions')
      }
    } catch (error) {
      console.error('Error saving custom instructions:', error)
      alert('Failed to save custom instructions')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Custom Instructions</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Add custom instructions that will be automatically included in every conversation with PeakSuite AI.
                  For example, you can set preferences for signatures, formatting, or any other instructions you want the AI to follow.
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <strong>Examples:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>On all my memos, please sign it "Sincerely, Jane Doe"</li>
                      <li>Always use formal business language</li>
                      <li>Include payment terms of Net 30 on all invoices</li>
                      <li>Use tables instead of bullet points when presenting data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Textarea
                  value={instructions}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setInstructions(e.target.value)
                    }
                  }}
                  placeholder="Enter your custom instructions here..."
                  rows={12}
                  className="w-full"
                />
                <div className="mt-2 text-xs text-muted-foreground text-right">
                  {charCount} / {MAX_CHARS} characters
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Instructions'}
          </Button>
        </div>
      </div>
    </div>
  )
}
