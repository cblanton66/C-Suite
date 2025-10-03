"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ClientAutocompleteProps {
  value: string
  onValueChange: (value: string) => void
  userEmail: string
  workspaceOwner?: string
  placeholder?: string
  className?: string
}

export function ClientAutocomplete({
  value,
  onValueChange,
  userEmail,
  workspaceOwner,
  placeholder = "Select or type client name...",
  className
}: ClientAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [clients, setClients] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  // Fetch client names on mount
  React.useEffect(() => {
    const fetchClients = async () => {
      if (!userEmail) return

      setLoading(true)
      try {
        const owner = workspaceOwner || userEmail
        const response = await fetch(
          `/api/user-clients?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(owner)}`
        )
        const data = await response.json()
        console.log('[ClientAutocomplete] Fetched clients from UserClients sheet:', data)
        if (data.success && data.clients) {
          // Extract just the client names
          const clientNames = data.clients.map((c: any) => c.clientName)
          setClients(clientNames)
          console.log('[ClientAutocomplete] Set clients count:', clientNames.length)
        }
      } catch (error) {
        console.error('[ClientAutocomplete] Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [userEmail, workspaceOwner])

  const filteredClients = clients.filter(client =>
    client.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onClick={() => {
            console.log('[ClientAutocomplete] Button clicked, open:', open)
            setOpen(!open)
          }}
        >
          <span>{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type new client name..."
            value={value}
            onValueChange={onValueChange}
          />
          {filteredClients.length === 0 && (
            <CommandEmpty>
              {value ? (
                <div className="py-6 text-center text-sm">
                  <p className="font-medium">Create new client:</p>
                  <p className="mt-1 text-muted-foreground">&quot;{value}&quot;</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setOpen(false)
                    }}
                  >
                    Use this name
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {loading ? "Loading clients..." : "Type to search or create new client..."}
                </div>
              )}
            </CommandEmpty>
          )}
          {filteredClients.length > 0 && (
            <CommandGroup heading={`${filteredClients.length} Existing Clients`} className="max-h-[300px] overflow-auto">
              {filteredClients.map((client) => (
                <CommandItem
                  key={client}
                  value={client}
                  onSelect={() => {
                    console.log('[ClientAutocomplete] Selected client:', client)
                    onValueChange(client)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
