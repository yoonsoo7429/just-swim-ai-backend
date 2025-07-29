import {
  AchievementConfig,
  AchievementType,
  AchievementLevel,
} from '../entities/achievement-config.entity';

export const achievementConfigSeeds: Partial<AchievementConfig>[] = [
  // 첫 훈련
  {
    type: AchievementType.FIRST_TRAINING,
    level: AchievementLevel.BRONZE,
    title: '첫 번째 훈련',
    description: '첫 번째 수영 훈련을 완료했습니다!',
    icon: '🏊‍♂️',
    target: 1,
    sortOrder: 1,
  },

  // 거리 마일스톤
  {
    type: AchievementType.DISTANCE_MILESTONE,
    level: AchievementLevel.BRONZE,
    title: '수영 초보자',
    description: '총 1km를 수영했습니다!',
    icon: '🌊',
    target: 1000,
    sortOrder: 2,
  },
  {
    type: AchievementType.DISTANCE_MILESTONE,
    level: AchievementLevel.SILVER,
    title: '수영 애호가',
    description: '총 5km를 수영했습니다!',
    icon: '🏊‍♀️',
    target: 5000,
    sortOrder: 3,
  },
  {
    type: AchievementType.DISTANCE_MILESTONE,
    level: AchievementLevel.GOLD,
    title: '수영 마스터',
    description: '총 10km를 수영했습니다!',
    icon: '🏆',
    target: 10000,
    sortOrder: 4,
  },
  {
    type: AchievementType.DISTANCE_MILESTONE,
    level: AchievementLevel.PLATINUM,
    title: '수영 전설',
    description: '총 50km를 수영했습니다!',
    icon: '👑',
    target: 50000,
    sortOrder: 5,
  },

  // 시간 마일스톤
  {
    type: AchievementType.TIME_MILESTONE,
    level: AchievementLevel.BRONZE,
    title: '시간 투자자',
    description: '총 1시간을 수영했습니다!',
    icon: '⏰',
    target: 60,
    sortOrder: 6,
  },
  {
    type: AchievementType.TIME_MILESTONE,
    level: AchievementLevel.SILVER,
    title: '시간 관리자',
    description: '총 5시간을 수영했습니다!',
    icon: '⏱️',
    target: 300,
    sortOrder: 7,
  },
  {
    type: AchievementType.TIME_MILESTONE,
    level: AchievementLevel.GOLD,
    title: '시간 마스터',
    description: '총 10시간을 수영했습니다!',
    icon: '⌛',
    target: 600,
    sortOrder: 8,
  },

  // 연속 훈련
  {
    type: AchievementType.STREAK_WEEK,
    level: AchievementLevel.BRONZE,
    title: '일주일 연속',
    description: '일주일 연속으로 수영했습니다!',
    icon: '📅',
    target: 7,
    sortOrder: 9,
  },
  {
    type: AchievementType.STREAK_MONTH,
    level: AchievementLevel.SILVER,
    title: '한 달 연속',
    description: '한 달 연속으로 수영했습니다!',
    icon: '📆',
    target: 30,
    sortOrder: 10,
  },

  // 영법 마스터
  {
    type: AchievementType.STYLE_MASTER,
    level: AchievementLevel.BRONZE,
    title: '자유형 마스터',
    description: '자유형으로 10회 훈련했습니다!',
    icon: '🏊‍♂️',
    target: 10,
    conditions: { style: 'freestyle' },
    sortOrder: 11,
  },
  {
    type: AchievementType.STYLE_MASTER,
    level: AchievementLevel.SILVER,
    title: '영법 다재다능',
    description: '모든 영법으로 훈련했습니다!',
    icon: '🎯',
    target: 4,
    conditions: {
      styles: ['freestyle', 'backstroke', 'breaststroke', 'butterfly'],
    },
    sortOrder: 12,
  },

  // 속도 개선
  {
    type: AchievementType.SPEED_IMPROVEMENT,
    level: AchievementLevel.BRONZE,
    title: '속도 개선',
    description: '이전 기록 대비 10% 속도 향상!',
    icon: '⚡',
    target: 10,
    sortOrder: 13,
  },

  // 페이스 개선 (새로운 성취)
  {
    type: AchievementType.PACE_IMPROVEMENT,
    level: AchievementLevel.BRONZE,
    title: '페이스 개선',
    description: '100m 페이스를 5분 이하로 달성!',
    icon: '🏃‍♂️',
    target: 5,
    conditions: { pace: 5.0 }, // 5분/100m
    sortOrder: 14,
  },
  {
    type: AchievementType.PACE_IMPROVEMENT,
    level: AchievementLevel.SILVER,
    title: '빠른 수영',
    description: '100m 페이스를 3분 이하로 달성!',
    icon: '🏃‍♀️',
    target: 3,
    conditions: { pace: 3.0 }, // 3분/100m
    sortOrder: 15,
  },

  // 복합 훈련 (새로운 성취)
  {
    type: AchievementType.COMPLEX_TRAINING,
    level: AchievementLevel.BRONZE,
    title: '복합 훈련',
    description: '한 훈련에서 3가지 이상의 영법을 연습!',
    icon: '🔄',
    target: 3,
    conditions: { minStyles: 3 },
    sortOrder: 16,
  },
  {
    type: AchievementType.COMPLEX_TRAINING,
    level: AchievementLevel.SILVER,
    title: '올라운드 수영',
    description: '한 훈련에서 모든 영법을 연습!',
    icon: '🔄',
    target: 4,
    conditions: { minStyles: 4 },
    sortOrder: 17,
  },

  // 일관성
  {
    type: AchievementType.CONSISTENCY,
    level: AchievementLevel.BRONZE,
    title: '꾸준함',
    description: '한 달 동안 주 3회 이상 수영!',
    icon: '📈',
    target: 12,
    sortOrder: 18,
  },

  // 목표 달성
  {
    type: AchievementType.GOAL_ACHIEVER,
    level: AchievementLevel.BRONZE,
    title: '목표 달성자',
    description: '첫 번째 목표를 달성했습니다!',
    icon: '🎯',
    target: 1,
    sortOrder: 19,
  },
];
