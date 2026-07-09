import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  reviewsCount?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ rating, reviewsCount }) => {
  return (
    <div className="flex items-center gap-1 text-[13px] text-muted-foreground select-none tabular-nums">
      {/* Monochrome star to conform to color limitations */}
      <Star className="size-3.5 fill-neutral-300 stroke-neutral-500 shrink-0" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      {reviewsCount !== undefined && reviewsCount > 0 && (
        <span className="text-muted-foreground/80">({reviewsCount})</span>
      )}
    </div>
  );
};
