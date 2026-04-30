import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const SpinLoading = () => (
  <div className="flex justify-center items-center h-32">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
  </div>
);

export const SkeletonCard = () => (
  <div className="animate-pulse mb-6 border rounded p-4 shadow">
    <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>

    <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>

    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
  </div>
);

export const SkeletonLib = () => (
  <div className="mb-6 border rounded p-4 shadow">
    <Skeleton height={20} width="30%" className="mb-2" />
    <Skeleton height={16} width="50%" className="mb-4" />
    <Skeleton height={16} width="80%" className="mb-2" />
    <Skeleton height={16} width="40%" className="mb-4" />
    <Skeleton height={16} width="70%" className="mb-2" />
    <Skeleton height={16} width="100%" />
  </div>
);