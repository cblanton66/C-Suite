"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientAutocomplete } from "@/components/client-autocomplete"
import { X } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

interface ThreadSaveModalProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  userEmail: string | null
  workspaceOwner?: string | null
  loadedThread?: {
    threadId: string
    filePath: string
    metadata: any
  } | null
  onThreadSaved?: () => void
}

export function ThreadSaveModal({ isOpen, onClose, messages, userEmail, workspaceOwner, loadedThread, onThreadSaved }: ThreadSaveModalProps) {
  const [clientName, setClientName] = useState("")
  const [title, setTitle] = useState("")
  const [projectType, setProjectType] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMode, setSaveMode] = useState<'new' | 'update'>('new')

  // Initialize form with loaded thread data
  useEffect(() => {
    if (isOpen && loadedThread) {
      setSaveMode('update')
      setClientName(loadedThread.metadata.clientName || '')
      setTitle(loadedThread.metadata.title || '')
      setProjectType(loadedThread.metadata.projectType || '')
      setStatus(loadedThread.metadata.status || '')
      setPriority(loadedThread.metadata.priority || '')
    } else {
      setSaveMode('new')
      setClientName('')
      setTitle('')
      setProjectType('')
      setStatus('')
      setPriority('')
    }
  }, [isOpen, loadedThread])

  const handleUpdateThread = async () => {
    if (!loadedThread || !userEmail) {
      alert("No thread to update")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/update-thread", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userEmail,
          filePath: loadedThread.filePath,
          messages: messages,
          clientName: clientName.trim(),
          title: title.trim(),
          projectType: projectType || "General",
          status: status || "Active",
          priority: priority || "Normal"
        }),
      })

      if (response.ok) {
        alert("Thread updated successfully!")
        onThreadSaved?.()
        onClose()
      } else {
        const error = await response.text()
        alert(`Failed to update thread: ${error}`)
      }
    } catch (error) {
      console.error("Error updating thread:", error)
      alert("Failed to update thread. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAsNew = async () => {
    if (!clientName.trim() || !title.trim() || !userEmail) {
      alert("Please fill in client name and title")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/save-thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userEmail,
          workspaceOwner,
          clientName: clientName.trim(),
          title: title.trim(),
          projectType: projectType || "General",
          status: status || "Active",
          priority: priority || "Normal",
          messages: messages
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Thread saved successfully! Thread ID: ${result.threadId}`)
        onThreadSaved?.()
        onClose()
      } else {
        const error = await response.text()
        alert(`Failed to save thread: ${error}`)
      }
    } catch (error) {
      console.error("Error saving thread:", error)
      alert("Failed to save thread. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {loadedThread ? "Update Conversation Thread" : "Save Conversation Thread"}
            </h2>
            {loadedThread && (
              <p className="text-sm text-muted-foreground mt-1">
                Currently editing: {loadedThread.metadata.title}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-auto p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Client Name *
            </label>
            <ClientAutocomplete
              value={clientName}
              onValueChange={setClientName}
              userEmail={userEmail || ''}
              workspaceOwner={workspaceOwner || undefined}
              placeholder="Select or type client name..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Thread Title *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 2024 Tax Estimate"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Project Type
            </label>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tax Planning">Tax Planning</SelectItem>
                <SelectItem value="Tax Preparation">Tax Preparation</SelectItem>
                <SelectItem value="Business Consultation">Business Consultation</SelectItem>
                <SelectItem value="Bookkeeping">Bookkeeping</SelectItem>
                <SelectItem value="Financial Planning">Financial Planning</SelectItem>
                <SelectItem value="Audit">Audit</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Waiting for Client Info">Waiting for Client Info</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            {messages.length} messages will be saved
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          {loadedThread ? (
            <>
              <Button variant="outline" onClick={handleSaveAsNew} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save as New Thread"}
              </Button>
              <Button onClick={handleUpdateThread} disabled={isSaving}>
                {isSaving ? "Updating..." : `Update "${loadedThread.metadata.title}"`}
              </Button>
            </>
          ) : (
            <Button onClick={handleSaveAsNew} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Thread"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}