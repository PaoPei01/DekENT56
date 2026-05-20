type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      {title ? <strong>{title}</strong> : null}
      <span>{message}</span>
    </div>
  );
}
