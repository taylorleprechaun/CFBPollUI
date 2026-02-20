export interface ActionFeedback {
  key: string;
  type: 'success' | 'error';
  message?: string;
}
