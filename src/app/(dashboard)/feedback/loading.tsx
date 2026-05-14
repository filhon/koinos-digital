import { FeedbackListSkeleton } from "./feedback-skeleton";

export default function FeedbackLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="h-16" />
      <FeedbackListSkeleton />
    </div>
  );
}
