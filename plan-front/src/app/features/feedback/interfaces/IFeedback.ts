// «طلب المرئيات» — a request for views on part of a plan, and its answers.
// The subject strings are the same vocabulary the notification list uses, so a
// request can be linked back to the screen it is about.

export type FeedbackSubject =
  | 'plans'
  | 'analysis-stage'
  | 'direction-stage'
  | 'objectives'
  | 'initiatives'
  | 'projects'
  | 'reports'
  | 'communication';

export interface IFeedbackRecipient {
  unitId?: number;
  unitName?: string;
  userId?: number;
  userName?: string;
  hasResponded: boolean;
}

export interface IFeedbackResponse {
  id: number;
  message: string;
  respondedByUserId: number;
  respondedByName?: string;
  unitName?: string;
  createdAt?: string;
}

export interface IFeedbackRequest {
  id: number;
  message: string;
  planId: number;
  planName?: string;
  subject: FeedbackSubject;
  subjectId?: number;
  subjectName?: string | null;
  dueDate?: string;
  isClosed: boolean;
  createdAt?: string;
  requestedByUserId: number;
  requestedByName?: string;
  isMine: boolean;
  responseCount: number;
  recipients: IFeedbackRecipient[];
  responses: IFeedbackResponse[];
}

// Options for the composer's pickers.
export interface IPlanOption {
  id: number;
  name: string;
  unitName?: string;
}

export interface ISubjectOption {
  id: number;
  name: string;
}

export interface ICreateFeedbackRequest {
  planId: number;
  message: string;
  subject: number;
  subjectId?: number | null;
  dueDate?: string | null;
  unitIds: number[];
  userIds: number[];
}

// Mirrors FormNameToReturnToFront on the server. The numbers are what the API
// expects when creating a request, and they are pinned there too.
export const FEEDBACK_SUBJECTS: { value: number; slug: FeedbackSubject; label: string }[] = [
  { value: 0, slug: 'plans', label: 'الخطة الاستراتيجية' },
  { value: 1, slug: 'analysis-stage', label: 'التحليل' },
  { value: 2, slug: 'direction-stage', label: 'التوجه الاستراتيجي' },
  { value: 3, slug: 'objectives', label: 'الأهداف' },
  { value: 4, slug: 'initiatives', label: 'المبادرات' },
  { value: 5, slug: 'projects', label: 'المشاريع' },
  { value: 6, slug: 'reports', label: 'التقارير' },
  { value: 9, slug: 'communication', label: 'خطة التواصل والمجازفات' },
];

export function feedbackSubjectLabel(slug: string | undefined): string {
  return FEEDBACK_SUBJECTS.find((s) => s.slug === slug)?.label ?? '';
}
