import { AuthGuard } from "@/components/AuthGuard";
import { GroupList } from "@/components/GroupList";

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <GroupList />
        </div>
      </div>
    </AuthGuard>
  );
}
