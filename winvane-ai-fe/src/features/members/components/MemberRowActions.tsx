'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Pencil,
  Mail,
  UserX,
  UserCheck,
  Ban,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { getErrorMessage } from '@/lib/api/apiError';
import { selectHasPermission } from '@/store/slices/authSlice';
import { useResendInvite } from '../hooks/useResendInvite';
import { useRevokeInvite } from '../hooks/useRevokeInvite';
import { useDeactivateMember } from '../hooks/useDeactivateMember';
import { useReactivateMember } from '../hooks/useReactivateMember';
import type { IMemberRow } from '../types/members.types';

export interface IMemberRowActionsProps {
  member: IMemberRow;
  onEdit: (member: IMemberRow) => void;
}

export function MemberRowActions({ member, onEdit }: IMemberRowActionsProps) {
  const confirm = useConfirm();
  const canUpdate = useSelector(selectHasPermission('members:update'));
  const canInvite = useSelector(selectHasPermission('members:invite'));
  const canDeactivate = useSelector(selectHasPermission('members:deactivate'));

  const { mutate: resendInvite, isPending: isResending } = useResendInvite();
  const { mutate: revokeInvite, isPending: isRevoking } = useRevokeInvite();
  const { mutate: deactivateMember, isPending: isDeactivating } = useDeactivateMember();
  const { mutate: reactivateMember, isPending: isReactivating } = useReactivateMember();

  const isBusy = isResending || isRevoking || isDeactivating || isReactivating;

  // Row action visibility matrix per §3.3
  const showEdit = canUpdate && !member.isOwner;
  const showResend =
    canInvite &&
    (member.status === 'invited' ||
      (member.status === 'inactive' && member.invitation !== null));
  const showRevoke = canInvite && member.status === 'invited';
  const showDeactivate =
    canDeactivate &&
    member.status === 'active' &&
    !member.isOwner &&
    !member.isSelf;
  const showReactivate =
    canDeactivate && member.status === 'inactive' && member.invitation === null;

  const hasAnyAction =
    showEdit || showResend || showRevoke || showDeactivate || showReactivate;

  if (!hasAnyAction) {
    return null;
  }

  const handleResend = async () => {
    const ok = await confirm({
      title: 'Resend invitation?',
      description: `A fresh invitation email will be sent to ${member.email}. Any previous links will be invalidated.`,
      confirmLabel: 'Resend email',
    });
    if (!ok) return;

    resendInvite(member.id, {
      onSuccess: () => toast.success(`Invitation resent to ${member.email}`),
      onError: (err) => toast.error(getErrorMessage(err) || 'Failed to resend invite.'),
    });
  };

  const handleRevoke = async () => {
    const ok = await confirm({
      title: 'Revoke invitation?',
      description: `Cancel the pending invite link for ${member.fullName || member.email}. They will not be able to accept it.`,
      confirmLabel: 'Revoke invite',
      variant: 'destructive',
    });
    if (!ok) return;

    revokeInvite(member.id, {
      onSuccess: () => toast.success('Invitation revoked successfully.'),
      onError: (err) => toast.error(getErrorMessage(err) || 'Failed to revoke invite.'),
    });
  };

  const handleDeactivate = async () => {
    const ok = await confirm({
      title: `Deactivate ${member.fullName}?`,
      description:
        "They'll be signed out immediately and can't sign in until reactivated. Team memberships are kept.",
      confirmLabel: 'Deactivate',
      variant: 'destructive',
    });
    if (!ok) return;

    deactivateMember(member.id, {
      onSuccess: () => toast.success(`${member.fullName} has been deactivated.`),
      onError: (err) => toast.error(getErrorMessage(err) || 'Failed to deactivate member.'),
    });
  };

  const handleReactivate = async () => {
    const ok = await confirm({
      title: `Reactivate ${member.fullName}?`,
      description: 'They will immediately regain workspace access and be able to sign in.',
      confirmLabel: 'Reactivate',
    });
    if (!ok) return;

    reactivateMember(member.id, {
      onSuccess: () => toast.success(`${member.fullName} has been reactivated.`),
      onError: (err) => toast.error(getErrorMessage(err) || 'Failed to reactivate member.'),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none disabled:opacity-50"
        aria-label="Open member actions menu"
        disabled={isBusy}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {showEdit && (
          <DropdownMenuItem onClick={() => onEdit(member)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit member
          </DropdownMenuItem>
        )}
        {showResend && (
          <DropdownMenuItem onClick={handleResend}>
            <Mail className="mr-2 h-4 w-4" />
            Resend invite
          </DropdownMenuItem>
        )}
        {showRevoke && (
          <DropdownMenuItem onClick={handleRevoke} variant="destructive">
            <Ban className="mr-2 h-4 w-4" />
            Revoke invite
          </DropdownMenuItem>
        )}
        {(showDeactivate || showReactivate) && (showEdit || showResend || showRevoke) && (
          <DropdownMenuSeparator />
        )}
        {showDeactivate && (
          <DropdownMenuItem onClick={handleDeactivate} variant="destructive">
            <UserX className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        )}
        {showReactivate && (
          <DropdownMenuItem onClick={handleReactivate}>
            <UserCheck className="mr-2 h-4 w-4" />
            Reactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

