import { useEffect, useState } from 'react'
import { hasInteractedWithClassroomForm } from '../lib/share-classroom'

// Decides when to surface the "tell us about your classroom" modal inside
// the app shell. We only ask once a teacher has actually generated something
// (>=1 lesson / activity / assessment in IndexedDB) so the request lands at
// a moment where they have already gotten value from the app.
export function useShouldShowClassroomGate(): boolean {
  const [shouldShow, setShouldShow] = useState(false)
  useEffect(() => {
    if (hasInteractedWithClassroomForm()) return
    let cancelled = false
    void (async () => {
      try {
        const { db } = await import('../lib/db')
        const [lessonCount, activityCount, assessmentCount] = await Promise.all([
          db.lessonPlans.count(),
          db.activities.count(),
          db.assessments.count(),
        ])
        if (cancelled) return
        if (lessonCount + activityCount + assessmentCount >= 1) {
          setShouldShow(true)
        }
      } catch {
        // If the DB isn't ready yet we just don't show the gate this session.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return shouldShow
}
