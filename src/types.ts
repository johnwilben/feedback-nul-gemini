/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum FeedbackCategory {
  ADMISSIONS = 'Admissions',
  REGISTRAR = 'Registrar',
  TREASURY = 'Treasury',
  SDAO = 'SDAO',
  LRC = 'LRC',
  ITSO = 'ITSO',
  OTHERS = 'Others',
}

export enum FeedbackStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

export enum RatingLabel {
  OUTSTANDING = 'Outstanding',
  EXCELLENT = 'Excellent',
  VERY_SATISFACTORY = 'Very Satisfactory',
  SATISFACTORY = 'Satisfactory',
  FAIR = 'Fair',
  POOR = 'Poor',
  VERY_POOR = 'Very Poor',
}

export interface FeedbackRatings {
  responsiveness: number;
  courtesy: number;
  clarity: number;
  efficiency: number;
  accessibility: number;
  overall: number;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  category: FeedbackCategory;
  otherCategory?: string;
  ratings: FeedbackRatings;
  likedMost: string;
  improvements: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: number;
  status: FeedbackStatus;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'faculty' | 'admin';
}
