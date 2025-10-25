"use client";

import { useState } from "react";
import { useWords, useCreateWords, useDeleteWord } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function WordsPage() {
  return (
    <AuthGuard>
      <WordsPageContent />
    </AuthGuard>
  );
}

function WordsPageContent() {
  const [isAdding, setIsAdding] = useState(false);
  const [newCivilian, setNewCivilian] = useState("");
  const [newUndercover, setNewUndercover] = useState("");
  const [showWords, setShowWords] = useState(false);

  const { data: words, isLoading, error } = useWords();
  const createWordsMutation = useCreateWords();
  const deleteWordMutation = useDeleteWord();

  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCivilian.trim() || !newUndercover.trim()) return;

    try {
      await createWordsMutation.mutateAsync({
        words: [{
          civilianWord: newCivilian.trim(),
          undercoverWord: newUndercover.trim(),
        }]
      });
      setNewCivilian("");
      setNewUndercover("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to create word pair:", error);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm("Are you sure you want to delete this word pair?")) return;

    try {
      await deleteWordMutation.mutateAsync(wordId);
    } catch (error) {
      console.error("Failed to delete word pair:", error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load words. Please try again.</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Groups
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Word Management</h1>
              <p className="text-muted-foreground">
                Manage word pairs for the Undercover game
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWords(!showWords)}
            >
              {showWords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showWords ? "Hide" : "Show"} Words
            </Button>
            
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Word Pair
              </Button>
            )}
          </div>
        </div>

        {/* Add Word Form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Word Pair</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWord} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Civilian Word</label>
                    <Input
                      type="text"
                      placeholder="e.g., Apple"
                      value={newCivilian}
                      onChange={(e) => setNewCivilian(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Undercover Word</label>
                    <Input
                      type="text"
                      placeholder="e.g., Orange"
                      value={newUndercover}
                      onChange={(e) => setNewUndercover(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createWordsMutation.isPending || !newCivilian.trim() || !newUndercover.trim()}
                  >
                    {createWordsMutation.isPending ? "Adding..." : "Add Word Pair"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAdding(false);
                      setNewCivilian("");
                      setNewUndercover("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Words List */}
        <Card>
          <CardHeader>
            <CardTitle>Word Pairs ({words?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading word pairs...</p>
              </div>
            )}

            <div className="space-y-2">
              {words?.map((word) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    {showWords ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Civilian:</span>
                          <p className="font-medium">{word.civilianWord}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Undercover:</span>
                          <p className="font-medium">{word.undercoverWord}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Word pair (click "Show Words" to reveal)
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {new Date(word.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWord(word.id)}
                    disabled={deleteWordMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {words && words.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  No word pairs available. Add your first word pair to get started!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
