'use client';

import React, { useState } from 'react';
import { MOCK_USERS } from '../../../lib/api/mockData';
import { User, Role } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { UserCog, ShieldCheck, Mail, Building } from 'lucide-react';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [userList, setUserList] = useState<User[]>(Object.values(MOCK_USERS));

  const handleRoleChange = (userId: string, newRole: Role) => {
    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    showToast(`Role updated to ${newRole} for user.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Role-Based Access Control (RBAC)
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          User Directory & Role Scope Administration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure authorization scopes across the five sanctioned institutional roles.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border text-slate-400 font-medium">
              <th className="pb-3">User</th>
              <th className="pb-3">Institutional Email</th>
              <th className="pb-3">Campus</th>
              <th className="pb-3">Department</th>
              <th className="pb-3">Current Role Scope</th>
              <th className="pb-3 text-right">Reassign Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {userList.map((u) => (
              <tr key={u.id} className="hover:bg-surface-elevated/40 transition">
                <td className="py-3">
                  <div className="font-semibold text-slate-100">{u.full_name}</div>
                  {u.student_id && (
                    <div className="text-[10px] font-mono text-cyan-400">{u.student_id}</div>
                  )}
                </td>
                <td className="py-3 font-mono text-slate-400">{u.email}</td>
                <td className="py-3 text-slate-300">{u.campus_name || 'Tech City'}</td>
                <td className="py-3 text-slate-300">{u.department || 'Computer Science'}</td>
                <td className="py-3">
                  <Badge
                    variant={
                      u.role === 'ADMIN'
                        ? 'danger'
                        : u.role === 'CAMPUS_MANAGER'
                        ? 'warning'
                        : u.role === 'FACULTY_ADVISOR'
                        ? 'violet'
                        : u.role === 'STUDENT_COORDINATOR'
                        ? 'cyan'
                        : 'default'
                    }
                    size="sm"
                  >
                    {u.role}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    className="rounded-lg bg-surface-elevated border border-surface-border px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="STUDENT_COORDINATOR">STUDENT_COORDINATOR</option>
                    <option value="FACULTY_ADVISOR">FACULTY_ADVISOR</option>
                    <option value="CAMPUS_MANAGER">CAMPUS_MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
