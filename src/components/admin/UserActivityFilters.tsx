"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserActivityFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  skillFilter: string;
  onSkillFilterChange: (value: string) => void;
  goalStatusFilter: string;
  onGoalStatusFilterChange: (value: string) => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
}

export default function UserActivityFilters({
  search,
  onSearch,
  skillFilter,
  onSkillFilterChange,
  goalStatusFilter,
  onGoalStatusFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
}: UserActivityFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search box */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users by name, email, skills, or goals..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Skill filter */}
      <Select value={skillFilter} onValueChange={onSkillFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by skill" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Skills</SelectItem>
          <SelectItem value="JavaScript">JavaScript</SelectItem>
          <SelectItem value="Python">Python</SelectItem>
          <SelectItem value="React">React</SelectItem>
          <SelectItem value="Node.js">Node.js</SelectItem>
          <SelectItem value="Communication">Communication</SelectItem>
        </SelectContent>
      </Select>

      {/* Goal status filter */}
      <Select value={goalStatusFilter} onValueChange={onGoalStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by goal status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Goals</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort filter */}
      <Select
        value={`${sortBy}-${sortOrder}`}
        onValueChange={(value) => {
          const [field, order] = value.split("-");
          onSortChange(field, order);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lastActive-desc">Last Active (Recent)</SelectItem>
          <SelectItem value="lastActive-asc">Last Active (Oldest)</SelectItem>
          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="totalActivities-desc">Most Active</SelectItem>
          <SelectItem value="averageSkillScore-desc">Highest Score</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
