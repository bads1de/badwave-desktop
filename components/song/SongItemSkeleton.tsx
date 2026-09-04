import { Skeleton } from "@/components/ui/skeleton";

const SongItemSkeleton = () => {
  return (
    <div
      className="
        relative
        flex
        flex-col
        items-center
        justify-center
        rounded-xl
        overflow-hidden
        bg-neutral-900
        aspect-[9/16]
      "
    >
      <Skeleton className="w-full h-full absolute inset-0 bg-neutral-800" />

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent w-full">
        {/* Title */}
        <Skeleton className="h-4 w-3/4 mb-2 bg-neutral-700" />

        {/* Author */}
        <Skeleton className="h-3 w-1/2 mb-3 bg-neutral-700" />

        {/* Stats */}
        <div className="flex items-center justify-start mt-2 space-x-4">
          <Skeleton className="h-3 w-8 bg-neutral-700" />
          <Skeleton className="h-3 w-8 bg-neutral-700" />
        </div>
      </div>
    </div>
  );
};

export default SongItemSkeleton;
