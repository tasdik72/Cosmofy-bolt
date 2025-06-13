"use client";

import { useState, type FormEvent, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { spaceExplainer, type SpaceExplainerInput } from '@/ai/flows/space-explainer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Send, BrainCircuit, UserCircle, X, AlertTriangle, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

const formSchema = z.object({
  question: z.string().min(1, { message: "Question cannot be empty." }).max(2000, { message: "Question too long (max 2000 characters)." }),
});

type AskAIFormValues = z.infer<typeof formSchema>;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface GlobalAIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalAIChatWidget({ isOpen, onClose }: GlobalAIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<AskAIFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus textarea when widget opens and there are no messages or last message was AI
      if (messages.length === 0 || messages[messages.length -1]?.sender === 'ai') {
        textareaRef.current?.focus();
      }
    }
  }, [isOpen, messages]);

  async function onSubmit(values: AskAIFormValues) {
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: values.question,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    form.reset();
    
    requestAnimationFrame(() => {
        textareaRef.current?.focus();
    });

    try {
      const input: SpaceExplainerInput = { question: values.question };
      const result = await spaceExplainer(input);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: result.answer,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      console.error(e);
      const errorMessageText = e instanceof Error ? e.message : 'An error occurred. Please try again.';
      setError(errorMessageText);
      const errorAiMessage: Message = {
        id: `ai-error-${Date.now()}`,
        text: `Sorry, I encountered an error: ${errorMessageText}`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 right-4 sm:right-6 md:right-8 w-[calc(100%-2rem)] sm:w-[380px] h-[calc(100%-6rem)] sm:h-[550px] max-h-[70vh] z-50 shadow-2xl rounded-xl border border-border flex flex-col animate-fade-in bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">Cosmofy AI Assistant</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-5 w-5" />
          <span className="sr-only">Close chat</span>
        </Button>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] py-5 text-center text-muted-foreground opacity-70">
              <Bot className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p className="text-md font-medium">Hey there!</p>
              <p className="text-sm">How can I assist you today?</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2 animate-fade-in max-w-full text-sm",
                msg.sender === 'user' ? 'justify-end ml-auto' : 'justify-start mr-auto'
              )}
            >
              {msg.sender === 'ai' && <Bot className="h-6 w-6 text-primary self-start shrink-0 mt-1 rounded-full bg-primary/10 p-1 border" />}
              <div
                className={cn(
                  "max-w-[85%] p-2.5 rounded-lg shadow-md leading-relaxed",
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-background text-foreground rounded-bl-sm border',
                  msg.text.startsWith("Sorry, I encountered an error:") && msg.sender === 'ai' ? 'bg-destructive/20 border-destructive text-destructive-foreground' : ''
                )}
              >
                <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\\n/g, '<br />').replace(/\n/g, '<br />') }}></p>
                 <p className={cn(
                  "text-xs mt-1.5 opacity-80",
                  msg.sender === 'user' ? 'text-right' : 'text-left'
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender === 'user' && <UserCircle className="h-6 w-6 text-foreground self-start shrink-0 mt-1 rounded-full bg-muted p-0.5 border" />}
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length -1]?.sender === 'user' && (
            <div className="flex items-start gap-2 justify-start animate-fade-in">
              <Bot className="h-6 w-6 text-primary self-start shrink-0 mt-1 rounded-full bg-primary/10 p-1 border" />
              <div className="max-w-[80%] p-2.5 rounded-lg shadow-md bg-background text-foreground border">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {error && !isLoading && (
        <div className="mx-3 mb-1 p-2 border bg-destructive/10 text-destructive text-xs flex items-center gap-2 justify-center rounded-md">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <CardFooter className="p-3 border-t">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start gap-2">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Textarea
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        if (textareaRef) {
                          (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                        }
                      }}
                      placeholder="Type your message..."
                      className="min-h-[48px] max-h-[150px] resize-none text-sm rounded-lg shadow-sm bg-background focus-visible:ring-1 focus-visible:ring-primary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (form.formState.isValid && !isLoading) {
                            form.handleSubmit(onSubmit)();
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !form.formState.isValid} size="icon" className="shrink-0 h-[48px] w-[48px] p-0 rounded-lg shadow-sm">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
