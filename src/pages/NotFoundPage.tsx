import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/States';
import { routes } from '../utils/routes';

export function NotFoundPage() {
  return (
    <div className="card">
      <EmptyState
        title="صفحه پیدا نشد"
        action={
          <Link to={routes.dashboard} className="link">
            بازگشت به داشبورد
          </Link>
        }
      />
    </div>
  );
}
