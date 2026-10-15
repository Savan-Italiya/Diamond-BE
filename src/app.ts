import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRouter from './modules/auth/auth.router';
import partiesRouter from './modules/parties/parties.router';
import inventoryRouter from './modules/inventory/inventory.router';
import memoRouter from './modules/memo/memo.router';
import salesRouter from './modules/sales/sales.router';
import processingRouter from './modules/processing/processing.router';
import accountingRouter from './modules/accounting/accounting.router';
import remindersRouter from './modules/reminders/reminders.router';
import notificationsRouter from './modules/notifications/notifications.router';
import auditRouter from './modules/audit/audit.router';
import organizationsRouter from './modules/organizations/organizations.router';
import expensesRouter from './modules/expenses/expenses.router';

import { errorHandler } from './middleware/error.middleware';

export function createApp(): Application {
  const app: Application = express();

  // Standard Security & Utility Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: '*', // In production, restrict to allowed origins e.g. web-admin domain
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    })
  );

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health Check Endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'Diamond Trading ERP Mumbai (BKC / Opera House)',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Modules
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/parties', partiesRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/memo', memoRouter);
  app.use('/api/v1/sales', salesRouter);
  app.use('/api/v1/processing', processingRouter);
  app.use('/api/v1/accounting', accountingRouter);
  app.use('/api/v1/reminders', remindersRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/audit', auditRouter);
  app.use('/api/v1/organizations', organizationsRouter);
  app.use('/api/v1/expenses', expensesRouter);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        code: 'ROUTE_NOT_FOUND'
      }
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export default createApp();
