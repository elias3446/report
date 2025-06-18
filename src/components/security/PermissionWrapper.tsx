
import React from 'react';
import { useSecurity, Permission } from '@/hooks/useSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionWrapperProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user must have ANY permission
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showFallback = true
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, permissionsLoading } = useSecurity();

  // Show loading state
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Determine if user has required permissions
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }

  // Render content if user has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Render fallback if no access
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback if showFallback is true
  if (showFallback) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          No tienes permisos suficientes para ver este contenido.
        </AlertDescription>
      </Alert>
    );
  }

  // Return null if no fallback should be shown
  return null;
};
