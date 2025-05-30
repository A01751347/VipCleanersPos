import LoginForm from "../../../components/admin/LoginForm";
import { Suspense } from 'react';

function LoginInner() {
  return <LoginForm />;
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginInner />
    </Suspense>
  );
}
