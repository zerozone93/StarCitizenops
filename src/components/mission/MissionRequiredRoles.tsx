import { Badge } from "@/components/ui/badge";

interface MissionRequiredRolesProps {
  role: string;
}

export function MissionRequiredRoles({ role }: MissionRequiredRolesProps) {
  return (
    <Badge variant="outline" className="bg-blue-950 text-blue-100 border-blue-700 hover:bg-blue-900">
      {role}
    </Badge>
  );
}

interface MissionRequiredRolesListProps {
  roles: string[];
  title?: string;
}

export function MissionRequiredRolesList({ roles, title = "Required Roles" }: MissionRequiredRolesListProps) {
  if (!roles || roles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {roles.map((role, idx) => (
          <MissionRequiredRoles key={idx} role={role} />
        ))}
      </div>
    </div>
  );
}
