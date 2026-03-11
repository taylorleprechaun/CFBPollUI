import { useDocumentTitle } from '../hooks/use-document-title';

export function PredictionsPage() {
  useDocumentTitle('Predictions - CFB Poll');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Predictions</h1>
      <p className="text-text-secondary">Coming soon.</p>
    </div>
  );
}

export default PredictionsPage;
