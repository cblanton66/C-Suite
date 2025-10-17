"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Edit, Copy, Archive, X } from "lucide-react"
import { toast } from "sonner"
import { Client } from "@/types/client"

interface ClientNotesTabProps {
  client: Client
  userEmail: string
  workspaceOwner: string
}

export function ClientNotesTab({
  client,
  userEmail,
  workspaceOwner
}: ClientNotesTabProps) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchivedNotes, setShowArchivedNotes] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [noteContent, setNoteContent] = useState('')
  const [loadingNote, setLoadingNote] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [editedNoteContent, setEditedNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [archivingNote, setArchivingNote] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const clientSlug = client.clientName.toLowerCase().replace(/\s+/g, '-')
      const clientOwner = client.workspaceOwner || workspaceOwner
      console.log('[ClientNotesTab] Fetching notes for client slug:', clientSlug, 'owner:', clientOwner)
      const response = await fetch(
        `/api/list-files?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(clientOwner)}&folder=client-files/${clientSlug}/notes`
      )
      const data = await response.json()
      console.log('[ClientNotesTab] Notes response:', data)
      console.log('[ClientNotesTab] Notes files:', data.files)
      setNotes(data.files || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNote = async (note: any) => {
    setSelectedNote(note)
    setLoadingNote(true)
    try {
      const response = await fetch(
        `/api/get-file-content?filePath=${encodeURIComponent(note.name)}`
      )
      if (response.ok) {
        const data = await response.json()
        setNoteContent(data.content || '')
      } else {
        setNoteContent('Failed to load note content')
      }
    } catch (error) {
      console.error('Error loading note:', error)
      setNoteContent('Failed to load note content')
    } finally {
      setLoadingNote(false)
    }
  }

  const handleCopyNote = () => {
    navigator.clipboard.writeText(noteContent)
    toast.success('Note content copied to clipboard!')
  }

  const handleCloseNote = () => {
    setSelectedNote(null)
    setNoteContent('')
    setIsEditingNote(false)
    setEditedNoteContent('')
  }

  const handleEditNote = () => {
    setEditedNoteContent(noteContent)
    setIsEditingNote(true)
  }

  const handleCancelEditNote = () => {
    setIsEditingNote(false)
    setEditedNoteContent('')
  }

  const handleSaveNote = async () => {
    if (!selectedNote) return

    setSavingNote(true)
    try {
      const response = await fetch('/api/save-private-note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedNote.name,
          content: editedNoteContent,
          userEmail,
          workspaceOwner
        })
      })

      if (response.ok) {
        setNoteContent(editedNoteContent)
        setIsEditingNote(false)
        toast.success('Note updated successfully!')
      } else {
        toast.error('Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleArchiveNote = async () => {
    if (!selectedNote) return

    setArchivingNote(true)
    try {
      const fileName = selectedNote.name.split('/').pop()
      const folderPath = selectedNote.name.substring(0, selectedNote.name.lastIndexOf('/'))
      const newFileName = fileName?.startsWith('[ARCHIVED]') ? fileName : `[ARCHIVED] ${fileName}`
      const newFilePath = `${folderPath}/${newFileName}`

      const response = await fetch('/api/rename-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath: selectedNote.name,
          newPath: newFilePath
        })
      })

      if (response.ok) {
        toast.success('Note archived successfully!')
        handleCloseNote()
        fetchNotes()
      } else {
        toast.error('Failed to archive note')
      }
    } catch (error) {
      console.error('Error archiving note:', error)
      toast.error('Failed to archive note')
    } finally {
      setArchivingNote(false)
    }
  }

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
    const phoneRegex = /(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/g

    const combinedRegex = new RegExp(
      `${urlRegex.source}|${emailRegex.source}|${phoneRegex.source}`,
      'g'
    )

    const parts = text.split(combinedRegex).filter(Boolean)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      if (part.match(emailRegex)) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      if (part.match(phoneRegex)) {
        const cleanPhone = part.replace(/[^\d+]/g, '')
        return (
          <a
            key={index}
            href={`tel:${cleanPhone}`}
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  const filteredNotes = notes.filter((note: any) => {
    if (note.name?.endsWith('.placeholder')) return false
    const fileName = note.name?.split('/').pop() || ''
    if (!showArchivedNotes && fileName.startsWith('[ARCHIVED]')) return false
    return true
  })

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {showArchivedNotes ? 'All Notes' : 'Active Notes'} ({filteredNotes.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchivedNotes(!showArchivedNotes)}
          >
            {showArchivedNotes ? 'Hide Archive' : 'Show Archive'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notes found for this client</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((note: any, index: number) => {
              const fileName = note.name?.split('/').pop() || ''
              const isArchived = fileName.startsWith('[ARCHIVED]')
              const noteTitle = note.title || fileName || 'Untitled Note'
              const noteDate = note.uploadedAt ? new Date(note.uploadedAt).toLocaleDateString() : ''

              return (
                <div
                  key={note.name || index}
                  className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{noteTitle}</h4>
                        {isArchived && (
                          <span className="px-2 py-0.5 bg-orange-600 text-white rounded text-xs">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{noteDate}</p>
                    </div>
                    <FileText className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Note Viewer Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedNote.title || 'Note'}</h2>
              <div className="flex items-center gap-2">
                {isEditingNote ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={savingNote}
                    >
                      {savingNote ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditNote}
                      disabled={savingNote}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEditNote}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyNote}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveNote}
                      disabled={archivingNote}
                      className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {archivingNote ? 'Archiving...' : 'Archive'}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleCloseNote}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingNote ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isEditingNote ? (
                <Textarea
                  value={editedNoteContent}
                  onChange={(e) => setEditedNoteContent(e.target.value)}
                  className="w-full h-full min-h-[400px] font-mono text-sm resize-none"
                  placeholder="Enter note content..."
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {renderTextWithLinks(noteContent)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
