import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

type RouteErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
};

class RouteErrorBoundaryInner extends Component<RouteErrorBoundaryProps & { language: 'th' | 'en' }, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Route render failed', error, info);
    }
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps & { language: 'th' | 'en' }) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isThai = this.props.language === 'th';
    return (
      <section className="route-error-state" role="alert">
        <h1>{isThai ? 'หน้านี้โหลดไม่สำเร็จ' : 'This page could not load.'}</h1>
        <p>{isThai ? 'กรุณาลองโหลดใหม่อีกครั้ง' : 'Please try again.'}</p>
        <div className="action-row">
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            {isThai ? 'โหลดใหม่' : 'Reload page'}
          </button>
          <Link className="btn btn-secondary" to="/">
            {isThai ? 'กลับหน้าแรก' : 'Back home'}
          </Link>
        </div>
      </section>
    );
  }
}

export function RouteErrorBoundary({ children, resetKey }: RouteErrorBoundaryProps) {
  const { language } = useLanguage();
  return (
    <RouteErrorBoundaryInner language={language} resetKey={resetKey}>
      {children}
    </RouteErrorBoundaryInner>
  );
}
