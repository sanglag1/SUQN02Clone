import prisma from '@/lib/prisma';
import { ActivityType } from '@prisma/client';

type NullableNumber = number | null | undefined;

export interface BaseEventInput {
  userId: string;
  activityType: ActivityType;
  feature: string;
  action: string; // 'started' | 'completed' | 'answered' | 'resumed' | 'retried' | 'evaluated'
  referenceId?: string;
  score?: NullableNumber;
  duration?: NullableNumber; // seconds
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  skillDeltas?: Record<string, number>;
}

export class TrackingEventService {
  static async recordEvent(event: BaseEventInput) {
    const timestamp = event.timestamp ?? new Date();

    const created = await prisma.userActivityEvent.create({
      data: {
        userId: event.userId,
        activityType: event.activityType,
        feature: event.feature,
        action: event.action,
        score: event.score ?? null,
        duration: event.duration ?? null,
        referenceId: event.referenceId ?? null,
        timestamp,
        metadata: (event.metadata ?? {}) as unknown as object,
        skillDeltas: (event.skillDeltas ?? {}) as unknown as object,
      }
    });

    await this.updateDailyStats({
      userId: event.userId,
      date: timestamp,
      score: event.score ?? null,
      duration: event.duration ?? 0,
      activityType: event.activityType,
      feature: event.feature,
    });

    if (event.skillDeltas && Object.keys(event.skillDeltas).length > 0) {
      await this.recordSkillSnapshots({
        userId: event.userId,
        skillDeltas: event.skillDeltas,
        source: event.activityType,
        referenceId: event.referenceId,
        createdAt: timestamp,
      });
    }

    return created;
  }

  static async trackQuizCompleted(input: {
    userId: string;
    quizId: string;
    field: string;
    topic: string;
    level: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeUsedSeconds: number; // seconds
    retryCount?: number;
    skillDeltas?: Record<string, number>;
  }) {
    return this.recordEvent({
      userId: input.userId,
      activityType: 'quiz',
      feature: 'secure_quiz',
      action: 'completed',
      referenceId: input.quizId,
      score: input.score,
      duration: input.timeUsedSeconds,
      metadata: {
        field: input.field,
        topic: input.topic,
        level: input.level,
        totalQuestions: input.totalQuestions,
        correctAnswers: input.correctAnswers,
        retryCount: input.retryCount ?? 0,
      },
      skillDeltas: input.skillDeltas,
    });
  }

  static async trackAssessmentCompleted(input: {
    userId: string;
    assessmentId: string;
    level: string;
    totalTimeSeconds: number;
    overallScore: number;
    jobRoleId?: string | null;
    history?: unknown;
    realTimeScores?: unknown;
    finalScores?: unknown;
    skillDeltas?: Record<string, number>;
  }) {
    return this.recordEvent({
      userId: input.userId,
      activityType: 'quiz', // keep consistent with scoring flows
      feature: 'assessment_test',
      action: 'completed',
      referenceId: input.assessmentId,
      score: input.overallScore,
      duration: input.totalTimeSeconds,
      metadata: {
        level: input.level,
        jobRoleId: input.jobRoleId ?? undefined,
        history: input.history,
        realTimeScores: input.realTimeScores,
        finalScores: input.finalScores,
      },
      skillDeltas: input.skillDeltas,
    });
  }

  static async trackAvatarInterviewCompleted(input: {
    userId: string;
    interviewId: string;
    durationSeconds: number;
    overallRating?: number;
    questionCount?: number;
    coveredTopics?: string[];
    evaluationBreakdown?: Record<string, number>;
    language?: string;
    jobRoleId?: string | null;
    skillDeltas?: Record<string, number>;
    progress?: number;
  }) {
    // Validate duration (should be in seconds)
    if (input.durationSeconds < 0) {
      console.warn(`Invalid duration: ${input.durationSeconds}s for interview ${input.interviewId} - duration cannot be negative`);
    } else if (input.durationSeconds > 3600) {
      console.warn(`Suspicious duration: ${input.durationSeconds}s (${Math.round(input.durationSeconds/60)}min) for interview ${input.interviewId} - very long interview`);
    } else if (input.durationSeconds < 30) {
      console.warn(`Very short duration: ${input.durationSeconds}s for interview ${input.interviewId} - might be incomplete`);
    }
    
    console.log(`📊 Tracking avatar interview completion: ${input.interviewId}, duration: ${input.durationSeconds}s, score: ${input.overallRating || 'N/A'}`);
    
    return this.recordEvent({
      userId: input.userId,
      activityType: 'interview',
      feature: 'avatar_interview',
      action: 'completed',
      referenceId: input.interviewId,
      score: input.overallRating,
      duration: input.durationSeconds,
      metadata: {
        questionCount: input.questionCount,
        coveredTopics: input.coveredTopics,
        evaluationBreakdown: input.evaluationBreakdown,
        language: input.language,
        jobRoleId: input.jobRoleId ?? undefined,
        progress: typeof input.progress === 'number' ? input.progress : undefined,
      },
      skillDeltas: input.skillDeltas,
    });
  }

  static async trackJdAnswered(input: {
    userId: string;
    jdQuestionSetId: string;
    questionIndex: number;
    timeSpentSeconds?: number;
    overallScore?: number;
    strengths?: string[];
    improvements?: string[];
    detailedScores?: Record<string, number>;
    feedback?: string;
    skillDeltas?: Record<string, number>;
  }) {
    return this.recordEvent({
      userId: input.userId,
      activityType: 'jd',
      feature: 'jd_qa',
      action: 'answered',
      referenceId: `${input.jdQuestionSetId}:${input.questionIndex}`,
      score: input.overallScore,
      duration: input.timeSpentSeconds,
      metadata: {
        strengths: input.strengths ?? [],
        improvements: input.improvements ?? [],
        detailedScores: input.detailedScores ?? {},
        feedback: input.feedback,
      },
      skillDeltas: input.skillDeltas,
    });
  }

  // Internals
  private static normalizeDateToUTC(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  static async updateDailyStats(input: {
    userId: string;
    date: Date;
    score: NullableNumber;
    duration: number; // seconds
    activityType: ActivityType;
    feature: string;
  }) {
    const day = this.normalizeDateToUTC(input.date);

    const existing = await prisma.userDailyStats.findUnique({
      where: { userId_date: { userId: input.userId, date: day } }
    });

    if (!existing) {
      await prisma.userDailyStats.create({
        data: {
          userId: input.userId,
          date: day,
          totalActivities: 1,
          totalDuration: Math.max(0, Math.round(input.duration ?? 0)),
          avgScore: input.score ?? null,
          activityTypeBreakdown: {
            [input.activityType]: 1,
            [input.feature]: 1,
          } as unknown as object,
          skillAverages: {},
        }
      });
      return;
    }

    const prevCount = existing.totalActivities ?? 0;
    const prevAvg = existing.avgScore ?? null;
    const nextCount = prevCount + 1;

    let nextAvg: number | null = prevAvg;
    if (typeof input.score === 'number') {
      if (typeof prevAvg === 'number') {
        nextAvg = (prevAvg * prevCount + input.score) / nextCount;
      } else {
        nextAvg = input.score;
      }
    }

    const prevBreakdown = (existing.activityTypeBreakdown as Record<string, number> | null) ?? {};
    const nextBreakdown = { ...prevBreakdown } as Record<string, number>;
    nextBreakdown[input.activityType] = (nextBreakdown[input.activityType] ?? 0) + 1;
    nextBreakdown[input.feature] = (nextBreakdown[input.feature] ?? 0) + 1;

    await prisma.userDailyStats.update({
      where: { userId_date: { userId: input.userId, date: day } },
      data: {
        totalActivities: nextCount,
        totalDuration: (existing.totalDuration ?? 0) + Math.max(0, Math.round(input.duration ?? 0)),
        avgScore: nextAvg,
        activityTypeBreakdown: nextBreakdown as unknown as object,
      }
    });
  }

  static async recordSkillSnapshots(input: {
    userId: string;
    skillDeltas: Record<string, number>;
    source?: ActivityType;
    referenceId?: string;
    createdAt?: Date;
  }) {
    const createdAt = input.createdAt ?? new Date();
    const entries = Object.entries(input.skillDeltas);
    if (entries.length === 0) return;

    await prisma.$transaction(
      entries.map(([skillName, score]) =>
        prisma.userSkillSnapshot.create({
          data: {
            userId: input.userId,
            skillName,
            score,
            source: input.source ?? null,
            referenceId: input.referenceId ?? null,
            createdAt,
          }
        })
      )
    );
  }
}

export default TrackingEventService;


