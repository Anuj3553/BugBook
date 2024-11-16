import PostEditor from "@/components/posts/editor/PostEditor";
import TrendsSidebar from "@/components/TrendsSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowingFeed from "./FollowingFeed";
import ForYouFeed from "./ForYouFeed";

export default function Home() {

  return (
    <main className="w-full min-w-0 flex gap-5">
      <div className="w-full min-w-0 space-y-5">
        {/* Post editor */}
        <PostEditor />

        {/* Tabs for switching between For You and Following feeds */}
        <Tabs defaultValue="for-you">
          <TabsList>
            {/* Tabs triggers */}
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          {/* Tabs content for For you feed */}
          <TabsContent value="for-you">
            <ForYouFeed />
          </TabsContent>
          {/* Tabs content for Following feed */}
          <TabsContent value="following">
            <FollowingFeed />
          </TabsContent>
        </Tabs>
      </div>


      {/* Trends sidebar */}
      <TrendsSidebar />
    </main>
  );
}
