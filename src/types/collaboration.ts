export type CollaboratorRole = 'viewer' | 'commenter' | 'editor' | 'editor_copy' | 'manager' | 'owner'
export type DocumentType = 'resume' | 'report'
export type ActivityAction =
  | 'created'
  | 'edited'
  | 'shared'
  | 'duplicated'
  | 'ownership_transferred'
  | 'deleted'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'collaborator_role_changed'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'version_restored'
  | 'copy_permission_changed'

export interface DocumentPermissions {
  canView: boolean
  canEdit: boolean
  canComment: boolean
  canDuplicate: boolean
  canShare: boolean
  canDelete: boolean
  canTransferOwnership: boolean
  canManagePermissions: boolean
}

export function roleToPermissions(role: CollaboratorRole): DocumentPermissions {
  const none: DocumentPermissions = {
    canView: false, canEdit: false, canComment: false,
    canDuplicate: false, canShare: false, canDelete: false,
    canTransferOwnership: false, canManagePermissions: false,
  }
  switch (role) {
    case 'viewer':
      return { ...none, canView: true }
    case 'commenter':
      return { ...none, canView: true, canComment: true }
    case 'editor':
      return { ...none, canView: true, canComment: true, canEdit: true }
    case 'editor_copy':
      return { ...none, canView: true, canComment: true, canEdit: true, canDuplicate: true }
    case 'manager':
      return { ...none, canView: true, canComment: true, canEdit: true, canDuplicate: true, canShare: true }
    case 'owner':
      return {
        canView: true, canComment: true, canEdit: true, canDuplicate: true,
        canShare: true, canDelete: true, canTransferOwnership: true, canManagePermissions: true,
      }
  }
}

export const ROLE_LABELS: Record<CollaboratorRole, string> = {
  viewer: 'Viewer',
  commenter: 'Commenter',
  editor: 'Editor',
  editor_copy: 'Editor + Copy',
  manager: 'Manager',
  owner: 'Owner',
}

export const ROLE_DESCRIPTIONS: Record<CollaboratorRole, string> = {
  viewer: 'Can view only',
  commenter: 'Can view and comment',
  editor: 'Can view and edit',
  editor_copy: 'Can view, edit, and duplicate',
  manager: 'Can view, edit, duplicate, and share',
  owner: 'Full control',
}

export const ASSIGNABLE_ROLES: CollaboratorRole[] = ['viewer', 'commenter', 'editor', 'editor_copy', 'manager']

export interface CollaboratorRecord {
  uid: string
  email: string
  displayName: string
  role: CollaboratorRole
  addedAt: string | null
  addedBy: string
  addedByEmail: string
}

export interface InvitationRecord {
  id: string
  email: string
  role: CollaboratorRole
  token: string
  status: 'pending' | 'accepted' | 'declined'
  invitedBy: string
  invitedByEmail: string
  invitedAt: string | null
  expiresAt: string | null
  documentName: string
  documentType: DocumentType
  docId?: string
}

export interface ActivityRecord {
  id: string
  userId: string
  userEmail: string
  action: ActivityAction
  timestamp: string | null
  meta?: Record<string, string>
}

export interface VersionRecord {
  id: string
  versionNumber: number
  label: string
  savedBy: string
  savedByEmail: string
  savedAt: string | null
  size: number
}

export interface DocumentCollabInfo {
  docId: string
  type: DocumentType
  ownerUid: string
  ownerEmail: string
  name: string
  allowCopy: boolean
  createdAt: string | null
  updatedAt: string | null
  myRole: CollaboratorRole
  myPermissions: DocumentPermissions
  collaborators: CollaboratorRecord[]
  pendingInvitations: InvitationRecord[]
}
