import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ChatErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });

    // Call the optional onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a fallback component is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4 max-w-2xl mx-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>We're sorry, but something went wrong with the chat interface.</p>
              </div>

              {this.state.error && (
                <div className="mt-4 p-4 bg-red-100 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Error Details:</h4>
                  <div className="mt-1 text-xs text-red-700 font-mono overflow-x-auto">
                    {this.state.error.toString()}
                  </div>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-4 bg-red-100 rounded-md">
                    <pre className="text-xs text-red-700 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={this.resetError}
                >
                  Try Again
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => {
                    // Reload the page
                    window.location.reload();
                  }}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component version for convenience
const withChatErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ChatErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ChatErrorBoundary>
  );
};

// Specific error boundary for chat components
interface ChatComponentErrorBoundaryProps {
  children: ReactNode;
  chatSection?: 'input' | 'messages' | 'loader' | 'container';
}

const ChatComponentErrorBoundary: React.FC<ChatComponentErrorBoundaryProps> = ({
  children,
  chatSection = 'container'
}) => {
  const getFallbackMessage = () => {
    switch (chatSection) {
      case 'input':
        return "There was an issue with the chat input. Please try typing your message again.";
      case 'messages':
        return "There was an issue displaying the chat messages. The conversation history may be temporarily unavailable.";
      case 'loader':
        return "There was an issue loading the chat interface. Please wait or refresh the page.";
      case 'container':
      default:
        return "There was an issue with the chat interface. The conversation may be temporarily unavailable.";
    }
  };

  return (
    <ChatErrorBoundary
      fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-2">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">
              {getFallbackMessage()}
            </span>
          </div>
        </div>
      }
    >
      {children}
    </ChatErrorBoundary>
  );
};

export { ChatErrorBoundary, withChatErrorBoundary, ChatComponentErrorBoundary };