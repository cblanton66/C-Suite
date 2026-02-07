"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface ThreadMetadata {
  clientName: string
  title: string
  projectType: string
  status: string
  priority: string
  createdAt: string
  lastUpdated: string
  messageCount: number
}

interface SavedThread {
  threadId: string
  fileName: string
  filePath: string
  metadata: ThreadMetadata
  messageCount: number
  lastUpdated: string
}

interface EditThreadModalProps {
  isOpen: boolean
  onClose: () => void
  thread: SavedThread | null
  userEmail: string | null
  onThreadUpdated: () => void
}

export function EditThreadModal({ isOpen, onClose, thread, userEmail, onThreadUpdated }: EditThreadModalProps) {
  const [clientName, setClientName] = useState("")
  const [title, setTitle] = useState("")
  const [projectType, setProjectType] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Initialize form when modal opens
  const initializeForm = () => {
    if (thread) {
      setClientName(thread.metadata.clientName || "")
      setTitle(thread.metadata.title || "")
      setProjectType(thread.metadata.projectType || "")
      setStatus(thread.metadata.status || "")
      setPriority(thread.metadata.priority || "")
    }
  }

  // Reset form when modal closes
  const resetForm = () => {
    setClientName("")
    setTitle("")
    setProjectType("")
    setStatus("")
    setPriority("")
  }

  const handleOpen = () => {
    if (isOpen && thread) {
      initializeForm()
    } else if (!isOpen) {
      resetForm()
    }
  }

  // Effect to handle modal state changes
  React.useEffect(() => {
    handleOpen()
  }, [isOpen, thread])

  const handleUpdate = async () => {
    if (!clientName.trim() || !title.trim() || !userEmail || !thread) {
      alert("Please fill in client name and title")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/update-thread", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userEmail,
          filePath: thread.filePath,
          clientName: clientName.trim(),
          title: title.trim(),
          projectType: projectType || "General",
          status: status || "Active",
          priority: priority || "Normal"
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert("Thread updated successfully!")
        onThreadUpdated() // Refresh the thread list
        onClose()
      } else {
        const error = await response.text()
        alert(`Failed to update thread: ${error}`)
      }
    } catch (error) {
      console.error("Error updating thread:", error)
      alert("Failed to update thread. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen || !thread) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-background border rounded-t-2xl sm:rounded-lg w-full sm:max-w-md flex flex-col" style={{ maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px))' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2 border-b shrink-0">
          <h2 className="text-lg font-semibold">Edit Thread</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-auto p-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Client Name *
            </label>
            <Input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
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
            Thread ID: {thread.threadId}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-2 p-4 sm:p-6 pt-4 border-t shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Thread"}
          </Button>
        </div>
      </div>
    </div>
  )
}