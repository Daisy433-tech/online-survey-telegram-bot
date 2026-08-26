import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminNotifications,
  analyticsEvents,
  masterclassVerifications,
  participants,
  supportTickets,
} from "@/db/schema";

/**
 * Dashboard aggregation. Every query is wrapped so a missing/unmigrated
 * database degrades the UI to empty states instead of crashing the page.
 */
export async function getDashboardData() {
  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  const [participantRows, eventRows, ticketRows, notificationRows, verificationRows, stats] =
    await Promise.all([
      safe(
        () =>
          db
            .select()
            .from(participants)
            .orderBy(desc(participants.registeredAt))
            .limit(25),
        [],
      ),
      safe(
        () =>
          db
            .select()
            .from(analyticsEvents)
            .orderBy(desc(analyticsEvents.createdAt))
            .limit(40),
        [],
      ),
      safe(
        () =>
          db
            .select()
            .from(supportTickets)
            .orderBy(desc(supportTickets.updatedAt))
            .limit(12),
        [],
      ),
      safe(
        () =>
          db
            .select()
            .from(adminNotifications)
            .orderBy(desc(adminNotifications.createdAt))
            .limit(12),
        [],
      ),
      safe(
        () =>
          db
            .select()
            .from(masterclassVerifications)
            .orderBy(desc(masterclassVerifications.createdAt))
            .limit(12),
        [],
      ),
      safe(async () => {
        const rows = await Promise.all([
          db.select({ n: sql<number>`count(*)::int` }).from(participants),
          db.select({ n: sql<number>`count(*)::int` }).from(analyticsEvents),
          db.select({ n: sql<number>`count(*)::int` }).from(supportTickets),
          db.select({ n: sql<number>`count(*)::int` }).from(masterclassVerifications),
        ]);
        return {
          participants: rows[0][0]?.n ?? 0,
          events: rows[1][0]?.n ?? 0,
          tickets: rows[2][0]?.n ?? 0,
          verifications: rows[3][0]?.n ?? 0,
        };
      }, { participants: 0, events: 0, tickets: 0, verifications: 0 }),
    ]);

  return {
    participants: participantRows,
    events: eventRows,
    tickets: ticketRows,
    notifications: notificationRows,
    verifications: verificationRows,
    stats,
  };
}
