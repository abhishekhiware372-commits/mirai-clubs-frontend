'use client';

import React from 'react';
import { RubricEvaluator } from '../../../components/shared/RubricEvaluator';

export default function CoordinatorEvaluationsPage() {
  return (
    <div className="space-y-6">
      <RubricEvaluator
        submissionId="sub-03-pending-eval"
        studentName="Priya Patel (MST-2026-EC204)"
        deliverableTitle="Customer Discovery & Problem Validation Matrix"
      />
    </div>
  );
}
