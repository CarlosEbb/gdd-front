import { auth } from './auth'
import { documents } from './documents'
import { user } from './user'
import { workspaces } from './workspace'
import { templates } from './templates'

export const server = {
  auth,
  workspaces,
  documents,
  user,
  templates,
}
