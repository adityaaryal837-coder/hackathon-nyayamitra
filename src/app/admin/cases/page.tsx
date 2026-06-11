'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminCasesRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const caseId = searchParams.get('caseId');
    if (caseId) {
      router.replace(`/admin-panel/cases?caseId=${caseId}`);
    } else {
      router.replace('/admin-panel/cases');
    }
  }, [router, searchParams]);

  return null;
}

export default function AdminCasesRedirect() {
  return (
    <Suspense fallback={null}>
      <AdminCasesRedirectContent />
    </Suspense>
  );
}
