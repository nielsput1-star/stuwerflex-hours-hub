import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProfileSchema, 
  insertDepartmentSchema, 
  insertEmployeeSchema, 
  insertTaskSchema, 
  insertWorkHourSchema,
  insertTimeSessionSchema,
  insertProjectSchema,
  insertOvertimeSchema,
  insertLeaveRequestSchema,
  insertAttendanceSchema
} from "@shared/schema";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    profileId: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Middleware to verify JWT token
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if profile exists
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // For demo purposes, we'll use a simple password check
      // In production, you should hash passwords
      if (password === 'demo123') {
        const token = jwt.sign(
          { userId: profile.userId, profileId: profile.id, role: profile.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role
          }
        });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingProfile = await storage.getProfileByEmail(email);
      if (existingProfile) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Generate a unique user ID for the profile
      const userId = crypto.randomUUID();
      
      const profile = await storage.createProfile({
        userId,
        email,
        firstName,
        lastName,
        phone: null,
        role: 'employee',
        employeeNumber: `EMP${Date.now()}`,
      });

      // Create employee record
      await storage.createEmployee({
        profileId: profile.id,
        departmentId: null,
        hireDate: new Date().toISOString().split('T')[0],
        status: 'active',
        hourlyRate: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
      });

      const token = jwt.sign(
        { userId: profile.userId, profileId: profile.id, role: profile.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Profile routes
  app.get('/api/profiles/me', authenticateToken, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.user.profileId);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const employee = await storage.getEmployeeByProfileId(profile.id);
      res.json({ ...profile, employee });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/profiles/me', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProfileSchema.partial().parse(req.body);
      const updatedProfile = await storage.updateProfile(req.user.profileId, validatedData);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Department routes
  app.get('/api/departments', authenticateToken, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/departments', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.json(department);
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/departments/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(req.params.id, validatedData);
      res.json(department);
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Employee routes
  app.get('/api/employees', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Task routes
  app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
      const tasks = await storage.getActiveTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/tasks', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({ ...validatedData, createdBy: req.user.profileId });
      res.json(task);
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      res.json(task);
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Work hours routes
  app.get('/api/work-hours', authenticateToken, async (req, res) => {
    try {
      let workHours;
      if (req.user.role === 'admin') {
        workHours = await storage.getWorkHours();
      } else {
        const employee = await storage.getEmployeeByProfileId(req.user.profileId);
        if (!employee) {
          return res.status(404).json({ message: 'Employee record not found' });
        }
        workHours = await storage.getWorkHoursByEmployee(employee.id);
      }
      res.json(workHours);
    } catch (error) {
      console.error('Get work hours error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/work-hours', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const validatedData = insertWorkHourSchema.parse({
        ...req.body,
        employeeId: employee.id
      });
      const workHour = await storage.createWorkHour(validatedData);
      res.json(workHour);
    } catch (error) {
      console.error('Create work hour error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/work-hours/:id', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertWorkHourSchema.partial().parse(req.body);
      const workHour = await storage.updateWorkHour(req.params.id, validatedData);
      res.json(workHour);
    } catch (error) {
      console.error('Update work hour error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Time Sessions routes (for real-time tracking)
  app.get('/api/time-sessions', authenticateToken, async (req, res) => {
    try {
      const { filter } = req.query;
      let sessions;
      
      if (filter === 'active') {
        const employee = await storage.getEmployeeByProfileId(req.user.profileId);
        if (!employee) {
          return res.status(404).json({ message: 'Employee record not found' });
        }
        sessions = await storage.getActiveSessionsByEmployee(employee.id);
      } else {
        sessions = await storage.getActiveSessions();
      }
      res.json(sessions);
    } catch (error) {
      console.error('Get time sessions error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/time-sessions', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const validatedData = insertTimeSessionSchema.parse({
        ...req.body,
        employeeId: employee.id
      });
      const session = await storage.createTimeSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error('Create time session error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/time-sessions/:id/stop', authenticateToken, async (req, res) => {
    try {
      const { endTime, totalHours, notes, breakTimeMinutes } = req.body;
      
      // First update the session to inactive
      const session = await storage.updateTimeSession(req.params.id, {
        isActive: false,
        notes
      });

      if (session) {
        // Create a work hour record from the session
        const workHour = await storage.createWorkHour({
          employeeId: session.employeeId,
          taskId: session.taskId,
          startTime: session.startTime,
          endTime: endTime,
          totalHours: totalHours,
          breakTimeMinutes: breakTimeMinutes || 0,
          notes: notes,
          status: 'completed'
        });
        res.json({ session, workHour });
      } else {
        res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      console.error('Stop time session error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Projects routes
  app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      res.json(project);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Leave Requests routes
  app.get('/api/leave-requests', authenticateToken, async (req, res) => {
    try {
      const { filter } = req.query;
      let requests;

      if (filter === 'team' && (req.user.role === 'admin' || req.user.role === 'manager')) {
        requests = await storage.getPendingLeaveRequests();
      } else {
        const employee = await storage.getEmployeeByProfileId(req.user.profileId);
        if (!employee) {
          return res.status(404).json({ message: 'Employee record not found' });
        }
        requests = await storage.getLeaveRequestsByEmployee(employee.id);
      }
      res.json(requests);
    } catch (error) {
      console.error('Get leave requests error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/leave-requests', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const validatedData = insertLeaveRequestSchema.parse({
        ...req.body,
        employeeId: employee.id
      });
      const request = await storage.createLeaveRequest(validatedData);
      res.json(request);
    } catch (error) {
      console.error('Create leave request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/leave-requests/:id/approve', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Only admins and managers can approve leave requests' });
      }

      const { comments } = req.body;
      const request = await storage.updateLeaveRequest(req.params.id, {
        status: 'approved',
        approvedBy: req.user.profileId,
        approvedAt: new Date().toISOString(),
        comments
      });
      res.json(request);
    } catch (error) {
      console.error('Approve leave request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/leave-requests/:id/reject', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Only admins and managers can reject leave requests' });
      }

      const { comments } = req.body;
      const request = await storage.updateLeaveRequest(req.params.id, {
        status: 'rejected',
        approvedBy: req.user.profileId,
        approvedAt: new Date().toISOString(),
        comments
      });
      res.json(request);
    } catch (error) {
      console.error('Reject leave request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Leave Balance route
  app.get('/api/leave-balance', authenticateToken, async (req, res) => {
    try {
      // Mock leave balance data - in production this would calculate from leave requests
      const balance = {
        vacation: 25,
        sick: 5,
        personal: 3,
        compTime: 8
      };
      res.json(balance);
    } catch (error) {
      console.error('Get leave balance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Attendance routes
  app.get('/api/attendance/today', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const attendance = await storage.getTodayAttendance(employee.id);
      res.json(attendance);
    } catch (error) {
      console.error('Get today attendance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/attendance/clock-in', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const today = new Date().toISOString().split('T')[0];
      const clockIn = new Date().toISOString();

      const attendance = await storage.createAttendance({
        employeeId: employee.id,
        date: today,
        clockIn: clockIn,
        status: 'present'
      });
      res.json(attendance);
    } catch (error) {
      console.error('Clock in error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/attendance/clock-out', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const todayAttendance = await storage.getTodayAttendance(employee.id);
      if (!todayAttendance) {
        return res.status(400).json({ message: 'No clock-in record found for today' });
      }

      const clockOut = new Date().toISOString();
      const clockInTime = new Date(todayAttendance.clockIn!);
      const totalHours = ((new Date(clockOut).getTime() - clockInTime.getTime()) / (1000 * 60 * 60)).toFixed(2);

      const attendance = await storage.updateAttendance(todayAttendance.id, {
        clockOut: clockOut,
        totalHours: parseFloat(totalHours)
      });
      res.json(attendance);
    } catch (error) {
      console.error('Clock out error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Overtime routes
  app.get('/api/overtime', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const overtime = await storage.getOvertimeByEmployee(employee.id);
      res.json(overtime);
    } catch (error) {
      console.error('Get overtime error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/overtime', authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByProfileId(req.user.profileId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      const validatedData = insertOvertimeSchema.parse({
        ...req.body,
        employeeId: employee.id
      });
      const overtime = await storage.createOvertime(validatedData);
      res.json(overtime);
    } catch (error) {
      console.error('Create overtime error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
