// Help suggestions service for AI chatbot
// Provides contextual help and command suggestions based on user context

interface HelpSuggestion {
  id: string;
  title: string;
  description: string;
  examples: string[];
  category: 'basic' | 'intermediate' | 'advanced' | 'troubleshooting';
  relevanceScore: number; // 0-1, higher is more relevant
  action?: string; // Optional action to take when selected
}

interface UserContext {
  userId?: number;
  sessionId?: string;
  conversationHistory?: string[];
  currentIntent?: string;
  lastAction?: string;
  accountType?: 'new' | 'returning' | 'power';
  lastInteraction?: Date;
}

class HelpSuggester {
  private defaultSuggestions: HelpSuggestion[] = [
    {
      id: 'create-task',
      title: 'Create a Task',
      description: 'Add a new task to your list',
      examples: ['Add a task to buy groceries', 'Create a task to call mom tomorrow', 'Add a task to finish report by Friday'],
      category: 'basic',
      relevanceScore: 1.0
    },
    {
      id: 'list-tasks',
      title: 'View Your Tasks',
      description: 'See all your current tasks',
      examples: ['Show me my tasks', 'What do I have to do?', 'List my todos'],
      category: 'basic',
      relevanceScore: 1.0
    },
    {
      id: 'complete-task',
      title: 'Complete a Task',
      description: 'Mark a task as completed',
      examples: ['Mark task #1 as done', 'Complete the grocery task', 'Finish the shopping'],
      category: 'basic',
      relevanceScore: 1.0
    },
    {
      id: 'update-task',
      title: 'Update a Task',
      description: 'Modify an existing task',
      examples: ['Change task #1 to call dad', 'Update the deadline for task #2', 'Edit the title of the meeting task'],
      category: 'intermediate',
      relevanceScore: 0.8
    },
    {
      id: 'delete-task',
      title: 'Delete a Task',
      description: 'Remove a task from your list',
      examples: ['Delete task #3', 'Remove the appointment task', 'Cancel the meeting task'],
      category: 'intermediate',
      relevanceScore: 0.7
    },
    {
      id: 'set-due-date',
      title: 'Set Due Dates',
      description: 'Add deadlines to your tasks',
      examples: ['Add a task to buy milk tomorrow', 'Create a task to call boss by Friday 3pm', 'Schedule team meeting for next Monday'],
      category: 'intermediate',
      relevanceScore: 0.8
    },
    {
      id: 'set-priority',
      title: 'Set Priority Levels',
      description: 'Mark tasks as high, medium, or low priority',
      examples: ['Create a high priority task to finish project', 'Add a low priority task to organize desk'],
      category: 'advanced',
      relevanceScore: 0.6
    },
    {
      id: 'filter-tasks',
      title: 'Filter Tasks',
      description: 'View specific subsets of your tasks',
      examples: ['Show my completed tasks', 'List urgent tasks', 'Show tasks due today'],
      category: 'advanced',
      relevanceScore: 0.7
    }
  ];

  /**
   * Get contextual help suggestions based on user context
   * @param userContext - Information about the user and their session
   * @returns Array of relevant help suggestions
   */
  getSuggestions(userContext: UserContext): HelpSuggestion[] {
    // Start with default suggestions
    let suggestions = [...this.defaultSuggestions];

    // Adjust relevance based on user context
    suggestions = suggestions.map(suggestion => {
      let relevanceAdjustment = 0;

      // Adjust for new users
      if (userContext.accountType === 'new') {
        if (suggestion.category === 'basic') {
          relevanceAdjustment += 0.2;
        } else if (suggestion.category === 'advanced') {
          relevanceAdjustment -= 0.2;
        }
      }

      // Adjust based on last action
      if (userContext.lastAction) {
        if (suggestion.id.includes(userContext.lastAction)) {
          relevanceAdjustment += 0.3;
        }
      }

      // Adjust based on current intent
      if (userContext.currentIntent) {
        if (suggestion.id.includes(userContext.currentIntent)) {
          relevanceAdjustment += 0.4;
        }
      }

      // Adjust based on conversation history
      if (userContext.conversationHistory && userContext.conversationHistory.length > 0) {
        const recentMessage = userContext.conversationHistory[userContext.conversationHistory.length - 1];
        if (recentMessage.toLowerCase().includes('help') || recentMessage.toLowerCase().includes('how')) {
          // Increase relevance for all suggestions when user asks for help
          relevanceAdjustment += 0.1;
        }
      }

      // Calculate final relevance score
      const finalScore = Math.max(0, Math.min(1, suggestion.relevanceScore + relevanceAdjustment));

      return {
        ...suggestion,
        relevanceScore: finalScore
      };
    });

    // Sort by relevance score (highest first)
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return suggestions;
  }

  /**
   * Get suggestions based on a specific query
   * @param query - The user's query or request
   * @param userContext - Information about the user
   * @returns Array of relevant help suggestions
   */
  getSuggestionsForQuery(query: string, userContext: UserContext): HelpSuggestion[] {
    const lowerQuery = query.toLowerCase();

    // Find suggestions that match the query
    let matchingSuggestions = this.defaultSuggestions.filter(suggestion => {
      // Check title, description, and examples
      return (
        suggestion.title.toLowerCase().includes(lowerQuery) ||
        suggestion.description.toLowerCase().includes(lowerQuery) ||
        suggestion.examples.some(example => example.toLowerCase().includes(lowerQuery))
      );
    });

    // If no direct matches, find related suggestions
    if (matchingSuggestions.length === 0) {
      matchingSuggestions = this.getRelatedSuggestions(lowerQuery, userContext);
    }

    // Calculate relevance scores for matching suggestions
    matchingSuggestions = matchingSuggestions.map(suggestion => {
      let relevanceScore = 0;

      // Boost score if query matches title
      if (suggestion.title.toLowerCase().includes(lowerQuery)) {
        relevanceScore += 0.4;
      }

      // Boost score if query matches description
      if (suggestion.description.toLowerCase().includes(lowerQuery)) {
        relevanceScore += 0.3;
      }

      // Boost score for each matching example
      const matchingExamples = suggestion.examples.filter(example =>
        example.toLowerCase().includes(lowerQuery)
      ).length;
      relevanceScore += matchingExamples * 0.1;

      // Apply user context adjustments
      if (userContext.accountType === 'new' && suggestion.category === 'basic') {
        relevanceScore += 0.2;
      }

      return {
        ...suggestion,
        relevanceScore: Math.min(1, relevanceScore)
      };
    });

    // Sort by relevance
    matchingSuggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return matchingSuggestions;
  }

  /**
   * Get related suggestions based on query analysis
   * @param query - The user's query
   * @param userContext - Information about the user
   * @returns Array of related help suggestions
   */
  private getRelatedSuggestions(query: string, userContext: UserContext): HelpSuggestion[] {
    const lowerQuery = query.toLowerCase();
    const relatedSuggestions: HelpSuggestion[] = [];

    // Map common query patterns to relevant suggestions
    const patternMappings: { pattern: RegExp; suggestionIds: string[] }[] = [
      { pattern: /\b(add|create|make|new|buy|get|order)\b/, suggestionIds: ['create-task'] },
      { pattern: /\b(show|list|display|see|view|get|fetch)\b/, suggestionIds: ['list-tasks'] },
      { pattern: /\b(complete|done|finish|marked|checked)\b/, suggestionIds: ['complete-task'] },
      { pattern: /\b(change|update|modify|edit|adjust)\b/, suggestionIds: ['update-task'] },
      { pattern: /\b(remove|delete|cancel|eliminate)\b/, suggestionIds: ['delete-task'] },
      { pattern: /\b(help|assist|support|command|instruction)\b/, suggestionIds: ['create-task', 'list-tasks', 'complete-task'] },
      { pattern: /\b(priority|urgent|important|high|low)\b/, suggestionIds: ['set-priority'] },
      { pattern: /\b(filter|sort|category|type)\b/, suggestionIds: ['filter-tasks'] },
      { pattern: /\b(when|due|deadline|date|time)\b/, suggestionIds: ['set-due-date'] }
    ];

    // Find matching patterns
    for (const mapping of patternMappings) {
      if (mapping.pattern.test(lowerQuery)) {
        for (const suggestionId of mapping.suggestionIds) {
          const suggestion = this.defaultSuggestions.find(s => s.id === suggestionId);
          if (suggestion && !relatedSuggestions.some(rs => rs.id === suggestionId)) {
            relatedSuggestions.push(suggestion);
          }
        }
      }
    }

    // If still no suggestions, return basic ones for new users or all for others
    if (relatedSuggestions.length === 0) {
      if (userContext.accountType === 'new') {
        return this.defaultSuggestions.filter(s => s.category === 'basic');
      } else {
        return this.defaultSuggestions.slice(0, 5); // Return top 5
      }
    }

    return relatedSuggestions;
  }

  /**
   * Get quick action suggestions for the current context
   * @param userContext - Information about the user
   * @returns Array of quick action suggestions
   */
  getQuickActions(userContext: UserContext): HelpSuggestion[] {
    const quickActions: HelpSuggestion[] = [];

    // Add contextually relevant quick actions
    if (!userContext.conversationHistory || userContext.conversationHistory.length === 0) {
      // If it's a new conversation, suggest basic actions
      quickActions.push(
        ...this.defaultSuggestions
          .filter(s => s.category === 'basic')
          .slice(0, 3)
      );
    } else {
      // If there's history, suggest actions based on common next steps
      const lastMessage = userContext.conversationHistory[userContext.conversationHistory.length - 1];
      const lastLower = lastMessage.toLowerCase();

      if (lastLower.includes('add') || lastLower.includes('create')) {
        quickActions.push(
          this.defaultSuggestions.find(s => s.id === 'list-tasks')!,
          this.defaultSuggestions.find(s => s.id === 'complete-task')!
        );
      } else if (lastLower.includes('list') || lastLower.includes('show')) {
        quickActions.push(
          this.defaultSuggestions.find(s => s.id === 'create-task')!,
          this.defaultSuggestions.find(s => s.id === 'complete-task')!
        );
      } else {
        // Default quick actions
        quickActions.push(
          this.defaultSuggestions.find(s => s.id === 'create-task')!,
          this.defaultSuggestions.find(s => s.id === 'list-tasks')!,
          this.defaultSuggestions.find(s => s.id === 'complete-task')!
        );
      }
    }

    return quickActions;
  }

  /**
   * Get onboarding suggestions for new users
   * @returns Array of onboarding help suggestions
   */
  getOnboardingSuggestions(): HelpSuggestion[] {
    return this.defaultSuggestions
      .filter(s => s.category === 'basic')
      .map(s => ({
        ...s,
        relevanceScore: 1.0
      }));
  }

  /**
   * Get troubleshooting suggestions
   * @returns Array of troubleshooting help suggestions
   */
  getTroubleshootingSuggestions(): HelpSuggestion[] {
    const troubleshootingSuggestions: HelpSuggestion[] = [
      {
        id: 'command-not-working',
        title: 'Command Not Working',
        description: 'If a command isn\'t working as expected',
        examples: ['I tried to add a task but nothing happened', 'My command was not recognized'],
        category: 'troubleshooting',
        relevanceScore: 1.0
      },
      {
        id: 'wrong-task-modified',
        title: 'Wrong Task Affected',
        description: 'If the wrong task was modified or completed',
        examples: ['I meant to complete task #2 but it completed task #1', 'It updated the wrong task'],
        category: 'troubleshooting',
        relevanceScore: 1.0
      },
      {
        id: 'forgot-task-number',
        title: 'Forgot Task Number',
        description: 'How to find task numbers when you don\'t remember them',
        examples: ['I don\'t know the task number', 'How do I find a specific task?'],
        category: 'troubleshooting',
        relevanceScore: 1.0
      }
    ];

    return troubleshootingSuggestions;
  }

  /**
   * Get personalized suggestions based on user behavior
   * @param userContext - Information about the user
   * @returns Array of personalized help suggestions
   */
  getPersonalizedSuggestions(userContext: UserContext): HelpSuggestion[] {
    const suggestions = this.getSuggestions(userContext);

    // For power users, emphasize advanced features
    if (userContext.accountType === 'power') {
      return suggestions
        .filter(s => s.category !== 'basic' || s.relevanceScore > 0.5)
        .slice(0, 5);
    }

    // For returning users, balance basic and intermediate
    if (userContext.accountType === 'returning') {
      return suggestions
        .filter(s => s.category !== 'advanced' || s.relevanceScore > 0.7)
        .slice(0, 6);
    }

    // For new users, emphasize basic features
    return suggestions
      .filter(s => s.category === 'basic' || s.relevanceScore > 0.8)
      .slice(0, 4);
  }

  /**
   * Format suggestions for UI display
   * @param suggestions - Array of help suggestions
   * @returns Formatted suggestions for UI
   */
  formatSuggestionsForUI(suggestions: HelpSuggestion[]) {
    return suggestions.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      examples: suggestion.examples.slice(0, 2), // Limit to 2 examples for UI
      category: suggestion.category,
      relevanceScore: Math.round(suggestion.relevanceScore * 100), // Convert to percentage
      action: suggestion.action
    }));
  }

  /**
   * Track suggestion effectiveness
   * @param suggestionId - The ID of the suggestion
   * @param wasUsed - Whether the suggestion was acted upon
   */
  trackSuggestionEffectiveness(suggestionId: string, wasUsed: boolean): void {
    // In a real implementation, this would track analytics
    // to improve suggestion relevance over time
    console.log(`Suggestion ${suggestionId} was ${wasUsed ? 'used' : 'not used'}`);
  }

  /**
   * Get trending help topics
   * @returns Array of trending help suggestions
   */
  getTrendingSuggestions(): HelpSuggestion[] {
    // In a real implementation, this would return suggestions
    // based on what other users are commonly asking for help with
    return [
      this.defaultSuggestions.find(s => s.id === 'create-task')!,
      this.defaultSuggestions.find(s => s.id === 'list-tasks')!,
      this.defaultSuggestions.find(s => s.id === 'set-due-date')!
    ];
  }
}

// Create a singleton instance
const helpSuggester = new HelpSuggester();

export { helpSuggester, HelpSuggester, type HelpSuggestion, type UserContext };