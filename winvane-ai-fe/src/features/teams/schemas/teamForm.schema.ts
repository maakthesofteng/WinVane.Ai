import { z } from 'zod';

export const teamFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Team name must be at least 2 characters.')
      .max(80, 'Team name cannot exceed 80 characters.'),
    departmentId: z.string().uuid().nullable().optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters.')
      .nullable()
      .optional(),
    adminUserId: z.string().uuid().nullable().optional(),
    managerUserId: z.string().uuid().nullable().optional(),
    memberUserIds: z.array(z.string().uuid()),
  })
  .refine(
    (data) => {
      const hasAdmin = Boolean(data.adminUserId);
      const hasManager = Boolean(data.managerUserId);
      const hasMembers = Array.isArray(data.memberUserIds) && data.memberUserIds.length > 0;
      return hasAdmin || hasManager || hasMembers;
    },
    {
      message: 'Add at least one person to the team.',
      path: ['memberUserIds'],
    },
  );

export type TTeamFormValues = z.infer<typeof teamFormSchema>;
