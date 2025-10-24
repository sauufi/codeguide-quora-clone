"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, ThumbsUp, ThumbsDown, User } from "lucide-react";
import { VoteButtons } from "./vote-buttons";

interface QuestionCardProps {
  question: {
    id: string;
    title: string;
    content: string;
    author: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    createdAt: string;
    updatedAt: string;
    voteCount: number;
    upvotes: number;
    downvotes: number;
    answerCount: number;
    topics: string[];
    userVote?: "upvote" | "downvote" | null;
  };
  showContent?: boolean;
}

export function QuestionCard({ question, showContent = false }: QuestionCardProps) {
  const initials = question.author.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={question.author.image || ""} alt={question.author.name} />
              <AvatarFallback className="text-xs">
                {initials || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {question.author.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <Link href={`/questions/${question.id}`}>
            <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors line-clamp-2">
              {question.title}
            </h3>
          </Link>

          {showContent && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {question.content}
            </p>
          )}
        </div>

        {question.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {question.topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <VoteButtons
              itemId={question.id}
              itemType="question"
              initialVoteCount={question.voteCount}
              initialUpvotes={question.upvotes}
              initialDownvotes={question.downvotes}
              userVote={question.userVote}
              size="sm"
            />

            <Link href={`/questions/${question.id}#answers`}>
              <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{question.answerCount}</span>
                <span className="text-sm hidden sm:inline">
                  {question.answerCount === 1 ? "Answer" : "Answers"}
                </span>
              </Button>
            </Link>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link href={`/questions/${question.id}`}>
              View Question
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}