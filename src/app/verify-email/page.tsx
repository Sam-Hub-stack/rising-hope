import { VerifyEmailCard } from "@/components/verify-email-card";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; required?: string }>;
}) {
  const params = await searchParams;
  return <VerifyEmailCard initialToken={params.token} required={params.required === "1"} />;
}
