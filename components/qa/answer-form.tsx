"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateAnswerInput } from "@/lib/validations";

const answerSchema = z.object({
  content: z.string()
    .min(10, "Answer must be at least 10 characters")
    .max(5000, "Answer cannot exceed 5000 characters"),
});

interface AnswerFormProps {
  questionId: string;
  onSuccess?: () => void;
}

export function AnswerForm({ questionId, onSuccess }: AnswerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateAnswerInput>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CreateAnswerInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please sign in to post an answer",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to post answer",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Answer posted",
        description: "Your answer has been successfully posted.",
      });

      // Reset form
      form.reset();

      // Call onSuccess callback or refresh the page
      if (onSuccess) {
        onSuccess();
      } else {
        // Refresh the page to show the new answer
        window.location.reload();
      }
    } catch (error) {
      console.error("Post answer error:", error);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Write your answer here. Be detailed and helpful..."
                  className="min-h-[120px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {form.watch("content").length}/5000 characters
          </p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Answer
          </Button>
        </div>
      </form>
    </Form>
  );
}