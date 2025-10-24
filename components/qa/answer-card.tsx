"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoteButtons } from "./vote-buttons";
import { MoreHorizontal, User, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AnswerCardProps {
  answer: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    authorId: string;
    createdAt: string;
    updatedAt: string;
    voteCount: number;
    upvotes: number;
    downvotes: number;
    userVote?: "upvote" | "downvote" | null;
  };
  showEditButton?: boolean;
}

export function AnswerCard({ answer, showEditButton = false }: AnswerCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // This would come from auth context in a real app
  const currentUserId = null; // Replace with actual user ID

  const isAuthor = currentUserId === answer.authorId;
  const initials = answer.author.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/answers/${answer.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete answer");
      }

      toast({
        title: "Answer deleted",
        description: "Your answer has been successfully deleted.",
      });

      // In a real app, you would remove the answer from the list or refresh the data
      window.location.reload();
    } catch (error) {
      console.error("Delete answer error:", error);
      toast({
        title: "Error",
        description: "Failed to delete answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={cn("w-full", isDeleting && "opacity-50")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={answer.author.image || ""} alt={answer.author.name} />
              <AvatarFallback className="text-xs">
                {initials || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {answer.author.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                {answer.updatedAt !== answer.createdAt && " (edited)"}
              </p>
            </div>
          </div>

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showEditButton && (
                  <DropdownMenuItem asChild>
                    <Link href={`/answers/${answer.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Answer</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this answer? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <VoteButtons
              itemId={answer.id}
              itemType="answer"
              initialVoteCount={answer.voteCount}
              initialUpvotes={answer.upvotes}
              initialDownvotes={answer.downvotes}
              userVote={answer.userVote}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {answer.content}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}