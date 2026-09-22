import { sqliteTable,text,integer,index,primaryKey } from 'drizzle-orm/sqlite-core';
export const courses=sqliteTable('courses',{id:text('id').primaryKey(),data:text('data').notNull(),updated:text('updated').notNull()});
export const saves=sqliteTable('saves',{userId:text('user_id').notNull(),courseId:text('course_id').notNull(),played:integer('played').notNull().default(0)},t=>[primaryKey({columns:[t.userId,t.courseId]})]);
export const trips=sqliteTable('trips',{id:text('id').primaryKey(),userId:text('user_id').notNull(),name:text('name').notNull(),data:text('data').notNull(),updated:text('updated').notNull()},t=>[index('trips_owner').on(t.userId)]);
export const rounds=sqliteTable('rounds',{id:text('id').primaryKey(),userId:text('user_id').notNull(),courseId:text('course_id').notNull(),data:text('data').notNull(),created:text('created').notNull()},t=>[index('rounds_owner').on(t.userId)]);
export const submissions=sqliteTable('submissions',{id:text('id').primaryKey(),userId:text('user_id').notNull(),courseId:text('course_id'),kind:text('kind').notNull(),data:text('data').notNull(),status:text('status').notNull().default('pending'),created:text('created').notNull()},t=>[index('submissions_status').on(t.status,t.courseId)]);
export const audit=sqliteTable('audit',{id:text('id').primaryKey(),userId:text('user_id').notNull(),action:text('action').notNull(),data:text('data').notNull(),created:text('created').notNull()});
export const rateLimits=sqliteTable('rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
