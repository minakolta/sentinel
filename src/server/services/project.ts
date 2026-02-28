import { prisma } from "@/lib/db";
import { AuditService } from "./audit";

export interface ProjectInput {
  name: string;
  description?: string | null;
  customerId: string;
  ownerId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  customerId: string;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  owner?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export const ProjectService = {
  /**
   * Get all projects with relations
   */
  async findAll(customerId?: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: [{ customer: { name: "asc" } }, { name: "asc" }],
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Get a project by ID
   */
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Create a new project
   */
  async create(data: ProjectInput, userId: string): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        customerId: data.customerId,
        ownerId: data.ownerId || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Project",
      entityId: project.id,
      action: "CREATE",
      after: project as unknown as Record<string, unknown>,
    });

    return project;
  },

  /**
   * Update a project
   */
  async update(id: string, data: Partial<ProjectInput>, userId: string): Promise<Project> {
    const before = await prisma.project.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Project not found");
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        customerId: data.customerId,
        ownerId: data.ownerId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Project",
      entityId: project.id,
      action: "UPDATE",
      before: before as unknown as Record<string, unknown>,
      after: project as unknown as Record<string, unknown>,
    });

    return project;
  },

  /**
   * Delete a project
   */
  async delete(id: string, userId: string): Promise<void> {
    const before = await prisma.project.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Project not found");
    }

    await prisma.project.delete({ where: { id } });

    await AuditService.logChange({
      userId,
      entity: "Project",
      entityId: id,
      action: "DELETE",
      before: before as unknown as Record<string, unknown>,
    });
  },
};
