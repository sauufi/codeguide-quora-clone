"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  itemId: string;
  itemType: "question" | "answer";
  initialVoteCount: number;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote?: "upvote" | "downvote" | null;
  size?: "sm" | "default";
  showNumbers?: boolean;
}

export function VoteButtons({
  itemId,
  itemType,
  initialVoteCount,
  initialUpvotes,
  initialDownvotes,
  userVote = null,
  size = "default",
  showNumbers = true,
}: VoteButtonsProps) {
  const [voteState, setVoteState] = useState<"upvote" | "downvote" | null>(userVote);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          itemType,
          voteType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please sign in to vote",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to vote",
            variant: "destructive",
          });
        }
        return;
      }

      // Update local state optimistically
      const newUserVote = result.data.userVoteType;
      const newVoteCounts = result.data.voteCounts;

      setVoteState(newUserVote);
      setVoteCount(newVoteCounts.total);
      setUpvotes(newVoteCounts.upvotes);
      setDownvotes(newVoteCounts.downvotes);

      toast({
        title: result.data.userVoteType ? "Vote recorded" : "Vote removed",
        description: result.data.userVoteType
          ? `Your ${result.data.userVoteType} has been recorded`
          : "Your vote has been removed",
      });
    } catch (error) {
      console.error("Vote error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = size === "sm" ? "h-7 w-7 p-0" : "h-8 w-8 p-0";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={voteState === "upvote" ? "default" : "ghost"}
        size={size}
        className={cn(
          buttonSize,
          voteState === "upvote" && "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300"
        )}
        onClick={() => handleVote("upvote")}
        disabled={isLoading}
      >
        <ThumbsUp className={iconSize} />
      </Button>

      {showNumbers && (
        <span className={cn(
          "text-sm font-medium min-w-[2ch] text-center",
          voteCount > 0 ? "text-green-600" : voteCount < 0 ? "text-red-600" : "text-muted-foreground"
        )}>
          {voteCount > 0 && "+"}{voteCount}
        </span>
      )}

      <Button
        variant={voteState === "downvote" ? "default" : "ghost"}
        size={size}
        className={cn(
          buttonSize,
          voteState === "downvote" && "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300"
        )}
        onClick={() => handleVote("downvote")}
        disabled={isLoading}
      >
        <ThumbsDown className={iconSize} />
      </Button>
    </div>
  );
}