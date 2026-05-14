import { auth } from './auth'
import { documents } from './documents'
import { users } from './users'
import { workspaces } from './workspace'
import { templates } from './templates'
import { servers } from './servers'
import { clients } from './clients'
import { profile } from './profile'
import { permissions } from './permissions'
import { publications } from './publications'
import { metrics } from './metrics'

export const server = {
  auth,
  workspaces,
  documents,
  users,
  templates,
  servers,
  clients,
  profile,
  permissions,
  publications,
  metrics,
}
