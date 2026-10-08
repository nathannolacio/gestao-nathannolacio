import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
    id: uuid().defaultRandom().primaryKey(),
    type: varchar({ enum: ["PF", "PJ"] }).notNull(),
    name: varchar({ length:100 }).notNull(),
    email: varchar({ length:256 }).notNull(),
    phoneNumber: varchar({ length:13 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})
