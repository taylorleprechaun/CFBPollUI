import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { BUTTON_PRIMARY } from '../components/ui/button-styles';
import { useDocumentTitle } from '../hooks/use-document-title';
import { toErrorMessage } from '../lib/error-utils';

const INPUT_CLASS = 'w-full px-3 py-2 border border-border bg-surface text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent';

export function LoginPage() {
  useDocumentTitle('Login - CFB Poll');

  const { login } = useAuth();
  const navigate = useNavigate();

  const usernameId = useId();
  const passwordId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/admin/snapshots');
    } catch (err) {
      setError(toErrorMessage(err, 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="bg-surface shadow-lg rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={usernameId} className="block text-sm font-medium text-text-secondary mb-1">
              Username
            </label>
            <input
              id={usernameId}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={INPUT_CLASS}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div role="alert" className="text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${BUTTON_PRIMARY} w-full`}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
