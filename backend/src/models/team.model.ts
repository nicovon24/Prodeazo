import { db } from '../db/client'
import { teams } from '../db/schema'

export function findAllTeams() {
  return db.select().from(teams)
}
