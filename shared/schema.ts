import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  uuid, 
  timestamp, 
  numeric,
  date,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "employee", "manager"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "on_leave"]);
export const taskTypeEnum = pgEnum("task_type", ["warehouse", "logistics", "maintenance", "administrative"]);
export const workStatusEnum = pgEnum("work_status", ["in_progress", "completed", "pending_approval", "approved"]);

// Users table (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Profiles table (user information)
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("employee"),
  employeeNumber: text("employee_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Departments table
export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  managerId: uuid("manager_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employees table
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").notNull(),
  departmentId: uuid("department_id"),
  hireDate: date("hire_date").defaultNow().notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  status: employeeStatusEnum("status").notNull().default("active"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: taskTypeEnum("type").notNull(),
  departmentId: uuid("department_id"),
  estimatedHours: numeric("estimated_hours", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Work hours table
export const workHours = pgTable("work_hours", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull(),
  taskId: uuid("task_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  breakTimeMinutes: integer("break_time_minutes").default(0),
  totalHours: numeric("total_hours", { precision: 10, scale: 2 }),
  notes: text("notes"),
  status: workStatusEnum("status").notNull().default("in_progress"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  employee: one(employees, {
    fields: [profiles.id],
    references: [employees.profileId],
  }),
  createdTasks: many(tasks),
  approvedWorkHours: many(workHours),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(profiles, {
    fields: [departments.managerId],
    references: [profiles.id],
  }),
  employees: many(employees),
  tasks: many(tasks),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [employees.profileId],
    references: [profiles.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  workHours: many(workHours),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  department: one(departments, {
    fields: [tasks.departmentId],
    references: [departments.id],
  }),
  createdBy: one(profiles, {
    fields: [tasks.createdBy],
    references: [profiles.id],
  }),
  workHours: many(workHours),
}));

export const workHoursRelations = relations(workHours, ({ one }) => ({
  employee: one(employees, {
    fields: [workHours.employeeId],
    references: [employees.id],
  }),
  task: one(tasks, {
    fields: [workHours.taskId],
    references: [tasks.id],
  }),
  approvedBy: one(profiles, {
    fields: [workHours.approvedBy],
    references: [profiles.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkHourSchema = createInsertSchema(workHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type WorkHour = typeof workHours.$inferSelect;
export type InsertWorkHour = z.infer<typeof insertWorkHourSchema>;
