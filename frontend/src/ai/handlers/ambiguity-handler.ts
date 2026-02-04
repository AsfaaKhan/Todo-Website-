// Ambiguity handler for the AI agent
// Handles cases where user input is unclear or multiple interpretations exist

import { Message } from '../../types/chat';

interface AmbiguityResolution {
  isAmbiguous: boolean;
  possibleInterpretations: string[];
  confidenceScores: number[];
  requiresClarification: boolean;
  clarificationQuestion?: string;
  suggestedActions: string[];
}

interface IntentClarification {
  originalIntent: string;
  possibleIntents: string[];
  confidenceDistribution: { intent: string; confidence: number }[];
  requiresUserChoice: boolean;
}

class AmbiguityHandler {
  /**
   * Check if a message contains ambiguous intent
   * @param message - The user message to analyze
   * @returns Ambiguity resolution object
   */
  analyzeAmbiguity(message: string): AmbiguityResolution {
    const lowerMessage = message.toLowerCase().trim();

    // Possible interpretations based on common ambiguities
    const interpretations: string[] = [];
    const confidenceScores: number[] = [];

    // Check for ambiguous phrases
    const ambiguityIndicators = [
      { pattern: /\b(task|todo|item)\s+#?\s*\w+/, description: 'Unclear task reference', confidence: 0.8 },
      { pattern: /\b(it|that|this)\s+(complete|delete|update|change)/, description: 'Unclear reference', confidence: 0.9 },
      { pattern: /\b(mark|set|make)\s+\w+\s+(done|complete|finished)/, description: 'Possible completion intent', confidence: 0.7 },
      { pattern: /buy|purchase|get|order/i, description: 'Possible creation intent', confidence: 0.6 },
      { pattern: /show|list|display|see|view/i, description: 'Possible listing intent', confidence: 0.8 },
      { pattern: /change|update|modify|edit/i, description: 'Possible update intent', confidence: 0.7 },
      { pattern: /remove|delete|cancel|erase/i, description: 'Possible deletion intent', confidence: 0.8 },
      { pattern: /\b(todo|task|item)\s+(for|on|at)\s+\w+/, description: 'Date/time reference', confidence: 0.7 }
    ];

    // Check for multiple possible interpretations
    ambiguityIndicators.forEach(indicator => {
      if (indicator.pattern.test(lowerMessage)) {
        interpretations.push(indicator.description);
        confidenceScores.push(indicator.confidence);
      }
    });

    // Check for multiple action words in the same message
    const actionWords = ['add', 'create', 'delete', 'remove', 'complete', 'finish', 'update', 'change', 'show', 'list'];
    const foundActions = actionWords.filter(action => lowerMessage.includes(action));

    if (foundActions.length > 1) {
      interpretations.push(`Multiple actions detected: ${foundActions.join(', ')}`);
      confidenceScores.push(0.9);
    }

    // Check for ambiguous pronouns or references
    const pronounIndicators = ['it', 'that', 'this', 'the task', 'the item'];
    const hasAmbiguousReference = pronounIndicators.some(pronoun =>
      lowerMessage.includes(pronoun) &&
      !lowerMessage.includes('task #') &&
      !lowerMessage.includes('todo #')
    );

    if (hasAmbiguousReference) {
      interpretations.push('Unclear reference to specific task');
      confidenceScores.push(0.85);
    }

    // Determine if clarification is needed
    const requiresClarification = interpretations.length > 0 || this.containsAmbiguousTerms(lowerMessage);
    const isAmbiguous = interpretations.length > 0;

    let clarificationQuestion: string | undefined;
    if (requiresClarification) {
      clarificationQuestion = this.generateClarificationQuestion(message, interpretations);
    }

    // Suggest possible actions
    const suggestedActions = this.generateSuggestedActions(message, interpretations);

    return {
      isAmbiguous,
      possibleInterpretations: interpretations,
      confidenceScores,
      requiresClarification,
      clarificationQuestion,
      suggestedActions
    };
  }

  /**
   * Check if a message contains ambiguous terms
   * @param message - The message to analyze
   * @returns True if ambiguous terms are found
   */
  private containsAmbiguousTerms(message: string): boolean {
    const ambiguousTerms = [
      /\b(it|that|this|those|these)\b/,
      /\b(some|any|few|several)\b/,
      /\b(soon|later|sometimes|occasionally)\b/,
      /\b(maybe|perhaps|possibly|could be)\b/,
      /\b(approximately|around|about)\b/,
      /\b(sort of|kind of|rather|quite)\b/
    ];

    const lowerMessage = message.toLowerCase();
    return ambiguousTerms.some(term => term.test(lowerMessage));
  }

  /**
   * Generate a clarification question for ambiguous input
   * @param message - The original message
   * @param interpretations - Possible interpretations
   * @returns Clarification question
   */
  private generateClarificationQuestion(message: string, interpretations: string[]): string {
    // If it's about a specific task reference
    if (interpretations.some(interp => interp.includes('reference'))) {
      return "Could you please specify which task you're referring to? You can use the task number or title.";
    }

    // If multiple actions are detected
    if (interpretations.some(interp => interp.includes('Multiple actions'))) {
      return "I detected multiple possible actions. Could you clarify which action you'd like me to take?";
    }

    // If it's about completion but unclear
    if (interpretations.some(interp => interp.includes('completion'))) {
      return "Which task would you like to mark as complete?";
    }

    // If it's about creation but unclear
    if (interpretations.some(interp => interp.includes('creation'))) {
      return "Could you provide more details about the task you'd like to create?";
    }

    // If it's about listing but unclear
    if (interpretations.some(interp => interp.includes('listing'))) {
      return "Would you like to see all tasks, completed tasks, or pending tasks?";
    }

    // If it's about updating but unclear
    if (interpretations.some(interp => interp.includes('update'))) {
      return "Which task would you like to update, and what would you like to change?";
    }

    // General clarification
    return "I'm not entirely sure what you mean. Could you rephrase that or provide more details?";
  }

  /**
   * Generate suggested actions based on the message
   * @param message - The original message
   * @param interpretations - Possible interpretations
   * @returns Array of suggested actions
   */
  private generateSuggestedActions(message: string, interpretations: string[]): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();

    // If it's about tasks in general
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      if (!lowerMessage.includes('complete') && !lowerMessage.includes('done')) {
        suggestions.push("Add a new task");
      }
      if (!lowerMessage.includes('create') && !lowerMessage.includes('add')) {
        suggestions.push("List your tasks");
      }
    }

    // If it seems like they want to create something
    if (lowerMessage.includes('buy') || lowerMessage.includes('get') || lowerMessage.includes('order')) {
      suggestions.push("Create a task to buy/get/order something");
    }

    // If it seems like they want to see something
    if (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('see')) {
      suggestions.push("List your tasks");
    }

    // If it seems like they want to complete something
    if (lowerMessage.includes('complete') || lowerMessage.includes('done') || lowerMessage.includes('finish')) {
      suggestions.push("Mark a task as complete");
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push("Add a new task", "List your tasks", "Update a task", "Complete a task");
    }

    return suggestions;
  }

  /**
   * Resolve intent ambiguity by asking for clarification
   * @param message - The user message
   * @returns Intent clarification object
   */
  resolveIntentAmbiguity(message: string): IntentClarification {
    const lowerMessage = message.toLowerCase().trim();

    // Define possible intents
    const possibleIntents = ['create_todo', 'list_todos', 'complete_todo', 'update_todo', 'delete_todo', 'help', 'greeting'];

    // Calculate confidence scores for each intent based on keywords
    const confidenceDistribution = possibleIntents.map(intent => {
      let confidence = 0;

      switch (intent) {
        case 'create_todo':
          if (/(add|create|make|new|buy|get|order|need to|have to|want to|should|must)/.test(lowerMessage)) {
            confidence = 0.8;
          }
          break;

        case 'list_todos':
          if (/(show|list|display|see|view|get|fetch|all|my|tasks|todos)/.test(lowerMessage)) {
            confidence = 0.8;
          }
          break;

        case 'complete_todo':
          if (/(complete|done|finish|finished|mark|check|accomplish|achieve|fulfill|cross off)/.test(lowerMessage)) {
            confidence = 0.8;
          }
          break;

        case 'update_todo':
          if (/(update|change|modify|edit|adjust|revise|improve|alter)/.test(lowerMessage)) {
            confidence = 0.8;
          }
          break;

        case 'delete_todo':
          if (/(delete|remove|cancel|erase|eliminate|clear|get rid of|dispose)/.test(lowerMessage)) {
            confidence = 0.8;
          }
          break;

        case 'help':
          if (/(help|assist|support|command|instruction|what can you do|how do I)/.test(lowerMessage)) {
            confidence = 0.9;
          }
          break;

        case 'greeting':
          if (/(hello|hi|hey|greetings|good morning|good afternoon|good evening)/.test(lowerMessage)) {
            confidence = 0.9;
          }
          break;
      }

      // Boost confidence if there are multiple supporting keywords
      const keywordMatches = this.countIntentKeywords(lowerMessage, intent);
      if (keywordMatches > 1) {
        confidence = Math.min(0.95, confidence + (keywordMatches - 1) * 0.1);
      }

      return { intent, confidence };
    });

    // Sort by confidence score
    confidenceDistribution.sort((a, b) => b.confidence - a.confidence);

    // Determine if user choice is needed (when top two confidences are close)
    const topConfidence = confidenceDistribution[0]?.confidence || 0;
    const secondConfidence = confidenceDistribution[1]?.confidence || 0;
    const requiresUserChoice = (topConfidence - secondConfidence) < 0.2 && topConfidence > 0.3;

    // Determine original intent based on highest confidence
    const originalIntent = confidenceDistribution[0]?.intent || 'unknown';

    return {
      originalIntent,
      possibleIntents: confidenceDistribution.map(item => item.intent),
      confidenceDistribution,
      requiresUserChoice
    };
  }

  /**
   * Count keywords related to a specific intent
   * @param message - The message to analyze
   * @param intent - The intent to check
   * @returns Number of matching keywords
   */
  private countIntentKeywords(message: string, intent: string): number {
    const keywordMap: { [key: string]: string[] } = {
      create_todo: ['add', 'create', 'make', 'new', 'buy', 'get', 'order', 'need', 'want', 'should', 'must'],
      list_todos: ['show', 'list', 'display', 'see', 'view', 'get', 'fetch', 'all', 'my', 'tasks', 'todos'],
      complete_todo: ['complete', 'done', 'finish', 'finished', 'mark', 'check', 'accomplish', 'achieve', 'fulfill'],
      update_todo: ['update', 'change', 'modify', 'edit', 'adjust', 'revise', 'improve', 'alter'],
      delete_todo: ['delete', 'remove', 'cancel', 'erase', 'eliminate', 'clear', 'rid', 'dispose'],
      help: ['help', 'assist', 'support', 'command', 'instruction', 'what can you do', 'how do'],
      greeting: ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening']
    };

    const keywords = keywordMap[intent] || [];
    return keywords.filter(keyword => message.includes(keyword)).length;
  }

  /**
   * Generate a response for ambiguous input
   * @param ambiguityResult - The ambiguity analysis result
   * @returns Response message for the user
   */
  generateAmbiguousResponse(ambiguityResult: AmbiguityResolution): string {
    if (!ambiguityResult.requiresClarification) {
      return "I understood your request and will process it.";
    }

    let response = "I'm not completely sure what you mean. ";

    if (ambiguityResult.clarificationQuestion) {
      response += ambiguityResult.clarificationQuestion;
    }

    if (ambiguityResult.suggestedActions && ambiguityResult.suggestedActions.length > 0) {
      response += ` You could try: ${ambiguityResult.suggestedActions.slice(0, 2).join(' or ')}.`;
    }

    return response;
  }

  /**
   * Handle ambiguous input by attempting to clarify
   * @param message - The user message
   * @returns Clarified message or indication of ambiguity
   */
  async handleAmbiguousInput(message: string): Promise<{
    isResolved: boolean;
    resolvedMessage?: string;
    clarificationNeeded: boolean;
    clarificationQuestion?: string;
  }> {
    const ambiguityResult = this.analyzeAmbiguity(message);

    if (!ambiguityResult.requiresClarification) {
      return {
        isResolved: true,
        resolvedMessage: message,
        clarificationNeeded: false
      };
    }

    return {
      isResolved: false,
      clarificationNeeded: true,
      clarificationQuestion: ambiguityResult.clarificationQuestion
    };
  }

  /**
   * Resolve intent ambiguity with user input
   * @param message - The original message
   * @param userChoice - The user's clarification
   * @returns Resolved intent
   */
  resolveWithUserInput(message: string, userChoice: string): string {
    // If user provided a clear directive, use that
    if (userChoice.toLowerCase().includes('create') || userChoice.toLowerCase().includes('add')) {
      return 'create_todo';
    }

    if (userChoice.toLowerCase().includes('list') || userChoice.toLowerCase().includes('show')) {
      return 'list_todos';
    }

    if (userChoice.toLowerCase().includes('complete') || userChoice.toLowerCase().includes('done')) {
      return 'complete_todo';
    }

    if (userChoice.toLowerCase().includes('update') || userChoice.toLowerCase().includes('change')) {
      return 'update_todo';
    }

    if (userChoice.toLowerCase().includes('delete') || userChoice.toLowerCase().includes('remove')) {
      return 'delete_todo';
    }

    // Fall back to analyzing the original message
    const intentClarity = this.resolveIntentAmbiguity(message);
    return intentClarity.originalIntent;
  }
}

// Create a singleton instance
const ambiguityHandler = new AmbiguityHandler();

export { ambiguityHandler, AmbiguityHandler, type AmbiguityResolution, type IntentClarification };