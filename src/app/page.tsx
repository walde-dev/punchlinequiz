import Header from "~/components/header/header";
import OnboardingDialog from "~/components/onboarding-dialog";
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12">
      <Header />
      <OnboardingDialog />
    </main>
  );
}
