"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateQuestionInput, UpdateQuestionInput } from "@/lib/validations";

// This would come from an API in a real app
const availableTopics = [
  { id: "topic-1", name: "Technology", slug: "technology" },
  { id: "topic-2", name: "Science", slug: "science" },
  { id: "topic-3", name: "Business", slug: "business" },
  { id: "topic-4", name: "Arts & Culture", slug: "arts-culture" },
  { id: "topic-5", name: "Health", slug: "health" },
  { id: "topic-6", name: "Education", slug: "education" },
  { id: "topic-7", name: "Sports", slug: "sports" },
  { id: "topic-8", name: "Entertainment", slug: "entertainment" },
];

const questionSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(300, "Title cannot exceed 300 characters"),
  content: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content cannot exceed 5000 characters"),
  topicIds: z.array(z.string()).optional().default([]),
});

interface QuestionFormProps {
  initialData?: {
    title: string;
    content: string;
    topicIds: string[];
  };
  questionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function QuestionForm({
  initialData,
  questionId,
  onSuccess,
  onCancel
}: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialData?.topicIds || []
  );
  const { toast } = useToast();

  const form = useForm<CreateQuestionInput | UpdateQuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      topicIds: initialData?.topicIds || [],
    },
  });

  const watchedContent = form.watch("content");

  useEffect(() => {
    form.setValue("topicIds", selectedTopics);
  }, [selectedTopics, form]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const onSubmit = async (data: CreateQuestionInput | UpdateQuestionInput) => {
    setIsSubmitting(true);

    try {
      const url = questionId
        ? `/api/questions/${questionId}`
        : "/api/questions";

      const method = questionId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          topicIds: selectedTopics,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please sign in to post a question",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to save question",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: questionId ? "Question updated" : "Question posted",
        description: questionId
          ? "Your question has been successfully updated."
          : "Your question has been successfully posted.",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to the question page or home
        if (questionId) {
          window.location.href = `/questions/${questionId}`;
        } else {
          window.location.href = `/questions/${result.data.id}`;
        }
      }
    } catch (error) {
      console.error("Save question error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {questionId ? "Edit Question" : "Ask a Question"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What's your question? Be specific..."
                      className="text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Include all the information someone would need to answer your question..."
                      className="min-h-[200px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      {watchedContent.length}/5000 characters
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Topics</FormLabel>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => (
                  <Badge
                    key={topic.id}
                    variant={selectedTopics.includes(topic.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleTopic(topic.id)}
                  >
                    {topic.name}
                    {selectedTopics.includes(topic.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Select up to 5 topics that best describe your question
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {questionId ? "Update Question" : "Post Question"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}