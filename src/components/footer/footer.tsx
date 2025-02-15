export default function Footer() {
  return (
    <footer className="bg-background">
      <div className="container mx-auto">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} punchline/quiz - Public Beta
        </p>
      </div>
    </footer>
  );
}
