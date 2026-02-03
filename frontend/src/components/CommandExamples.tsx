import React from 'react';

interface CommandExamplesProps {
  className?: string;
  onUseExample?: (command: string) => void;
}

const CommandExamples: React.FC<CommandExamplesProps> = ({
  className = '',
  onUseExample
}) => {
  const examples = [
    {
      category: 'Creating Tasks',
      commands: [
        'Add a task to buy groceries',
        'Create a task to call John tomorrow at 3pm',
        'Make a note to finish the report by Friday',
        'Add a task to schedule dentist appointment next week'
      ]
    },
    {
      category: 'Updating Tasks',
      commands: [
        'Change the grocery task to Saturday morning',
        'Update my meeting prep to high priority',
        'Modify the report deadline to next Monday',
        'Edit the title of task #3 to "Review proposal"'
      ]
    },
    {
      category: 'Completing Tasks',
      commands: [
        'Mark the shopping task as done',
        'Complete task #1',
        'Finish the presentation task',
        'Check off the laundry task'
      ]
    },
    {
      category: 'Listing Tasks',
      commands: [
        'Show me my tasks',
        'List my tasks for today',
        'Show my high priority tasks',
        'Display upcoming tasks for this week'
      ]
    },
    {
      category: 'Deleting Tasks',
      commands: [
        'Remove the old task',
        'Delete task #5',
        'Cancel the appointment task',
        'Get rid of the obsolete task'
      ]
    }
  ];

  const handleUseExample = (command: string) => {
    if (onUseExample) {
      onUseExample(command);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Example Commands
      </h3>

      <div className="space-y-4">
        {examples.map((category, index) => (
          <div key={index} className="pt-3">
            <h4 className="font-medium text-blue-700 text-sm uppercase tracking-wide mb-2">
              {category.category}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {category.commands.map((command, cmdIndex) => (
                <button
                  key={cmdIndex}
                  onClick={() => handleUseExample(command)}
                  className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-gray-700 text-sm group-hover:text-blue-600 transition-colors">
                      "{command}"
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Tip: Be specific with dates and times for better results. Use natural language like "tomorrow", "next week", or specific times like "3pm".
        </p>
      </div>
    </div>
  );
};

export { CommandExamples };