'use client';

import React from 'react';
import { QRAttendanceHost } from '../../../components/shared/QRAttendanceHost';

export default function CoordinatorAttendancePage() {
  return (
    <div className="space-y-6">
      <QRAttendanceHost activityId="act-01-live" />
    </div>
  );
}
