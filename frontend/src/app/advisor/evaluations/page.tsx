'use client';

import React from 'react';
import { RubricEvaluator } from '../../../components/shared/RubricEvaluator';

export default function AdvisorEvaluationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Faculty Grading Interface
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          Rubric Evaluation Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Evaluate submitted student deliverables against standardized Content, Presentation, and Participation rubrics.
        </p>
      </div>

      <RubricEvaluator
        submissionId="sub-03-pending-eval"
        studentName="Priya Patel (MST-2026-EC204)"
        deliverableTitle="Club Day 07: Customer Discovery & Problem Validation Matrix"
      />
    </div>
  );
}
