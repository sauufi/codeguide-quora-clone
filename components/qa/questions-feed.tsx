"use client";

import { useState, useEffect } from "react";
import { QuestionCard } from "./question-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Question {
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
}

interface QuestionsFeedProps {
  initialQuestions?: Question[];
  topic?: string;
}

export function QuestionsFeed({ initialQuestions = [], topic }: QuestionsFeedProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"recent" | "most_voted">("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchQuestions = async (pageNum: number = 1, reset: boolean = false) => {
    if (loading) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
        sort: sort,
      });

      if (topic) {
        params.append("topic", topic);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/questions?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch questions");
      }

      const newQuestions = result.data;

      if (reset) {
        setQuestions(newQuestions);
      } else {
        setQuestions((prev) => [...prev, ...newQuestions]);
      }

      setHasMore(result.pagination ? pageNum < result.pagination.totalPages : false);
      setPage(pageNum);
    } catch (error) {
      console.error("Fetch questions error:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchQuestions(page + 1);
    }
  };

  const handleSortChange = (newSort: "recent" | "most_voted") => {
    setSort(newSort);
    setPage(1);
    setHasMore(true);
    fetchQuestions(1, true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    setHasMore(true);
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchQuestions(1, true);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  useEffect(() => {
    if (initialQuestions.length === 0) {
      fetchQuestions(1, true);
    }
  }, []);

  if (questions.length === 0 && !loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">🤔</div>
            <div>
              <h3 className="text-lg font-semibold">No questions found</h3>
              <p className="text-muted-foreground mt-2">
                {topic
                  ? `No questions found in the "${topic}" topic.`
                  : "Be the first to ask a question!"}
              </p>
            </div>
            <Button asChild>
              <Link href="/ask">
                <Plus className="h-4 w-4 mr-2" />
                Ask a Question
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="most_voted">Most Voted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-full mt-3" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardFooter>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center">
            <Button onClick={loadMore} variant="outline">
              Load More Questions
            </Button>
          </div>
        )}

        {!hasMore && questions.length > 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            You've reached the end of the questions list.
          </div>
        )}
      </div>
    </div>
  );
}