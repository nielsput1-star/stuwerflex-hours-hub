import { 
  users, 
  profiles, 
  departments, 
  employees, 
  tasks, 
  workHours,
  timeSessions,
  projects,
  overtime,
  leaveRequests,
  attendance,
  type User, 
  type InsertUser,
  type Profile,
  type InsertProfile,
  type Department,
  type InsertDepartment,
  type Employee,
  type InsertEmployee,
  type Task,
  type InsertTask,
  type WorkHour,
  type InsertWorkHour,
  type TimeSession,
  type InsertTimeSession,
  type Project,
  type InsertProject,
  type Overtime,
  type InsertOvertime,
  type LeaveRequest,
  type InsertLeaveRequest,
  type Attendance,
  type InsertAttendance
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByProfileId(profileId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getActiveTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Work Hours
  getWorkHours(): Promise<WorkHour[]>;
  getWorkHoursByEmployee(employeeId: string): Promise<WorkHour[]>;
  getWorkHour(id: string): Promise<WorkHour | undefined>;
  createWorkHour(workHour: InsertWorkHour): Promise<WorkHour>;
  updateWorkHour(id: string, workHour: Partial<InsertWorkHour>): Promise<WorkHour | undefined>;
  
  // Time Sessions
  getActiveSessions(): Promise<TimeSession[]>;
  getActiveSessionsByEmployee(employeeId: string): Promise<TimeSession[]>;
  getTimeSession(id: string): Promise<TimeSession | undefined>;
  createTimeSession(session: InsertTimeSession): Promise<TimeSession>;
  updateTimeSession(id: string, session: Partial<InsertTimeSession>): Promise<TimeSession | undefined>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  
  // Overtime
  getOvertimeByEmployee(employeeId: string): Promise<Overtime[]>;
  createOvertime(overtime: InsertOvertime): Promise<Overtime>;
  updateOvertime(id: string, overtime: Partial<InsertOvertime>): Promise<Overtime | undefined>;
  
  // Leave Requests
  getLeaveRequests(): Promise<LeaveRequest[]>;
  getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: string, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined>;
  
  // Attendance
  getAttendanceByEmployee(employeeId: string): Promise<Attendance[]>;
  getTodayAttendance(employeeId: string): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.email, email));
    return profile || undefined;
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async updateProfile(id: string, profileUpdate: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [profile] = await db.update(profiles)
      .set({ ...profileUpdate, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return profile || undefined;
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }

  async updateDepartment(id: string, departmentUpdate: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [department] = await db.update(departments)
      .set({ ...departmentUpdate, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department || undefined;
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByProfileId(profileId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.profileId, profileId));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: string, employeeUpdate: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db.update(employees)
      .set({ ...employeeUpdate, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.name);
  }

  async getActiveTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.isActive, true)).orderBy(tasks.name);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ ...taskUpdate, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  // Work Hours
  async getWorkHours(): Promise<WorkHour[]> {
    return await db.select().from(workHours).orderBy(desc(workHours.startTime));
  }

  async getWorkHoursByEmployee(employeeId: string): Promise<WorkHour[]> {
    return await db.select().from(workHours)
      .where(eq(workHours.employeeId, employeeId))
      .orderBy(desc(workHours.startTime));
  }

  async getWorkHour(id: string): Promise<WorkHour | undefined> {
    const [workHour] = await db.select().from(workHours).where(eq(workHours.id, id));
    return workHour || undefined;
  }

  async createWorkHour(insertWorkHour: InsertWorkHour): Promise<WorkHour> {
    const [workHour] = await db.insert(workHours).values(insertWorkHour).returning();
    return workHour;
  }

  async updateWorkHour(id: string, workHourUpdate: Partial<InsertWorkHour>): Promise<WorkHour | undefined> {
    const [workHour] = await db.update(workHours)
      .set({ ...workHourUpdate, updatedAt: new Date() })
      .where(eq(workHours.id, id))
      .returning();
    return workHour || undefined;
  }

  // Time Sessions
  async getActiveSessions(): Promise<TimeSession[]> {
    return await db.select().from(timeSessions)
      .where(eq(timeSessions.isActive, true))
      .orderBy(desc(timeSessions.startTime));
  }

  async getActiveSessionsByEmployee(employeeId: string): Promise<TimeSession[]> {
    return await db.select().from(timeSessions)
      .where(and(eq(timeSessions.employeeId, employeeId), eq(timeSessions.isActive, true)))
      .orderBy(desc(timeSessions.startTime));
  }

  async getTimeSession(id: string): Promise<TimeSession | undefined> {
    const [session] = await db.select().from(timeSessions).where(eq(timeSessions.id, id));
    return session || undefined;
  }

  async createTimeSession(insertSession: InsertTimeSession): Promise<TimeSession> {
    const [session] = await db.insert(timeSessions).values(insertSession).returning();
    return session;
  }

  async updateTimeSession(id: string, sessionUpdate: Partial<InsertTimeSession>): Promise<TimeSession | undefined> {
    const [session] = await db.update(timeSessions)
      .set({ ...sessionUpdate, lastUpdate: new Date() })
      .where(eq(timeSessions.id, id))
      .returning();
    return session || undefined;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: string, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects)
      .set({ ...projectUpdate, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  // Overtime
  async getOvertimeByEmployee(employeeId: string): Promise<Overtime[]> {
    return await db.select().from(overtime)
      .where(eq(overtime.employeeId, employeeId))
      .orderBy(desc(overtime.date));
  }

  async createOvertime(insertOvertime: InsertOvertime): Promise<Overtime> {
    const [overtimeRecord] = await db.insert(overtime).values(insertOvertime).returning();
    return overtimeRecord;
  }

  async updateOvertime(id: string, overtimeUpdate: Partial<InsertOvertime>): Promise<Overtime | undefined> {
    const [overtimeRecord] = await db.update(overtime)
      .set(overtimeUpdate)
      .where(eq(overtime.id, id))
      .returning();
    return overtimeRecord || undefined;
  }

  // Leave Requests
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests)
      .where(eq(leaveRequests.employeeId, employeeId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests)
      .where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || undefined;
  }

  async createLeaveRequest(insertRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const [request] = await db.insert(leaveRequests).values(insertRequest).returning();
    return request;
  }

  async updateLeaveRequest(id: string, requestUpdate: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined> {
    const [request] = await db.update(leaveRequests)
      .set({ ...requestUpdate, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return request || undefined;
  }

  // Attendance
  async getAttendanceByEmployee(employeeId: string): Promise<Attendance[]> {
    return await db.select().from(attendance)
      .where(eq(attendance.employeeId, employeeId))
      .orderBy(desc(attendance.date));
  }

  async getTodayAttendance(employeeId: string): Promise<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [attendanceRecord] = await db.select().from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)));
    return attendanceRecord || undefined;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db.insert(attendance).values(insertAttendance).returning();
    return attendanceRecord;
  }

  async updateAttendance(id: string, attendanceUpdate: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [attendanceRecord] = await db.update(attendance)
      .set({ ...attendanceUpdate, updatedAt: new Date() })
      .where(eq(attendance.id, id))
      .returning();
    return attendanceRecord || undefined;
  }
}

export const storage = new DatabaseStorage();
