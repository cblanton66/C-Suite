export interface Client {
  id?: string
  clientName: string
  email: string
  phone: string
  address: string
  industry: string
  status: string
  workspaceOwner: string
  createdBy: string
  sharedWith: string[] | string
  dateAdded: string
}
