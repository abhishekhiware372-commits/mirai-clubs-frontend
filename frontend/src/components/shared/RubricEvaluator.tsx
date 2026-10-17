'use client';

import React, { useState } from 'react';
import { evaluationService } from '../../lib/api/evaluations';
import { RubricCriterionScore, Evaluation } from '../../lib/api/types';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { FileCheck2, Award, Send } from 'lucide-react';

export function RubricEvaluator({
  submissionId,
  studentName = 'Alex Chen',
  deliverableTitle = 'Rapid B2B SaaS Prototyping',
  onEvaluationComplete,
}: {
  submissionId: string;
  studentName?: string;
  deliverableTitle?: string;
  onEvaluationComplete?: (evaluation: Evaluation) => void;
}) {
  const { showToast } = useToast();

  const [criteria, setCriteria] = useState<RubricCriterionScore[]>([
    { criterion_name: 'Content', max_score: 40, score: 36, feedback: 'Well structured schema with realistic relationships.' },
    { criterion_name: 'Presentation', max_score: 30, score: 27, feedback: 'Concise architecture diagrams and clear explanation.' },
    { criterion_name: 'Participation', max_score: 30, score: 28, feedback: 'Active participation in Q&A critique.' },
  ]);

  const [comments, setComments] = useState<string>('Strong execution across all dimensions. Meets institutional standards for credit award.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const maxTotal = criteria.reduce((sum, c) => sum + c.max_score, 0);

  const handleScoreChange = (index: number, newScore: number) => {
    setCriteria((prev) => {
      const next = [...prev];
      const bounded = Math.max(0, Math.min(next[index].max_score, newScore));
      next[index] = { ...next[index], score: bounded };
      return next;
    });
  };

  const handleCriterionFeedbackChange = (index: number, text: string) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], feedback: text };
      return next;
    });
  };

  const handleSubmitEvaluation = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!comments.trim() || comments.trim().length < 5) {
      showToast('Please provide constructive overall comments (min 5 chars)', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const evaluation = await evaluationService.evaluateSubmission({
        submission_id: submissionId,
        rubric_scores: criteria,
        comments,
        status,
      });

      showToast(
        status === 'PUBLISHED'
          ? `Evaluation published successfully! Score: ${totalScore}/${maxTotal}`
          : 'Evaluation draft saved.',
        'success'
      );

      if (onEvaluationComplete) onEvaluationComplete(evaluation);
    } catch (err: any) {
      showToast(err.message || 'Evaluation submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Rubric Evaluation Engine
          </span>
          <h3 className="text-base font-bold text-slate-100 mt-0.5">
            Evaluating: {studentName}
          </h3>
          <p className="text-xs text-slate-400">{deliverableTitle}</p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-elevated border border-surface-border">
          <Award className="w-5 h-5 text-cyan-400" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Score</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              {totalScore} / {maxTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Rubric Criteria Rows */}
      <div className="space-y-4">
        {criteria.map((crit, idx) => (
          <div
            key={crit.criterion_name}
            className="p-4 rounded-xl bg-surface-elevated/50 border border-surface-border space-y-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200">{crit.criterion_name}</h4>
                <span className="text-[10px] text-slate-400">
                  Maximum weight: {crit.max_score} points
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={crit.max_score}
                  value={crit.score}
                  onChange={(e) => handleScoreChange(idx, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 rounded-lg bg-surface border border-surface-border text-center font-mono font-bold text-cyan-300 text-sm focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-400 font-mono">/ {crit.max_score}</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={crit.max_score}
              value={crit.score}
              onChange={(e) => handleScoreChange(idx, parseInt(e.target.value) || 0)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            {/* Criterion comment */}
            <input
              type="text"
              value={crit.feedback || ''}
              onChange={(e) => handleCriterionFeedbackChange(idx, e.target.value)}
              placeholder={`Specific feedback for ${crit.criterion_name}...`}
              className="w-full text-xs rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        ))}
      </div>

      {/* Overall Evaluator Feedback */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1.5">
          Overall Faculty / Coordinator Feedback *
        </label>
        <textarea
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Constructive recommendations, technical rigor review..."
          className="w-full rounded-xl bg-surface-elevated border border-surface-border p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSubmitEvaluation('DRAFT')}
          disabled={isSubmitting}
        >
          Save Draft
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSubmitEvaluation('PUBLISHED')}
          isLoading={isSubmitting}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Publish Official Score
        </Button>
      </div>
    </div>
  );
}
