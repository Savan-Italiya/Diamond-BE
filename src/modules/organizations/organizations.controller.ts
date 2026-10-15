import { Request, Response, NextFunction } from 'express';
import { OrganizationsService } from './organizations.service';

export class OrganizationsController {
  public static async getMyOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'admin-1';
      const org = await OrganizationsService.getMyOrganization(userId);
      res.status(200).json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  public static async createOrUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'admin-1';
      const org = await OrganizationsService.createOrUpdateOrganization(userId, req.body);
      res.status(200).json({ success: true, message: 'Organization saved successfully', data: org });
    } catch (err) {
      next(err);
    }
  }

  public static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'admin-1';
      const org = await OrganizationsService.getMyOrganization(userId);
      const members = await OrganizationsService.getMembers(org.id);
      res.status(200).json({ success: true, count: members.length, data: members });
    } catch (err) {
      next(err);
    }
  }

  public static async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'admin-1';
      const org = await OrganizationsService.getMyOrganization(userId);
      const member = await OrganizationsService.addMember(org.id, req.body);
      res.status(201).json({
        success: true,
        message: `Member ${member.name} registered under ${org.name}. Login enabled with separate hisab.`,
        data: member
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMemberStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'admin-1';
      const { id } = req.params;
      const { status } = req.body;
      const org = await OrganizationsService.getMyOrganization(userId);
      const updated = await OrganizationsService.updateMemberStatus(org.id, id, status);
      res.status(200).json({ success: true, message: 'Member status updated', data: updated });
    } catch (err) {
      next(err);
    }
  }
}
