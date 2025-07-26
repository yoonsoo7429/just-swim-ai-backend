export class RecommendRequestDto {
  distance: number;
  style: string;
  duration: number;
  frequency_per_week: number;
  goal: string;
}

export class RecommendResponseDto {
  userId: number;
  swim_training: string;
  dryland_training: string;
  input: RecommendRequestDto;
}
