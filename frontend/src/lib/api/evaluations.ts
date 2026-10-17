import { apiClient } from './client';
import { Evaluation, RubricCriterionScore } from './types';
import { submissionService } from './submissions';

export const evaluationService = {
  async evaluateSubmission(data: {
    submission_id: string;
    rubric_scores: RubricCriterionScore[];
    comments: string;
    status: 'DRAFT' | 'PUBLISHED';
    evaluator_role?: 'FACULTY_ADVISOR' | 'STUDENT_COORDINATOR';
  }): Promise<Evaluation> {
    if (!data.rubric_scores || data.rubric_scores.length === 0) {
      throw new Error('At least one rubric criterion score is required');
    }
    if (!data.comments || data.comments.trim().length < 5) {
      throw new Error('Constructive feedback comments required (minimum 5 characters)');
    }

    try {
      return await apiClient<Evaluation>('/evaluations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const totalScore = data.rubric_scores.reduce((sum, item) => sum + item.score, 0);
      const maxTotal = data.rubric_scores.reduce((sum, item) => sum + item.max_score, 0);

      const evaluation: Evaluation = {
        id: `eval-${Date.now()}`,
        submission_id: data.submission_id,
        evaluator_id: data.evaluator_role === 'STUDENT_COORDINATOR' ? 'usr-coord-01' : 'usr-adv-01',
        evaluator_name: data.evaluator_role === 'STUDENT_COORDINATOR' ? 'Rohan Sharma' : 'Dr. Radha Nair',
        evaluator_role: data.evaluator_role || 'FACULTY_ADVISOR',
        rubric_scores: data.rubric_scores,
        total_score: totalScore,
        max_total_score: maxTotal,
        comments: data.comments,
        status: data.status,
        evaluated_at: new Date().toISOString(),
      };

      // Update submission status in repository
      const sub = await submissionService.getSubmissionById(data.submission_id);
      if (sub) {
        sub.status = data.status === 'PUBLISHED' ? 'EVALUATED' : 'UNDER_REVIEW';
        sub.score = totalScore;
        sub.evaluation = evaluation;
      }

      return evaluation;
    }
  },
};
